-- Migration: Create hiperfocos related tables
-- Created: 2024-01-01
-- Description: Tables for hyperfocus management system including projects, tasks, sessions and alternation sessions

BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================================
-- TABLE CREATION
-- ====================================================================================

-- Create hyperfocus_projects table
-- Stores user-created hyperfocus projects with metadata
CREATE TABLE IF NOT EXISTS hyperfocus_projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    description text,
    color varchar(7) NOT NULL, -- Hex color code (e.g., #ff0000)
    time_limit integer, -- Time limit in minutes (nullable)
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add comment to table
COMMENT ON TABLE hyperfocus_projects IS 'Stores hyperfocus projects created by users for interest management';
COMMENT ON COLUMN hyperfocus_projects.color IS 'Hex color code for project visualization';
COMMENT ON COLUMN hyperfocus_projects.time_limit IS 'Optional time limit for the project in minutes';
COMMENT ON COLUMN hyperfocus_projects.is_active IS 'Whether the project is currently active';

-- Create hyperfocus_tasks table
-- Stores tasks associated with hyperfocus projects
CREATE TABLE IF NOT EXISTS hyperfocus_tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES hyperfocus_projects(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    description text,
    completed boolean NOT NULL DEFAULT false,
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add comment to table
COMMENT ON TABLE hyperfocus_tasks IS 'Tasks that belong to hyperfocus projects';
COMMENT ON COLUMN hyperfocus_tasks.order_index IS 'Used for ordering tasks within a project';
COMMENT ON COLUMN hyperfocus_tasks.completed IS 'Whether the task has been completed';

-- Create hyperfocus_sessions table
-- Stores focus sessions for tracking time spent on projects
CREATE TABLE IF NOT EXISTS hyperfocus_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id uuid REFERENCES hyperfocus_projects(id) ON DELETE SET NULL,
    duration_minutes integer NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add comment to table
COMMENT ON TABLE hyperfocus_sessions IS 'Focus sessions for tracking time spent on hyperfocus activities';
COMMENT ON COLUMN hyperfocus_sessions.project_id IS 'Optional reference to specific project, can be null for general sessions';
COMMENT ON COLUMN hyperfocus_sessions.duration_minutes IS 'Duration of the focus session in minutes';
COMMENT ON COLUMN hyperfocus_sessions.started_at IS 'When the session was actually started';
COMMENT ON COLUMN hyperfocus_sessions.completed_at IS 'When the session was completed';

-- Create alternation_sessions table
-- Stores alternation sessions for managing multiple hyperfocus projects
CREATE TABLE IF NOT EXISTS alternation_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    projects text[] NOT NULL, -- Array of project UUIDs
    current_project_index integer NOT NULL DEFAULT 0,
    session_duration integer NOT NULL, -- Duration per project in minutes
    is_active boolean NOT NULL DEFAULT false,
    started_at timestamp with time zone,
    paused_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add comment to table
COMMENT ON TABLE alternation_sessions IS 'Sessions for alternating between multiple hyperfocus projects';
COMMENT ON COLUMN alternation_sessions.projects IS 'Array of project UUIDs to alternate between';
COMMENT ON COLUMN alternation_sessions.current_project_index IS 'Index of currently active project in the projects array';
COMMENT ON COLUMN alternation_sessions.session_duration IS 'Duration to spend on each project in minutes';
COMMENT ON COLUMN alternation_sessions.is_active IS 'Whether the alternation session is currently running';

-- ====================================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================================

-- Enable RLS on all tables
ALTER TABLE hyperfocus_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hyperfocus_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hyperfocus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hyperfocus_projects
CREATE POLICY "Users can only see their own hyperfocus projects" ON hyperfocus_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own hyperfocus projects" ON hyperfocus_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own hyperfocus projects" ON hyperfocus_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own hyperfocus projects" ON hyperfocus_projects
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for hyperfocus_tasks
CREATE POLICY "Users can only see tasks from their own projects" ON hyperfocus_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM hyperfocus_projects 
            WHERE hyperfocus_projects.id = hyperfocus_tasks.project_id 
            AND hyperfocus_projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only insert tasks to their own projects" ON hyperfocus_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM hyperfocus_projects 
            WHERE hyperfocus_projects.id = hyperfocus_tasks.project_id 
            AND hyperfocus_projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only update tasks from their own projects" ON hyperfocus_tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM hyperfocus_projects 
            WHERE hyperfocus_projects.id = hyperfocus_tasks.project_id 
            AND hyperfocus_projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only delete tasks from their own projects" ON hyperfocus_tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM hyperfocus_projects 
            WHERE hyperfocus_projects.id = hyperfocus_tasks.project_id 
            AND hyperfocus_projects.user_id = auth.uid()
        )
    );

-- RLS Policies for hyperfocus_sessions
CREATE POLICY "Users can only see their own hyperfocus sessions" ON hyperfocus_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own hyperfocus sessions" ON hyperfocus_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own hyperfocus sessions" ON hyperfocus_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own hyperfocus sessions" ON hyperfocus_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for alternation_sessions
CREATE POLICY "Users can only see their own alternation sessions" ON alternation_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own alternation sessions" ON alternation_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own alternation sessions" ON alternation_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own alternation sessions" ON alternation_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================================================================
-- INDEXES
-- ====================================================================================

-- Indexes for hyperfocus_projects
CREATE INDEX IF NOT EXISTS idx_hyperfocus_projects_user_id ON hyperfocus_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_projects_created_at ON hyperfocus_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_projects_is_active ON hyperfocus_projects(is_active);

-- Indexes for hyperfocus_tasks
CREATE INDEX IF NOT EXISTS idx_hyperfocus_tasks_project_id ON hyperfocus_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_tasks_order_index ON hyperfocus_tasks(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_tasks_completed ON hyperfocus_tasks(completed);

-- Indexes for hyperfocus_sessions
CREATE INDEX IF NOT EXISTS idx_hyperfocus_sessions_user_id ON hyperfocus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_sessions_project_id ON hyperfocus_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_sessions_created_at ON hyperfocus_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_sessions_completed ON hyperfocus_sessions(completed);

-- Indexes for alternation_sessions
CREATE INDEX IF NOT EXISTS idx_alternation_sessions_user_id ON alternation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_alternation_sessions_created_at ON alternation_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alternation_sessions_is_active ON alternation_sessions(is_active);

-- ====================================================================================
-- TRIGGERS
-- ====================================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating updated_at on each table
CREATE TRIGGER update_hyperfocus_projects_updated_at
    BEFORE UPDATE ON hyperfocus_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hyperfocus_tasks_updated_at
    BEFORE UPDATE ON hyperfocus_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hyperfocus_sessions_updated_at
    BEFORE UPDATE ON hyperfocus_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alternation_sessions_updated_at
    BEFORE UPDATE ON alternation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================================
-- CONSTRAINTS
-- ====================================================================================

-- Add constraints for data validation
ALTER TABLE hyperfocus_projects 
ADD CONSTRAINT check_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE hyperfocus_projects 
ADD CONSTRAINT check_time_limit_positive CHECK (time_limit IS NULL OR time_limit > 0);

ALTER TABLE hyperfocus_tasks 
ADD CONSTRAINT check_order_index_non_negative CHECK (order_index >= 0);

ALTER TABLE hyperfocus_sessions 
ADD CONSTRAINT check_duration_positive CHECK (duration_minutes > 0);

ALTER TABLE hyperfocus_sessions 
ADD CONSTRAINT check_completed_at_after_started_at CHECK (
    completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at
);

ALTER TABLE alternation_sessions 
ADD CONSTRAINT check_session_duration_positive CHECK (session_duration > 0);

ALTER TABLE alternation_sessions 
ADD CONSTRAINT check_current_project_index_non_negative CHECK (current_project_index >= 0);

ALTER TABLE alternation_sessions 
ADD CONSTRAINT check_projects_not_empty CHECK (array_length(projects, 1) > 0);

-- ====================================================================================
-- SAMPLE DATA (Optional - for development/testing)
-- ====================================================================================

-- Note: Sample data insertion is commented out for production safety
-- Uncomment below lines if you want to insert sample data for testing

/*
-- Sample hyperfocus project (only if a test user exists)
INSERT INTO hyperfocus_projects (user_id, title, description, color, time_limit, is_active) 
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Aprender TypeScript',
    'Estudo aprofundado de TypeScript para desenvolvimento web',
    '#3b82f6',
    120,
    true
) ON CONFLICT DO NOTHING;

-- Sample tasks for the project
INSERT INTO hyperfocus_tasks (project_id, title, completed, order_index)
SELECT 
    p.id,
    'Configurar ambiente de desenvolvimento',
    false,
    0
FROM hyperfocus_projects p 
WHERE p.title = 'Aprender TypeScript'
ON CONFLICT DO NOTHING;
*/

COMMIT;
