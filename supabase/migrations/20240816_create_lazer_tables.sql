BEGIN;

-- =====================================================
-- MIGRAÇÃO: Criação das tabelas de lazer
-- Data: 2024-08-16
-- Descrição: Estrutura completa para o módulo de lazer
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS PRINCIPAIS
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
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE atividades_lazer ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes_descanso ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes_favoritas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_lazer ENABLE ROW LEVEL SECURITY;

-- Políticas para atividades_lazer
CREATE POLICY "Users can view their own atividades_lazer" ON atividades_lazer
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own atividades_lazer" ON atividades_lazer
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own atividades_lazer" ON atividades_lazer
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own atividades_lazer" ON atividades_lazer
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para sugestoes_descanso (apenas leitura para usuários autenticados)
CREATE POLICY "Authenticated users can view sugestoes_descanso" ON sugestoes_descanso
    FOR SELECT USING (auth.role() = 'authenticated');

-- Nota: Apenas administradores podem inserir, atualizar ou deletar sugestões
-- Sugestões são dados pré-populados na migração

-- Políticas para sugestoes_favoritas
CREATE POLICY "Users can view their own sugestoes_favoritas" ON sugestoes_favoritas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sugestoes_favoritas" ON sugestoes_favoritas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sugestoes_favoritas" ON sugestoes_favoritas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sugestoes_favoritas" ON sugestoes_favoritas
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para sessoes_lazer
CREATE POLICY "Users can view their own sessoes_lazer" ON sessoes_lazer
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessoes_lazer" ON sessoes_lazer
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessoes_lazer" ON sessoes_lazer
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessoes_lazer" ON sessoes_lazer
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ÍNDICES PARA OTIMIZAÇÃO
-- =====================================================

-- Índices para atividades_lazer
CREATE INDEX IF NOT EXISTS idx_atividades_lazer_user_id ON atividades_lazer(user_id);
CREATE INDEX IF NOT EXISTS idx_atividades_lazer_data_realizacao ON atividades_lazer(data_realizacao DESC);
CREATE INDEX IF NOT EXISTS idx_atividades_lazer_categoria ON atividades_lazer(categoria);
CREATE INDEX IF NOT EXISTS idx_atividades_lazer_user_data ON atividades_lazer(user_id, data_realizacao DESC);

-- Índices para sugestoes_descanso
CREATE INDEX IF NOT EXISTS idx_sugestoes_descanso_categoria ON sugestoes_descanso(categoria);
CREATE INDEX IF NOT EXISTS idx_sugestoes_descanso_dificuldade ON sugestoes_descanso(dificuldade);
CREATE INDEX IF NOT EXISTS idx_sugestoes_descanso_created_at ON sugestoes_descanso(created_at DESC);

-- Índices para sugestoes_favoritas
CREATE INDEX IF NOT EXISTS idx_sugestoes_favoritas_user_id ON sugestoes_favoritas(user_id);
CREATE INDEX IF NOT EXISTS idx_sugestoes_favoritas_sugestao_id ON sugestoes_favoritas(sugestao_id);

-- Índices para sessoes_lazer
CREATE INDEX IF NOT EXISTS idx_sessoes_lazer_user_id ON sessoes_lazer(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_lazer_status ON sessoes_lazer(status);
CREATE INDEX IF NOT EXISTS idx_sessoes_lazer_user_status ON sessoes_lazer(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sessoes_lazer_data_inicio ON sessoes_lazer(data_inicio DESC);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atividades_lazer
CREATE TRIGGER update_atividades_lazer_updated_at
    BEFORE UPDATE ON atividades_lazer
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS (SUGESTÕES DE DESCANSO)
-- =====================================================

-- Inserir algumas sugestões de descanso padrão
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
-- CONSTRAINTS ADICIONAIS
-- =====================================================

-- Garantir que apenas uma sessão pode estar ativa por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessoes_lazer_user_ativa 
    ON sessoes_lazer(user_id) 
    WHERE status = 'ativo';

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE atividades_lazer IS 'Registro das atividades de lazer realizadas pelos usuários';
COMMENT ON TABLE sugestoes_descanso IS 'Sugestões de atividades de descanso disponíveis para todos os usuários';
COMMENT ON TABLE sugestoes_favoritas IS 'Relacionamento entre usuários e suas sugestões favoritas';
COMMENT ON TABLE sessoes_lazer IS 'Sessões de temporizador de lazer dos usuários';

-- Comentários detalhados das colunas
COMMENT ON COLUMN atividades_lazer.nome IS 'Nome da atividade de lazer realizada';
COMMENT ON COLUMN atividades_lazer.categoria IS 'Categoria da atividade (opcional)';
COMMENT ON COLUMN atividades_lazer.duracao_minutos IS 'Duração da atividade em minutos';
COMMENT ON COLUMN atividades_lazer.data_realizacao IS 'Data e hora em que a atividade foi realizada';
COMMENT ON COLUMN atividades_lazer.avaliacao IS 'Avaliação da atividade de 1 a 10';
COMMENT ON COLUMN atividades_lazer.observacoes IS 'Campo adicional para observações sobre a atividade';

COMMENT ON COLUMN sugestoes_descanso.titulo IS 'Título da sugestão de descanso';
COMMENT ON COLUMN sugestoes_descanso.descricao IS 'Descrição detalhada da atividade';
COMMENT ON COLUMN sugestoes_descanso.categoria IS 'Categoria da sugestão (ex: Respiração, Mindfulness)';
COMMENT ON COLUMN sugestoes_descanso.dificuldade IS 'Nível de dificuldade: Fácil, Médio ou Difícil';
COMMENT ON COLUMN sugestoes_descanso.duracao_estimada IS 'Duração estimada em minutos';

COMMENT ON COLUMN sugestoes_favoritas.user_id IS 'ID do usuário que favoritou';
COMMENT ON COLUMN sugestoes_favoritas.sugestao_id IS 'ID da sugestão favoritada';

COMMENT ON COLUMN sessoes_lazer.duracao_minutos IS 'Duração planejada da sessão em minutos';
COMMENT ON COLUMN sessoes_lazer.tempo_usado_minutos IS 'Tempo efetivamente usado da sessão em minutos';
COMMENT ON COLUMN sessoes_lazer.status IS 'Status da sessão: ativo, pausado ou concluido';
COMMENT ON COLUMN sessoes_lazer.atividade_id IS 'ID da atividade associada (opcional)';
COMMENT ON COLUMN sessoes_lazer.data_inicio IS 'Data e hora de início da sessão';
COMMENT ON COLUMN sessoes_lazer.data_fim IS 'Data e hora de fim da sessão (opcional)';

COMMIT;
