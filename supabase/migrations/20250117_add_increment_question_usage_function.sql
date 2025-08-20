-- Migration: Add increment_question_usage RPC function
-- Created: 2025-01-17

-- Create function to increment question usage count
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
