BEGIN;

-- =====================================================
-- MIGRAÇÃO: Criação das tabelas do módulo de finanças
-- Data: 2024-08-16
-- Descrição: Estrutura completa para gestão financeira pessoal
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela: expense_categories
-- Descrição: Categorias para classificação de despesas
CREATE TABLE IF NOT EXISTS expense_categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    color varchar(7) NOT NULL DEFAULT '#6b7280', -- Cor em formato hexadecimal
    icon varchar(50), -- Nome do ícone (opcional)
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT expense_categories_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT expense_categories_color_format CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    CONSTRAINT expense_categories_user_name_unique UNIQUE (user_id, name)
);

-- Tabela: expenses
-- Descrição: Registro de despesas/gastos do usuário
CREATE TABLE IF NOT EXISTS expenses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
    description varchar(200) NOT NULL,
    amount decimal(10,2) NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    notes text, -- Campo opcional para observações adicionais
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT expenses_description_not_empty CHECK (length(trim(description)) > 0),
    CONSTRAINT expenses_amount_positive CHECK (amount > 0),
    CONSTRAINT expenses_date_not_future CHECK (date <= CURRENT_DATE + INTERVAL '1 day') -- Permite 1 dia no futuro para flexibilidade
);

-- Tabela: virtual_envelopes
-- Descrição: Sistema de envelopes virtuais para controle orçamentário
CREATE TABLE IF NOT EXISTS virtual_envelopes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    color varchar(7) NOT NULL DEFAULT '#3b82f6', -- Cor em formato hexadecimal
    total_amount decimal(10,2) NOT NULL,
    used_amount decimal(10,2) NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT virtual_envelopes_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT virtual_envelopes_color_format CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    CONSTRAINT virtual_envelopes_total_amount_positive CHECK (total_amount > 0),
    CONSTRAINT virtual_envelopes_used_amount_non_negative CHECK (used_amount >= 0),
    CONSTRAINT virtual_envelopes_used_not_exceed_total CHECK (used_amount <= total_amount),
    CONSTRAINT virtual_envelopes_user_name_unique UNIQUE (user_id, name)
);

-- Tabela: scheduled_payments
-- Descrição: Pagamentos agendados e recorrentes
CREATE TABLE IF NOT EXISTS scheduled_payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title varchar(150) NOT NULL,
    amount decimal(10,2) NOT NULL,
    due_date date NOT NULL,
    is_recurring boolean NOT NULL DEFAULT false,
    recurrence_type varchar(20) CHECK (recurrence_type IN ('monthly', 'weekly', 'yearly')),
    is_paid boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT scheduled_payments_title_not_empty CHECK (length(trim(title)) > 0),
    CONSTRAINT scheduled_payments_amount_positive CHECK (amount > 0),
    CONSTRAINT scheduled_payments_recurrence_logic CHECK (
        (is_recurring = false AND recurrence_type IS NULL) OR
        (is_recurring = true AND recurrence_type IS NOT NULL)
    )
);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para expense_categories
CREATE POLICY "Users can view their own expense categories" ON expense_categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense categories" ON expense_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense categories" ON expense_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense categories" ON expense_categories
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para expenses
CREATE POLICY "Users can view their own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para virtual_envelopes
CREATE POLICY "Users can view their own virtual envelopes" ON virtual_envelopes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own virtual envelopes" ON virtual_envelopes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own virtual envelopes" ON virtual_envelopes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own virtual envelopes" ON virtual_envelopes
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para scheduled_payments
CREATE POLICY "Users can view their own scheduled payments" ON scheduled_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled payments" ON scheduled_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled payments" ON scheduled_payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled payments" ON scheduled_payments
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para expense_categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON expense_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(user_id, name);

-- Índices para expenses
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(user_id, amount DESC);

-- Índices para virtual_envelopes
CREATE INDEX IF NOT EXISTS idx_virtual_envelopes_user_id ON virtual_envelopes(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_envelopes_created_at ON virtual_envelopes(user_id, created_at);

-- Índices para scheduled_payments
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_user_id ON scheduled_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_due_date ON scheduled_payments(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_is_paid ON scheduled_payments(user_id, is_paid);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_recurring ON scheduled_payments(user_id, is_recurring);

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

-- Triggers para todas as tabelas
CREATE TRIGGER update_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_envelopes_updated_at
    BEFORE UPDATE ON virtual_envelopes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_payments_updated_at
    BEFORE UPDATE ON scheduled_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA CRIAR CATEGORIAS PADRÃO
-- =====================================================

-- Função para criar categorias padrão para novos usuários
CREATE OR REPLACE FUNCTION create_default_expense_categories(user_uuid uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO expense_categories (user_id, name, color, icon) VALUES
        (user_uuid, 'Alimentação', '#f59e0b', '🍽️'),
        (user_uuid, 'Transporte', '#3b82f6', '🚗'),
        (user_uuid, 'Moradia', '#10b981', '🏠'),
        (user_uuid, 'Saúde', '#ef4444', '⚕️'),
        (user_uuid, 'Educação', '#8b5cf6', '📚'),
        (user_uuid, 'Lazer', '#f97316', '🎯'),
        (user_uuid, 'Compras', '#ec4899', '🛍️'),
        (user_uuid, 'Outros', '#6b7280', '📋')
    ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a função seja executável por usuários autenticados
GRANT EXECUTE ON FUNCTION create_default_expense_categories TO authenticated;

-- =====================================================
-- COMENTÁRIOS ADICIONAIS
-- =====================================================

COMMENT ON TABLE expense_categories IS 'Categorias para classificação de despesas do usuário';
COMMENT ON TABLE expenses IS 'Registro de despesas e gastos do usuário';
COMMENT ON TABLE virtual_envelopes IS 'Sistema de envelopes virtuais para controle orçamentário';
COMMENT ON TABLE scheduled_payments IS 'Pagamentos agendados e recorrentes do usuário';

COMMENT ON COLUMN expense_categories.name IS 'Nome da categoria de despesa';
COMMENT ON COLUMN expense_categories.color IS 'Cor da categoria em formato hexadecimal (#RRGGBB)';
COMMENT ON COLUMN expense_categories.icon IS 'Ícone emoji da categoria (opcional)';

COMMENT ON COLUMN expenses.description IS 'Descrição da despesa (máximo 200 caracteres)';
COMMENT ON COLUMN expenses.amount IS 'Valor da despesa (deve ser positivo)';
COMMENT ON COLUMN expenses.date IS 'Data da despesa';
COMMENT ON COLUMN expenses.notes IS 'Campo opcional para observações adicionais sobre a despesa';

COMMENT ON COLUMN virtual_envelopes.name IS 'Nome do envelope virtual';
COMMENT ON COLUMN virtual_envelopes.color IS 'Cor do envelope em formato hexadecimal (#RRGGBB)';
COMMENT ON COLUMN virtual_envelopes.total_amount IS 'Valor total disponível no envelope';
COMMENT ON COLUMN virtual_envelopes.used_amount IS 'Valor já utilizado do envelope virtual';

COMMENT ON COLUMN scheduled_payments.title IS 'Título do pagamento agendado';
COMMENT ON COLUMN scheduled_payments.amount IS 'Valor do pagamento';
COMMENT ON COLUMN scheduled_payments.due_date IS 'Data de vencimento do pagamento';
COMMENT ON COLUMN scheduled_payments.is_recurring IS 'Indica se o pagamento é recorrente';
COMMENT ON COLUMN scheduled_payments.recurrence_type IS 'Tipo de recorrência: monthly, weekly ou yearly';
COMMENT ON COLUMN scheduled_payments.is_paid IS 'Indica se o pagamento foi realizado';

COMMIT;
