-- Migration: Create Compromissos Table
-- Description: Creates table for user appointments and commitments
-- Date: 2024-08-20

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create compromissos table
CREATE TABLE IF NOT EXISTS compromissos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo text NOT NULL CHECK (length(trim(titulo)) > 0 AND length(titulo) <= 200),
    horario text NOT NULL CHECK (horario ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'),
    tipo text NOT NULL CHECK (tipo IN ('saude', 'estudos', 'alimentacao', 'trabalho', 'lazer', 'outros')),
    data date NOT NULL,
    concluido boolean NOT NULL DEFAULT false,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add table comment
COMMENT ON TABLE compromissos IS 'Compromissos e agendamentos do usuário';
COMMENT ON COLUMN compromissos.titulo IS 'Título do compromisso (máx 200 caracteres)';
COMMENT ON COLUMN compromissos.horario IS 'Horário do compromisso no formato HH:MM';
COMMENT ON COLUMN compromissos.tipo IS 'Categoria do compromisso';
COMMENT ON COLUMN compromissos.data IS 'Data do compromisso';
COMMENT ON COLUMN compromissos.concluido IS 'Indica se o compromisso foi concluído';

-- Enable RLS
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own compromissos" ON compromissos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compromissos" ON compromissos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compromissos" ON compromissos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own compromissos" ON compromissos
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compromissos_user_id ON compromissos(user_id);
CREATE INDEX IF NOT EXISTS idx_compromissos_data ON compromissos(user_id, data);
CREATE INDEX IF NOT EXISTS idx_compromissos_horario ON compromissos(user_id, horario);
CREATE INDEX IF NOT EXISTS idx_compromissos_tipo ON compromissos(tipo);

-- Create trigger for updated_at
CREATE TRIGGER update_compromissos_updated_at 
    BEFORE UPDATE ON compromissos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
