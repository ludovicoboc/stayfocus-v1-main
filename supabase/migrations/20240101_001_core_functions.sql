-- =====================================================
-- MIGRATION 001: Core Functions and Extensions
-- Description: Essential functions and extensions needed by all other migrations
-- Date: 2024-01-01
-- =====================================================

BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp (used by all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Comment for the function
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at column on row updates';

COMMIT;