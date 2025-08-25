export interface AtividadePainelDia {
  id: string
  horario: string
  atividade: string
  cor: string
  concluida: boolean
  created_at: string
  date: string
}

export interface Prioridade {
  id: string
  titulo: string
  importante: boolean
  concluida: boolean
  created_at: string
  date: string
}

export interface Medicamento {
  id: string
  user_id: string
  nome: string
  dosagem: string
  frequencia: string
  intervalo_horas: number
  horarios: string[]
  data_inicio: string
  data_fim?: string
  observacoes?: string
  created_at: string
  updated_at: string
  tomado_hoje: boolean
  proximo_horario?: string
}

export interface SessaoFocoDashboard {
  id: string
  duracao_minutos: number
  tempo_restante: number
  ativa: boolean
  pausada: boolean
  created_at: string
  date: string
}
