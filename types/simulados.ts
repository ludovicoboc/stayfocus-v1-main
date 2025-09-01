export interface SimuladoMetadata {
  titulo: string
  concurso?: string
  ano?: number
  area?: string
  nivel?: string
  totalQuestoes: number
  autor?: string
}

export interface SimuladoAlternativas {
  a: string
  b: string
  c: string
  d: string
  e?: string
  f?: string
  g?: string
}

export interface SimuladoQuestao {
  id: number
  enunciado: string
  alternativas: SimuladoAlternativas
  gabarito: string
  assunto?: string
  dificuldade?: number
  explicacao?: string
}

export interface SimuladoData {
  metadata: SimuladoMetadata
  questoes: SimuladoQuestao[]
}

export interface SimuladoResposta {
  questaoId: number
  resposta: string
  correta: boolean
  tempoResposta?: number
}

export interface SimuladoResultado {
  id?: string
  user_id?: string
  simulation_id?: string
  score: number // Required for legacy simulation_history table
  total_questions: number
  percentage: number
  time_taken_minutes?: number
  answers: Record<string, string>
  completed_at?: string
  created_at?: string
}

export interface Simulado {
  id?: string
  user_id?: string
  competition_id?: string | null
  title: string
  metadata: SimuladoMetadata
  questions: SimuladoQuestao[]
  user_answers: Record<string, string>
  score: number
  total_questions: number
  completed: boolean
  started_at?: string
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

export type SimuladoStatus = "idle" | "loading" | "reviewing" | "results"
