-- =====================================================
-- MIGRATION 002: User Profile System
-- Description: User profiles, preferences, and goals management
-- Date: 2024-01-01
-- =====================================================

BEGIN;

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

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE user_profiles IS 'Stores user profile information including display name and personal details';
COMMENT ON COLUMN user_profiles.display_name IS 'User-friendly display name shown in the interface';

COMMENT ON TABLE user_preferences IS 'Stores user visual preferences for accessibility and interface customization';
COMMENT ON COLUMN user_preferences.high_contrast IS 'Enable high contrast mode for better readability';
COMMENT ON COLUMN user_preferences.large_text IS 'Enable large text mode across the application';
COMMENT ON COLUMN user_preferences.reduced_stimuli IS 'Enable reduced stimuli mode with fewer animations';

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
CREATE POLICY "Users can manage their own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for user_preferences
CREATE POLICY "Users can manage their own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for user_goals
CREATE POLICY "Users can manage their own goals" ON user_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INDEXES
-- =====================================================

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- Indexes for user_preferences  
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Indexes for user_goals
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

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
-- FUNCTION FOR DEFAULT USER DATA
-- =====================================================

-- Function to create default data when a user registers
CREATE OR REPLACE FUNCTION create_default_user_data(user_uuid uuid)
RETURNS void AS $$
BEGIN
    -- Create default profile
    INSERT INTO user_profiles (user_id, display_name)
    VALUES (user_uuid, NULL)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create default preferences
    INSERT INTO user_preferences (user_id, high_contrast, large_text, reduced_stimuli)
    VALUES (user_uuid, false, false, false)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create default goals
    INSERT INTO user_goals (user_id, sleep_hours, daily_tasks, water_glasses, break_frequency)
    VALUES (user_uuid, 8, 5, 8, 2)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION create_default_user_data TO authenticated;

-- =====================================================
-- AUTO-TRIGGER FOR NEW USERS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create default data for the new user
    PERFORM create_default_user_data(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for when a new user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMIT;