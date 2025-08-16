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

export interface Questao {
  id?: string
  competition_id?: string
  subject_id?: string
  topic_id?: string | null
  question_text: string
  options?: { text: string; isCorrect: boolean }[]
  correct_answer?: string
  explanation?: string
  difficulty?: "facil" | "medio" | "dificil"
  is_ai_generated?: boolean
  created_at?: string
  updated_at?: string
}

export interface Simulado {
  id?: string
  competition_id?: string
  user_id?: string
  title: string
  questions: string[] // Array of question IDs
  results?: {
    score: number
    total: number
    answers: Record<string, string>
    completed_at?: string
  }
  is_favorite: boolean
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
