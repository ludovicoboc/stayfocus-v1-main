-- Migração para criar tabelas do módulo de sono
-- Criado em: 2024-08-18
-- Descrição: Tabelas para gerenciamento de registros de sono e configuração de lembretes

BEGIN;

-- Extensão necessária para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================
-- CRIAÇÃO DAS TABELAS
-- ====================

-- Tabela de registros de sono
-- Armazena dados diários sobre padrões de sono dos usuários
CREATE TABLE IF NOT EXISTS sleep_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bedtime TIME NOT NULL, -- Horário de dormir (formato HH:MM)
    wake_time TIME NOT NULL, -- Horário de acordar (formato HH:MM)
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality >= 1 AND sleep_quality <= 10), -- Qualidade do sono (1-10)
    notes TEXT, -- Observações sobre o sono (opcional)
    date DATE NOT NULL, -- Data do registro (YYYY-MM-DD)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Restrição para garantir que só existe um registro por usuário por data
    UNIQUE(user_id, date)
);

-- Comentários da tabela sleep_records
COMMENT ON TABLE sleep_records IS 'Registros diários de sono dos usuários, incluindo horários e qualidade';
COMMENT ON COLUMN sleep_records.bedtime IS 'Horário que o usuário foi dormir no formato HH:MM';
COMMENT ON COLUMN sleep_records.wake_time IS 'Horário que o usuário acordou no formato HH:MM';
COMMENT ON COLUMN sleep_records.sleep_quality IS 'Qualidade do sono numa escala de 1 a 10';
COMMENT ON COLUMN sleep_records.notes IS 'Observações opcionais sobre a qualidade do sono';
COMMENT ON COLUMN sleep_records.date IS 'Data do registro de sono no formato YYYY-MM-DD';

-- Tabela de configuração de lembretes de sono
-- Gerencia configurações de notificações para dormir e acordar
CREATE TABLE IF NOT EXISTS sleep_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bedtime_reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- Lembrete para dormir ativo
    bedtime_reminder_time TIME NOT NULL DEFAULT '22:00', -- Horário do lembrete para dormir
    wake_reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- Lembrete para acordar ativo
    wake_reminder_time TIME NOT NULL DEFAULT '07:00', -- Horário do lembrete para acordar
    weekdays TEXT[], -- Dias da semana para os lembretes (segunda, terca, etc.)
    message TEXT, -- Mensagem personalizada do lembrete
    active BOOLEAN NOT NULL DEFAULT TRUE, -- Se a configuração está ativa
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Restrição para garantir que só existe uma configuração por usuário
    UNIQUE(user_id)
);

-- Comentários da tabela sleep_reminders
COMMENT ON TABLE sleep_reminders IS 'Configurações de lembretes de sono personalizados por usuário';
COMMENT ON COLUMN sleep_reminders.bedtime_reminder_enabled IS 'Se o lembrete para dormir está ativo';
COMMENT ON COLUMN sleep_reminders.bedtime_reminder_time IS 'Horário do lembrete para se preparar para dormir';
COMMENT ON COLUMN sleep_reminders.wake_reminder_enabled IS 'Se o lembrete para acordar está ativo';
COMMENT ON COLUMN sleep_reminders.wake_reminder_time IS 'Horário do alarme para acordar';
COMMENT ON COLUMN sleep_reminders.weekdays IS 'Array com os dias da semana que os lembretes devem ser ativados';
COMMENT ON COLUMN sleep_reminders.message IS 'Mensagem personalizada opcional para os lembretes';
COMMENT ON COLUMN sleep_reminders.active IS 'Se a configuração de lembretes está ativa globalmente';

-- ====================
-- POLÍTICAS RLS
-- ====================

-- Habilitar RLS nas tabelas
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas para sleep_records
-- Usuários só podem ver seus próprios registros
CREATE POLICY "Users can view own sleep records" ON sleep_records
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários só podem inserir seus próprios registros
CREATE POLICY "Users can insert own sleep records" ON sleep_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários só podem atualizar seus próprios registros
CREATE POLICY "Users can update own sleep records" ON sleep_records
    FOR UPDATE USING (auth.uid() = user_id);

-- Usuários só podem deletar seus próprios registros
CREATE POLICY "Users can delete own sleep records" ON sleep_records
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para sleep_reminders
-- Usuários só podem ver suas próprias configurações
CREATE POLICY "Users can view own sleep reminders" ON sleep_reminders
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários só podem inserir suas próprias configurações
CREATE POLICY "Users can insert own sleep reminders" ON sleep_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários só podem atualizar suas próprias configurações
CREATE POLICY "Users can update own sleep reminders" ON sleep_reminders
    FOR UPDATE USING (auth.uid() = user_id);

-- Usuários só podem deletar suas próprias configurações
CREATE POLICY "Users can delete own sleep reminders" ON sleep_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- ====================
-- ÍNDICES
-- ====================

-- Índices para sleep_records
-- Índice composto para buscar registros por usuário e data (query principal)
CREATE INDEX IF NOT EXISTS idx_sleep_records_user_date 
    ON sleep_records(user_id, date DESC);

-- Índice para ordenação por data de criação
CREATE INDEX IF NOT EXISTS idx_sleep_records_created_at 
    ON sleep_records(created_at DESC);

-- Índice para buscar por qualidade de sono
CREATE INDEX IF NOT EXISTS idx_sleep_records_quality 
    ON sleep_records(user_id, sleep_quality);

-- Índices para sleep_reminders
-- Índice para buscar configuração por usuário
CREATE INDEX IF NOT EXISTS idx_sleep_reminders_user_id 
    ON sleep_reminders(user_id);

-- Índice para lembretes ativos
CREATE INDEX IF NOT EXISTS idx_sleep_reminders_active 
    ON sleep_reminders(active, bedtime_reminder_enabled, wake_reminder_enabled);

-- ====================
-- TRIGGERS
-- ====================

-- Função para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para sleep_records
CREATE TRIGGER update_sleep_records_updated_at 
    BEFORE UPDATE ON sleep_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para sleep_reminders
CREATE TRIGGER update_sleep_reminders_updated_at 
    BEFORE UPDATE ON sleep_reminders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================
-- VALIDAÇÕES ADICIONAIS
-- ====================

-- Função para validar horários lógicos
CREATE OR REPLACE FUNCTION validate_sleep_times()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se a qualidade está no range correto (1-10)
    IF NEW.sleep_quality < 1 OR NEW.sleep_quality > 10 THEN
        RAISE EXCEPTION 'sleep_quality deve estar entre 1 e 10, recebido: %', NEW.sleep_quality;
    END IF;
    
    -- Verificar se a data não é no futuro
    IF NEW.date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Não é possível registrar sono para datas futuras: %', NEW.date;
    END IF;
    
    -- Verificar se a data não é muito antiga (máximo 1 ano)
    IF NEW.date < CURRENT_DATE - INTERVAL '1 year' THEN
        RAISE EXCEPTION 'Não é possível registrar sono para datas anteriores a 1 ano: %', NEW.date;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar validação na tabela sleep_records
CREATE TRIGGER validate_sleep_record_data
    BEFORE INSERT OR UPDATE ON sleep_records
    FOR EACH ROW EXECUTE FUNCTION validate_sleep_times();

-- ====================
-- FUNÇÃO PARA CRIAR CONFIGURAÇÕES PADRÃO
-- ====================

-- Função para criar configurações padrão de lembretes de sono
CREATE OR REPLACE FUNCTION create_default_sleep_reminders(user_uuid uuid)
RETURNS void AS $$
BEGIN
    -- Criar configuração padrão de lembretes
    INSERT INTO sleep_reminders (
        user_id, 
        bedtime_reminder_enabled, 
        bedtime_reminder_time, 
        wake_reminder_enabled, 
        wake_reminder_time,
        weekdays,
        message,
        active
    ) VALUES (
        user_uuid, 
        false,  -- lembretes desabilitados por padrão
        '22:00', 
        false, 
        '07:00',
        ARRAY['segunda', 'terca', 'quarta', 'quinta', 'sexta'], -- dias úteis por padrão
        'Hora de se preparar para dormir! 😴',
        true
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION create_default_sleep_reminders TO authenticated;

-- ====================
-- TRIGGER PARA CRIAR CONFIGURAÇÕES AUTOMÁTICAMENTE
-- ====================

-- Função de trigger para criar configurações padrão automaticamente
CREATE OR REPLACE FUNCTION handle_new_user_sleep_setup()
RETURNS trigger AS $$
BEGIN
    -- Criar configurações padrão de sono para o novo usuário
    PERFORM create_default_sleep_reminders(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created_sleep_setup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_sleep_setup();

-- ====================
-- DADOS INICIAIS
-- ====================

-- Configurações padrão são criadas automaticamente via trigger
-- Registros de sono são pessoais e criados pelo usuário

COMMIT;
