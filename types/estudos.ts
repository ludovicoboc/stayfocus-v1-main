export interface SessaoEstudo {
  id?: string
  user_id?: string
  competition_id?: string | null
  subject: string
  topic?: string | null
  duration_minutes: number
  completed: boolean
  pomodoro_cycles: number
  notes?: string | null
  started_at?: string
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface SessaoPomodoro {
  id?: string
  user_id?: string
  study_session_id?: string | null
  focus_duration: number
  break_duration: number
  long_break_duration: number
  cycles_completed: number
  current_cycle: number
  is_active: boolean
  started_at?: string | null
  paused_at?: string | null
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

export type PomodoroState = "idle" | "focus" | "break" | "long-break" | "paused"

export interface PomodoroConfig {
  focusDuration: number
  breakDuration: number
  longBreakDuration: number
  cyclesUntilLongBreak: number
}
