-- =====================================================
-- MIGRATION 008: Leisure and Self-Knowledge Systems  
-- Description: Complete leisure activity tracking and self-knowledge management systems
-- Date: 2024-01-01
-- =====================================================

BEGIN;

-- =====================================================
-- LEISURE TABLES
-- =====================================================

-- Tabela: atividades_lazer
-- Descrição: Armazena as atividades de lazer realizadas pelos usuários
CREATE TABLE IF NOT EXISTS atividades_lazer (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome varchar(200) NOT NULL,
    categoria varchar(100),
    duracao_minutos integer CHECK (duracao_minutos > 0),
    data_realizacao timestamp with time zone NOT NULL,
    observacoes text,
    avaliacao integer CHECK (avaliacao >= 1 AND avaliacao <= 10),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela: sugestoes_descanso
-- Descrição: Sugestões de atividades de descanso disponíveis para todos os usuários
CREATE TABLE IF NOT EXISTS sugestoes_descanso (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo varchar(200) NOT NULL,
    descricao text,
    categoria varchar(100),
    dificuldade varchar(20) NOT NULL CHECK (dificuldade IN ('Fácil', 'Médio', 'Difícil')),
    duracao_estimada integer CHECK (duracao_estimada > 0),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela: sugestoes_favoritas
-- Descrição: Relacionamento entre usuários e suas sugestões de descanso favoritas
CREATE TABLE IF NOT EXISTS sugestoes_favoritas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sugestao_id uuid NOT NULL REFERENCES sugestoes_descanso(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, sugestao_id)
);

-- Tabela: sessoes_lazer
-- Descrição: Sessões de temporizador de lazer dos usuários
CREATE TABLE IF NOT EXISTS sessoes_lazer (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    duracao_minutos integer NOT NULL CHECK (duracao_minutos > 0),
    tempo_usado_minutos integer DEFAULT 0 CHECK (tempo_usado_minutos >= 0),
    status varchar(20) NOT NULL CHECK (status IN ('ativo', 'pausado', 'concluido')),
    atividade_id uuid REFERENCES atividades_lazer(id) ON DELETE SET NULL,
    data_inicio timestamp with time zone DEFAULT now() NOT NULL,
    data_fim timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =====================================================
-- SELF-KNOWLEDGE TABLES
-- =====================================================

-- Create enum type for self knowledge categories
CREATE TYPE self_knowledge_category AS ENUM ('quem_sou', 'meus_porques', 'meus_padroes');

-- Tabela: self_knowledge_notes
-- Descrição: Armazena notas de autoconhecimento organizadas por categorias
CREATE TABLE IF NOT EXISTS self_knowledge_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category self_knowledge_category NOT NULL,
    title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
    content TEXT NOT NULL CHECK (length(content) > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- COMMENTS
-- =====================================================

-- Leisure table comments
COMMENT ON TABLE atividades_lazer IS 'Registro das atividades de lazer realizadas pelos usuários';
COMMENT ON TABLE sugestoes_descanso IS 'Sugestões de atividades de descanso disponíveis para todos os usuários';
COMMENT ON TABLE sugestoes_favoritas IS 'Relacionamento entre usuários e suas sugestões favoritas';
COMMENT ON TABLE sessoes_lazer IS 'Sessões de temporizador de lazer dos usuários';

-- Self-knowledge table comments
COMMENT ON TABLE self_knowledge_notes IS 'Stores self-knowledge notes organized by categories: who I am, my whys, and my patterns';
COMMENT ON COLUMN self_knowledge_notes.category IS 'Category of the note: quem_sou (who I am), meus_porques (my whys), meus_padroes (my patterns)';
COMMENT ON COLUMN self_knowledge_notes.title IS 'Title of the self-knowledge note (max 200 characters)';
COMMENT ON COLUMN self_knowledge_notes.content IS 'Content of the self-knowledge note';

-- Detailed column comments for leisure
COMMENT ON COLUMN atividades_lazer.nome IS 'Nome da atividade de lazer realizada';
COMMENT ON COLUMN atividades_lazer.categoria IS 'Categoria da atividade (opcional)';
COMMENT ON COLUMN atividades_lazer.duracao_minutos IS 'Duração da atividade em minutos';
COMMENT ON COLUMN atividades_lazer.data_realizacao IS 'Data e hora em que a atividade foi realizada';
COMMENT ON COLUMN atividades_lazer.avaliacao IS 'Avaliação da atividade de 1 a 10';

COMMENT ON COLUMN sugestoes_descanso.titulo IS 'Título da sugestão de descanso';
COMMENT ON COLUMN sugestoes_descanso.descricao IS 'Descrição detalhada da atividade';
COMMENT ON COLUMN sugestoes_descanso.categoria IS 'Categoria da sugestão (ex: Respiração, Mindfulness)';
COMMENT ON COLUMN sugestoes_descanso.dificuldade IS 'Nível de dificuldade: Fácil, Médio ou Difícil';
COMMENT ON COLUMN sugestoes_descanso.duracao_estimada IS 'Duração estimada em minutos';

COMMENT ON COLUMN sessoes_lazer.duracao_minutos IS 'Duração planejada da sessão em minutos';
COMMENT ON COLUMN sessoes_lazer.tempo_usado_minutos IS 'Tempo efetivamente usado da sessão em minutos';
COMMENT ON COLUMN sessoes_lazer.status IS 'Status da sessão: ativo, pausado ou concluido';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS for all tables
ALTER TABLE atividades_lazer ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes_descanso ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes_favoritas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_lazer ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_knowledge_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leisure - simplified
CREATE POLICY "Users can manage their own atividades_lazer" ON atividades_lazer FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sugestoes_favoritas" ON sugestoes_favoritas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sessoes_lazer" ON sessoes_lazer FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Special policy for sugestoes_descanso (read-only for authenticated users)
CREATE POLICY "Authenticated users can view sugestoes_descanso" ON sugestoes_descanso FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for self-knowledge - simplified
CREATE POLICY "Users can manage their own self knowledge notes" ON self_knowledge_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INDEXES
-- =====================================================

-- Leisure indexes
CREATE INDEX IF NOT EXISTS idx_atividades_lazer_user_id ON atividades_lazer(user_id);
CREATE INDEX IF NOT EXISTS idx_atividades_lazer_data_realizacao ON atividades_lazer(data_realizacao DESC);
CREATE INDEX IF NOT EXISTS idx_atividades_lazer_categoria ON atividades_lazer(categoria);
CREATE INDEX IF NOT EXISTS idx_atividades_lazer_user_data ON atividades_lazer(user_id, data_realizacao DESC);

CREATE INDEX IF NOT EXISTS idx_sugestoes_descanso_categoria ON sugestoes_descanso(categoria);
CREATE INDEX IF NOT EXISTS idx_sugestoes_descanso_dificuldade ON sugestoes_descanso(dificuldade);
CREATE INDEX IF NOT EXISTS idx_sugestoes_descanso_created_at ON sugestoes_descanso(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sugestoes_favoritas_user_id ON sugestoes_favoritas(user_id);
CREATE INDEX IF NOT EXISTS idx_sugestoes_favoritas_sugestao_id ON sugestoes_favoritas(sugestao_id);

CREATE INDEX IF NOT EXISTS idx_sessoes_lazer_user_id ON sessoes_lazer(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_lazer_status ON sessoes_lazer(status);
CREATE INDEX IF NOT EXISTS idx_sessoes_lazer_user_status ON sessoes_lazer(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sessoes_lazer_data_inicio ON sessoes_lazer(data_inicio DESC);

-- Self-knowledge indexes
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_user_id ON self_knowledge_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_category ON self_knowledge_notes(category);
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_user_category ON self_knowledge_notes(user_id, category);
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_updated_at ON self_knowledge_notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_created_at ON self_knowledge_notes(created_at DESC);

-- Composite index for main query pattern (user_id + category + updated_at)
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_main_query ON self_knowledge_notes(user_id, category, updated_at DESC);

-- Text search index for title and content
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_search ON self_knowledge_notes USING gin(to_tsvector('portuguese', title || ' ' || content));

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger for atividades_lazer
CREATE TRIGGER update_atividades_lazer_updated_at
    BEFORE UPDATE ON atividades_lazer
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for self-knowledge notes
CREATE TRIGGER update_self_knowledge_notes_updated_at
    BEFORE UPDATE ON self_knowledge_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Constraint to ensure only one active leisure session per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessoes_lazer_user_ativa 
    ON sessoes_lazer(user_id) 
    WHERE status = 'ativo';

-- =====================================================
-- INITIAL DATA FOR SUGESTOES_DESCANSO
-- =====================================================

-- Insert default rest suggestions
INSERT INTO sugestoes_descanso (titulo, descricao, categoria, dificuldade, duracao_estimada) VALUES
('Respiração 4-7-8', 'Inspire por 4 segundos, segure por 7, expire por 8. Repita 4 vezes.', 'Respiração', 'Fácil', 5),
('Meditação Mindfulness', 'Sente-se confortavelmente e foque na sua respiração por alguns minutos.', 'Mindfulness', 'Médio', 10),
('Alongamento de Pescoço', 'Movimente suavemente o pescoço em círculos lentos.', 'Alongamento', 'Fácil', 3),
('Gratidão Diária', 'Liste mentalmente 3 coisas pelas quais você é grato hoje.', 'Gratidão', 'Fácil', 5),
('Caminhada Consciente', 'Caminhe lentamente prestando atenção em cada passo.', 'Mindfulness', 'Médio', 15),
('Desenho Livre', 'Pegue papel e lápis e desenhe o que vier à mente.', 'Criativo', 'Fácil', 10),
('Escuta Musical', 'Escolha uma música relaxante e ouça com atenção plena.', 'Musical', 'Fácil', 5),
('Contemplação da Natureza', 'Observe uma planta, árvore ou o céu por alguns minutos.', 'Contemplação', 'Fácil', 8),
('Relaxamento Progressivo', 'Tensione e relaxe cada grupo muscular do corpo.', 'Relaxamento', 'Médio', 20),
('Journaling', 'Escreva seus pensamentos e sentimentos em um diário.', 'Criativo', 'Médio', 15)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FULL-TEXT SEARCH FUNCTION FOR SELF-KNOWLEDGE
-- =====================================================

-- Function for full-text search of self-knowledge notes
CREATE OR REPLACE FUNCTION search_self_knowledge_notes(
    search_user_id UUID,
    search_category self_knowledge_category DEFAULT NULL,
    search_term TEXT DEFAULT NULL
)
RETURNS SETOF self_knowledge_notes AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM self_knowledge_notes
    WHERE user_id = search_user_id
        AND (search_category IS NULL OR category = search_category)
        AND (
            search_term IS NULL 
            OR search_term = '' 
            OR to_tsvector('portuguese', title || ' ' || content) @@ plainto_tsquery('portuguese', search_term)
            OR title ILIKE '%' || search_term || '%'
            OR content ILIKE '%' || search_term || '%'
        )
    ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_self_knowledge_notes TO authenticated;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON self_knowledge_notes TO authenticated;

COMMIT;