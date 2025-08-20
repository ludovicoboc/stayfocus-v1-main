-- Migration: Add update_simulation_stats RPC function
-- Description: Updates simulation statistics when a new attempt is completed
-- Date: 2025-08-20

BEGIN;

-- Create function to update simulation statistics
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

COMMIT;