-- Migration: Add date column to dashboard tables
-- Description: Adds a DATE column named "date" with DEFAULT CURRENT_DATE to painel_dia, prioridades, medicamentos, and sessoes_foco
-- Date: 2025-08-17

BEGIN;

-- painel_dia
ALTER TABLE IF EXISTS painel_dia
  ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE;

-- prioridades
ALTER TABLE IF EXISTS prioridades
  ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE;

-- medicamentos
ALTER TABLE IF EXISTS medicamentos
  ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE;

-- sessoes_foco
ALTER TABLE IF EXISTS sessoes_foco
  ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE;

COMMIT;
