-- =====================================================
-- MIGRATION 006: Health and Sleep Systems
-- Description: Complete health tracking and sleep management systems
-- Date: 2024-01-01
-- =====================================================

BEGIN;

-- =====================================================
-- HEALTH TABLES
-- =====================================================

-- Tabela: medicamentos
-- Descrição: Medicamentos cadastrados pelos usuários
CREATE TABLE IF NOT EXISTS medicamentos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome text NOT NULL CHECK (length(trim(nome)) > 0 AND length(nome) <= 100),
    dosagem varchar(100),
    frequencia varchar(50) CHECK (frequencia IN ('Diária', 'Semanal', 'Mensal', 'Conforme necessário')),
    intervalo_horas integer DEFAULT 24 CHECK (intervalo_horas > 0 AND intervalo_horas <= 24),
    horarios text[] CHECK (array_length(horarios, 1) > 0),
    data_inicio date,
    data_fim date CHECK (data_fim IS NULL OR data_fim >= data_inicio),
    observacoes text,
    horario text CHECK (horario IS NULL OR horario ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'),
    tomado boolean NOT NULL DEFAULT false,
    date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela: registros_humor
-- Descrição: Registros diários de humor do usuário
CREATE TABLE IF NOT EXISTS registros_humor (
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

-- Tabela: medicamentos_tomados
-- Descrição: Registra quando medicamentos foram efetivamente tomados
CREATE TABLE IF NOT EXISTS medicamentos_tomados (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medicamento_id uuid NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    data_tomada date NOT NULL,
    horario_tomada time NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =====================================================
-- SLEEP TABLES
-- =====================================================

-- Tabela: sleep_records
-- Descrição: Registros diários de sono dos usuários
CREATE TABLE IF NOT EXISTS sleep_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bedtime TIME NOT NULL,
    wake_time TIME NOT NULL,
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    notes TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Only one record per user per date
    UNIQUE(user_id, date)
);

-- Tabela: sleep_reminders
-- Descrição: Configurações de lembretes de sono
CREATE TABLE IF NOT EXISTS sleep_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bedtime_reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    bedtime_reminder_time TIME NOT NULL DEFAULT '22:00',
    wake_reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    wake_reminder_time TIME NOT NULL DEFAULT '07:00',
    weekdays TEXT[],
    message TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Only one configuration per user
    UNIQUE(user_id)
);

-- =====================================================
-- COMMENTS
-- =====================================================

-- Health table comments
COMMENT ON TABLE medicamentos IS 'Tabela para armazenar medicamentos cadastrados pelo usuário';
COMMENT ON TABLE registros_humor IS 'Tabela para armazenar registros diários de humor do usuário';
COMMENT ON TABLE medicamentos_tomados IS 'Tabela para registrar quando medicamentos foram efetivamente tomados';

-- Sleep table comments
COMMENT ON TABLE sleep_records IS 'Registros diários de sono dos usuários, incluindo horários e qualidade';
COMMENT ON TABLE sleep_reminders IS 'Configurações de lembretes de sono personalizados por usuário';

-- Column comments for key fields
COMMENT ON COLUMN sleep_records.bedtime IS 'Horário que o usuário foi dormir no formato HH:MM';
COMMENT ON COLUMN sleep_records.wake_time IS 'Horário que o usuário acordou no formato HH:MM';
COMMENT ON COLUMN sleep_records.sleep_quality IS 'Qualidade do sono numa escala de 1 a 10';
COMMENT ON COLUMN registros_humor.nivel_humor IS 'Nível de humor de 1 (muito baixo) a 5 (muito alto)';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS for all tables
ALTER TABLE medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_humor ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicamentos_tomados ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies - simplified for all operations
CREATE POLICY "Users can manage their own medicamentos" ON medicamentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own registros_humor" ON registros_humor FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own medicamentos_tomados" ON medicamentos_tomados FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sleep records" ON sleep_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sleep reminders" ON sleep_reminders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Health indexes
CREATE INDEX IF NOT EXISTS idx_medicamentos_user_id ON medicamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_created_at ON medicamentos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registros_humor_user_id ON registros_humor(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_humor_user_data ON registros_humor(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_medicamentos_tomados_user_id ON medicamentos_tomados(user_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_tomados_user_data ON medicamentos_tomados(user_id, data_tomada DESC);
CREATE INDEX IF NOT EXISTS idx_medicamentos_tomados_medicamento_data ON medicamentos_tomados(medicamento_id, data_tomada);

-- Sleep indexes
CREATE INDEX IF NOT EXISTS idx_sleep_records_user_date ON sleep_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_records_created_at ON sleep_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_records_quality ON sleep_records(user_id, sleep_quality);
CREATE INDEX IF NOT EXISTS idx_sleep_reminders_user_id ON sleep_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_reminders_active ON sleep_reminders(active, bedtime_reminder_enabled, wake_reminder_enabled);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Triggers for health tables
CREATE TRIGGER update_medicamentos_updated_at
    BEFORE UPDATE ON medicamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registros_humor_updated_at
    BEFORE UPDATE ON registros_humor
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for sleep tables
CREATE TRIGGER update_sleep_records_updated_at 
    BEFORE UPDATE ON sleep_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sleep_reminders_updated_at 
    BEFORE UPDATE ON sleep_reminders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate time format for medication schedules
CREATE OR REPLACE FUNCTION validate_horarios_array(horarios text[])
RETURNS boolean AS $$
DECLARE
    horario text;
BEGIN
    -- Check if array is not empty
    IF horarios IS NULL OR array_length(horarios, 1) IS NULL THEN
        RETURN false;
    END IF;
    
    -- Validate each time in HH:MM format
    FOREACH horario IN ARRAY horarios
    LOOP
        IF NOT horario ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' THEN
            RETURN false;
        END IF;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate time format
ALTER TABLE medicamentos 
ADD CONSTRAINT check_horarios_format 
CHECK (horarios IS NULL OR validate_horarios_array(horarios));

-- Sleep validation function
CREATE OR REPLACE FUNCTION validate_sleep_times()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if sleep quality is in correct range (1-10)
    IF NEW.sleep_quality < 1 OR NEW.sleep_quality > 10 THEN
        RAISE EXCEPTION 'sleep_quality deve estar entre 1 e 10, recebido: %', NEW.sleep_quality;
    END IF;
    
    -- Check if date is not in the future
    IF NEW.date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Não é possível registrar sono para datas futuras: %', NEW.date;
    END IF;
    
    -- Check if date is not too old (maximum 1 year)
    IF NEW.date < CURRENT_DATE - INTERVAL '1 year' THEN
        RAISE EXCEPTION 'Não é possível registrar sono para datas anteriores a 1 ano: %', NEW.date;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply sleep validation
CREATE TRIGGER validate_sleep_record_data
    BEFORE INSERT OR UPDATE ON sleep_records
    FOR EACH ROW EXECUTE FUNCTION validate_sleep_times();

-- =====================================================
-- DEFAULT DATA CREATION FUNCTIONS
-- =====================================================

-- Function to create default sleep reminders for new users
CREATE OR REPLACE FUNCTION create_default_sleep_reminders(user_uuid uuid)
RETURNS void AS $$
BEGIN
    -- Create default sleep reminder configuration
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
        false,  -- reminders disabled by default
        '22:00', 
        false, 
        '07:00',
        ARRAY['segunda', 'terca', 'quarta', 'quinta', 'sexta'], -- weekdays by default
        'Hora de se preparar para dormir! 😴',
        true
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION create_default_sleep_reminders TO authenticated;

-- Function to handle sleep setup for new users
CREATE OR REPLACE FUNCTION handle_new_user_sleep_setup()
RETURNS trigger AS $$
BEGIN
    -- Create default sleep configurations for the new user
    PERFORM create_default_sleep_reminders(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for when a new user is created - sleep setup
CREATE TRIGGER on_auth_user_created_sleep_setup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_sleep_setup();

COMMIT;