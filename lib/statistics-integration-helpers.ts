/**
 * Statistics Integration Helpers
 * Utilities to help existing modules easily integrate with the enhanced statistics system
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { createHistoryTracker } from "@/lib/history-integration"
import type { ModuleType } from "@/types/history"

// =====================================================
// QUICK INTEGRATION FUNCTIONS
// =====================================================

/**
 * Quick function to track any activity with automatic statistics integration
 */
export async function trackActivity(params: {
  userId: string
  module: ModuleType
  activityType: string
  title: string
  description?: string
  score?: number
  duration_minutes?: number
  metadata?: Record<string, any>
  autoGenerateInsights?: boolean
}) {
  try {
    const tracker = createHistoryTracker(params.userId)
    
    // Track in unified history system
    const activity = await tracker.addActivity({
      module: params.module,
      activity_type: params.activityType,
      title: params.title,
      description: params.description,
      score: params.score,
      duration_minutes: params.duration_minutes,
      metadata: params.metadata || {}
    })

    // Auto-generate insights if requested
    if (params.autoGenerateInsights) {
      await generateModuleInsights(params.userId, params.module)
    }

    return activity
  } catch (error) {
    console.error("Error tracking activity:", error)
    throw error
  }
}

/**
 * Quick function to get module statistics for display in components
 */
export async function getQuickModuleStats(userId: string, module: ModuleType) {
  const supabase = createClient()
  
  try {
    // Get recent activities
    const { data: activities, error } = await supabase
      .from("activity_history")
      .select("*")
      .eq("user_id", userId)
      .eq("module", module)
      .order("activity_date", { ascending: false })
      .limit(10)

    if (error) throw error

    if (!activities || activities.length === 0) {
      return {
        total_activities: 0,
        average_performance: 0,
        recent_trend: 'stable' as const,
        current_streak: 0,
        last_activity: null,
        quick_recommendation: `Comece a usar o módulo ${module} para obter insights`
      }
    }

    // Calculate quick stats
    const totalActivities = activities.length
    const scores = activities.map(a => a.score || 0).filter(s => s > 0)
    const averagePerformance = scores.length > 0 
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
      : 0

    // Determine trend (compare first 3 vs last 3)
    let recentTrend: 'improving' | 'stable' | 'declining' = 'stable'
    if (activities.length >= 6) {
      const recent = activities.slice(0, 3)
      const older = activities.slice(3, 6)
      const recentAvg = recent.reduce((sum, a) => sum + (a.score || 0), 0) / 3
      const olderAvg = older.reduce((sum, a) => sum + (a.score || 0), 0) / 3
      
      if (recentAvg > olderAvg + 5) recentTrend = 'improving'
      else if (recentAvg < olderAvg - 5) recentTrend = 'declining'
    }

    // Calculate streak
    const currentStreak = calculateSimpleStreak(activities)

    // Generate quick recommendation
    const quickRecommendation = generateQuickRecommendation(module, averagePerformance, currentStreak, recentTrend)

    return {
      total_activities: totalActivities,
      average_performance: Math.round(averagePerformance * 100) / 100,
      recent_trend: recentTrend,
      current_streak: currentStreak,
      last_activity: activities[0]?.activity_date || null,
      quick_recommendation: quickRecommendation
    }
  } catch (error) {
    console.error("Error getting quick module stats:", error)
    return {
      total_activities: 0,
      average_performance: 0,
      recent_trend: 'stable' as const,
      current_streak: 0,
      last_activity: null,
      quick_recommendation: "Erro ao carregar estatísticas"
    }
  }
}

/**
 * Generate insights for a specific module
 */
export async function generateModuleInsights(userId: string, module: ModuleType) {
  const supabase = createClient()
  
  try {
    // Get module data
    const { data: activities, error } = await supabase
      .from("activity_history")
      .select("*")
      .eq("user_id", userId)
      .eq("module", module)
      .order("activity_date", { ascending: false })
      .limit(50)

    if (error) throw error
    if (!activities || activities.length === 0) return []

    const insights = []

    // Performance insight
    const scores = activities.map(a => a.score || 0).filter(s => s > 0)
    if (scores.length > 0) {
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length
      if (avgScore < 60) {
        insights.push({
          type: 'performance',
          priority: 'high',
          message: `Sua performance média em ${module} está em ${avgScore.toFixed(1)}%. Considere revisar conceitos básicos.`,
          action: 'review_basics'
        })
      } else if (avgScore > 80) {
        insights.push({
          type: 'performance',
          priority: 'positive',
          message: `Excelente performance em ${module}! Você está indo muito bem com ${avgScore.toFixed(1)}% de média.`,
          action: 'maintain_level'
        })
      }
    }

    // Consistency insight
    const recentActivities = activities.filter(a => {
      const activityDate = new Date(a.activity_date)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return activityDate >= weekAgo
    })

    if (recentActivities.length === 0) {
      insights.push({
        type: 'consistency',
        priority: 'medium',
        message: `Você não teve atividades em ${module} na última semana. Que tal retomar hoje?`,
        action: 'resume_activity'
      })
    } else if (recentActivities.length >= 5) {
      insights.push({
        type: 'consistency',
        priority: 'positive',
        message: `Ótima consistência em ${module}! ${recentActivities.length} atividades esta semana.`,
        action: 'keep_momentum'
      })
    }

    // Time-based insight
    const durations = activities.map(a => a.duration_minutes).filter(d => d && d > 0)
    if (durations.length > 0) {
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
      if (avgDuration > 120) {
        insights.push({
          type: 'time_management',
          priority: 'medium',
          message: `Suas sessões em ${module} duram em média ${avgDuration.toFixed(0)} minutos. Considere sessões mais curtas e focadas.`,
          action: 'optimize_time'
        })
      }
    }

    return insights
  } catch (error) {
    console.error("Error generating module insights:", error)
    return []
  }
}

/**
 * Create a statistics widget for any module
 */
export function createModuleStatsWidget(
  moduleStats: any,
  options: {
    showTrend?: boolean
    showRecommendation?: boolean
    compact?: boolean
  } = {}
) {
  const { showTrend = true, showRecommendation = true, compact = false } = options

  return {
    totalActivities: moduleStats.total_activities || 0,
    averagePerformance: moduleStats.average_performance || 0,
    recentTrend: moduleStats.recent_trend || 'stable',
    currentStreak: moduleStats.current_streak || 0,
    lastActivity: moduleStats.last_activity,
    recommendation: showRecommendation ? moduleStats.quick_recommendation : null,
    displayOptions: {
      showTrend,
      showRecommendation,
      compact
    }
  }
}

/**
 * Batch update statistics for multiple modules
 */
export async function batchUpdateModuleStats(userId: string, modules: ModuleType[]) {
  const results = []
  
  for (const moduleType of modules) {
    try {
      const stats = await getQuickModuleStats(userId, moduleType)
      const insights = await generateModuleInsights(userId, moduleType)
      
      results.push({
        module: moduleType,
        stats,
        insights,
        success: true
      })
    } catch (error) {
      results.push({
        module: moduleType,
        stats: null,
        insights: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  return results
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculateSimpleStreak(activities: any[]): number {
  if (activities.length === 0) return 0
  
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
  )
  
  let streak = 0
  const today = new Date()
  
  for (const activity of sortedActivities) {
    const activityDate = new Date(activity.activity_date)
    const daysDiff = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff <= streak + 1) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

function generateQuickRecommendation(
  module: ModuleType, 
  averagePerformance: number, 
  currentStreak: number, 
  recentTrend: string
): string {
  // Performance-based recommendations
  if (averagePerformance === 0) {
    return `Comece sua jornada em ${module} - faça sua primeira atividade hoje!`
  }
  
  if (averagePerformance < 50) {
    return `Foque na qualidade em ${module} - revise conceitos básicos antes de continuar`
  }
  
  if (averagePerformance > 85) {
    return `Excelente trabalho em ${module}! Considere aumentar a dificuldade`
  }
  
  // Streak-based recommendations
  if (currentStreak === 0) {
    return `Retome sua rotina em ${module} - consistência é a chave do sucesso`
  }
  
  if (currentStreak >= 7) {
    return `Incrível sequência de ${currentStreak} dias em ${module}! Continue assim`
  }
  
  // Trend-based recommendations
  if (recentTrend === 'declining') {
    return `Sua performance em ${module} está em declínio - que tal uma revisão?`
  }
  
  if (recentTrend === 'improving') {
    return `Ótima evolução em ${module}! Mantenha o ritmo de melhoria`
  }
  
  // Default recommendations by module
  const moduleRecommendations = {
    estudos: "Varie suas técnicas de estudo para manter o interesse",
    simulados: "Analise seus erros para identificar pontos de melhoria",
    concursos: "Pratique resolução de questões sob pressão de tempo",
    financas: "Revise seus gastos semanalmente para manter controle",
    saude: "Mantenha registros regulares para acompanhar tendências",
    sono: "Estabeleça uma rotina consistente de sono",
    alimentacao: "Planeje suas refeições com antecedência",
    lazer: "Balance atividades ativas e relaxantes",
    hiperfocos: "Use técnicas de time-boxing para gerenciar interesses",
    autoconhecimento: "Dedique tempo regular para reflexão e autoavaliação"
  }
  
  return moduleRecommendations[module] || `Continue praticando regularmente em ${module}`
}

// =====================================================
// INTEGRATION DECORATORS
// =====================================================

/**
 * Decorator function to automatically track activities in existing functions
 */
export function withStatisticsTracking(
  userId: string,
  module: ModuleType,
  activityType: string
) {
  return function<T extends (...args: any[]) => any>(
    target: T,
    options: {
      extractTitle?: (...args: Parameters<T>) => string
      extractScore?: (...args: Parameters<T>) => number | undefined
      extractDuration?: (...args: Parameters<T>) => number | undefined
      extractMetadata?: (...args: Parameters<T>) => Record<string, any>
    } = {}
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        // Execute original function
        const result = await target(...args)
        
        // Track activity
        await trackActivity({
          userId,
          module,
          activityType,
          title: options.extractTitle ? options.extractTitle(...args) : `${activityType} completed`,
          score: options.extractScore ? options.extractScore(...args) : undefined,
          duration_minutes: options.extractDuration ? options.extractDuration(...args) : undefined,
          metadata: options.extractMetadata ? options.extractMetadata(...args) : {}
        })
        
        return result
      } catch (error) {
        console.error("Error in statistics tracking:", error)
        // Don't fail the original function if tracking fails
        return await target(...args)
      }
    }) as T
  }
}

/**
 * React hook for easy statistics integration
 */
export function useModuleStatistics(module: ModuleType, userId?: string) {
  const [stats, setStats] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const refreshStats = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const [moduleStats, moduleInsights] = await Promise.all([
        getQuickModuleStats(userId, module),
        generateModuleInsights(userId, module)
      ])
      
      setStats(moduleStats)
      setInsights(moduleInsights)
    } catch (error) {
      console.error("Error refreshing module statistics:", error)
    } finally {
      setLoading(false)
    }
  }, [userId, module])
  
  const trackModuleActivity = useCallback(async (activityData: {
    activityType: string
    title: string
    description?: string
    score?: number
    duration_minutes?: number
    metadata?: Record<string, any>
  }) => {
    if (!userId) return
    
    try {
      await trackActivity({
        userId,
        module,
        ...activityData,
        autoGenerateInsights: true
      })
      
      // Refresh stats after tracking
      await refreshStats()
    } catch (error) {
      console.error("Error tracking module activity:", error)
    }
  }, [userId, module, refreshStats])
  
  useEffect(() => {
    refreshStats()
  }, [refreshStats])
  
  return {
    stats,
    insights,
    loading,
    refreshStats,
    trackModuleActivity
  }
}

// =====================================================
// EXPORT UTILITIES
// =====================================================

// Export statements removed to avoid duplicate export errors