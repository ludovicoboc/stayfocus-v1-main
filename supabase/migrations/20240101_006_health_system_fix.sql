-- =====================================================
-- MIGRATION 006 FIX: Health System Structure Corrections
-- Description: Fix medicamentos table inconsistencies and improve structure
-- Date: 2024-08-24
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: Clean up medicamentos table structure
-- =====================================================

-- Remove conflicting single-entry fields that don't match the array-based design
-- The table has both 'horario' (single) and 'horarios' (array) - keep only the array
ALTER TABLE medicamentos 
DROP COLUMN IF EXISTS horario CASCADE;

-- Remove the single-entry tracking fields that conflict with medicamentos_tomados table
ALTER TABLE medicamentos 
DROP COLUMN IF EXISTS tomado CASCADE;

-- Remove single date field that conflicts with proper date tracking
ALTER TABLE medicamentos 
DROP COLUMN IF EXISTS date CASCADE;

-- =====================================================
-- FIX 2: Add missing fields that frontend might need
-- =====================================================

-- Add end date validation to ensure proper date handling
ALTER TABLE medicamentos 
ADD CONSTRAINT medicamentos_date_logic 
CHECK (data_fim IS NULL OR data_fim >= data_inicio);

-- =====================================================
-- FIX 3: Improve medicamentos_tomados table structure
-- =====================================================

-- Ensure proper relationship and add helpful fields
ALTER TABLE medicamentos_tomados 
ADD COLUMN IF NOT EXISTS horario_planejado TIME;

-- Add composite index for better performance
CREATE INDEX IF NOT EXISTS idx_medicamentos_tomados_comprehensive
ON medicamentos_tomados(user_id, medicamento_id, data_tomada DESC, horario_tomada);

-- =====================================================
-- FIX 4: Create view for frontend compatibility
-- =====================================================

-- View that combines medicamento info with today's status
CREATE OR REPLACE VIEW v_medicamentos_dashboard AS
SELECT 
    m.id,
    m.user_id,
    m.nome,
    m.dosagem,
    m.frequencia,
    m.intervalo_horas,
    m.horarios,
    m.data_inicio,
    m.data_fim,
    m.observacoes,
    m.created_at,
    m.updated_at,
    -- Check if taken today for dashboard display
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM medicamentos_tomados mt 
            WHERE mt.medicamento_id = m.id 
            AND mt.data_tomada = CURRENT_DATE
        ) THEN true 
        ELSE false 
    END as tomado_hoje,
    -- Get next scheduled time for today
    (
        SELECT MIN(mt.horario_tomada)
        FROM medicamentos_tomados mt 
        WHERE mt.medicamento_id = m.id 
        AND mt.data_tomada = CURRENT_DATE
        AND mt.horario_tomada > CURRENT_TIME
    ) as proximo_horario
FROM medicamentos m
WHERE (m.data_fim IS NULL OR m.data_fim >= CURRENT_DATE);

-- Enable RLS on the view
ALTER VIEW v_medicamentos_dashboard SET (security_barrier = true);
GRANT SELECT ON v_medicamentos_dashboard TO authenticated;

-- =====================================================
-- FIX 5: Improved functions for medication management
-- =====================================================

-- Function to mark medication as taken
CREATE OR REPLACE FUNCTION marcar_medicamento_tomado(
    p_user_id UUID,
    p_medicamento_id UUID,
    p_data_tomada DATE DEFAULT CURRENT_DATE,
    p_horario_tomada TIME DEFAULT CURRENT_TIME,
    p_observacoes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    registro_id UUID;
    med_exists BOOLEAN;
BEGIN
    -- Verify medication belongs to user
    SELECT EXISTS(
        SELECT 1 FROM medicamentos 
        WHERE id = p_medicamento_id AND user_id = p_user_id
    ) INTO med_exists;
    
    IF NOT med_exists THEN
        RAISE EXCEPTION 'Medicamento não encontrado ou não pertence ao usuário';
    END IF;
    
    -- Insert the record
    INSERT INTO medicamentos_tomados (
        user_id,
        medicamento_id,
        data_tomada,
        horario_tomada,
        observacoes
    ) VALUES (
        p_user_id,
        p_medicamento_id,
        p_data_tomada,
        p_horario_tomada,
        p_observacoes
    )
    RETURNING id INTO registro_id;
    
    RETURN registro_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION marcar_medicamento_tomado TO authenticated;

-- Function to get medication schedule for a specific date
CREATE OR REPLACE FUNCTION get_medicamento_agenda(
    p_user_id UUID,
    p_data DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    medicamento_id UUID,
    nome TEXT,
    dosagem VARCHAR(100),
    horario_planejado TIME,
    tomado BOOLEAN,
    horario_tomado TIME,
    observacoes TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH horarios_expandidos AS (
        SELECT 
            m.id as medicamento_id,
            m.nome,
            m.dosagem,
            unnest(m.horarios)::TIME as horario_planejado
        FROM medicamentos m
        WHERE m.user_id = p_user_id
        AND (m.data_fim IS NULL OR m.data_fim >= p_data)
        AND m.data_inicio <= p_data
    )
    SELECT 
        he.medicamento_id,
        he.nome,
        he.dosagem,
        he.horario_planejado,
        (mt.id IS NOT NULL) as tomado,
        mt.horario_tomada as horario_tomado,
        mt.observacoes
    FROM horarios_expandidos he
    LEFT JOIN medicamentos_tomados mt ON (
        mt.medicamento_id = he.medicamento_id 
        AND mt.data_tomada = p_data
        AND ABS(EXTRACT(EPOCH FROM (mt.horario_tomada - he.horario_planejado))) < 3600 -- Within 1 hour
    )
    ORDER BY he.horario_planejado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_medicamento_agenda TO authenticated;

-- =====================================================
-- FIX 6: Update RLS policies for new structure
-- =====================================================

-- Ensure medicamentos_tomados has proper RLS
CREATE POLICY "Users can manage their medication records" ON medicamentos_tomados 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FIX 7: Add helpful comments
-- =====================================================

COMMENT ON VIEW v_medicamentos_dashboard IS 'Dashboard view showing medications with today status and next scheduled time';
COMMENT ON FUNCTION marcar_medicamento_tomado IS 'Mark a medication as taken at specific date/time';
COMMENT ON FUNCTION get_medicamento_agenda IS 'Get medication schedule for a specific date with taken status';

-- Update existing table comments
COMMENT ON TABLE medicamentos IS 'Stores user medications with schedule arrays and date ranges - cleaned structure';
COMMENT ON COLUMN medicamentos.horarios IS 'Array of scheduled times in HH:MM format for daily doses';
COMMENT ON COLUMN medicamentos.data_inicio IS 'Start date for the medication treatment';
COMMENT ON COLUMN medicamentos.data_fim IS 'End date for the medication treatment (NULL = ongoing)';

COMMIT;