-- =====================================================
-- MIGRATION 005: Study System
-- Description: Complete study system with sessions and pomodoro tracking
-- Date: 2024-01-01
-- =====================================================

BEGIN;

-- =====================================================
-- TABLE: study_sessions
-- Description: Manages user study sessions
-- =====================================================

CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
    subject VARCHAR(200) NOT NULL,
    topic VARCHAR(200),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
    completed BOOLEAN NOT NULL DEFAULT false,
    pomodoro_cycles INTEGER NOT NULL DEFAULT 0 CHECK (pomodoro_cycles >= 0 AND pomodoro_cycles <= 100),
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABLE: pomodoro_sessions
-- Description: Manages pomodoro sessions for users
-- =====================================================

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    study_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    focus_duration INTEGER NOT NULL DEFAULT 25 CHECK (focus_duration >= 1 AND focus_duration <= 60),
    break_duration INTEGER NOT NULL DEFAULT 5 CHECK (break_duration >= 1 AND break_duration <= 30),
    long_break_duration INTEGER NOT NULL DEFAULT 15 CHECK (long_break_duration >= 1 AND long_break_duration <= 60),
    cycles_completed INTEGER NOT NULL DEFAULT 0 CHECK (cycles_completed >= 0),
    current_cycle INTEGER NOT NULL DEFAULT 1 CHECK (current_cycle >= 1),
    is_active BOOLEAN NOT NULL DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- COMMENTS
-- =====================================================

-- Comments for study_sessions table
COMMENT ON TABLE study_sessions IS 'Registra as sessões de estudo dos usuários com detalhes sobre matéria, tópico e progresso, integrada aos concursos';
COMMENT ON COLUMN study_sessions.competition_id IS 'Vincula a sessão de estudo a um concurso específico';
COMMENT ON COLUMN study_sessions.subject IS 'Matéria ou disciplina estudada (ex: Matemática, Português)';
COMMENT ON COLUMN study_sessions.topic IS 'Tópico específico dentro da matéria (ex: Álgebra Linear)';
COMMENT ON COLUMN study_sessions.duration_minutes IS 'Duração planejada da sessão em minutos (1-1440)';
COMMENT ON COLUMN study_sessions.completed IS 'Indica se a sessão foi marcada como completa pelo usuário';
COMMENT ON COLUMN study_sessions.pomodoro_cycles IS 'Número de ciclos pomodoro completados nesta sessão';
COMMENT ON COLUMN study_sessions.notes IS 'Observações adicionais sobre a sessão de estudo';
COMMENT ON COLUMN study_sessions.started_at IS 'Timestamp de quando a sessão foi iniciada';
COMMENT ON COLUMN study_sessions.completed_at IS 'Timestamp de quando a sessão foi marcada como completa';

-- Comments for pomodoro_sessions table
COMMENT ON TABLE pomodoro_sessions IS 'Registra as sessões de pomodoro dos usuários com configurações e progresso';
COMMENT ON COLUMN pomodoro_sessions.study_session_id IS 'Vincula a sessão pomodoro a uma sessão de estudo específica';
COMMENT ON COLUMN pomodoro_sessions.focus_duration IS 'Duração do período de foco em minutos (1-60)';
COMMENT ON COLUMN pomodoro_sessions.break_duration IS 'Duração da pausa curta em minutos (1-30)';
COMMENT ON COLUMN pomodoro_sessions.long_break_duration IS 'Duração da pausa longa em minutos (1-60)';
COMMENT ON COLUMN pomodoro_sessions.cycles_completed IS 'Número de ciclos completos (foco + pausa) realizados';
COMMENT ON COLUMN pomodoro_sessions.current_cycle IS 'Número do ciclo atual em andamento';
COMMENT ON COLUMN pomodoro_sessions.is_active IS 'Indica se a sessão pomodoro está ativa/em uso';
COMMENT ON COLUMN pomodoro_sessions.started_at IS 'Timestamp de quando a sessão pomodoro foi iniciada';
COMMENT ON COLUMN pomodoro_sessions.paused_at IS 'Timestamp de quando a sessão foi pausada';
COMMENT ON COLUMN pomodoro_sessions.completed_at IS 'Timestamp de quando a sessão foi finalizada';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on tables
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - simplified for all operations
CREATE POLICY "Users can manage their own study sessions" ON study_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own pomodoro sessions" ON pomodoro_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Indexes for study_sessions
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_competition_id ON study_sessions(competition_id) WHERE competition_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_study_sessions_completed ON study_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_completion ON study_sessions(user_id, completed, created_at DESC);

-- Indexes for pomodoro_sessions
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_created_at ON pomodoro_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_study_session_id ON pomodoro_sessions(study_session_id) WHERE study_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_is_active ON pomodoro_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_active ON pomodoro_sessions(user_id, is_active, created_at DESC);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger for study_sessions
CREATE TRIGGER update_study_sessions_updated_at 
    BEFORE UPDATE ON study_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for pomodoro_sessions
CREATE TRIGGER update_pomodoro_sessions_updated_at 
    BEFORE UPDATE ON pomodoro_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER FOR POMODORO CYCLE SYNCHRONIZATION
-- =====================================================

-- Function to synchronize pomodoro cycles between tables
CREATE OR REPLACE FUNCTION sync_pomodoro_cycles()
RETURNS TRIGGER AS $$
BEGIN
    -- When a pomodoro session is updated with more cycles,
    -- update the corresponding study session
    IF NEW.study_session_id IS NOT NULL AND 
       (TG_OP = 'UPDATE' AND OLD.cycles_completed != NEW.cycles_completed) THEN
        
        UPDATE study_sessions 
        SET pomodoro_cycles = NEW.cycles_completed,
            updated_at = now()
        WHERE id = NEW.study_session_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to synchronize pomodoro cycles
CREATE TRIGGER sync_pomodoro_cycles_trigger
    AFTER UPDATE ON pomodoro_sessions
    FOR EACH ROW
    EXECUTE FUNCTION sync_pomodoro_cycles();

-- =====================================================
-- FUNCTIONS FOR STUDY STATISTICS
-- =====================================================

-- Function to calculate general study statistics
CREATE OR REPLACE FUNCTION get_study_statistics(p_user_id UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    completed_sessions BIGINT,
    total_study_time INTEGER,
    total_pomodoro_cycles INTEGER,
    avg_session_duration NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
        COALESCE(SUM(duration_minutes), 0)::INTEGER as total_study_time,
        COALESCE(SUM(pomodoro_cycles), 0)::INTEGER as total_pomodoro_cycles,
        ROUND(AVG(duration_minutes), 2) as avg_session_duration
    FROM study_sessions 
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate study statistics per competition
CREATE OR REPLACE FUNCTION get_competition_study_statistics(p_user_id UUID, p_competition_id UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    completed_sessions BIGINT,
    total_study_time INTEGER,
    total_pomodoro_cycles INTEGER,
    avg_session_duration NUMERIC,
    subjects_studied TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
        COALESCE(SUM(duration_minutes), 0)::INTEGER as total_study_time,
        COALESCE(SUM(pomodoro_cycles), 0)::INTEGER as total_pomodoro_cycles,
        ROUND(AVG(duration_minutes), 2) as avg_session_duration,
        ARRAY_AGG(DISTINCT subject) as subjects_studied
    FROM study_sessions 
    WHERE user_id = p_user_id AND competition_id = p_competition_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for functions
COMMENT ON FUNCTION get_study_statistics(UUID) IS 'Calcula estatísticas gerais de estudo para um usuário específico';
COMMENT ON FUNCTION get_competition_study_statistics(UUID, UUID) IS 'Calcula estatísticas de estudo para um usuário em um concurso específico';

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_study_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_competition_study_statistics TO authenticated;

-- =====================================================
-- CLEANUP FUNCTION FOR OLD INACTIVE SESSIONS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_inactive_pomodoro_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Remove inactive pomodoro sessions older than 7 days
    DELETE FROM pomodoro_sessions 
    WHERE is_active = false 
      AND completed_at IS NOT NULL 
      AND completed_at < now() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for cleanup function
COMMENT ON FUNCTION cleanup_old_inactive_pomodoro_sessions() IS 'Remove sessões pomodoro inativas há mais de 7 dias para otimizar performance';

COMMIT;