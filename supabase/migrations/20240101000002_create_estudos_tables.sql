-- ==========================================
-- Migração para funcionalidades de Estudos
-- Tabelas: study_sessions, pomodoro_sessions
-- ==========================================

BEGIN;

-- Ativar extensão UUID se não estiver ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABELA: study_sessions
-- Gerencia as sessões de estudo dos usuários
-- ==========================================

CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
    subject VARCHAR(200) NOT NULL,
    topic VARCHAR(200),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 1440), -- máximo 24h
    completed BOOLEAN NOT NULL DEFAULT false,
    pomodoro_cycles INTEGER NOT NULL DEFAULT 0 CHECK (pomodoro_cycles >= 0 AND pomodoro_cycles <= 100),
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários para a tabela study_sessions
COMMENT ON TABLE study_sessions IS 'Registra as sessões de estudo dos usuários com detalhes sobre matéria, tópico e progresso';
COMMENT ON COLUMN study_sessions.subject IS 'Matéria ou disciplina estudada (ex: Matemática, Português)';
COMMENT ON COLUMN study_sessions.topic IS 'Tópico específico dentro da matéria (ex: Álgebra Linear)';
COMMENT ON COLUMN study_sessions.duration_minutes IS 'Duração planejada da sessão em minutos (1-1440)';
COMMENT ON COLUMN study_sessions.completed IS 'Indica se a sessão foi marcada como completa pelo usuário';
COMMENT ON COLUMN study_sessions.pomodoro_cycles IS 'Número de ciclos pomodoro completados nesta sessão';
COMMENT ON COLUMN study_sessions.notes IS 'Observações adicionais sobre a sessão de estudo';
COMMENT ON COLUMN study_sessions.started_at IS 'Timestamp de quando a sessão foi iniciada';
COMMENT ON COLUMN study_sessions.completed_at IS 'Timestamp de quando a sessão foi marcada como completa';

-- ==========================================
-- TABELA: pomodoro_sessions
-- Gerencia as sessões de pomodoro dos usuários
-- ==========================================

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

-- Comentários para a tabela pomodoro_sessions
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

-- ==========================================
-- POLÍTICAS RLS (Row Level Security)
-- ==========================================

-- Habilitar RLS nas tabelas
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para study_sessions
CREATE POLICY "Users can view their own study sessions" ON study_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions" ON study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" ON study_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions" ON study_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para pomodoro_sessions
CREATE POLICY "Users can view their own pomodoro sessions" ON pomodoro_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pomodoro sessions" ON pomodoro_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pomodoro sessions" ON pomodoro_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pomodoro sessions" ON pomodoro_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices para study_sessions
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_competition_id ON study_sessions(competition_id) WHERE competition_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_study_sessions_completed ON study_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_completion ON study_sessions(user_id, completed, created_at DESC);

-- Índices para pomodoro_sessions
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_created_at ON pomodoro_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_study_session_id ON pomodoro_sessions(study_session_id) WHERE study_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_is_active ON pomodoro_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_active ON pomodoro_sessions(user_id, is_active, created_at DESC);

-- ==========================================
-- TRIGGERS PARA UPDATED_AT
-- ==========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para study_sessions
CREATE TRIGGER update_study_sessions_updated_at 
    BEFORE UPDATE ON study_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para pomodoro_sessions
CREATE TRIGGER update_pomodoro_sessions_updated_at 
    BEFORE UPDATE ON pomodoro_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- TRIGGER PARA SINCRONIZAÇÃO DE CICLOS POMODORO
-- ==========================================

-- Função para sincronizar ciclos pomodoro entre as tabelas
CREATE OR REPLACE FUNCTION sync_pomodoro_cycles()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando uma sessão pomodoro é atualizada com mais ciclos,
    -- atualizar a sessão de estudo correspondente
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

-- Trigger para sincronizar ciclos pomodoro
CREATE TRIGGER sync_pomodoro_cycles_trigger
    AFTER UPDATE ON pomodoro_sessions
    FOR EACH ROW
    EXECUTE FUNCTION sync_pomodoro_cycles();

-- ==========================================
-- FUNÇÃO PARA CALCULAR ESTATÍSTICAS DE ESTUDO
-- ==========================================

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

-- Comentário para a função
COMMENT ON FUNCTION get_study_statistics(UUID) IS 'Calcula estatísticas de estudo para um usuário específico';

-- ==========================================
-- FUNÇÃO PARA LIMPEZA DE SESSÕES ANTIGAS
-- ==========================================

CREATE OR REPLACE FUNCTION cleanup_old_inactive_pomodoro_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Remove sessões pomodoro inativas há mais de 7 dias
    DELETE FROM pomodoro_sessions 
    WHERE is_active = false 
      AND completed_at IS NOT NULL 
      AND completed_at < now() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO admin_logs (action, details, created_at) 
    VALUES ('cleanup_pomodoro_sessions', 
            format('Removed %s inactive pomodoro sessions', deleted_count), 
            now())
    ON CONFLICT DO NOTHING; -- Ignora se a tabela admin_logs não existir
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário para a função de limpeza
COMMENT ON FUNCTION cleanup_old_inactive_pomodoro_sessions() IS 'Remove sessões pomodoro inativas há mais de 7 dias para otimizar performance';

COMMIT;
