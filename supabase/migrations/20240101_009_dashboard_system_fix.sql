-- =====================================================
-- MIGRATION 009 FIX: Dashboard System Corrections
-- Description: Fix dashboard system inconsistencies and improve performance
-- Date: 2024-08-24
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: Clarify sessoes_foco tempo_restante usage
-- =====================================================

-- Add comment to clarify that tempo_restante is in seconds, not minutes
COMMENT ON COLUMN sessoes_foco.tempo_restante IS 'Remaining time in SECONDS for the focus session';
COMMENT ON COLUMN sessoes_foco.duracao_minutos IS 'Total session duration in MINUTES (1-180)';

-- =====================================================
-- FIX 2: Add validation function for focus sessions
-- =====================================================

-- Function to validate focus session time consistency
CREATE OR REPLACE FUNCTION validate_sessao_foco_times()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure tempo_restante doesn't exceed total duration in seconds
    IF NEW.tempo_restante > (NEW.duracao_minutos * 60) THEN
        RAISE EXCEPTION 'tempo_restante (%) cannot exceed duracao_minutos in seconds (%)', 
            NEW.tempo_restante, (NEW.duracao_minutos * 60);
    END IF;
    
    -- Ensure only one active session per user per date
    IF NEW.ativa = true THEN
        UPDATE sessoes_foco 
        SET ativa = false, updated_at = NOW()
        WHERE user_id = NEW.user_id 
        AND date = NEW.date 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND ativa = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
DROP TRIGGER IF EXISTS validate_sessao_foco_trigger ON sessoes_foco;
CREATE TRIGGER validate_sessao_foco_trigger
    BEFORE INSERT OR UPDATE ON sessoes_foco
    FOR EACH ROW EXECUTE FUNCTION validate_sessao_foco_times();

-- =====================================================
-- FIX 3: Enhanced dashboard summary function
-- =====================================================

-- Improved dashboard summary with better performance and clarity
CREATE OR REPLACE FUNCTION get_dashboard_summary_enhanced(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_activities INTEGER,
    completed_activities INTEGER,
    activity_completion_rate NUMERIC,
    total_priorities INTEGER,
    completed_priorities INTEGER,
    important_priorities INTEGER,
    priority_completion_rate NUMERIC,
    active_focus_sessions INTEGER,
    total_focus_time_minutes INTEGER,
    remaining_focus_time_seconds INTEGER,
    upcoming_compromissos INTEGER,
    overdue_compromissos INTEGER,
    overall_completion_percentage NUMERIC,
    productivity_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            -- Activities stats
            (SELECT COUNT(*)::INTEGER FROM painel_dia WHERE user_id = p_user_id AND date = p_date) as tot_activities,
            (SELECT COUNT(*)::INTEGER FROM painel_dia WHERE user_id = p_user_id AND date = p_date AND concluida = true) as comp_activities,
            
            -- Priorities stats
            (SELECT COUNT(*)::INTEGER FROM prioridades WHERE user_id = p_user_id AND date = p_date) as tot_priorities,
            (SELECT COUNT(*)::INTEGER FROM prioridades WHERE user_id = p_user_id AND date = p_date AND concluida = true) as comp_priorities,
            (SELECT COUNT(*)::INTEGER FROM prioridades WHERE user_id = p_user_id AND date = p_date AND importante = true) as imp_priorities,
            
            -- Focus sessions stats
            (SELECT COUNT(*)::INTEGER FROM sessoes_foco WHERE user_id = p_user_id AND date = p_date AND ativa = true) as act_focus,
            (SELECT COALESCE(SUM(duracao_minutos), 0)::INTEGER FROM sessoes_foco WHERE user_id = p_user_id AND date = p_date) as tot_focus_time,
            (SELECT COALESCE(SUM(tempo_restante), 0)::INTEGER FROM sessoes_foco WHERE user_id = p_user_id AND date = p_date AND ativa = true) as rem_focus_time,
            
            -- Compromissos stats
            (SELECT COUNT(*)::INTEGER FROM compromissos WHERE user_id = p_user_id AND data = p_date AND concluido = false) as up_compromissos,
            (SELECT COUNT(*)::INTEGER FROM compromissos WHERE user_id = p_user_id AND data < p_date AND concluido = false) as over_compromissos
    )
    SELECT 
        s.tot_activities,
        s.comp_activities,
        CASE WHEN s.tot_activities > 0 THEN ROUND((s.comp_activities::NUMERIC / s.tot_activities) * 100, 2) ELSE 0 END,
        s.tot_priorities,
        s.comp_priorities,
        s.imp_priorities,
        CASE WHEN s.tot_priorities > 0 THEN ROUND((s.comp_priorities::NUMERIC / s.tot_priorities) * 100, 2) ELSE 0 END,
        s.act_focus,
        s.tot_focus_time,
        s.rem_focus_time,
        s.up_compromissos,
        s.over_compromissos,
        -- Overall completion percentage
        CASE 
            WHEN (s.tot_activities + s.tot_priorities) = 0 THEN 0::NUMERIC
            ELSE ROUND(((s.comp_activities + s.comp_priorities)::NUMERIC / (s.tot_activities + s.tot_priorities)) * 100, 2)
        END,
        -- Productivity score (weighted by importance and focus time)
        CASE 
            WHEN (s.tot_activities + s.tot_priorities) = 0 THEN 0::NUMERIC
            ELSE ROUND(
                ((s.comp_activities * 1.0 + s.comp_priorities * 1.5 + s.imp_priorities * 0.5 + LEAST(s.tot_focus_time / 60.0, 8) * 2) / 
                 GREATEST(s.tot_activities + s.tot_priorities * 1.5 + s.imp_priorities * 0.5 + 8, 1)) * 100, 2
            )
        END
    FROM stats s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_dashboard_summary_enhanced TO authenticated;

-- =====================================================
-- FIX 4: Focus session management functions
-- =====================================================

-- Function to start a new focus session
CREATE OR REPLACE FUNCTION start_focus_session(
    p_user_id UUID,
    p_duracao_minutos INTEGER,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- Validate input
    IF p_duracao_minutos < 1 OR p_duracao_minutos > 180 THEN
        RAISE EXCEPTION 'duracao_minutos deve estar entre 1 e 180 minutos';
    END IF;
    
    -- Insert new session (trigger will deactivate other sessions)
    INSERT INTO sessoes_foco (
        user_id,
        duracao_minutos,
        tempo_restante,
        ativa,
        pausada,
        date
    ) VALUES (
        p_user_id,
        p_duracao_minutos,
        p_duracao_minutos * 60, -- Convert to seconds
        true,
        false,
        p_date
    )
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update focus session time
CREATE OR REPLACE FUNCTION update_focus_session_time(
    p_session_id UUID,
    p_user_id UUID,
    p_tempo_restante_seconds INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sessoes_foco 
    SET 
        tempo_restante = p_tempo_restante_seconds,
        updated_at = NOW(),
        -- Auto-complete if time reaches zero
        ativa = CASE WHEN p_tempo_restante_seconds <= 0 THEN false ELSE ativa END
    WHERE id = p_session_id 
    AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to pause/resume focus session
CREATE OR REPLACE FUNCTION toggle_focus_session_pause(
    p_session_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sessoes_foco 
    SET 
        pausada = NOT pausada,
        updated_at = NOW()
    WHERE id = p_session_id 
    AND user_id = p_user_id
    AND ativa = true;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION start_focus_session TO authenticated;
GRANT EXECUTE ON FUNCTION update_focus_session_time TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_focus_session_pause TO authenticated;

-- =====================================================
-- FIX 5: Improve existing indexes
-- =====================================================

-- Enhanced composite indexes for better query performance
DROP INDEX IF EXISTS idx_sessoes_foco_user_ativa;

-- Better index for active sessions per user per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessoes_foco_unique_active 
ON sessoes_foco(user_id, date) 
WHERE ativa = true;

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_sessoes_foco_dashboard_stats
ON sessoes_foco(user_id, date, ativa, duracao_minutos, tempo_restante);

-- =====================================================
-- FIX 6: Add helpful comments and documentation
-- =====================================================

COMMENT ON FUNCTION get_dashboard_summary_enhanced IS 'Enhanced dashboard summary with productivity scoring and detailed focus session stats';
COMMENT ON FUNCTION start_focus_session IS 'Start a new focus session, automatically deactivating any existing active session';
COMMENT ON FUNCTION update_focus_session_time IS 'Update remaining time for a focus session in seconds';
COMMENT ON FUNCTION toggle_focus_session_pause IS 'Toggle pause state of an active focus session';

-- Update table comment
COMMENT ON TABLE sessoes_foco IS 'Focus/Pomodoro sessions for dashboard - tempo_restante in SECONDS, duracao_minutos in MINUTES';

COMMIT;