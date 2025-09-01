-- =====================================================
-- MIGRATION 011: Integration and Performance Fixes
-- Description: Final integration fixes and performance improvements
-- Date: 2024-08-24
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: Create unified dashboard data function
-- =====================================================

-- Comprehensive function that returns all dashboard data in one call
-- This reduces the number of requests from frontend (addressing performance audit requirements)
CREATE OR REPLACE FUNCTION get_dashboard_unified_data(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    -- Activities
    activities JSONB,
    -- Priorities
    priorities JSONB,
    -- Medications for today
    medications JSONB,
    -- Active focus sessions
    focus_sessions JSONB,
    -- Today's compromissos
    compromissos JSONB,
    -- Summary stats
    summary JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Activities
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'horario', horario,
                    'atividade', atividade,
                    'cor', cor,
                    'concluida', concluida,
                    'created_at', created_at,
                    'date', date
                ) ORDER BY horario
            ) FROM painel_dia WHERE user_id = p_user_id AND date = p_date),
            '[]'::JSONB
        ),
        
        -- Priorities
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'titulo', titulo,
                    'importante', importante,
                    'concluida', concluida,
                    'created_at', created_at,
                    'date', date
                ) ORDER BY importante DESC, created_at
            ) FROM prioridades WHERE user_id = p_user_id AND date = p_date),
            '[]'::JSONB
        ),
        
        -- Medications (from view)
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'nome', nome,
                    'dosagem', dosagem,
                    'horarios', horarios,
                    'tomado_hoje', tomado_hoje,
                    'proximo_horario', proximo_horario
                )
            ) FROM v_medicamentos_dashboard WHERE user_id = p_user_id),
            '[]'::JSONB
        ),
        
        -- Focus sessions
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'duracao_minutos', duracao_minutos,
                    'tempo_restante', tempo_restante,
                    'ativa', ativa,
                    'pausada', pausada,
                    'date', date,
                    'created_at', created_at
                )
            ) FROM sessoes_foco WHERE user_id = p_user_id AND date = p_date),
            '[]'::JSONB
        ),
        
        -- Compromissos for today
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'titulo', titulo,
                    'horario', horario,
                    'tipo', tipo,
                    'data', data,
                    'concluido', concluido,
                    'observacoes', observacoes
                ) ORDER BY horario
            ) FROM compromissos WHERE user_id = p_user_id AND data = p_date),
            '[]'::JSONB
        ),
        
        -- Summary stats
        (SELECT jsonb_build_object(
            'total_activities', total_activities,
            'completed_activities', completed_activities,
            'activity_completion_rate', activity_completion_rate,
            'total_priorities', total_priorities,
            'completed_priorities', completed_priorities,
            'important_priorities', important_priorities,
            'priority_completion_rate', priority_completion_rate,
            'active_focus_sessions', active_focus_sessions,
            'total_focus_time_minutes', total_focus_time_minutes,
            'remaining_focus_time_seconds', remaining_focus_time_seconds,
            'upcoming_compromissos', upcoming_compromissos,
            'overdue_compromissos', overdue_compromissos,
            'overall_completion_percentage', overall_completion_percentage,
            'productivity_score', productivity_score
        ) FROM get_dashboard_summary_enhanced(p_user_id, p_date));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_dashboard_unified_data TO authenticated;

-- =====================================================
-- FIX 2: Create batch operations for better performance
-- =====================================================

-- Function to batch update multiple activities completion status
CREATE OR REPLACE FUNCTION batch_update_activities_completion(
    p_user_id UUID,
    p_activity_updates JSONB
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    activity JSONB;
BEGIN
    FOR activity IN SELECT jsonb_array_elements(p_activity_updates)
    LOOP
        UPDATE painel_dia 
        SET 
            concluida = (activity->>'concluida')::BOOLEAN,
            updated_at = NOW()
        WHERE user_id = p_user_id 
        AND id = (activity->>'id')::UUID;
        
        IF FOUND THEN
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to batch update multiple priorities completion status
CREATE OR REPLACE FUNCTION batch_update_priorities_completion(
    p_user_id UUID,
    p_priority_updates JSONB
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    priority JSONB;
BEGIN
    FOR priority IN SELECT jsonb_array_elements(p_priority_updates)
    LOOP
        UPDATE prioridades 
        SET 
            concluida = (priority->>'concluida')::BOOLEAN,
            updated_at = NOW()
        WHERE user_id = p_user_id 
        AND id = (priority->>'id')::UUID;
        
        IF FOUND THEN
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION batch_update_activities_completion TO authenticated;
GRANT EXECUTE ON FUNCTION batch_update_priorities_completion TO authenticated;

-- =====================================================
-- FIX 3: Create data validation functions
-- =====================================================

-- Function to validate frontend data consistency
CREATE OR REPLACE FUNCTION validate_user_data_integrity(p_user_id UUID)
RETURNS TABLE (
    table_name TEXT,
    issue_type TEXT,
    issue_description TEXT,
    affected_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    
    -- Check for orphaned records
    SELECT 'medicamentos_tomados'::TEXT, 'orphaned_records'::TEXT, 
           'Records without valid medicamento'::TEXT, COUNT(*)::INTEGER
    FROM medicamentos_tomados mt
    LEFT JOIN medicamentos m ON mt.medicamento_id = m.id
    WHERE mt.user_id = p_user_id AND m.id IS NULL
    HAVING COUNT(*) > 0
    
    UNION ALL
    
    -- Check for invalid time ranges in medications
    SELECT 'medicamentos'::TEXT, 'invalid_date_range'::TEXT,
           'End date before start date'::TEXT, COUNT(*)::INTEGER
    FROM medicamentos
    WHERE user_id = p_user_id 
    AND data_fim IS NOT NULL 
    AND data_fim < data_inicio
    HAVING COUNT(*) > 0
    
    UNION ALL
    
    -- Check for focus sessions with invalid time remaining
    SELECT 'sessoes_foco'::TEXT, 'invalid_time_remaining'::TEXT,
           'Time remaining exceeds duration'::TEXT, COUNT(*)::INTEGER
    FROM sessoes_foco
    WHERE user_id = p_user_id
    AND tempo_restante > (duracao_minutos * 60)
    HAVING COUNT(*) > 0
    
    UNION ALL
    
    -- Check for multiple active focus sessions on same date
    SELECT 'sessoes_foco'::TEXT, 'multiple_active_sessions'::TEXT,
           'Multiple active sessions on same date'::TEXT, COUNT(*)::INTEGER - COUNT(DISTINCT date)
    FROM sessoes_foco
    WHERE user_id = p_user_id AND ativa = true
    GROUP BY date
    HAVING COUNT(*) > 1;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_user_data_integrity TO authenticated;

-- =====================================================
-- FIX 4: Performance monitoring function
-- =====================================================

-- Function to get table sizes and query performance info
CREATE OR REPLACE FUNCTION get_performance_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    stat_name TEXT,
    stat_value NUMERIC,
    stat_unit TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'user_record_count'::TEXT,
        COUNT(*)::NUMERIC,
        'records'::TEXT,
        'Total records across all user tables'::TEXT
    FROM (
        SELECT user_id FROM painel_dia WHERE user_id = COALESCE(p_user_id, user_id)
        UNION ALL SELECT user_id FROM prioridades WHERE user_id = COALESCE(p_user_id, user_id)
        UNION ALL SELECT user_id FROM medicamentos WHERE user_id = COALESCE(p_user_id, user_id)
        UNION ALL SELECT user_id FROM sessoes_foco WHERE user_id = COALESCE(p_user_id, user_id)
        UNION ALL SELECT user_id FROM compromissos WHERE user_id = COALESCE(p_user_id, user_id)
        UNION ALL SELECT user_id FROM competitions WHERE user_id = COALESCE(p_user_id, user_id)
        UNION ALL SELECT user_id FROM receitas WHERE user_id = COALESCE(p_user_id, user_id)
        UNION ALL SELECT user_id FROM expenses WHERE user_id = COALESCE(p_user_id, user_id)
    ) all_records
    
    UNION ALL
    
    SELECT 
        'active_focus_sessions'::TEXT,
        COUNT(*)::NUMERIC,
        'sessions'::TEXT,
        'Currently active focus sessions'::TEXT
    FROM sessoes_foco 
    WHERE ativa = true 
    AND (p_user_id IS NULL OR user_id = p_user_id)
    
    UNION ALL
    
    SELECT 
        'todays_activities'::TEXT,
        COUNT(*)::NUMERIC,
        'activities'::TEXT,
        'Activities scheduled for today'::TEXT
    FROM painel_dia 
    WHERE date = CURRENT_DATE
    AND (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This function should be restricted to service_role for system monitoring
-- GRANT EXECUTE ON FUNCTION get_performance_stats TO service_role;

-- =====================================================
-- FIX 5: Add final indexes for optimal performance
-- =====================================================

-- Composite indexes for unified dashboard query
CREATE INDEX IF NOT EXISTS idx_painel_dia_unified_dashboard 
ON painel_dia(user_id, date, horario) 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_prioridades_unified_dashboard 
ON prioridades(user_id, date, importante DESC, created_at) 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_compromissos_unified_dashboard 
ON compromissos(user_id, data, horario) 
WHERE data >= CURRENT_DATE - INTERVAL '7 days';

-- =====================================================
-- FIX 6: Add helpful comments
-- =====================================================

COMMENT ON FUNCTION get_dashboard_unified_data IS 'Returns all dashboard data in a single query to reduce API calls - addresses mobile performance requirements';
COMMENT ON FUNCTION batch_update_activities_completion IS 'Batch update multiple activity completion statuses for better performance';
COMMENT ON FUNCTION batch_update_priorities_completion IS 'Batch update multiple priority completion statuses for better performance';
COMMENT ON FUNCTION validate_user_data_integrity IS 'Validate data integrity across user tables and identify inconsistencies';
COMMENT ON FUNCTION get_performance_stats IS 'Get system performance statistics for monitoring (admin function)';

-- =====================================================
-- FIX 7: Clean up any potential conflicts
-- =====================================================

-- Update the trigger creation for better user setup
DROP FUNCTION IF EXISTS handle_comprehensive_new_user() CASCADE;
CREATE OR REPLACE FUNCTION handle_comprehensive_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create all default data for the new user
    PERFORM create_default_user_data(NEW.id);
    PERFORM create_default_sleep_reminders(NEW.id);  
    PERFORM create_default_expense_categories(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_comprehensive ON handle_comprehensive_new_user;
CREATE TRIGGER on_auth_user_created_comprehensive
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_comprehensive_new_user();

COMMIT;