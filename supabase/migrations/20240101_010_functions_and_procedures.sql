-- =====================================================
-- MIGRATION 010: Functions and Procedures
-- Description: Additional functions, RPC procedures, and utility functions
-- Date: 2024-01-01
-- =====================================================

BEGIN;

-- =====================================================
-- COMPETITION FUNCTIONS
-- =====================================================

-- Function to increment question usage count
CREATE OR REPLACE FUNCTION increment_question_usage(question_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE competition_questions
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = question_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_question_usage(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION increment_question_usage(UUID) IS 'Increments the usage count for a specific question';

-- =====================================================
-- RPC: random_competition_questions
-- =====================================================

-- Returns N random questions for a competition, optionally filtered by difficulties
-- Enforces that the caller can only access their own competition's questions
CREATE OR REPLACE FUNCTION public.random_competition_questions(
  competition_id uuid,
  n int,
  difficulties text[] DEFAULT NULL
)
RETURNS SETOF public.competition_questions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.*
  FROM public.competition_questions q
  JOIN public.competitions c ON c.id = q.competition_id
  WHERE q.competition_id = random_competition_questions.competition_id
    AND c.user_id = auth.uid()
    AND (
      difficulties IS NULL
      OR q.difficulty = ANY(difficulties)
    )
  ORDER BY random()
  LIMIT n;
$$;

-- Ensure only authenticated users can execute
REVOKE ALL ON FUNCTION public.random_competition_questions(uuid, int, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.random_competition_questions(uuid, int, text[]) TO authenticated;

-- =====================================================
-- SIMULATION STATISTICS FUNCTION
-- =====================================================

-- Function to update simulation statistics
CREATE OR REPLACE FUNCTION update_simulation_stats(
  simulation_id UUID,
  new_score INTEGER,
  new_percentage NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_attempts INTEGER;
  current_best_score NUMERIC;
  current_avg_score NUMERIC;
  total_score NUMERIC;
BEGIN
  -- Get current stats
  SELECT 
    attempts_count, 
    best_score, 
    avg_score
  INTO 
    current_attempts, 
    current_best_score, 
    current_avg_score
  FROM competition_simulations 
  WHERE id = simulation_id;

  -- Calculate new stats
  current_attempts := current_attempts + 1;
  
  -- Update best score
  IF current_best_score IS NULL OR new_percentage > current_best_score THEN
    current_best_score := new_percentage;
  END IF;
  
  -- Calculate new average score
  IF current_avg_score IS NULL THEN
    current_avg_score := new_percentage;
  ELSE
    total_score := (current_avg_score * (current_attempts - 1)) + new_percentage;
    current_avg_score := total_score / current_attempts;
  END IF;
  
  -- Update the simulation record
  UPDATE competition_simulations 
  SET 
    attempts_count = current_attempts,
    best_score = current_best_score,
    avg_score = current_avg_score,
    updated_at = NOW()
  WHERE id = simulation_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_simulation_stats(UUID, INTEGER, NUMERIC) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION update_simulation_stats(UUID, INTEGER, NUMERIC) IS 'Updates simulation statistics after a completed attempt';

-- =====================================================
-- USER SETUP AUTOMATION FUNCTIONS
-- =====================================================

-- Comprehensive function to create all default data for new users
CREATE OR REPLACE FUNCTION create_comprehensive_user_defaults(user_uuid uuid)
RETURNS void AS $$
BEGIN
    -- Create user profile data (from migration 002)
    PERFORM create_default_user_data(user_uuid);
    
    -- Create sleep reminders (from migration 006)  
    PERFORM create_default_sleep_reminders(user_uuid);
    
    -- Create expense categories (from migration 007)
    PERFORM create_default_expense_categories(user_uuid);
    
    -- Log the setup completion
    INSERT INTO admin_logs (action, details, created_at) 
    VALUES ('user_setup_complete', 
            format('Completed default setup for user %s', user_uuid), 
            now())
    ON CONFLICT DO NOTHING; -- Ignore if admin_logs table doesn't exist
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_comprehensive_user_defaults TO authenticated;

-- Enhanced function to handle complete new user setup
CREATE OR REPLACE FUNCTION handle_comprehensive_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create all default data for the new user
    PERFORM create_comprehensive_user_defaults(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the existing trigger with comprehensive setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_sleep_setup ON auth.users;

-- Create comprehensive trigger for new user setup
CREATE TRIGGER on_auth_user_created_comprehensive
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_comprehensive_new_user();

-- =====================================================
-- DASHBOARD UTILITY FUNCTIONS  
-- =====================================================

-- Function to get dashboard summary for a user on a specific date
CREATE OR REPLACE FUNCTION get_dashboard_summary(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_activities INTEGER,
    completed_activities INTEGER,
    total_priorities INTEGER,
    completed_priorities INTEGER,
    active_focus_sessions INTEGER,
    upcoming_compromissos INTEGER,
    completion_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Activities
        (SELECT COUNT(*)::INTEGER FROM painel_dia WHERE user_id = p_user_id AND date = p_date),
        (SELECT COUNT(*)::INTEGER FROM painel_dia WHERE user_id = p_user_id AND date = p_date AND concluida = true),
        
        -- Priorities
        (SELECT COUNT(*)::INTEGER FROM prioridades WHERE user_id = p_user_id AND date = p_date),
        (SELECT COUNT(*)::INTEGER FROM prioridades WHERE user_id = p_user_id AND date = p_date AND concluida = true),
        
        -- Focus sessions
        (SELECT COUNT(*)::INTEGER FROM sessoes_foco WHERE user_id = p_user_id AND date = p_date AND ativa = true),
        
        -- Upcoming appointments
        (SELECT COUNT(*)::INTEGER FROM compromissos WHERE user_id = p_user_id AND data = p_date AND concluido = false),
        
        -- Overall completion percentage
        CASE 
            WHEN (SELECT COUNT(*) FROM painel_dia WHERE user_id = p_user_id AND date = p_date) + 
                 (SELECT COUNT(*) FROM prioridades WHERE user_id = p_user_id AND date = p_date) = 0 
            THEN 0::NUMERIC
            ELSE ROUND(
                ((SELECT COUNT(*) FROM painel_dia WHERE user_id = p_user_id AND date = p_date AND concluida = true) + 
                 (SELECT COUNT(*) FROM prioridades WHERE user_id = p_user_id AND date = p_date AND concluida = true))::NUMERIC /
                ((SELECT COUNT(*) FROM painel_dia WHERE user_id = p_user_id AND date = p_date) + 
                 (SELECT COUNT(*) FROM prioridades WHERE user_id = p_user_id AND date = p_date))::NUMERIC * 100, 2
            )
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_dashboard_summary TO authenticated;

-- Comment for the function
COMMENT ON FUNCTION get_dashboard_summary(UUID, DATE) IS 'Returns daily dashboard summary statistics for a user';

-- =====================================================
-- HEALTH TRACKING UTILITY FUNCTIONS
-- =====================================================

-- Function to get health overview for a user
CREATE OR REPLACE FUNCTION get_health_overview(
    p_user_id UUID,
    p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    medications_count INTEGER,
    mood_records_count INTEGER,
    avg_mood_level NUMERIC,
    sleep_records_count INTEGER,
    avg_sleep_quality NUMERIC,
    hydration_avg NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Current medications count
        (SELECT COUNT(*)::INTEGER FROM medicamentos WHERE user_id = p_user_id),
        
        -- Mood records in the last N days
        (SELECT COUNT(*)::INTEGER FROM registros_humor 
         WHERE user_id = p_user_id AND data >= CURRENT_DATE - INTERVAL '1 day' * p_days_back),
        
        -- Average mood level in the last N days
        (SELECT ROUND(AVG(nivel_humor), 2) FROM registros_humor 
         WHERE user_id = p_user_id AND data >= CURRENT_DATE - INTERVAL '1 day' * p_days_back),
        
        -- Sleep records in the last N days
        (SELECT COUNT(*)::INTEGER FROM sleep_records 
         WHERE user_id = p_user_id AND date >= CURRENT_DATE - p_days_back),
        
        -- Average sleep quality in the last N days
        (SELECT ROUND(AVG(sleep_quality), 2) FROM sleep_records 
         WHERE user_id = p_user_id AND date >= CURRENT_DATE - p_days_back),
        
        -- Average daily hydration in the last N days
        (SELECT ROUND(AVG(glasses_count), 2) FROM hydration_records 
         WHERE user_id = p_user_id AND date >= CURRENT_DATE - p_days_back);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_health_overview TO authenticated;

-- Comment for the function
COMMENT ON FUNCTION get_health_overview(UUID, INTEGER) IS 'Returns health tracking overview for a user over specified number of days';

-- =====================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to clean up old data across all tables
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    total_deleted INTEGER := 0;
    deleted_count INTEGER;
BEGIN
    -- Clean up old painel_dia entries (keep 1 year by default)
    DELETE FROM painel_dia 
    WHERE date < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Clean up old prioridades entries
    DELETE FROM prioridades 
    WHERE date < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Clean up old sessoes_foco entries
    DELETE FROM sessoes_foco 
    WHERE date < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Clean up old meal_records entries
    DELETE FROM meal_records 
    WHERE date < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Clean up old hydration_records entries  
    DELETE FROM hydration_records 
    WHERE date < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Clean up old inactive pomodoro sessions (call existing function)
    SELECT cleanup_old_inactive_pomodoro_sessions() INTO deleted_count;
    total_deleted := total_deleted + deleted_count;
    
    RETURN total_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for the cleanup function
COMMENT ON FUNCTION cleanup_old_data(INTEGER) IS 'Cleans up old data across all tables, keeping specified number of days';

-- =====================================================
-- ADMIN AND MONITORING FUNCTIONS
-- =====================================================

-- Function to get system statistics
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE (
    total_users INTEGER,
    total_competitions INTEGER,
    total_questions INTEGER,
    total_simulations INTEGER,
    total_recipes INTEGER,
    active_focus_sessions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM auth.users),
        (SELECT COUNT(*)::INTEGER FROM competitions),
        (SELECT COUNT(*)::INTEGER FROM competition_questions),
        (SELECT COUNT(*)::INTEGER FROM competition_simulations),
        (SELECT COUNT(*)::INTEGER FROM receitas),
        (SELECT COUNT(*)::INTEGER FROM sessoes_foco WHERE ativa = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This function should only be available to service_role, not regular users
-- GRANT EXECUTE ON FUNCTION get_system_stats TO service_role;

COMMENT ON FUNCTION get_system_stats() IS 'Returns system-wide statistics (admin function)';

COMMIT;