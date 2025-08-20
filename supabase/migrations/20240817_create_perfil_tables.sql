-- Migration: Create Profile Tables
-- Description: Creates tables for user profiles, preferences, and goals management
-- Date: 2024-08-17

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: user_profiles
-- Description: Stores user profile information
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    display_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Ensure one profile per user
    UNIQUE(user_id)
);

-- Add comment to table
COMMENT ON TABLE user_profiles IS 'Stores user profile information including display name and personal details';
COMMENT ON COLUMN user_profiles.display_name IS 'User-friendly display name shown in the interface';

-- =====================================================
-- TABLE: user_preferences  
-- Description: Stores user visual and interface preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    high_contrast boolean DEFAULT false NOT NULL,
    large_text boolean DEFAULT false NOT NULL,
    reduced_stimuli boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Ensure one preference set per user
    UNIQUE(user_id)
);

-- Add comments to table
COMMENT ON TABLE user_preferences IS 'Stores user visual preferences for accessibility and interface customization';
COMMENT ON COLUMN user_preferences.high_contrast IS 'Enable high contrast mode for better readability';
COMMENT ON COLUMN user_preferences.large_text IS 'Enable large text mode across the application';
COMMENT ON COLUMN user_preferences.reduced_stimuli IS 'Enable reduced stimuli mode with fewer animations';

-- =====================================================
-- TABLE: user_goals
-- Description: Stores user daily goals and targets
-- =====================================================
CREATE TABLE IF NOT EXISTS user_goals (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sleep_hours integer DEFAULT 8 NOT NULL CHECK (sleep_hours >= 1 AND sleep_hours <= 24),
    daily_tasks integer DEFAULT 5 NOT NULL CHECK (daily_tasks >= 1 AND daily_tasks <= 100),
    water_glasses integer DEFAULT 8 NOT NULL CHECK (water_glasses >= 1 AND water_glasses <= 50),
    break_frequency integer DEFAULT 2 NOT NULL CHECK (break_frequency >= 1 AND break_frequency <= 10),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Ensure one goal set per user
    UNIQUE(user_id)
);

-- Add comments to table
COMMENT ON TABLE user_goals IS 'Stores user daily goals and targets for health and productivity tracking';
COMMENT ON COLUMN user_goals.sleep_hours IS 'Target hours of sleep per day (1-24)';
COMMENT ON COLUMN user_goals.daily_tasks IS 'Target number of daily tasks to complete (1-100)';
COMMENT ON COLUMN user_goals.water_glasses IS 'Target number of water glasses to drink per day (1-50)';
COMMENT ON COLUMN user_goals.break_frequency IS 'Target number of breaks to take per hour (1-10)';

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
    ON user_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
    ON user_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for user_goals
CREATE POLICY "Users can view their own goals"
    ON user_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
    ON user_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON user_goals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
    ON user_goals FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES
-- =====================================================

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- Indexes for user_preferences  
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_created_at ON user_preferences(created_at DESC);

-- Indexes for user_goals
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_created_at ON user_goals(created_at DESC);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA CRIAR DADOS PADRÃO DO USUÁRIO
-- =====================================================

-- Função para criar dados padrão quando um usuário se registra
CREATE OR REPLACE FUNCTION create_default_user_data(user_uuid uuid)
RETURNS void AS $$
BEGIN
    -- Criar perfil padrão
    INSERT INTO user_profiles (user_id, display_name)
    VALUES (user_uuid, NULL)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Criar preferências padrão
    INSERT INTO user_preferences (user_id, high_contrast, large_text, reduced_stimuli)
    VALUES (user_uuid, false, false, false)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Criar metas padrão
    INSERT INTO user_goals (user_id, sleep_hours, daily_tasks, water_glasses, break_frequency)
    VALUES (user_uuid, 8, 5, 8, 2)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION create_default_user_data TO authenticated;

-- =====================================================
-- TRIGGER PARA CRIAR DADOS AUTOMÁTICAMENTE
-- =====================================================

-- Função de trigger para criar dados padrão automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Criar dados padrão para o novo usuário
    PERFORM create_default_user_data(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMIT;
