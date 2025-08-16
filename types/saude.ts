export interface Medicamento {
  id: string
  user_id: string
  nome: string
  dosagem: string
  frequencia: string
  intervalo_horas: number
  horarios: string[]
  data_inicio: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface RegistroHumor {
  id: string
  user_id: string
  data: string
  nivel_humor: number
  fatores?: string[]
  notas?: string
  created_at: string
  updated_at: string
}

export interface NovoMedicamento {
  nome: string
  dosagem: string
  frequencia: string
  intervalo_horas?: number
  horarios: string[]
  data_inicio: string
  observacoes?: string
}

export interface NovoRegistroHumor {
  data: string
  nivel_humor: number
  fatores?: string[]
  notas?: string
}

export interface ResumoMedicamentos {
  total: number
  tomadosHoje: number
  proximaDose: string | null
}

export interface ResumoHumor {
  media: number
  fatoresComuns: string[]
}

export type FrequenciaMedicamento = "Diária" | "Semanal" | "Mensal" | "Conforme necessário"
export type IntervaloHoras = "4 horas" | "6 horas" | "8 horas" | "12 horas" | "24 horas"
