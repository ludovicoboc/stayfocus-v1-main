-- Migration: Fix simulation default status
-- Description: Changes default status from 'draft' to 'active' for new simulations
-- Date: 2025-08-20

BEGIN;

-- Alter the default value for status column in competition_simulations
ALTER TABLE competition_simulations 
ALTER COLUMN status SET DEFAULT 'active';

-- Update existing draft simulations to active (optional - only if you want to activate existing drafts)
-- Uncomment the line below if you want to activate all existing draft simulations:
-- UPDATE competition_simulations SET status = 'active' WHERE status = 'draft';

COMMIT;