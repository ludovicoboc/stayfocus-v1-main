/**
 * History Integration Utilities
 * Helper functions to integrate the unified history system with existing modules
 */

import { createClient } from "@/lib/supabase"
import type { 
  ModuleType, 
  CreateActivityInput, 
  ActivityHistory,
  ACTIVITY_TYPES 
} from "@/types/history"

// =====================================================
// ACTIVITY CREATION HELPERS
// =====================================================

/**
 * Quick activity creation for common scenarios
 */
export class HistoryTracker {
  private supabase = createClient()
  private userId: string | null = null

  constructor(userId?: string) {
    this.userId = userId || null
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  async addActivity(input: CreateActivityInput): Promise<ActivityHistory | null> {
    if (!this.userId) {
      console.warn("HistoryTracker: User ID not set")
      return null
    }

    try {
      const activityData = {
        user_id: this.userId,
        module: input.module,
        activity_type: input.activity_type,
        activity_subtype: input.activity_subtype,
        title: input.title,
        description: input.description,
        metadata: input.metadata || {},
        score: input.score,
        percentage: input.percentage,
        duration_minutes: input.duration_minutes,
        success_rate: input.success_rate,
        category: input.category,
        tags: input.tags || [],
        difficulty: input.difficulty,
        activity_date: input.activity_date || new Date().toISOString().split('T')[0],
        started_at: input.started_at,
        completed_at: input.completed_at || new Date().toISOString(),
        is_favorite: input.is_favorite || false,
        is_milestone: input.is_milestone || false,
        status: 'completed' as const
      }

      const { data, error } = await this.supabase
        .from("activity_history")
        .insert(activityData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error adding activity to history:", error)
      return null
    }
  }

  // =====================================================
  // ESTUDOS MODULE
  // =====================================================

  async trackStudySession(params: {
    disciplina: string
    topico?: string
    duration_minutes: number
    notes?: string
    pomodoro_cycles?: number
    difficulty?: 'facil' | 'medio' | 'dificil'
    competition_id?: string
  }) {
    return this.addActivity({
      module: 'estudos',
      activity_type: 'study_session',
      title: `Sessão de Estudo: ${params.disciplina}`,
      description: params.topico ? `Tópico: ${params.topico}` : undefined,
      duration_minutes: params.duration_minutes,
      category: params.disciplina,
      tags: params.topico ? [params.topico] : [],
      difficulty: params.difficulty,
      metadata: {
        disciplina: params.disciplina,
        topico: params.topico,
        notes: params.notes,
        pomodoro_cycles: params.pomodoro_cycles,
        competition_id: params.competition_id
      }
    })
  }

  async trackPomodoroSession(params: {
    focus_duration: number
    break_duration: number
    cycles_completed: number
    task?: string
  }) {
    return this.addActivity({
      module: 'estudos',
      activity_type: 'pomodoro_completed',
      title: `Pomodoro: ${params.cycles_completed} ciclo(s)`,
      description: params.task,
      duration_minutes: params.focus_duration,
      metadata: {
        focus_duration: params.focus_duration,
        break_duration: params.break_duration,
        cycles_completed: params.cycles_completed,
        task: params.task
      }
    })
  }

  // =====================================================
  // SIMULADOS MODULE
  // =====================================================

  async trackSimulationCompletion(params: {
    simulation_title: string
    score: number
    total_questions: number
    duration_minutes?: number
    subject?: string
    difficulty?: 'facil' | 'medio' | 'dificil'
    simulation_id?: string
    answers?: Record<string, string>
  }) {
    const percentage = (params.score / params.total_questions) * 100
    
    return this.addActivity({
      module: 'simulados',
      activity_type: 'simulation_completed',
      title: params.simulation_title,
      description: `${params.score}/${params.total_questions} questões corretas`,
      score: params.score, // Raw score (number of correct answers)
      percentage: percentage, // Calculated percentage (0-100)
      duration_minutes: params.duration_minutes,
      category: params.subject,
      difficulty: params.difficulty,
      is_milestone: percentage >= 90, // Auto-mark high scores as milestones
      metadata: {
        simulation_id: params.simulation_id,
        score: params.score,
        total_questions: params.total_questions,
        percentage,
        answers: params.answers
      }
    })
  }

  // =====================================================
  // FINANCAS MODULE
  // =====================================================

  async trackExpense(params: {
    amount: number
    category: string
    description?: string
    payment_method?: string
  }) {
    return this.addActivity({
      module: 'financas',
      activity_type: 'expense_added',
      title: `Despesa: ${params.category}`,
      description: params.description,
      category: params.category,
      metadata: {
        amount: params.amount,
        payment_method: params.payment_method,
        type: 'expense'
      }
    })
  }

  async trackIncome(params: {
    amount: number
    source: string
    description?: string
  }) {
    return this.addActivity({
      module: 'financas',
      activity_type: 'income_added',
      title: `Receita: ${params.source}`,
      description: params.description,
      category: params.source,
      metadata: {
        amount: params.amount,
        source: params.source,
        type: 'income'
      }
    })
  }

  // =====================================================
  // SAUDE MODULE
  // =====================================================

  async trackMedicationTaken(params: {
    medication_name: string
    dosage: string
    time_taken?: string
  }) {
    return this.addActivity({
      module: 'saude',
      activity_type: 'medication_taken',
      title: `Medicamento: ${params.medication_name}`,
      description: `Dosagem: ${params.dosage}`,
      category: 'medicamentos',
      metadata: {
        medication_name: params.medication_name,
        dosage: params.dosage,
        time_taken: params.time_taken || new Date().toISOString()
      }
    })
  }

  async trackMoodLog(params: {
    mood_level: number // 1-10
    notes?: string
    symptoms?: string[]
  }) {
    return this.addActivity({
      module: 'saude',
      activity_type: 'mood_logged',
      title: `Humor registrado: ${params.mood_level}/10`,
      description: params.notes,
      score: params.mood_level * 10, // Convert to percentage
      category: 'humor',
      tags: params.symptoms,
      metadata: {
        mood_level: params.mood_level,
        symptoms: params.symptoms
      }
    })
  }

  // =====================================================
  // SONO MODULE
  // =====================================================

  async trackSleepLog(params: {
    bedtime: string
    wake_time: string
    sleep_quality: number // 1-10
    duration_hours: number
    notes?: string
  }) {
    return this.addActivity({
      module: 'sono',
      activity_type: 'sleep_logged',
      title: `Sono: ${params.duration_hours.toFixed(1)}h`,
      description: params.notes,
      score: params.sleep_quality * 10,
      duration_minutes: Math.round(params.duration_hours * 60),
      category: 'registro_sono',
      metadata: {
        bedtime: params.bedtime,
        wake_time: params.wake_time,
        sleep_quality: params.sleep_quality,
        duration_hours: params.duration_hours
      }
    })
  }

  // =====================================================
  // ALIMENTACAO MODULE
  // =====================================================

  async trackMealLog(params: {
    meal_type: 'cafe_manha' | 'almoco' | 'jantar' | 'lanche'
    foods: string[]
    calories?: number
    notes?: string
  }) {
    return this.addActivity({
      module: 'alimentacao',
      activity_type: 'meal_logged',
      title: `Refeição: ${params.meal_type}`,
      description: params.foods.join(', '),
      category: params.meal_type,
      tags: params.foods,
      metadata: {
        meal_type: params.meal_type,
        foods: params.foods,
        calories: params.calories,
        notes: params.notes
      }
    })
  }

  // =====================================================
  // LAZER MODULE
  // =====================================================

  async trackLeisureActivity(params: {
    activity_name: string
    duration_minutes: number
    enjoyment_level?: number // 1-10
    category?: string
    with_others?: boolean
  }) {
    return this.addActivity({
      module: 'lazer',
      activity_type: 'activity_completed',
      title: params.activity_name,
      duration_minutes: params.duration_minutes,
      score: params.enjoyment_level ? params.enjoyment_level * 10 : undefined,
      category: params.category || 'lazer',
      metadata: {
        enjoyment_level: params.enjoyment_level,
        with_others: params.with_others
      }
    })
  }

  // =====================================================
  // HIPERFOCOS MODULE
  // =====================================================

  async trackFocusSession(params: {
    interest_topic: string
    duration_minutes: number
    productivity_level?: number // 1-10
    notes?: string
    resources_used?: string[]
  }) {
    return this.addActivity({
      module: 'hiperfocos',
      activity_type: 'focus_session',
      title: `Hiperfoco: ${params.interest_topic}`,
      description: params.notes,
      duration_minutes: params.duration_minutes,
      score: params.productivity_level ? params.productivity_level * 10 : undefined,
      category: params.interest_topic,
      tags: params.resources_used,
      metadata: {
        interest_topic: params.interest_topic,
        productivity_level: params.productivity_level,
        resources_used: params.resources_used
      }
    })
  }

  // =====================================================
  // AUTOCONHECIMENTO MODULE
  // =====================================================

  async trackReflection(params: {
    reflection_type: 'journal' | 'assessment' | 'goal_setting' | 'insight'
    title: string
    content?: string
    insights?: string[]
    mood_before?: number
    mood_after?: number
  }) {
    return this.addActivity({
      module: 'autoconhecimento',
      activity_type: 'reflection_completed',
      title: params.title,
      description: params.content,
      category: params.reflection_type,
      tags: params.insights,
      metadata: {
        reflection_type: params.reflection_type,
        insights: params.insights,
        mood_before: params.mood_before,
        mood_after: params.mood_after
      }
    })
  }
}

// =====================================================
// INTEGRATION HELPERS
// =====================================================

/**
 * Create a history tracker instance for a specific user
 */
export function createHistoryTracker(userId: string): HistoryTracker {
  return new HistoryTracker(userId)
}

/**
 * Batch add multiple activities (useful for data migration)
 */
export async function batchAddActivities(
  userId: string, 
  activities: CreateActivityInput[]
): Promise<ActivityHistory[]> {
  const supabase = createClient()
  const results: ActivityHistory[] = []

  for (const activity of activities) {
    try {
      const activityData = {
        user_id: userId,
        ...activity,
        metadata: activity.metadata || {},
        tags: activity.tags || [],
        activity_date: activity.activity_date || new Date().toISOString().split('T')[0],
        completed_at: activity.completed_at || new Date().toISOString(),
        is_favorite: activity.is_favorite || false,
        is_milestone: activity.is_milestone || false,
        status: 'completed' as const
      }

      const { data, error } = await supabase
        .from("activity_history")
        .insert(activityData)
        .select()
        .single()

      if (error) throw error
      results.push(data)
    } catch (error) {
      console.error("Error adding activity:", error)
    }
  }

  return results
}

/**
 * Migrate existing simulation history to new format
 */
export async function migrateSimulationHistory(userId: string): Promise<void> {
  const supabase = createClient()
  
  try {
    // Get existing simulation history
    const { data: oldHistory, error } = await supabase
      .from("simulation_history")
      .select("*")
      .eq("user_id", userId)

    if (error) throw error

    const tracker = createHistoryTracker(userId)

    // Convert to new format
    for (const record of oldHistory || []) {
      await tracker.trackSimulationCompletion({
        simulation_title: `Simulado #${record.id.slice(-8)}`,
        score: record.score,
        total_questions: record.total_questions,
        duration_minutes: record.time_taken_minutes,
        simulation_id: record.simulation_id,
        answers: record.answers
      })
    }

    console.log(`Migrated ${oldHistory?.length || 0} simulation records`)
  } catch (error) {
    console.error("Error migrating simulation history:", error)
  }
}

/**
 * Get activity statistics for a module
 */
export async function getModuleActivityStats(
  userId: string, 
  module: ModuleType, 
  daysBack = 30
) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc("get_user_activity_summary", {
      p_user_id: userId,
      p_module: module,
      p_days_back: daysBack
    })

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error("Error getting module stats:", error)
    return null
  }
}

/**
 * Export user history data
 */
export async function exportUserHistory(
  userId: string, 
  modules?: ModuleType[],
  dateFrom?: string,
  dateTo?: string
): Promise<ActivityHistory[]> {
  const supabase = createClient()
  
  try {
    let query = supabase
      .from("activity_history")
      .select("*")
      .eq("user_id", userId)
      .order("activity_date", { ascending: false })

    if (modules?.length) {
      query = query.in("module", modules)
    }

    if (dateFrom) {
      query = query.gte("activity_date", dateFrom)
    }

    if (dateTo) {
      query = query.lte("activity_date", dateTo)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error exporting history:", error)
    return []
  }
}