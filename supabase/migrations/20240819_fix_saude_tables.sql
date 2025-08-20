BEGIN;

-- ====================================================================
-- MIGRAÇÃO: CORREÇÃO TABELAS DE SAÚDE
-- Descrição: Corrige estrutura das tabelas de saúde existentes
-- Data: 2024-08-19
-- ====================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- CORREÇÃO DA TABELA: medicamentos
-- ====================================================================

-- Verificar se a tabela existe e adicionar colunas faltantes
DO $$
BEGIN
    -- Adicionar coluna dosagem se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medicamentos' 
        AND column_name = 'dosagem'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medicamentos ADD COLUMN dosagem varchar(100);
        ALTER TABLE public.medicamentos ADD CONSTRAINT medicamentos_dosagem_check 
            CHECK (char_length(trim(dosagem)) > 0);
    END IF;

    -- Adicionar coluna frequencia se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medicamentos' 
        AND column_name = 'frequencia'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medicamentos ADD COLUMN frequencia varchar(50);
        ALTER TABLE public.medicamentos ADD CONSTRAINT medicamentos_frequencia_check 
            CHECK (frequencia IN ('Diária', 'Semanal', 'Mensal', 'Conforme necessário'));
    END IF;

    -- Adicionar coluna intervalo_horas se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medicamentos' 
        AND column_name = 'intervalo_horas'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medicamentos ADD COLUMN intervalo_horas integer DEFAULT 24;
        ALTER TABLE public.medicamentos ADD CONSTRAINT medicamentos_intervalo_check 
            CHECK (intervalo_horas > 0 AND intervalo_horas <= 24);
    END IF;

    -- Adicionar coluna horarios se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medicamentos' 
        AND column_name = 'horarios'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medicamentos ADD COLUMN horarios text[];
        ALTER TABLE public.medicamentos ADD CONSTRAINT medicamentos_horarios_check 
            CHECK (array_length(horarios, 1) > 0);
    END IF;

    -- Adicionar coluna data_inicio se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medicamentos' 
        AND column_name = 'data_inicio'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medicamentos ADD COLUMN data_inicio date;
    END IF;

    -- Adicionar coluna data_fim se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medicamentos' 
        AND column_name = 'data_fim'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medicamentos ADD COLUMN data_fim date;
        ALTER TABLE public.medicamentos ADD CONSTRAINT medicamentos_data_fim_check 
            CHECK (data_fim IS NULL OR data_fim >= data_inicio);
    END IF;

    -- Adicionar coluna observacoes se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medicamentos' 
        AND column_name = 'observacoes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medicamentos ADD COLUMN observacoes text;
    END IF;

    -- Adicionar colunas de timestamp se não existirem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medicamentos' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medicamentos ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medicamentos' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medicamentos ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
    END IF;
END $$;

-- ====================================================================
-- CRIAR TABELA: registros_humor (se não existir)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.registros_humor (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data date NOT NULL,
    nivel_humor integer NOT NULL CHECK (nivel_humor >= 1 AND nivel_humor <= 5),
    fatores text[],
    notas text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, data)
);

-- ====================================================================
-- CRIAR TABELA: medicamentos_tomados (se não existir)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.medicamentos_tomados (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medicamento_id uuid NOT NULL REFERENCES public.medicamentos(id) ON DELETE CASCADE,
    data_tomada date NOT NULL,
    horario_tomada time NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ====================================================================
-- COMENTÁRIOS DAS TABELAS
-- ====================================================================

-- Comentários da tabela medicamentos
COMMENT ON TABLE public.medicamentos IS 'Tabela para armazenar medicamentos cadastrados pelo usuário';
COMMENT ON COLUMN public.medicamentos.nome IS 'Nome do medicamento (ex: Ritalina, Fluoxetina)';
COMMENT ON COLUMN public.medicamentos.dosagem IS 'Dosagem do medicamento (ex: 10mg, 1 comprimido)';
COMMENT ON COLUMN public.medicamentos.frequencia IS 'Frequência de uso do medicamento';
COMMENT ON COLUMN public.medicamentos.intervalo_horas IS 'Intervalo mínimo entre doses em horas';
COMMENT ON COLUMN public.medicamentos.horarios IS 'Array com horários de tomada (formato HH:MM)';
COMMENT ON COLUMN public.medicamentos.data_inicio IS 'Data de início do tratamento';
COMMENT ON COLUMN public.medicamentos.data_fim IS 'Data de fim do tratamento (opcional)';
COMMENT ON COLUMN public.medicamentos.observacoes IS 'Observações adicionais sobre o medicamento';

-- Comentários da tabela registros_humor
COMMENT ON TABLE public.registros_humor IS 'Tabela para armazenar registros diários de humor do usuário';
COMMENT ON COLUMN public.registros_humor.data IS 'Data do registro de humor';
COMMENT ON COLUMN public.registros_humor.nivel_humor IS 'Nível de humor de 1 (muito baixo) a 5 (muito alto)';
COMMENT ON COLUMN public.registros_humor.fatores IS 'Array com fatores que influenciaram o humor';
COMMENT ON COLUMN public.registros_humor.notas IS 'Notas adicionais sobre o estado de humor';

-- Comentários da tabela medicamentos_tomados
COMMENT ON TABLE public.medicamentos_tomados IS 'Tabela para registrar quando medicamentos foram efetivamente tomados';
COMMENT ON COLUMN public.medicamentos_tomados.medicamento_id IS 'Referência ao medicamento que foi tomado';
COMMENT ON COLUMN public.medicamentos_tomados.data_tomada IS 'Data em que o medicamento foi tomado';
COMMENT ON COLUMN public.medicamentos_tomados.horario_tomada IS 'Horário em que o medicamento foi tomado';
COMMENT ON COLUMN public.medicamentos_tomados.observacoes IS 'Observações sobre a tomada do medicamento';

-- ====================================================================
-- PROBLEM CRITICAL: INCOMPATIBILIDADE DETECTADA
-- ====================================================================

-- PROBLEMA: Interface MedicamentoTomado espera campo "observacoes" mas tabela não define
-- SOLUÇÃO: Verificar e adicionar campo "observacoes" se necessário

DO $$
BEGIN
    -- Adicionar campo observacoes à tabela medicamentos_tomados se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medicamentos_tomados' 
        AND column_name = 'observacoes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medicamentos_tomados ADD COLUMN observacoes text;
    END IF;
END $$;

-- ====================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ====================================================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_humor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicamentos_tomados ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "medicamentos_select_policy" ON public.medicamentos;
DROP POLICY IF EXISTS "medicamentos_insert_policy" ON public.medicamentos;
DROP POLICY IF EXISTS "medicamentos_update_policy" ON public.medicamentos;
DROP POLICY IF EXISTS "medicamentos_delete_policy" ON public.medicamentos;

-- Políticas para tabela medicamentos
CREATE POLICY "medicamentos_select_policy" ON public.medicamentos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medicamentos_insert_policy" ON public.medicamentos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medicamentos_update_policy" ON public.medicamentos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "medicamentos_delete_policy" ON public.medicamentos
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela registros_humor
DROP POLICY IF EXISTS "registros_humor_select_policy" ON public.registros_humor;
DROP POLICY IF EXISTS "registros_humor_insert_policy" ON public.registros_humor;
DROP POLICY IF EXISTS "registros_humor_update_policy" ON public.registros_humor;
DROP POLICY IF EXISTS "registros_humor_delete_policy" ON public.registros_humor;

CREATE POLICY "registros_humor_select_policy" ON public.registros_humor
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "registros_humor_insert_policy" ON public.registros_humor
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "registros_humor_update_policy" ON public.registros_humor
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "registros_humor_delete_policy" ON public.registros_humor
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela medicamentos_tomados
DROP POLICY IF EXISTS "medicamentos_tomados_select_policy" ON public.medicamentos_tomados;
DROP POLICY IF EXISTS "medicamentos_tomados_insert_policy" ON public.medicamentos_tomados;
DROP POLICY IF EXISTS "medicamentos_tomados_update_policy" ON public.medicamentos_tomados;
DROP POLICY IF EXISTS "medicamentos_tomados_delete_policy" ON public.medicamentos_tomados;

CREATE POLICY "medicamentos_tomados_select_policy" ON public.medicamentos_tomados
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medicamentos_tomados_insert_policy" ON public.medicamentos_tomados
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medicamentos_tomados_update_policy" ON public.medicamentos_tomados
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "medicamentos_tomados_delete_policy" ON public.medicamentos_tomados
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================================================
-- ÍNDICES PARA PERFORMANCE
-- ====================================================================

-- Índices para user_id (consultas principais)
CREATE INDEX IF NOT EXISTS idx_medicamentos_user_id ON public.medicamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_humor_user_id ON public.registros_humor(user_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_tomados_user_id ON public.medicamentos_tomados(user_id);

-- Índices para ordenação por data
CREATE INDEX IF NOT EXISTS idx_medicamentos_created_at ON public.medicamentos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registros_humor_data ON public.registros_humor(data DESC);
CREATE INDEX IF NOT EXISTS idx_medicamentos_tomados_data_tomada ON public.medicamentos_tomados(data_tomada DESC);

-- Índices compostos para consultas específicas
CREATE INDEX IF NOT EXISTS idx_registros_humor_user_data ON public.registros_humor(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_medicamentos_tomados_user_data ON public.medicamentos_tomados(user_id, data_tomada DESC);
CREATE INDEX IF NOT EXISTS idx_medicamentos_tomados_medicamento_data ON public.medicamentos_tomados(medicamento_id, data_tomada);

-- Índice para consulta de medicamentos tomados hoje (removido devido a limitação IMMUTABLE)
-- CREATE INDEX IF NOT EXISTS idx_medicamentos_tomados_user_data_today ON public.medicamentos_tomados(user_id, data_tomada)
-- WHERE data_tomada = CURRENT_DATE;

-- ====================================================================
-- FUNÇÕES E TRIGGERS
-- ====================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_medicamentos_updated_at ON public.medicamentos;
CREATE TRIGGER update_medicamentos_updated_at
    BEFORE UPDATE ON public.medicamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_registros_humor_updated_at ON public.registros_humor;
CREATE TRIGGER update_registros_humor_updated_at
    BEFORE UPDATE ON public.registros_humor
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- FUNÇÃO PARA VALIDAR HORÁRIOS
-- ====================================================================

-- Função para validar formato de horários no array
CREATE OR REPLACE FUNCTION validate_horarios_array(horarios text[])
RETURNS boolean AS $$
DECLARE
    horario text;
BEGIN
    -- Verificar se array não está vazio
    IF horarios IS NULL OR array_length(horarios, 1) IS NULL THEN
        RETURN false;
    END IF;
    
    -- Validar cada horário no formato HH:MM
    FOREACH horario IN ARRAY horarios
    LOOP
        IF NOT horario ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' THEN
            RETURN false;
        END IF;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Constraint para validar horários (remover se existir e recriar)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_horarios_format' 
        AND table_name = 'medicamentos'
    ) THEN
        ALTER TABLE public.medicamentos DROP CONSTRAINT check_horarios_format;
    END IF;
    
    ALTER TABLE public.medicamentos 
    ADD CONSTRAINT check_horarios_format 
    CHECK (validate_horarios_array(horarios));
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorar erro se constraint já existir
        NULL;
END $$;

-- ====================================================================
-- FUNÇÃO PARA CRIAR DADOS PADRÃO DE SAÚDE
-- ====================================================================

-- Função para criar dados padrão de saúde quando um usuário se registra
CREATE OR REPLACE FUNCTION create_default_health_data(user_uuid uuid)
RETURNS void AS $$
BEGIN
    -- Não há dados padrão específicos de saúde para criar
    -- Medicamentos e registros de humor são criados pelo usuário conforme necessário
    -- Esta função está disponível para futuras implementações se necessário
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION create_default_health_data TO authenticated;

COMMIT;
