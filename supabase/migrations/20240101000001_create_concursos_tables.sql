BEGIN;

-- ==========================================================================
-- MIGRATION: Create Concursos (Competitions) Tables
-- Description: Creates all tables required for the concursos feature
-- Author: StayFocus App
-- Date: 2024-01-01
-- ==========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================================
-- TABLE: competitions
-- Description: Main table for competitions/concursos
-- ==========================================================================
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    organizer TEXT NOT NULL,
    registration_date DATE,
    exam_date DATE,
    edital_link TEXT,
    status TEXT NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado', 'inscrito', 'estudando', 'realizado', 'aguardando_resultado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to competitions table
COMMENT ON TABLE competitions IS 'Stores competition/concurso information for users';
COMMENT ON COLUMN competitions.title IS 'Title of the competition';
COMMENT ON COLUMN competitions.organizer IS 'Organization responsible for the competition';
COMMENT ON COLUMN competitions.registration_date IS 'Registration deadline date';
COMMENT ON COLUMN competitions.exam_date IS 'Exam date';
COMMENT ON COLUMN competitions.edital_link IS 'Link to the official competition notice';
COMMENT ON COLUMN competitions.status IS 'Current status of the competition for the user';

-- ==========================================================================
-- TABLE: competition_subjects
-- Description: Subjects/disciplines for each competition
-- ==========================================================================
CREATE TABLE IF NOT EXISTS competition_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to competition_subjects table
COMMENT ON TABLE competition_subjects IS 'Stores subjects/disciplines for each competition';
COMMENT ON COLUMN competition_subjects.name IS 'Name of the subject/discipline';
COMMENT ON COLUMN competition_subjects.progress IS 'Study progress percentage for this subject (0-100)';

-- ==========================================================================
-- TABLE: competition_topics
-- Description: Topics within each subject
-- ==========================================================================
CREATE TABLE IF NOT EXISTS competition_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES competition_subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to competition_topics table
COMMENT ON TABLE competition_topics IS 'Stores topics within each competition subject';
COMMENT ON COLUMN competition_topics.name IS 'Name of the topic';
COMMENT ON COLUMN competition_topics.completed IS 'Whether the topic has been completed by the user';

-- ==========================================================================
-- TABLE: competition_questions
-- Description: Questions for competitions
-- ==========================================================================
CREATE TABLE IF NOT EXISTS competition_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES competition_subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES competition_topics(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT DEFAULT 'medio' CHECK (difficulty IN ('facil', 'medio', 'dificil')),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to competition_questions table
COMMENT ON TABLE competition_questions IS 'Stores questions for competition practice';
COMMENT ON COLUMN competition_questions.question_text IS 'The question text';
COMMENT ON COLUMN competition_questions.options IS 'JSON array of answer options with isCorrect flags';
COMMENT ON COLUMN competition_questions.correct_answer IS 'The correct answer text';
COMMENT ON COLUMN competition_questions.explanation IS 'Explanation for the correct answer';
COMMENT ON COLUMN competition_questions.difficulty IS 'Difficulty level of the question';
COMMENT ON COLUMN competition_questions.is_ai_generated IS 'Whether the question was generated by AI';

-- ==========================================================================
-- TABLE: competition_simulations
-- Description: Saved simulations/tests for competitions
-- ==========================================================================
CREATE TABLE IF NOT EXISTS competition_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    results JSONB,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to competition_simulations table
COMMENT ON TABLE competition_simulations IS 'Stores saved simulations/practice tests for competitions';
COMMENT ON COLUMN competition_simulations.title IS 'Title of the simulation';
COMMENT ON COLUMN competition_simulations.questions IS 'JSON array of question IDs included in the simulation';
COMMENT ON COLUMN competition_simulations.results IS 'JSON object containing simulation results (score, answers, etc.)';
COMMENT ON COLUMN competition_simulations.is_favorite IS 'Whether the simulation is marked as favorite';

-- ==========================================================================
-- INDEXES
-- ==========================================================================

-- Index for user-specific queries on competitions
CREATE INDEX IF NOT EXISTS idx_competitions_user_id ON competitions(user_id);
CREATE INDEX IF NOT EXISTS idx_competitions_created_at ON competitions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitions_exam_date ON competitions(exam_date);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);

-- Index for competition subjects
CREATE INDEX IF NOT EXISTS idx_competition_subjects_competition_id ON competition_subjects(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_subjects_created_at ON competition_subjects(created_at);

-- Index for competition topics
CREATE INDEX IF NOT EXISTS idx_competition_topics_subject_id ON competition_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_competition_topics_completed ON competition_topics(completed);

-- Index for competition questions
CREATE INDEX IF NOT EXISTS idx_competition_questions_competition_id ON competition_questions(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_questions_subject_id ON competition_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_competition_questions_topic_id ON competition_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_competition_questions_difficulty ON competition_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_competition_questions_is_ai_generated ON competition_questions(is_ai_generated);
CREATE INDEX IF NOT EXISTS idx_competition_questions_created_at ON competition_questions(created_at DESC);

-- Index for competition simulations
CREATE INDEX IF NOT EXISTS idx_competition_simulations_competition_id ON competition_simulations(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_simulations_user_id ON competition_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_simulations_is_favorite ON competition_simulations(is_favorite);
CREATE INDEX IF NOT EXISTS idx_competition_simulations_created_at ON competition_simulations(created_at DESC);

-- Composite indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_competitions_user_status ON competitions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_competition_simulations_user_competition ON competition_simulations(user_id, competition_id);

-- ==========================================================================
-- TRIGGERS
-- ==========================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_competitions_updated_at
    BEFORE UPDATE ON competitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_subjects_updated_at
    BEFORE UPDATE ON competition_subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_topics_updated_at
    BEFORE UPDATE ON competition_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_questions_updated_at
    BEFORE UPDATE ON competition_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_simulations_updated_at
    BEFORE UPDATE ON competition_simulations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================================================

-- Enable RLS on all tables
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_simulations ENABLE ROW LEVEL SECURITY;

-- ==========================================================================
-- RLS POLICIES FOR competitions
-- ==========================================================================

-- Users can only see their own competitions
CREATE POLICY "Users can view their own competitions" ON competitions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own competitions
CREATE POLICY "Users can insert their own competitions" ON competitions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own competitions
CREATE POLICY "Users can update their own competitions" ON competitions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own competitions
CREATE POLICY "Users can delete their own competitions" ON competitions
    FOR DELETE USING (auth.uid() = user_id);

-- ==========================================================================
-- RLS POLICIES FOR competition_subjects
-- ==========================================================================

-- Users can only see subjects from their own competitions
CREATE POLICY "Users can view subjects from their own competitions" ON competition_subjects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_subjects.competition_id 
            AND competitions.user_id = auth.uid()
        )
    );

-- Users can insert subjects for their own competitions
CREATE POLICY "Users can insert subjects for their own competitions" ON competition_subjects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_subjects.competition_id 
            AND competitions.user_id = auth.uid()
        )
    );

-- Users can update subjects from their own competitions
CREATE POLICY "Users can update subjects from their own competitions" ON competition_subjects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_subjects.competition_id 
            AND competitions.user_id = auth.uid()
        )
    );

-- Users can delete subjects from their own competitions
CREATE POLICY "Users can delete subjects from their own competitions" ON competition_subjects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_subjects.competition_id 
            AND competitions.user_id = auth.uid()
        )
    );

-- ==========================================================================
-- RLS POLICIES FOR competition_topics
-- ==========================================================================

-- Users can only see topics from their own competition subjects
CREATE POLICY "Users can view topics from their own competition subjects" ON competition_topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM competition_subjects cs
            JOIN competitions c ON c.id = cs.competition_id
            WHERE cs.id = competition_topics.subject_id 
            AND c.user_id = auth.uid()
        )
    );

-- Users can insert topics for their own competition subjects
CREATE POLICY "Users can insert topics for their own competition subjects" ON competition_topics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM competition_subjects cs
            JOIN competitions c ON c.id = cs.competition_id
            WHERE cs.id = competition_topics.subject_id 
            AND c.user_id = auth.uid()
        )
    );

-- Users can update topics from their own competition subjects
CREATE POLICY "Users can update topics from their own competition subjects" ON competition_topics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM competition_subjects cs
            JOIN competitions c ON c.id = cs.competition_id
            WHERE cs.id = competition_topics.subject_id 
            AND c.user_id = auth.uid()
        )
    );

-- Users can delete topics from their own competition subjects
CREATE POLICY "Users can delete topics from their own competition subjects" ON competition_topics
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM competition_subjects cs
            JOIN competitions c ON c.id = cs.competition_id
            WHERE cs.id = competition_topics.subject_id 
            AND c.user_id = auth.uid()
        )
    );

-- ==========================================================================
-- RLS POLICIES FOR competition_questions
-- ==========================================================================

-- Users can only see questions from their own competitions
CREATE POLICY "Users can view questions from their own competitions" ON competition_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_questions.competition_id 
            AND competitions.user_id = auth.uid()
        )
    );

-- Users can insert questions for their own competitions
CREATE POLICY "Users can insert questions for their own competitions" ON competition_questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_questions.competition_id 
            AND competitions.user_id = auth.uid()
        )
    );

-- Users can update questions from their own competitions
CREATE POLICY "Users can update questions from their own competitions" ON competition_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_questions.competition_id 
            AND competitions.user_id = auth.uid()
        )
    );

-- Users can delete questions from their own competitions
CREATE POLICY "Users can delete questions from their own competitions" ON competition_questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_questions.competition_id 
            AND competitions.user_id = auth.uid()
        )
    );

-- ==========================================================================
-- RLS POLICIES FOR competition_simulations
-- ==========================================================================

-- Users can only see their own simulations
CREATE POLICY "Users can view their own simulations" ON competition_simulations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own simulations
CREATE POLICY "Users can insert their own simulations" ON competition_simulations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_simulations.competition_id 
            AND competitions.user_id = auth.uid()
        )
    );

-- Users can update their own simulations
CREATE POLICY "Users can update their own simulations" ON competition_simulations
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own simulations
CREATE POLICY "Users can delete their own simulations" ON competition_simulations
    FOR DELETE USING (auth.uid() = user_id);

-- ==========================================================================
-- FINAL VALIDATION
-- ==========================================================================

-- Verify all tables were created successfully
DO $$
BEGIN
    -- Check if all tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competitions') THEN
        RAISE EXCEPTION 'competitions table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competition_subjects') THEN
        RAISE EXCEPTION 'competition_subjects table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competition_topics') THEN
        RAISE EXCEPTION 'competition_topics table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competition_questions') THEN
        RAISE EXCEPTION 'competition_questions table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competition_simulations') THEN
        RAISE EXCEPTION 'competition_simulations table was not created';
    END IF;
    
    RAISE NOTICE 'All concursos tables created successfully!';
END $$;

COMMIT;
