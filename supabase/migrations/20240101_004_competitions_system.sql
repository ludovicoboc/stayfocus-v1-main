-- =====================================================
-- MIGRATION 004: Competitions System
-- Description: Complete competition/concursos system with questions and simulations
-- Date: 2024-01-01
-- =====================================================

BEGIN;

-- =====================================================
-- TABLE: competitions
-- Description: Main table for competitions/concursos
-- =====================================================
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

-- =====================================================
-- TABLE: competition_subjects
-- Description: Subjects/disciplines for each competition
-- =====================================================
CREATE TABLE IF NOT EXISTS competition_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: competition_topics
-- Description: Topics within each subject
-- =====================================================
CREATE TABLE IF NOT EXISTS competition_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES competition_subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: competition_questions
-- Description: Questions for competitions
-- =====================================================
CREATE TABLE IF NOT EXISTS competition_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES competition_subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES competition_topics(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'essay', 'fill_blank')),
    options JSONB DEFAULT '[]',
    correct_answer TEXT,
    correct_options JSONB DEFAULT '[]',
    explanation TEXT,
    difficulty TEXT DEFAULT 'medio' CHECK (difficulty IN ('facil', 'medio', 'dificil')),
    points INTEGER DEFAULT 1 CHECK (points > 0),
    time_limit_seconds INTEGER CHECK (time_limit_seconds > 0),
    tags TEXT[] DEFAULT '{}',
    source TEXT,
    year INTEGER CHECK (year >= 1900 AND year <= 2100),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: competition_simulations
-- Description: Saved simulations/tests for competitions
-- =====================================================
CREATE TABLE IF NOT EXISTS competition_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]',
    question_count INTEGER DEFAULT 0 CHECK (question_count >= 0),
    time_limit_minutes INTEGER CHECK (time_limit_minutes > 0),
    difficulty_filter TEXT CHECK (difficulty_filter IN ('facil', 'medio', 'dificil')),
    subject_filters TEXT[] DEFAULT '{}',
    topic_filters TEXT[] DEFAULT '{}',
    results JSONB,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    is_favorite BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    attempts_count INTEGER DEFAULT 0,
    best_score NUMERIC,
    avg_score NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE competitions IS 'Stores competition/concurso information for users';
COMMENT ON TABLE competition_subjects IS 'Stores subjects/disciplines for each competition';
COMMENT ON TABLE competition_topics IS 'Stores topics within each competition subject';
COMMENT ON TABLE competition_questions IS 'Stores questions for competition practice with enhanced features';
COMMENT ON TABLE competition_simulations IS 'Stores saved simulations/practice tests for competitions with enhanced features';
COMMENT ON TABLE simulation_history IS 'Stores history of completed simulations with scores and answers';

-- =====================================================
-- INDEXES
-- =====================================================

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
CREATE INDEX IF NOT EXISTS idx_competition_questions_question_type ON competition_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_competition_questions_is_active ON competition_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_competition_questions_tags ON competition_questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_competition_questions_usage_count ON competition_questions(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_competition_questions_created_at ON competition_questions(created_at DESC);

-- Index for competition simulations
CREATE INDEX IF NOT EXISTS idx_competition_simulations_competition_id ON competition_simulations(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_simulations_user_id ON competition_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_simulations_is_favorite ON competition_simulations(is_favorite);
CREATE INDEX IF NOT EXISTS idx_competition_simulations_status ON competition_simulations(status);
CREATE INDEX IF NOT EXISTS idx_competition_simulations_created_at ON competition_simulations(created_at DESC);

-- Indexes for simulation_history
CREATE INDEX IF NOT EXISTS idx_simulation_history_user_id ON simulation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_history_simulation_id ON simulation_history(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_history_completed_at ON simulation_history(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_history_percentage ON simulation_history(percentage DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_history ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES - Simplified for all operations
CREATE POLICY "Users can manage their own competitions" ON competitions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage subjects from their competitions" ON competition_subjects FOR ALL 
    USING (EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_subjects.competition_id AND competitions.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_subjects.competition_id AND competitions.user_id = auth.uid()));

CREATE POLICY "Users can manage topics from their competition subjects" ON competition_topics FOR ALL 
    USING (EXISTS (SELECT 1 FROM competition_subjects cs JOIN competitions c ON c.id = cs.competition_id WHERE cs.id = competition_topics.subject_id AND c.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM competition_subjects cs JOIN competitions c ON c.id = cs.competition_id WHERE cs.id = competition_topics.subject_id AND c.user_id = auth.uid()));

CREATE POLICY "Users can manage questions from their competitions" ON competition_questions FOR ALL 
    USING (EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_questions.competition_id AND competitions.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_questions.competition_id AND competitions.user_id = auth.uid()));

CREATE POLICY "Users can manage their own simulations" ON competition_simulations FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_simulations.competition_id AND competitions.user_id = auth.uid()));

CREATE POLICY "Users can manage their own simulation history" ON simulation_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

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

CREATE TRIGGER update_simulation_history_updated_at
    BEFORE UPDATE ON simulation_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;