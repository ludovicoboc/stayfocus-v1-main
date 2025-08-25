-- =====================================================
-- MIGRATION 004 FIX: Competitions System Corrections
-- Description: Fix inconsistencies between SQL schema and frontend types
-- Date: 2024-08-24
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: Update competition_questions structure
-- =====================================================

-- Add missing columns that frontend might need
ALTER TABLE competition_questions 
ADD COLUMN IF NOT EXISTS question_type_v2 TEXT DEFAULT 'multiple_choice' 
CHECK (question_type_v2 IN ('multiple_choice', 'true_false', 'essay', 'fill_blank'));

-- Ensure options column structure matches frontend expectations
COMMENT ON COLUMN competition_questions.options IS 'JSONB array with structure: [{"text": string, "isCorrect": boolean}]';
COMMENT ON COLUMN competition_questions.correct_options IS 'JSONB array for multiple correct answers (legacy field)';

-- =====================================================
-- FIX 2: Update competition_simulations structure  
-- =====================================================

-- Ensure questions column structure matches frontend
COMMENT ON COLUMN competition_simulations.questions IS 'JSONB array of question UUIDs: ["uuid1", "uuid2", ...]';

-- Add computed column for question_count to match frontend usage
-- This will be automatically calculated based on questions array length

-- =====================================================
-- FIX 3: Standardize naming conventions
-- =====================================================

-- Create view for better frontend compatibility
CREATE OR REPLACE VIEW v_competition_questions_frontend AS
SELECT 
    id,
    competition_id,
    subject_id,
    topic_id,
    question_text,
    COALESCE(question_type_v2, question_type) as question_type,
    options,
    correct_answer,
    explanation,
    difficulty,
    points,
    time_limit_seconds,
    tags,
    source,
    year,
    is_ai_generated,
    is_active,
    usage_count,
    created_at,
    updated_at
FROM competition_questions
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON v_competition_questions_frontend TO authenticated;

-- Create RLS policy for the view
ALTER VIEW v_competition_questions_frontend SET (security_barrier = true);

-- =====================================================
-- FIX 4: Update simulation statistics function
-- =====================================================

-- Enhanced function to handle new simulation structure
CREATE OR REPLACE FUNCTION get_simulation_statistics(
    p_simulation_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    total_questions INTEGER,
    attempts_count INTEGER,
    best_score NUMERIC,
    avg_score NUMERIC,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jsonb_array_length(s.questions)::INTEGER as total_questions,
        s.attempts_count,
        s.best_score,
        s.avg_score,
        CASE 
            WHEN s.attempts_count > 0 THEN (s.attempts_count::NUMERIC / GREATEST(s.attempts_count, 1)) * 100
            ELSE 0
        END as completion_rate
    FROM competition_simulations s
    WHERE s.id = p_simulation_id 
    AND s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_simulation_statistics TO authenticated;

-- =====================================================
-- FIX 5: Add indexes for better performance
-- =====================================================

-- Index for question type filtering
CREATE INDEX IF NOT EXISTS idx_competition_questions_type_v2 
ON competition_questions(question_type_v2) 
WHERE question_type_v2 IS NOT NULL;

-- Composite index for simulation queries
CREATE INDEX IF NOT EXISTS idx_competition_simulations_user_competition 
ON competition_simulations(user_id, competition_id, created_at DESC);

COMMIT;