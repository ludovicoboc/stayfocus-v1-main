export interface CategoriaGasto {
  id?: string
  user_id?: string
  name: string
  color: string
  icon?: string
  created_at?: string
  updated_at?: string
}

export interface Despesa {
  id?: string
  user_id?: string
  category_id?: string | null
  description: string
  amount: number
  date: string
  created_at?: string
  updated_at?: string
  category?: CategoriaGasto
}

export interface EnvelopeVirtual {
  id?: string
  user_id?: string
  name: string
  color: string
  total_amount: number
  used_amount: number
  created_at?: string
  updated_at?: string
}

export interface PagamentoAgendado {
  id?: string
  user_id?: string
  title: string
  amount: number
  due_date: string
  is_recurring: boolean
  recurrence_type?: "monthly" | "weekly" | "yearly" | null
  is_paid: boolean
  created_at?: string
  updated_at?: string
}

export interface GastosPorCategoria {
  categoria: string
  valor: number
  cor: string
  porcentagem: number
}
