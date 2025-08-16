export interface AtividadePainelDia {
  id: string
  horario: string
  atividade: string
  cor: string
  concluida: boolean
  created_at: string
}

export interface Prioridade {
  id: string
  titulo: string
  importante: boolean
  concluida: boolean
  created_at: string
}

export interface Medicamento {
  id: string
  nome: string
  horario?: string
  tomado: boolean
  created_at: string
}

export interface SessaoFocoDashboard {
  id: string
  duracao_minutos: number
  tempo_restante: number
  ativa: boolean
  pausada: boolean
  created_at: string
}
