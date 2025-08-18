-- Migration: Create Dashboard Tables
-- Description: Creates all tables needed for the dashboard functionality
-- Author: System Analysis
-- Date: 2024-08-16

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela: painel_dia
-- Descrição: Armazena as atividades programadas para o painel do dia
CREATE TABLE IF NOT EXISTS painel_dia (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    horario text NOT NULL CHECK (horario ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'),
    atividade text NOT NULL CHECK (length(trim(atividade)) > 0 AND length(atividade) <= 200),
    cor text NOT NULL DEFAULT '#3b82f6' CHECK (cor ~ '^#[0-9A-Fa-f]{6}$'),
    concluida boolean NOT NULL DEFAULT false,
    date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela: prioridades
-- Descrição: Armazena as prioridades/tarefas importantes do usuário
CREATE TABLE IF NOT EXISTS prioridades (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo text NOT NULL CHECK (length(trim(titulo)) > 0 AND length(titulo) <= 100),
    importante boolean NOT NULL DEFAULT false,
    concluida boolean NOT NULL DEFAULT false,
    date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela: medicamentos
-- Descrição: Armazena os medicamentos cadastrados pelo usuário
CREATE TABLE IF NOT EXISTS medicamentos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome text NOT NULL CHECK (length(trim(nome)) > 0 AND length(nome) <= 100),
    horario text CHECK (horario IS NULL OR horario ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'),
    tomado boolean NOT NULL DEFAULT false,
    date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela: sessoes_foco
-- Descrição: Armazena as sessões de foco/pomodoro do usuário
CREATE TABLE IF NOT EXISTS sessoes_foco (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    duracao_minutos integer NOT NULL CHECK (duracao_minutos > 0 AND duracao_minutos <= 180),
    tempo_restante integer NOT NULL CHECK (tempo_restante >= 0),
    ativa boolean NOT NULL DEFAULT false,
    pausada boolean NOT NULL DEFAULT false,
    date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela: compromissos
-- Descrição: Armazena compromissos e agendamentos do usuário
CREATE TABLE IF NOT EXISTS compromissos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo text NOT NULL CHECK (length(trim(titulo)) > 0 AND length(titulo) <= 200),
    horario text NOT NULL CHECK (horario ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'),
    tipo text NOT NULL CHECK (tipo IN ('saude', 'estudos', 'alimentacao', 'trabalho', 'lazer', 'outros')),
    data date NOT NULL DEFAULT CURRENT_DATE,
    concluido boolean NOT NULL DEFAULT false,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE painel_dia ENABLE ROW LEVEL SECURITY;
ALTER TABLE prioridades ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_foco ENABLE ROW LEVEL SECURITY;
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;

-- Políticas para painel_dia
CREATE POLICY "Users can view their own painel_dia" ON painel_dia
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own painel_dia" ON painel_dia
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own painel_dia" ON painel_dia
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own painel_dia" ON painel_dia
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para prioridades
CREATE POLICY "Users can view their own prioridades" ON prioridades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prioridades" ON prioridades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prioridades" ON prioridades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prioridades" ON prioridades
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para medicamentos
CREATE POLICY "Users can view their own medicamentos" ON medicamentos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medicamentos" ON medicamentos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medicamentos" ON medicamentos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medicamentos" ON medicamentos
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para sessoes_foco
CREATE POLICY "Users can view their own sessoes_foco" ON sessoes_foco
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessoes_foco" ON sessoes_foco
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessoes_foco" ON sessoes_foco
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessoes_foco" ON sessoes_foco
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para compromissos
CREATE POLICY "Users can view their own compromissos" ON compromissos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compromissos" ON compromissos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compromissos" ON compromissos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own compromissos" ON compromissos
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ÍNDICES PARA OTIMIZAÇÃO
-- =====================================================

-- Índices para painel_dia
CREATE INDEX IF NOT EXISTS idx_painel_dia_user_id ON painel_dia(user_id);
CREATE INDEX IF NOT EXISTS idx_painel_dia_user_date ON painel_dia(user_id, date);
CREATE INDEX IF NOT EXISTS idx_painel_dia_horario ON painel_dia(user_id, date, horario);
CREATE INDEX IF NOT EXISTS idx_painel_dia_concluida ON painel_dia(user_id, date, concluida);
CREATE INDEX IF NOT EXISTS idx_painel_dia_created_at ON painel_dia(user_id, created_at DESC);

-- Índices para prioridades
CREATE INDEX IF NOT EXISTS idx_prioridades_user_id ON prioridades(user_id);
CREATE INDEX IF NOT EXISTS idx_prioridades_user_date ON prioridades(user_id, date);
CREATE INDEX IF NOT EXISTS idx_prioridades_importante ON prioridades(user_id, date, importante);
CREATE INDEX IF NOT EXISTS idx_prioridades_concluida ON prioridades(user_id, date, concluida);
CREATE INDEX IF NOT EXISTS idx_prioridades_created_at ON prioridades(user_id, created_at DESC);

-- Índices para medicamentos
CREATE INDEX IF NOT EXISTS idx_medicamentos_user_id ON medicamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_user_date ON medicamentos(user_id, date);
CREATE INDEX IF NOT EXISTS idx_medicamentos_horario ON medicamentos(user_id, date, horario);
CREATE INDEX IF NOT EXISTS idx_medicamentos_tomado ON medicamentos(user_id, date, tomado);
CREATE INDEX IF NOT EXISTS idx_medicamentos_created_at ON medicamentos(user_id, created_at DESC);

-- Índices para sessoes_foco
CREATE INDEX IF NOT EXISTS idx_sessoes_foco_user_id ON sessoes_foco(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_foco_user_date ON sessoes_foco(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sessoes_foco_ativa ON sessoes_foco(user_id, date, ativa);
CREATE INDEX IF NOT EXISTS idx_sessoes_foco_created_at ON sessoes_foco(user_id, created_at DESC);

-- Índices para compromissos
CREATE INDEX IF NOT EXISTS idx_compromissos_user_id ON compromissos(user_id);
CREATE INDEX IF NOT EXISTS idx_compromissos_user_date ON compromissos(user_id, data);
CREATE INDEX IF NOT EXISTS idx_compromissos_horario ON compromissos(user_id, data, horario);
CREATE INDEX IF NOT EXISTS idx_compromissos_tipo ON compromissos(user_id, tipo);
CREATE INDEX IF NOT EXISTS idx_compromissos_concluido ON compromissos(user_id, data, concluido);
CREATE INDEX IF NOT EXISTS idx_compromissos_created_at ON compromissos(user_id, created_at DESC);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_painel_dia_updated_at 
    BEFORE UPDATE ON painel_dia 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prioridades_updated_at 
    BEFORE UPDATE ON prioridades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicamentos_updated_at 
    BEFORE UPDATE ON medicamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessoes_foco_updated_at 
    BEFORE UPDATE ON sessoes_foco 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compromissos_updated_at 
    BEFORE UPDATE ON compromissos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE painel_dia IS 'Atividades programadas para o painel do dia do usuário';
COMMENT ON COLUMN painel_dia.horario IS 'Horário da atividade no formato HH:MM';
COMMENT ON COLUMN painel_dia.atividade IS 'Descrição da atividade (máx 200 caracteres)';
COMMENT ON COLUMN painel_dia.cor IS 'Cor da atividade em formato hexadecimal';
COMMENT ON COLUMN painel_dia.concluida IS 'Indica se a atividade foi concluída';
COMMENT ON COLUMN painel_dia.date IS 'Data da atividade (YYYY-MM-DD)';

COMMENT ON TABLE prioridades IS 'Prioridades e tarefas importantes do usuário';
COMMENT ON COLUMN prioridades.titulo IS 'Título da prioridade (máx 100 caracteres)';
COMMENT ON COLUMN prioridades.importante IS 'Marca se a prioridade é de alta importância';
COMMENT ON COLUMN prioridades.concluida IS 'Indica se a prioridade foi concluída';
COMMENT ON COLUMN prioridades.date IS 'Data da prioridade (YYYY-MM-DD)';

COMMENT ON TABLE medicamentos IS 'Medicamentos cadastrados pelo usuário';
COMMENT ON COLUMN medicamentos.nome IS 'Nome do medicamento (máx 100 caracteres)';
COMMENT ON COLUMN medicamentos.horario IS 'Horário de tomada no formato HH:MM (opcional)';
COMMENT ON COLUMN medicamentos.tomado IS 'Indica se o medicamento foi tomado hoje';
COMMENT ON COLUMN medicamentos.date IS 'Data do registro do medicamento (YYYY-MM-DD)';

COMMENT ON TABLE sessoes_foco IS 'Sessões de foco/pomodoro do usuário';
COMMENT ON COLUMN sessoes_foco.duracao_minutos IS 'Duração da sessão em minutos (1-180)';
COMMENT ON COLUMN sessoes_foco.tempo_restante IS 'Tempo restante da sessão em segundos';
COMMENT ON COLUMN sessoes_foco.ativa IS 'Indica se a sessão está ativa';
COMMENT ON COLUMN sessoes_foco.pausada IS 'Indica se a sessão está pausada';
COMMENT ON COLUMN sessoes_foco.date IS 'Data da sessão de foco (YYYY-MM-DD)';

COMMENT ON TABLE compromissos IS 'Compromissos e agendamentos do usuário';
COMMENT ON COLUMN compromissos.titulo IS 'Título do compromisso (máx 200 caracteres)';
COMMENT ON COLUMN compromissos.horario IS 'Horário do compromisso no formato HH:MM';
COMMENT ON COLUMN compromissos.tipo IS 'Categoria do compromisso (saude, estudos, alimentacao, trabalho, lazer, outros)';
COMMENT ON COLUMN compromissos.data IS 'Data do compromisso (YYYY-MM-DD)';
COMMENT ON COLUMN compromissos.concluido IS 'Indica se o compromisso foi concluído';
COMMENT ON COLUMN compromissos.observacoes IS 'Observações adicionais sobre o compromisso';

-- =====================================================
-- CONSTRAINT ADICIONAL
-- =====================================================

-- Garantir que apenas uma sessão pode estar ativa por usuário por data
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessoes_foco_user_ativa 
    ON sessoes_foco(user_id, date) 
    WHERE ativa = true;

COMMIT;
