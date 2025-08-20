-- Migration: Create simulation_history table
-- Description: Creates table to store history of completed simulations
-- Date: 2025-08-20

BEGIN;

-- =====================================================
-- TABLE: simulation_history
-- Description: Stores history of completed simulations
-- =====================================================
CREATE TABLE IF NOT EXISTS simulation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    simulation_id UUID NOT NULL REFERENCES competition_simulations(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    time_taken_minutes INTEGER CHECK (time_taken_minutes >= 0),
    answers JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comments to table
COMMENT ON TABLE simulation_history IS 'Stores history of completed simulations with scores and answers';
COMMENT ON COLUMN simulation_history.score IS 'Number of correct answers';
COMMENT ON COLUMN simulation_history.total_questions IS 'Total number of questions in the simulation';
COMMENT ON COLUMN simulation_history.percentage IS 'Percentage score (score/total_questions * 100)';
COMMENT ON COLUMN simulation_history.time_taken_minutes IS 'Time taken to complete the simulation in minutes';
COMMENT ON COLUMN simulation_history.answers IS 'JSON object containing user answers and question details';
COMMENT ON COLUMN simulation_history.completed_at IS 'When the simulation was completed';

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE simulation_history ENABLE ROW LEVEL SECURITY;

-- Policies for simulation_history
CREATE POLICY "Users can view their own simulation history"
    ON simulation_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own simulation history"
    ON simulation_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulation history"
    ON simulation_history FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simulation history"
    ON simulation_history FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES
-- =====================================================

-- Indexes for simulation_history
CREATE INDEX IF NOT EXISTS idx_simulation_history_user_id ON simulation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_history_simulation_id ON simulation_history(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_history_completed_at ON simulation_history(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_history_user_completed ON simulation_history(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_history_percentage ON simulation_history(percentage DESC);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger for updated_at
CREATE TRIGGER update_simulation_history_updated_at
    BEFORE UPDATE ON simulation_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;