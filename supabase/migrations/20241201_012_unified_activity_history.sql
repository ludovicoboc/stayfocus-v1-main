-- =====================================================
-- MIGRATION 012: Unified Activity History System
-- Description: Complete unified activity history system with support for all modules including concursos
-- Date: 2024-12-01
-- =====================================================

BEGIN;

-- =====================================================
-- TABLE: activity_history
-- Description: Unified activity tracking across all modules
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Activity identification
    module TEXT NOT NULL CHECK (module IN ('estudos', 'simulados', 'concursos', 'financas', 'saude', 'sono', 'alimentacao', 'lazer', 'hiperfocos', 'autoconhecimento')),
    activity_type TEXT NOT NULL,
    activity_subtype TEXT,

    -- Activity data
    title TEXT NOT NULL CHECK (length(trim(title)) > 0 AND length(title) <= 200),
    description TEXT CHECK (length(description) <= 1000),

    -- Enhanced metadata (JSONB for flexible data storage)
    metadata JSONB DEFAULT '{}',

    -- Performance/Results
    score NUMERIC CHECK (score >= 0),
    percentage NUMERIC(5,2) CHECK (percentage >= 0 AND percentage <= 100),
    duration_minutes INTEGER CHECK (duration_minutes >= 0),

    -- Success metrics
    success_rate NUMERIC(5,2) CHECK (success_rate >= 0 AND success_rate <= 100),

    -- Categorization
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    difficulty TEXT CHECK (difficulty IN ('facil', 'medio', 'dificil')),

    -- Status and flags
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
    is_favorite BOOLEAN DEFAULT FALSE,
    is_milestone BOOLEAN DEFAULT FALSE,

    -- Timestamps
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE activity_history IS 'Unified activity history system supporting all modules including concursos';
COMMENT ON COLUMN activity_history.module IS 'Module identifier: estudos, simulados, concursos, financas, saude, sono, alimentacao, lazer, hiperfocos, autoconhecimento';
COMMENT ON COLUMN activity_history.activity_type IS 'Type of activity within the module (e.g., study_session, simulation_completed)';
COMMENT ON COLUMN activity_history.activity_subtype IS 'Optional sub-type for more granular categorization';
COMMENT ON COLUMN activity_history.metadata IS 'Flexible JSON storage for module-specific data';
COMMENT ON COLUMN activity_history.percentage IS 'Performance percentage (0-100) for scoring activities';
COMMENT ON COLUMN activity_history.success_rate IS 'Success rate percentage (0-100) for completion metrics';
COMMENT ON COLUMN activity_history.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN activity_history.activity_date IS 'Date when the activity occurred (YYYY-MM-DD)';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary user-based indexes
CREATE INDEX IF NOT EXISTS idx_activity_history_user_id ON activity_history(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_history_user_module ON activity_history(user_id, module);
CREATE INDEX IF NOT EXISTS idx_activity_history_user_date ON activity_history(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_history_user_created_at ON activity_history(user_id, created_at DESC);

-- Module-specific indexes
CREATE INDEX IF NOT EXISTS idx_activity_history_module ON activity_history(module);
CREATE INDEX IF NOT EXISTS idx_activity_history_module_date ON activity_history(module, activity_date);
CREATE INDEX IF NOT EXISTS idx_activity_history_module_status ON activity_history(module, status);

-- Activity type indexes
CREATE INDEX IF NOT EXISTS idx_activity_history_activity_type ON activity_history(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_history_activity_subtype ON activity_history(activity_subtype);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_activity_history_percentage ON activity_history(percentage DESC);
CREATE INDEX IF NOT EXISTS idx_activity_history_score ON activity_history(score DESC);
CREATE INDEX IF NOT EXISTS idx_activity_history_duration ON activity_history(duration_minutes);

-- Status and flags indexes
CREATE INDEX IF NOT EXISTS idx_activity_history_status ON activity_history(status);
CREATE INDEX IF NOT EXISTS idx_activity_history_is_favorite ON activity_history(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_activity_history_is_milestone ON activity_history(user_id, is_milestone) WHERE is_milestone = true;

-- Tags index (GIN for array operations)
CREATE INDEX IF NOT EXISTS idx_activity_history_tags ON activity_history USING GIN(tags);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_history_user_module_date ON activity_history(user_id, module, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_history_user_module_type ON activity_history(user_id, module, activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_history_user_date_type ON activity_history(user_id, activity_date DESC, activity_type);

-- Recent activities index (for dashboard queries) - Note: This index cannot use NOW() as it's not IMMUTABLE
-- Consider creating this index after data is populated if needed for performance

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own activity history" ON activity_history;

-- Create comprehensive RLS policy
CREATE POLICY "Users can manage their own activity history" ON activity_history
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at column
DROP TRIGGER IF EXISTS update_activity_history_updated_at ON activity_history;
CREATE TRIGGER update_activity_history_updated_at
    BEFORE UPDATE ON activity_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATA MIGRATION FROM EXISTING TABLES
-- =====================================================

-- Note: This migration creates the unified table structure.
-- Data migration from existing tables should be handled separately
-- to ensure data integrity and avoid conflicts.

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get activity statistics by module
CREATE OR REPLACE FUNCTION get_activity_stats_by_module(
    p_user_id UUID,
    p_module TEXT DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    module TEXT,
    total_activities BIGINT,
    completed_activities BIGINT,
    total_duration_minutes BIGINT,
    avg_score NUMERIC,
    avg_percentage NUMERIC,
    best_score NUMERIC,
    best_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ah.module,
        COUNT(*) as total_activities,
        COUNT(*) FILTER (WHERE ah.status = 'completed') as completed_activities,
        COALESCE(SUM(ah.duration_minutes), 0) as total_duration_minutes,
        ROUND(AVG(ah.score) FILTER (WHERE ah.score IS NOT NULL), 2) as avg_score,
        ROUND(AVG(ah.percentage) FILTER (WHERE ah.percentage IS NOT NULL), 2) as avg_percentage,
        MAX(ah.score) FILTER (WHERE ah.score IS NOT NULL) as best_score,
        MAX(ah.percentage) FILTER (WHERE ah.percentage IS NOT NULL) as best_percentage
    FROM activity_history ah
    WHERE ah.user_id = p_user_id
    AND (p_module IS NULL OR ah.module = p_module)
    AND ah.activity_date >= COALESCE(p_date_from, ah.activity_date)
    AND ah.activity_date <= p_date_to
    GROUP BY ah.module
    ORDER BY ah.module;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent activities for dashboard
CREATE OR REPLACE FUNCTION get_recent_activities(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    module TEXT,
    title TEXT,
    activity_type TEXT,
    score NUMERIC,
    percentage NUMERIC,
    duration_minutes INTEGER,
    status TEXT,
    activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ah.id,
        ah.module,
        ah.title,
        ah.activity_type,
        ah.score,
        ah.percentage,
        ah.duration_minutes,
        ah.status,
        ah.activity_date,
        ah.created_at
    FROM activity_history ah
    WHERE ah.user_id = p_user_id
    ORDER BY ah.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_activity_stats_by_module TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activities TO authenticated;

-- =====================================================
-- MIGRATION VALIDATION
-- =====================================================

-- Verify table creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_history') THEN
        RAISE EXCEPTION 'Table activity_history was not created successfully';
    END IF;
END $$;

COMMIT;
