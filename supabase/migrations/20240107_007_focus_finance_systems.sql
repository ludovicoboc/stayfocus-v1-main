-- =====================================================
-- MIGRATION 007: Focus and Finance Systems
-- Description: Hyperfocus management and financial tracking systems
-- Date: 2024-01-01
-- =====================================================

BEGIN;

-- =====================================================
-- HYPERFOCUS TABLES
-- =====================================================

-- Tabela: hyperfocus_projects
-- Descrição: Projetos de hiperfoco dos usuários
CREATE TABLE IF NOT EXISTS hyperfocus_projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    description text,
    color varchar(7) NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    time_limit integer CHECK (time_limit IS NULL OR time_limit > 0),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: hyperfocus_tasks
-- Descrição: Tarefas associadas aos projetos de hiperfoco
CREATE TABLE IF NOT EXISTS hyperfocus_tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES hyperfocus_projects(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    description text,
    completed boolean NOT NULL DEFAULT false,
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: hyperfocus_sessions
-- Descrição: Sessões de foco para projetos
CREATE TABLE IF NOT EXISTS hyperfocus_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id uuid REFERENCES hyperfocus_projects(id) ON DELETE SET NULL,
    duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
    completed boolean NOT NULL DEFAULT false,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: alternation_sessions
-- Descrição: Sessões de alternância entre projetos
CREATE TABLE IF NOT EXISTS alternation_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    projects text[] NOT NULL CHECK (array_length(projects, 1) > 0),
    current_project_index integer NOT NULL DEFAULT 0,
    session_duration integer NOT NULL CHECK (session_duration > 0),
    is_active boolean NOT NULL DEFAULT false,
    started_at timestamp with time zone,
    paused_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- FINANCE TABLES
-- =====================================================

-- Tabela: expense_categories
-- Descrição: Categorias para classificação de despesas
CREATE TABLE IF NOT EXISTS expense_categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL CHECK (length(trim(name)) > 0),
    color varchar(7) NOT NULL DEFAULT '#6b7280' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    icon varchar(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT expense_categories_user_name_unique UNIQUE (user_id, name)
);

-- Tabela: expenses
-- Descrição: Registro de despesas/gastos do usuário
CREATE TABLE IF NOT EXISTS expenses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
    description varchar(200) NOT NULL CHECK (length(trim(description)) > 0),
    amount decimal(10,2) NOT NULL CHECK (amount > 0),
    date date NOT NULL DEFAULT CURRENT_DATE,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT expenses_date_not_future CHECK (date <= CURRENT_DATE + INTERVAL '1 day')
);

-- Tabela: virtual_envelopes
-- Descrição: Sistema de envelopes virtuais para controle orçamentário
CREATE TABLE IF NOT EXISTS virtual_envelopes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL CHECK (length(trim(name)) > 0),
    color varchar(7) NOT NULL DEFAULT '#3b82f6' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    total_amount decimal(10,2) NOT NULL CHECK (total_amount > 0),
    used_amount decimal(10,2) NOT NULL DEFAULT 0 CHECK (used_amount >= 0),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT virtual_envelopes_used_not_exceed_total CHECK (used_amount <= total_amount),
    CONSTRAINT virtual_envelopes_user_name_unique UNIQUE (user_id, name)
);

-- Tabela: scheduled_payments
-- Descrição: Pagamentos agendados e recorrentes
CREATE TABLE IF NOT EXISTS scheduled_payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title varchar(150) NOT NULL CHECK (length(trim(title)) > 0),
    amount decimal(10,2) NOT NULL CHECK (amount > 0),
    due_date date NOT NULL,
    is_recurring boolean NOT NULL DEFAULT false,
    recurrence_type varchar(20) CHECK (recurrence_type IN ('monthly', 'weekly', 'yearly')),
    is_paid boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT scheduled_payments_recurrence_logic CHECK (
        (is_recurring = false AND recurrence_type IS NULL) OR
        (is_recurring = true AND recurrence_type IS NOT NULL)
    )
);

-- =====================================================
-- COMMENTS
-- =====================================================

-- Hyperfocus comments
COMMENT ON TABLE hyperfocus_projects IS 'Stores hyperfocus projects created by users for interest management';
COMMENT ON TABLE hyperfocus_tasks IS 'Tasks that belong to hyperfocus projects';
COMMENT ON TABLE hyperfocus_sessions IS 'Focus sessions for tracking time spent on hyperfocus activities';
COMMENT ON TABLE alternation_sessions IS 'Sessions for alternating between multiple hyperfocus projects';

-- Finance comments
COMMENT ON TABLE expense_categories IS 'Categorias para classificação de despesas do usuário';
COMMENT ON TABLE expenses IS 'Registro de despesas e gastos do usuário';
COMMENT ON TABLE virtual_envelopes IS 'Sistema de envelopes virtuais para controle orçamentário';
COMMENT ON TABLE scheduled_payments IS 'Pagamentos agendados e recorrentes do usuário';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE hyperfocus_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hyperfocus_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hyperfocus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hyperfocus - simplified
DROP POLICY IF EXISTS "Users can manage their own hyperfocus projects" ON hyperfocus_projects;
CREATE POLICY "Users can manage their own hyperfocus projects" ON hyperfocus_projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage hyperfocus sessions" ON hyperfocus_sessions;
CREATE POLICY "Users can manage hyperfocus sessions" ON hyperfocus_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage alternation sessions" ON alternation_sessions;
CREATE POLICY "Users can manage alternation sessions" ON alternation_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policy for hyperfocus_tasks - depends on project ownership
DROP POLICY IF EXISTS "Users can manage tasks from their projects" ON hyperfocus_tasks;
CREATE POLICY "Users can manage tasks from their projects" ON hyperfocus_tasks FOR ALL 
    USING (EXISTS (SELECT 1 FROM hyperfocus_projects WHERE hyperfocus_projects.id = hyperfocus_tasks.project_id AND hyperfocus_projects.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM hyperfocus_projects WHERE hyperfocus_projects.id = hyperfocus_tasks.project_id AND hyperfocus_projects.user_id = auth.uid()));

-- RLS Policies for finance - simplified
DROP POLICY IF EXISTS "Users can manage their own expense categories" ON expense_categories;
CREATE POLICY "Users can manage their own expense categories" ON expense_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own expenses" ON expenses;
CREATE POLICY "Users can manage their own expenses" ON expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own virtual envelopes" ON virtual_envelopes;
CREATE POLICY "Users can manage their own virtual envelopes" ON virtual_envelopes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own scheduled payments" ON scheduled_payments;
CREATE POLICY "Users can manage their own scheduled payments" ON scheduled_payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INDEXES
-- =====================================================

-- Hyperfocus indexes
CREATE INDEX IF NOT EXISTS idx_hyperfocus_projects_user_id ON hyperfocus_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_projects_created_at ON hyperfocus_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_projects_is_active ON hyperfocus_projects(is_active);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_tasks_project_id ON hyperfocus_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_tasks_order_index ON hyperfocus_tasks(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_tasks_completed ON hyperfocus_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_sessions_user_id ON hyperfocus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_sessions_project_id ON hyperfocus_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_hyperfocus_sessions_created_at ON hyperfocus_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alternation_sessions_user_id ON alternation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_alternation_sessions_created_at ON alternation_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alternation_sessions_is_active ON alternation_sessions(is_active);

-- Finance indexes
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON expense_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(user_id, name);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_virtual_envelopes_user_id ON virtual_envelopes(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_user_id ON scheduled_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_due_date ON scheduled_payments(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_is_paid ON scheduled_payments(user_id, is_paid);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Triggers for hyperfocus tables
DROP TRIGGER IF EXISTS update_hyperfocus_projects_updated_at ON update_updated_at_column;
CREATE TRIGGER update_hyperfocus_projects_updated_at
    BEFORE UPDATE ON hyperfocus_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hyperfocus_tasks_updated_at ON update_updated_at_column;
CREATE TRIGGER update_hyperfocus_tasks_updated_at
    BEFORE UPDATE ON hyperfocus_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hyperfocus_sessions_updated_at ON update_updated_at_column;
CREATE TRIGGER update_hyperfocus_sessions_updated_at
    BEFORE UPDATE ON hyperfocus_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alternation_sessions_updated_at ON update_updated_at_column;
CREATE TRIGGER update_alternation_sessions_updated_at
    BEFORE UPDATE ON alternation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for finance tables
DROP TRIGGER IF EXISTS update_expense_categories_updated_at ON update_updated_at_column;
CREATE TRIGGER update_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON update_updated_at_column;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_virtual_envelopes_updated_at ON update_updated_at_column;
CREATE TRIGGER update_virtual_envelopes_updated_at
    BEFORE UPDATE ON virtual_envelopes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_payments_updated_at ON update_updated_at_column;
CREATE TRIGGER update_scheduled_payments_updated_at
    BEFORE UPDATE ON scheduled_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DEFAULT CATEGORY CREATION
-- =====================================================

-- Function to create default expense categories for new users
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_default_expense_categories TO authenticated;

COMMIT;