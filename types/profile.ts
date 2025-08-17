export interface UserPreferences {
  id?: string
  user_id: string
  high_contrast: boolean
  large_text: boolean
  reduced_stimuli: boolean
  created_at?: string
  updated_at?: string
}

export interface UserGoals {
  id?: string
  user_id: string
  sleep_hours: number
  daily_tasks: number
  water_glasses: number
  break_frequency: number
  created_at?: string
  updated_at?: string
}

export interface UserProfile {
  id?: string
  user_id: string
  display_name: string | null
  created_at?: string
  updated_at?: string
}

export interface NovaPreferencia {
  high_contrast: boolean
  large_text: boolean
  reduced_stimuli: boolean
}

export interface NovaMeta {
  sleep_hours: number
  daily_tasks: number
  water_glasses: number
  break_frequency: number
}

export interface NovoProfile {
  display_name: string
}

export interface ExportData {
  preferences: UserPreferences | null
  goals: UserGoals | null
  profile: UserProfile | null
  export_date: string
  version: string
}
