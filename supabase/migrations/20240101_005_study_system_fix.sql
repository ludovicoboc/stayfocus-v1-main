-- =====================================================
-- MIGRATION 005 FIX: Study System Field Name Corrections
-- Description: Fix field naming inconsistencies between SQL and frontend
-- Date: 2024-08-24
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: Create view with frontend-compatible field names
-- =====================================================

-- Create view for study_sessions with frontend naming
CREATE OR REPLACE VIEW v_study_sessions_frontend AS
SELECT 
    id,
    user_id,
    competition_id,
    subject as disciplina,  -- Map SQL 'subject' to frontend 'disciplina'
    topic as topico,        -- Map SQL 'topic' to frontend 'topico'
    duration_minutes,
    completed,
    pomodoro_cycles,
    notes,
    started_at,
    completed_at,
    created_at,
    updated_at
FROM study_sessions;

-- Enable RLS on the view
ALTER VIEW v_study_sessions_frontend SET (security_barrier = true);

-- Grant access to authenticated users
GRANT SELECT ON v_study_sessions_frontend TO authenticated;

-- =====================================================
-- FIX 2: Create functions for inserting with correct field names
-- =====================================================

-- Function to insert study session with frontend field names
CREATE OR REPLACE FUNCTION insert_study_session_frontend(
    p_user_id UUID,
    p_competition_id UUID DEFAULT NULL,
    p_disciplina TEXT,
    p_topico TEXT DEFAULT NULL,
    p_duration_minutes INTEGER,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO study_sessions (
        user_id,
        competition_id,
        subject,  -- Map frontend 'disciplina' to SQL 'subject'
        topic,    -- Map frontend 'topico' to SQL 'topic'
        duration_minutes,
        notes,
        completed,
        pomodoro_cycles
    ) VALUES (
        p_user_id,
        p_competition_id,
        p_disciplina,
        p_topico,
        p_duration_minutes,
        p_notes,
        false,
        0
    )
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION insert_study_session_frontend TO authenticated;

-- Function to update study session with frontend field names
CREATE OR REPLACE FUNCTION update_study_session_frontend(
    p_session_id UUID,
    p_user_id UUID,
    p_disciplina TEXT DEFAULT NULL,
    p_topico TEXT DEFAULT NULL,
    p_duration_minutes INTEGER DEFAULT NULL,
    p_completed BOOLEAN DEFAULT NULL,
    p_pomodoro_cycles INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE study_sessions 
    SET 
        subject = COALESCE(p_disciplina, subject),
        topic = COALESCE(p_topico, topic),
        duration_minutes = COALESCE(p_duration_minutes, duration_minutes),
        completed = COALESCE(p_completed, completed),
        pomodoro_cycles = COALESCE(p_pomodoro_cycles, pomodoro_cycles),
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = p_session_id 
    AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_study_session_frontend TO authenticated;

-- =====================================================
-- FIX 3: Update existing statistics functions to use correct field names
-- =====================================================

-- Update the existing statistics function to work with frontend naming
CREATE OR REPLACE FUNCTION get_study_statistics_frontend(p_user_id UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    completed_sessions BIGINT,
    total_study_time INTEGER,
    total_pomodoro_cycles INTEGER,
    avg_session_duration NUMERIC,
    disciplinas_studied TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
        COALESCE(SUM(duration_minutes), 0)::INTEGER as total_study_time,
        COALESCE(SUM(pomodoro_cycles), 0)::INTEGER as total_pomodoro_cycles,
        ROUND(AVG(duration_minutes), 2) as avg_session_duration,
        ARRAY_AGG(DISTINCT subject) as disciplinas_studied  -- Return as 'disciplinas'
    FROM study_sessions 
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_study_statistics_frontend TO authenticated;

-- =====================================================
-- FIX 4: Add helpful indexes for the new naming pattern
-- =====================================================

-- Index for subject (disciplina) queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject_topic 
ON study_sessions(user_id, subject, topic);

-- Index for recent sessions by subject
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject_recent 
ON study_sessions(user_id, subject, created_at DESC);

-- =====================================================
-- FIX 5: Add comments for clarity
-- =====================================================

COMMENT ON VIEW v_study_sessions_frontend IS 'View with frontend-compatible field names: subject->disciplina, topic->topico';
COMMENT ON FUNCTION insert_study_session_frontend IS 'Insert study session using frontend field names (disciplina, topico)';
COMMENT ON FUNCTION update_study_session_frontend IS 'Update study session using frontend field names (disciplina, topico)';
COMMENT ON FUNCTION get_study_statistics_frontend IS 'Get study statistics with frontend-compatible field names';

COMMIT;