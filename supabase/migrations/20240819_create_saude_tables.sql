BEGIN;

-- ====================================================================
-- MIGRAÇÃO: TABELAS DE SAÚDE
-- Descrição: Cria tabelas para gerenciamento de medicamentos e 
--           monitoramento de humor do usuário
-- Data: 2024-08-19
-- ====================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- TABELA: medicamentos
-- Descrição: Armazena informações sobre medicamentos do usuário
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.medicamentos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome varchar(255) NOT NULL CHECK (char_length(trim(nome)) > 0),
    dosagem varchar(100) NOT NULL CHECK (char_length(trim(dosagem)) > 0),
    frequencia varchar(50) NOT NULL CHECK (frequencia IN ('Diária', 'Semanal', 'Mensal', 'Conforme necessário')),
    intervalo_horas integer NOT NULL DEFAULT 24 CHECK (intervalo_horas > 0 AND intervalo_horas <= 24),
    horarios text[] NOT NULL CHECK (array_length(horarios, 1) > 0),
    data_inicio date NOT NULL,
    data_fim date CHECK (data_fim IS NULL OR data_fim >= data_inicio),
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

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

-- ====================================================================
-- TABELA: registros_humor
-- Descrição: Armazena registros diários de humor do usuário
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

-- Comentários da tabela registros_humor
COMMENT ON TABLE public.registros_humor IS 'Tabela para armazenar registros diários de humor do usuário';
COMMENT ON COLUMN public.registros_humor.data IS 'Data do registro de humor';
COMMENT ON COLUMN public.registros_humor.nivel_humor IS 'Nível de humor de 1 (muito baixo) a 5 (muito alto)';
COMMENT ON COLUMN public.registros_humor.fatores IS 'Array com fatores que influenciaram o humor';
COMMENT ON COLUMN public.registros_humor.notas IS 'Notas adicionais sobre o estado de humor';

-- ====================================================================
-- TABELA: medicamentos_tomados
-- Descrição: Registra quando medicamentos foram efetivamente tomados
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

-- Comentários da tabela medicamentos_tomados
COMMENT ON TABLE public.medicamentos_tomados IS 'Tabela para registrar quando medicamentos foram efetivamente tomados';
COMMENT ON COLUMN public.medicamentos_tomados.medicamento_id IS 'Referência ao medicamento que foi tomado';
COMMENT ON COLUMN public.medicamentos_tomados.data_tomada IS 'Data em que o medicamento foi tomado';
COMMENT ON COLUMN public.medicamentos_tomados.horario_tomada IS 'Horário em que o medicamento foi tomado';
COMMENT ON COLUMN public.medicamentos_tomados.observacoes IS 'Observações sobre a tomada do medicamento';

-- ====================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ====================================================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_humor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicamentos_tomados ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "registros_humor_select_policy" ON public.registros_humor
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "registros_humor_insert_policy" ON public.registros_humor
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "registros_humor_update_policy" ON public.registros_humor
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "registros_humor_delete_policy" ON public.registros_humor
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela medicamentos_tomados
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

-- Índice para consulta de medicamentos tomados hoje
CREATE INDEX IF NOT EXISTS idx_medicamentos_tomados_user_data_today ON public.medicamentos_tomados(user_id, data_tomada)
WHERE data_tomada = CURRENT_DATE;

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

-- Constraint para validar horários
ALTER TABLE public.medicamentos 
ADD CONSTRAINT check_horarios_format 
CHECK (validate_horarios_array(horarios));

-- ====================================================================
-- DADOS DE EXEMPLO (APENAS PARA DESENVOLVIMENTO)
-- ====================================================================

-- Inserir dados de exemplo apenas se não existirem dados na tabela
-- (Remover este bloco em produção)
DO $$
BEGIN
    -- Verificar se já existem dados
    IF NOT EXISTS (SELECT 1 FROM public.medicamentos LIMIT 1) THEN
        -- Este bloco é apenas para desenvolvimento/teste
        -- Em produção, os dados serão inseridos pela aplicação
        NULL;
    END IF;
END $$;

COMMIT;
