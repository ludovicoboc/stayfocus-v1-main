export interface HiperfocoProject {
  id?: string
  user_id?: string
  title: string
  description?: string
  color: string
  time_limit?: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface HiperfocoTask {
  id?: string
  project_id: string
  title: string
  description?: string
  completed: boolean
  order_index: number
  created_at?: string
  updated_at?: string
}

export interface HiperfocoSession {
  id?: string
  user_id?: string
  project_id?: string | null
  duration_minutes: number
  completed: boolean
  started_at?: string
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface AlternationSession {
  id?: string
  user_id?: string
  title: string
  projects: string[] // Array of project IDs
  current_project_index: number
  session_duration: number
  is_active: boolean
  started_at?: string | null
  paused_at?: string | null
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

export type HiperfocoTab = "conversor" | "alternancia" | "estrutura" | "temporizador"

export interface ProjectWithTasks extends HiperfocoProject {
  tasks?: HiperfocoTask[]
}
