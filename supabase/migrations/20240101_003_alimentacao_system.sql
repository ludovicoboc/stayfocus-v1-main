-- =====================================================
-- MIGRATION 003: Alimentação System
-- Description: Complete food management system (recipes, meal planning, shopping lists)
-- Date: 2024-01-01
-- =====================================================

BEGIN;

-- =====================================================
-- TABELAS
-- =====================================================

-- Tabela: receitas
-- Descrição: Armazena as receitas criadas pelos usuários
CREATE TABLE IF NOT EXISTS receitas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome varchar(100) NOT NULL CHECK (length(trim(nome)) >= 2),
  categoria varchar(50) NOT NULL,
  ingredientes text[] NOT NULL CHECK (array_length(ingredientes, 1) > 0),
  modo_preparo text NOT NULL CHECK (length(trim(modo_preparo)) >= 10),
  tempo_preparo integer CHECK (tempo_preparo > 0 AND tempo_preparo <= 1440),
  porcoes integer CHECK (porcoes > 0 AND porcoes <= 50),
  dificuldade varchar(10) CHECK (dificuldade IN ('facil', 'medio', 'dificil')),
  favorita boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela: lista_compras
-- Descrição: Armazena itens da lista de compras dos usuários
CREATE TABLE IF NOT EXISTS lista_compras (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome varchar(100) NOT NULL CHECK (length(trim(nome)) >= 1),
  categoria varchar(50) NOT NULL,
  quantidade varchar(50),
  comprado boolean NOT NULL DEFAULT false,
  receita_id uuid REFERENCES receitas(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela: meal_plans (planejador de refeições)
-- Descrição: Armazena o planejamento de refeições dos usuários
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time varchar(5) NOT NULL CHECK (time ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'),
  description varchar(200) NOT NULL CHECK (length(trim(description)) >= 2),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela: meal_records (registro de refeições)
-- Descrição: Armazena o registro diário de refeições consumidas
CREATE TABLE IF NOT EXISTS meal_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time varchar(5) NOT NULL CHECK (time ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'),
  description varchar(200) NOT NULL CHECK (length(trim(description)) >= 2),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela: hydration_records (registro de hidratação)
-- Descrição: Armazena o registro diário de hidratação dos usuários
CREATE TABLE IF NOT EXISTS hydration_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  glasses_count integer NOT NULL DEFAULT 0 CHECK (glasses_count >= 0 AND glasses_count <= 50),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, date)
);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_records ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas para todas as operações
CREATE POLICY "Users can manage their own receitas" ON receitas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own lista_compras" ON lista_compras FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own meal_plans" ON meal_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own meal_records" ON meal_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own hydration_records" ON hydration_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices para receitas
CREATE INDEX IF NOT EXISTS idx_receitas_user_id ON receitas(user_id);
CREATE INDEX IF NOT EXISTS idx_receitas_categoria ON receitas(categoria);
CREATE INDEX IF NOT EXISTS idx_receitas_favorita ON receitas(favorita) WHERE favorita = true;
CREATE INDEX IF NOT EXISTS idx_receitas_created_at ON receitas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receitas_user_categoria ON receitas(user_id, categoria);

-- Índices para lista_compras
CREATE INDEX IF NOT EXISTS idx_lista_compras_user_id ON lista_compras(user_id);
CREATE INDEX IF NOT EXISTS idx_lista_compras_categoria ON lista_compras(categoria);
CREATE INDEX IF NOT EXISTS idx_lista_compras_comprado ON lista_compras(comprado);
CREATE INDEX IF NOT EXISTS idx_lista_compras_receita_id ON lista_compras(receita_id);
CREATE INDEX IF NOT EXISTS idx_lista_compras_user_categoria ON lista_compras(user_id, categoria);

-- Índices para meal_plans
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_time ON meal_plans(time);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_time ON meal_plans(user_id, time);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans(date DESC);

-- Índices para meal_records
CREATE INDEX IF NOT EXISTS idx_meal_records_user_id ON meal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_records_created_at ON meal_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_records_user_date ON meal_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_records_date ON meal_records(date DESC);

-- Índices para hydration_records
CREATE INDEX IF NOT EXISTS idx_hydration_records_user_id ON hydration_records(user_id);
CREATE INDEX IF NOT EXISTS idx_hydration_records_date ON hydration_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_hydration_records_user_date ON hydration_records(user_id, date);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Triggers para atualizar updated_at
CREATE TRIGGER trigger_receitas_updated_at
  BEFORE UPDATE ON receitas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_meal_records_updated_at
  BEFORE UPDATE ON meal_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_hydration_records_updated_at
  BEFORE UPDATE ON hydration_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

-- Comentários nas tabelas
COMMENT ON TABLE receitas IS 'Armazena receitas criadas pelos usuários com ingredientes, modo de preparo e informações nutricionais básicas';
COMMENT ON TABLE lista_compras IS 'Lista de compras dos usuários, pode ser gerada automaticamente a partir das receitas selecionadas';
COMMENT ON TABLE meal_plans IS 'Planejamento de refeições dos usuários para organizar horários e tipos de refeições';
COMMENT ON TABLE meal_records IS 'Registro diário das refeições consumidas pelos usuários para controle alimentar';
COMMENT ON TABLE hydration_records IS 'Controle diário de hidratação dos usuários, registrando número de copos de água consumidos';

-- Comentários em campos específicos
COMMENT ON COLUMN receitas.ingredientes IS 'Array de strings contendo a lista de ingredientes da receita';
COMMENT ON COLUMN receitas.tempo_preparo IS 'Tempo de preparo em minutos, máximo 24 horas (1440 minutos)';
COMMENT ON COLUMN receitas.porcoes IS 'Número de porções que a receita rende';
COMMENT ON COLUMN receitas.dificuldade IS 'Nível de dificuldade: facil, medio ou dificil';

COMMENT ON COLUMN lista_compras.receita_id IS 'Referência opcional à receita que originou este item';
COMMENT ON COLUMN lista_compras.quantidade IS 'Quantidade do item (ex: 2kg, 1 pacote, etc.)';

COMMENT ON COLUMN meal_plans.time IS 'Horário planejado para a refeição no formato HH:MM';
COMMENT ON COLUMN meal_plans.date IS 'Data do planejamento da refeição (YYYY-MM-DD)';
COMMENT ON COLUMN meal_records.time IS 'Horário em que a refeição foi consumida no formato HH:MM';
COMMENT ON COLUMN meal_records.date IS 'Data do registro da refeição (YYYY-MM-DD)';

COMMENT ON COLUMN hydration_records.date IS 'Data do registro de hidratação';
COMMENT ON COLUMN hydration_records.glasses_count IS 'Número de copos de água consumidos no dia';

COMMIT;