export type ConcursoStatus = "planejado" | "inscrito" | "estudando" | "realizado" | "aguardando_resultado"

export interface Topico {
  id?: string
  subject_id?: string
  name: string
  completed?: boolean
  created_at?: string
  updated_at?: string
}

export interface Disciplina {
  id?: string
  competition_id?: string
  name: string
  progress?: number
  topicos?: Topico[]
  created_at?: string
  updated_at?: string
}

export interface Concurso {
  id?: string
  user_id?: string
  title: string
  organizer: string
  registration_date?: string | null
  exam_date?: string | null
  edital_link?: string | null
  status: ConcursoStatus
  disciplinas?: Disciplina[]
  created_at?: string
  updated_at?: string
}

export interface QuestionOption {
  text: string
  isCorrect: boolean
}

export interface SimulationResults {
  score: number
  total: number
  answers: Record<string, string>
  completed_at?: string
  percentage?: number
  time_taken_minutes?: number
}

export interface Questao {
  id?: string
  competition_id?: string
  subject_id?: string
  topic_id?: string | null
  question_text: string
  options?: QuestionOption[]
  correct_answer?: string
  explanation?: string
  difficulty?: "facil" | "medio" | "dificil"
  question_type?: "multiple_choice" | "true_false" | "essay" | "short_answer"
  points?: number
  time_limit_seconds?: number
  tags?: string[]
  source?: string
  year?: number
  is_active?: boolean
  usage_count?: number
  is_ai_generated?: boolean
  created_at?: string
  updated_at?: string
}

export interface Simulado {
  id?: string
  competition_id?: string
  user_id?: string
  title: string
  description?: string
  questions: string[] // Array of question IDs
  question_count?: number
  time_limit_minutes?: number
  difficulty_filter?: 'facil' | 'medio' | 'dificil'
  subject_filters?: string[]
  topic_filters?: string[]
  status?: 'draft' | 'active' | 'completed' | 'archived'
  is_public?: boolean
  results?: SimulationResults
  is_favorite: boolean
  attempts_count?: number
  best_score?: number
  avg_score?: number
  created_at?: string
  updated_at?: string
}

export interface ConcursoFormData {
  title: string
  organizer: string
  registration_date: string
  exam_date: string
  edital_link?: string
  status: ConcursoStatus
  disciplinas: {
    name: string
    topicos: string[]
  }[]
}

export interface ConcursoJsonImport {
  titulo: string
  organizadora: string
  dataInscricao?: string
  dataProva?: string
  linkEdital?: string
  conteudoProgramatico: {
    disciplina: string
    topicos: string[]
  }[]
}
