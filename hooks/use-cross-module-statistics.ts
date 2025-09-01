"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-provider"
import { useSimulationStatistics } from "@/hooks/use-simulation-statistics"
import { useHistory } from "@/hooks/use-history"
import type { ModuleType } from "@/types/history"

export interface CrossModuleStatistics {
  // Overall performance across all modules
  overall_performance: {
    total_activities: number
    average_success_rate: number
    most_active_module: ModuleType
    least_active_module: ModuleType
    consistency_score: number
    improvement_trend: number
  }
  
  // Module-specific insights
  module_insights: Array<{
    module: ModuleType
    activity_count: number
    average_performance: number
    time_spent_hours: number
    improvement_rate: number
    last_activity: string
    performance_category: 'excellent' | 'good' | 'needs_improvement'
    recommendations: string[]
  }>
  
  // Cross-module correlations
  correlations: {
    study_vs_simulation_performance: number
    consistency_across_modules: number
    time_distribution: Record<ModuleType, number>
    peak_performance_hours: string[]
  }
  
  // Comparative analysis
  comparative_analysis: {
    strongest_areas: ModuleType[]
    improvement_areas: ModuleType[]
    balanced_score: number // How balanced performance is across modules
    specialization_index: number // How specialized vs generalist the user is
  }
}

export interface ModuleStatisticsWidget {
  module: ModuleType
  title: string
  current_streak: number
  best_performance: number
  recent_trend: 'improving' | 'stable' | 'declining'
  quick_stats: {
    this_week: number
    this_month: number
    total: number
  }
  next_goal: {
    description: string
    progress: number
    target_date: string
  }
}

export interface UseCrossModuleStatisticsReturn {
  // Data
  crossModuleStats: CrossModuleStatistics | null
  moduleWidgets: ModuleStatisticsWidget[]
  loading: boolean
  error: string | null
  
  // Functions
  generateCrossModuleAnalysis: () => Promise<CrossModuleStatistics>
  getModuleWidget: (module: ModuleType) => Promise<ModuleStatisticsWidget>
  getPerformanceComparison: (modules: ModuleType[]) => Promise<{
    module: ModuleType
    performance: number
    rank: number
  }[]>
  getRecommendationsForModule: (module: ModuleType) => Promise<string[]>
  
  // Integration functions
  updateDashboardStats: () => Promise<void>
  refreshAllModuleStats: () => Promise<void>
  exportCrossModuleReport: () => Promise<string>
  
  // Utility
  clearError: () => void
}

export function useCrossModuleStatistics(): UseCrossModuleStatisticsReturn {
  const { user } = useAuth()
  const supabase = createClient()
  const { statistics: simulationStats } = useSimulationStatistics()
  const { summary: historyStats, getModuleStats } = useHistory()
  
  const [crossModuleStats, setCrossModuleStats] = useState<CrossModuleStatistics | null>(null)
  const [moduleWidgets, setModuleWidgets] = useState<ModuleStatisticsWidget[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // =====================================================
  // CROSS-MODULE ANALYSIS
  // =====================================================
  
  const generateCrossModuleAnalysis = useCallback(async (): Promise<CrossModuleStatistics> => {
    if (!user) throw new Error("User not authenticated")
    
    try {
      setLoading(true)
      setError(null)

      // Get data from all modules
      const [
        simulationData,
        studyData,
        competitionData,
        financeData,
        healthData,
        sleepData,
        nutritionData,
        leisureData,
        focusData,
        selfKnowledgeData
      ] = await Promise.all([
        getModuleActivityData('simulados'),
        getModuleActivityData('estudos'),
        getModuleActivityData('concursos'),
        getModuleActivityData('financas'),
        getModuleActivityData('saude'),
        getModuleActivityData('sono'),
        getModuleActivityData('alimentacao'),
        getModuleActivityData('lazer'),
        getModuleActivityData('hiperfocos'),
        getModuleActivityData('autoconhecimento')
      ])

      const allModuleData = {
        simulados: simulationData,
        estudos: studyData,
        concursos: competitionData,
        financas: financeData,
        saude: healthData,
        sono: sleepData,
        alimentacao: nutritionData,
        lazer: leisureData,
        hiperfocos: focusData,
        autoconhecimento: selfKnowledgeData
      }

      // Calculate overall performance
      const overallPerformance = calculateOverallPerformance(allModuleData)
      
      // Generate module insights
      const moduleInsights = await generateModuleInsights(allModuleData)
      
      // Calculate correlations
      const correlations = calculateCrossModuleCorrelations(allModuleData)
      
      // Perform comparative analysis
      const comparativeAnalysis = performComparativeAnalysis(allModuleData)

      const crossModuleAnalysis: CrossModuleStatistics = {
        overall_performance: overallPerformance,
        module_insights: moduleInsights,
        correlations,
        comparative_analysis: comparativeAnalysis
      }

      setCrossModuleStats(crossModuleAnalysis)
      return crossModuleAnalysis
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate cross-module analysis"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // =====================================================
  // MODULE WIDGET GENERATION
  // =====================================================
  
  const getModuleWidget = useCallback(async (module: ModuleType): Promise<ModuleStatisticsWidget> => {
    const moduleData = await getModuleActivityData(module)
    const moduleStats = await getModuleStats(module)
    
    if (!moduleData || moduleData.length === 0) {
      return {
        module,
        title: getModuleTitle(module),
        current_streak: 0,
        best_performance: 0,
        recent_trend: 'stable',
        quick_stats: { this_week: 0, this_month: 0, total: 0 },
        next_goal: {
          description: `Comece a usar o módulo ${getModuleTitle(module)}`,
          progress: 0,
          target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      }
    }

    // Calculate streak
    const currentStreak = calculateModuleStreak(moduleData)
    
    // Get best performance
    const bestPerformance = Math.max(...moduleData.map(d => d.score || d.success_rate || 0))
    
    // Determine trend
    const recentTrend = determineRecentTrend(moduleData)
    
    // Calculate quick stats
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const thisWeek = moduleData.filter(d => new Date(d.activity_date) >= weekAgo).length
    const thisMonth = moduleData.filter(d => new Date(d.activity_date) >= monthAgo).length
    const total = moduleData.length
    
    // Generate next goal
    const nextGoal = generateNextGoalForModule(module, moduleData, moduleStats)

    return {
      module,
      title: getModuleTitle(module),
      current_streak: currentStreak,
      best_performance: bestPerformance,
      recent_trend: recentTrend,
      quick_stats: { this_week: thisWeek, this_month: thisMonth, total },
      next_goal: nextGoal
    }
  }, [getModuleStats])

  // =====================================================
  // PERFORMANCE COMPARISON
  // =====================================================
  
  const getPerformanceComparison = useCallback(async (modules: ModuleType[]) => {
    const modulePerformances = await Promise.all(
      modules.map(async (module) => {
        const stats = await getModuleStats(module)
        return {
          module,
          performance: stats?.avg_performance || 0,
          rank: 0 // Will be calculated after sorting
        }
      })
    )

    // Sort by performance and assign ranks
    const sortedPerformances = modulePerformances
      .sort((a, b) => b.performance - a.performance)
      .map((item, index) => ({ ...item, rank: index + 1 }))

    return sortedPerformances
  }, [getModuleStats])

  // =====================================================
  // RECOMMENDATIONS
  // =====================================================
  
  const getRecommendationsForModule = useCallback(async (module: ModuleType): Promise<string[]> => {
    const moduleData = await getModuleActivityData(module)
    const moduleStats = await getModuleStats(module)
    
    if (!moduleData || moduleData.length === 0) {
      return [
        `Comece a usar o módulo ${getModuleTitle(module)} para obter insights personalizados`,
        "Defina uma meta inicial pequena e alcançável",
        "Estabeleça uma rotina regular de uso"
      ]
    }

    const recommendations: string[] = []
    
    // Performance-based recommendations
    if (moduleStats && moduleStats.avg_performance < 60) {
      recommendations.push("Foque em melhorar a qualidade das atividades antes da quantidade")
      recommendations.push("Considere revisar conceitos básicos desta área")
    }
    
    // Consistency-based recommendations
    if (moduleStats && moduleStats.streak < 3) {
      recommendations.push("Tente manter uma rotina mais consistente")
      recommendations.push("Defina lembretes para não esquecer das atividades")
    }
    
    // Time-based recommendations
    const recentActivity = moduleData.filter(d => {
      const activityDate = new Date(d.activity_date)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return activityDate >= weekAgo
    })
    
    if (recentActivity.length === 0) {
      recommendations.push("Você não teve atividades recentes - que tal retomar hoje?")
    }
    
    // Module-specific recommendations
    const moduleSpecificRecs = getModuleSpecificRecommendations(module, moduleData, moduleStats)
    recommendations.push(...moduleSpecificRecs)
    
    return recommendations.slice(0, 5) // Limit to 5 recommendations
  }, [getModuleStats])

  // =====================================================
  // INTEGRATION FUNCTIONS
  // =====================================================
  
  const updateDashboardStats = useCallback(async () => {
    try {
      // Generate widgets for all active modules
      const allModules: ModuleType[] = [
        'estudos', 'simulados', 'financas', 'saude', 'sono', 
        'alimentacao', 'lazer', 'hiperfocos', 'autoconhecimento'
      ]
      
      const widgets = await Promise.all(
        allModules.map(module => getModuleWidget(module))
      )
      
      setModuleWidgets(widgets)
    } catch (error) {
      console.error("Error updating dashboard stats:", error)
    }
  }, [getModuleWidget])

  const refreshAllModuleStats = useCallback(async () => {
    await Promise.all([
      generateCrossModuleAnalysis(),
      updateDashboardStats()
    ])
  }, [generateCrossModuleAnalysis, updateDashboardStats])

  const exportCrossModuleReport = useCallback(async (): Promise<string> => {
    if (!crossModuleStats) {
      throw new Error("No statistics available to export")
    }

    const report = {
      generated_at: new Date().toISOString(),
      user_id: user?.id,
      overall_performance: crossModuleStats.overall_performance,
      module_insights: crossModuleStats.module_insights,
      correlations: crossModuleStats.correlations,
      comparative_analysis: crossModuleStats.comparative_analysis,
      module_widgets: moduleWidgets
    }

    return JSON.stringify(report, null, 2)
  }, [crossModuleStats, moduleWidgets, user])

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================
  
  const getModuleActivityData = async (module: ModuleType) => {
    try {
      const { data, error } = await supabase
        .from("activity_history")
        .select("*")
        .eq("user_id", user?.id)
        .eq("module", module)
        .order("activity_date", { ascending: false })
        .limit(100)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error(`Error fetching ${module} data:`, error)
      return []
    }
  }

  const calculateOverallPerformance = (allModuleData: Record<ModuleType, any[]>) => {
    const allActivities = Object.values(allModuleData).flat()
    
    if (allActivities.length === 0) {
      return {
        total_activities: 0,
        average_success_rate: 0,
        most_active_module: 'estudos' as ModuleType,
        least_active_module: 'estudos' as ModuleType,
        consistency_score: 0,
        improvement_trend: 0
      }
    }

    const totalActivities = allActivities.length
    const successRates = allActivities.map(a => a.score || a.success_rate || 0).filter(s => s > 0)
    const averageSuccessRate = successRates.length > 0 
      ? successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length 
      : 0

    // Find most and least active modules
    const moduleCounts = Object.entries(allModuleData).map(([module, data]) => ({
      module: module as ModuleType,
      count: data.length
    }))
    
    const sortedModules = moduleCounts.sort((a, b) => b.count - a.count)
    const mostActiveModule = sortedModules[0]?.module || 'estudos'
    const leastActiveModule = sortedModules[sortedModules.length - 1]?.module || 'estudos'

    // Calculate consistency (how evenly distributed activities are across modules)
    const totalCount = moduleCounts.reduce((sum, m) => sum + m.count, 0)
    const expectedPerModule = totalCount / moduleCounts.length
    const variance = moduleCounts.reduce((sum, m) => sum + Math.pow(m.count - expectedPerModule, 2), 0) / moduleCounts.length
    const consistencyScore = Math.max(0, 100 - (Math.sqrt(variance) / expectedPerModule) * 100)

    // Calculate improvement trend (simplified)
    const recentActivities = allActivities.slice(0, 20)
    const olderActivities = allActivities.slice(-20)
    const recentAvg = recentActivities.reduce((sum, a) => sum + (a.score || a.success_rate || 0), 0) / recentActivities.length
    const olderAvg = olderActivities.reduce((sum, a) => sum + (a.score || a.success_rate || 0), 0) / olderActivities.length
    const improvementTrend = recentAvg - olderAvg

    return {
      total_activities: totalActivities,
      average_success_rate: Math.round(averageSuccessRate * 100) / 100,
      most_active_module: mostActiveModule,
      least_active_module: leastActiveModule,
      consistency_score: Math.round(consistencyScore * 100) / 100,
      improvement_trend: Math.round(improvementTrend * 100) / 100
    }
  }

  const generateModuleInsights = async (allModuleData: Record<ModuleType, any[]>) => {
    const insights = []
    
    for (const [module, data] of Object.entries(allModuleData)) {
      if (data.length === 0) continue
      
      const performances = data.map(d => d.score || d.success_rate || 0).filter(p => p > 0)
      const averagePerformance = performances.length > 0 
        ? performances.reduce((sum, p) => sum + p, 0) / performances.length 
        : 0
      
      const timeSpent = data.reduce((sum, d) => sum + (d.duration_minutes || 0), 0) / 60 // Convert to hours
      
      // Calculate improvement rate
      const improvementRate = data.length > 1 
        ? (performances[0] || 0) - (performances[performances.length - 1] || 0) 
        : 0
      
      const lastActivity = data[0]?.activity_date || new Date().toISOString().split('T')[0]
      
      // Determine performance category
      let performanceCategory: 'excellent' | 'good' | 'needs_improvement' = 'needs_improvement'
      if (averagePerformance >= 80) performanceCategory = 'excellent'
      else if (averagePerformance >= 60) performanceCategory = 'good'
      
      // Generate recommendations
      const recommendations = await getRecommendationsForModule(module as ModuleType)
      
      insights.push({
        module: module as ModuleType,
        activity_count: data.length,
        average_performance: Math.round(averagePerformance * 100) / 100,
        time_spent_hours: Math.round(timeSpent * 100) / 100,
        improvement_rate: Math.round(improvementRate * 100) / 100,
        last_activity: lastActivity,
        performance_category: performanceCategory,
        recommendations: recommendations.slice(0, 3)
      })
    }
    
    return insights.sort((a, b) => b.activity_count - a.activity_count)
  }

  const calculateCrossModuleCorrelations = (allModuleData: Record<ModuleType, any[]>) => {
    // Simplified correlation calculations
    const studyData = allModuleData.estudos || []
    const simulationData = allModuleData.simulados || []
    
    // Study vs Simulation correlation (simplified)
    let studyVsSimulationCorrelation = 0
    if (studyData.length > 0 && simulationData.length > 0) {
      const studyAvg = studyData.reduce((sum, d) => sum + (d.score || 0), 0) / studyData.length
      const simAvg = simulationData.reduce((sum, d) => sum + (d.score || 0), 0) / simulationData.length
      studyVsSimulationCorrelation = Math.min(studyAvg, simAvg) / Math.max(studyAvg, simAvg) * 100
    }
    
    // Consistency across modules
    const moduleConsistencies = Object.values(allModuleData).map(data => {
      if (data.length < 2) return 100
      const scores = data.map(d => d.score || d.success_rate || 0)
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length
      return Math.max(0, 100 - Math.sqrt(variance))
    })
    const consistencyAcrossModules = moduleConsistencies.reduce((sum, c) => sum + c, 0) / moduleConsistencies.length
    
    // Time distribution
    const timeDistribution: Record<ModuleType, number> = {} as Record<ModuleType, number>
    const totalTime = Object.values(allModuleData).flat().reduce((sum, d) => sum + (d.duration_minutes || 0), 0)
    
    for (const [module, data] of Object.entries(allModuleData)) {
      const moduleTime = data.reduce((sum, d) => sum + (d.duration_minutes || 0), 0)
      timeDistribution[module as ModuleType] = totalTime > 0 ? (moduleTime / totalTime) * 100 : 0
    }
    
    // Peak performance hours (simplified)
    const peakPerformanceHours = ["09:00", "14:00", "20:00"] // Placeholder
    
    return {
      study_vs_simulation_performance: Math.round(studyVsSimulationCorrelation * 100) / 100,
      consistency_across_modules: Math.round(consistencyAcrossModules * 100) / 100,
      time_distribution: timeDistribution,
      peak_performance_hours: peakPerformanceHours
    }
  }

  const performComparativeAnalysis = (allModuleData: Record<ModuleType, any[]>) => {
    const modulePerformances = Object.entries(allModuleData).map(([module, data]) => {
      const performances = data.map(d => d.score || d.success_rate || 0).filter(p => p > 0)
      const avgPerformance = performances.length > 0 
        ? performances.reduce((sum, p) => sum + p, 0) / performances.length 
        : 0
      return { module: module as ModuleType, performance: avgPerformance }
    }).filter(m => m.performance > 0)
    
    const sortedModules = modulePerformances.sort((a, b) => b.performance - a.performance)
    
    const strongestAreas = sortedModules.slice(0, 3).map(m => m.module)
    const improvementAreas = sortedModules.slice(-3).map(m => m.module)
    
    // Balanced score (how evenly distributed performance is)
    const avgPerformance = sortedModules.reduce((sum, m) => sum + m.performance, 0) / sortedModules.length
    const variance = sortedModules.reduce((sum, m) => sum + Math.pow(m.performance - avgPerformance, 2), 0) / sortedModules.length
    const balancedScore = Math.max(0, 100 - Math.sqrt(variance))
    
    // Specialization index (higher = more specialized, lower = more generalist)
    const maxPerformance = Math.max(...sortedModules.map(m => m.performance))
    const minPerformance = Math.min(...sortedModules.map(m => m.performance))
    const specializationIndex = maxPerformance > 0 ? ((maxPerformance - minPerformance) / maxPerformance) * 100 : 0
    
    return {
      strongest_areas: strongestAreas,
      improvement_areas: improvementAreas,
      balanced_score: Math.round(balancedScore * 100) / 100,
      specialization_index: Math.round(specializationIndex * 100) / 100
    }
  }

  // Additional helper functions
  const getModuleTitle = (module: ModuleType): string => {
    const titles = {
      estudos: "Estudos",
      simulados: "Simulados",
      concursos: "Concursos",
      financas: "Finanças",
      saude: "Saúde",
      sono: "Sono",
      alimentacao: "Alimentação",
      lazer: "Lazer",
      hiperfocos: "Hiperfocos",
      autoconhecimento: "Autoconhecimento"
    }
    return titles[module] || module
  }

  const calculateModuleStreak = (moduleData: any[]): number => {
    if (moduleData.length === 0) return 0
    
    const sortedData = [...moduleData].sort((a, b) => 
      new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
    )
    
    let streak = 0
    const today = new Date()
    
    for (const activity of sortedData) {
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

  const determineRecentTrend = (moduleData: any[]): 'improving' | 'stable' | 'declining' => {
    if (moduleData.length < 4) return 'stable'
    
    const recent = moduleData.slice(0, 2)
    const older = moduleData.slice(2, 4)
    
    const recentAvg = recent.reduce((sum, d) => sum + (d.score || d.success_rate || 0), 0) / recent.length
    const olderAvg = older.reduce((sum, d) => sum + (d.score || d.success_rate || 0), 0) / older.length
    
    const diff = recentAvg - olderAvg
    
    if (diff > 5) return 'improving'
    if (diff < -5) return 'declining'
    return 'stable'
  }

  const generateNextGoalForModule = (module: ModuleType, moduleData: any[], moduleStats: any) => {
    const recentPerformance = moduleData.slice(0, 5).reduce((sum, d) => sum + (d.score || d.success_rate || 0), 0) / Math.min(5, moduleData.length)
    
    let description = ""
    let progress = 0
    let targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    if (moduleData.length === 0) {
      description = `Faça sua primeira atividade em ${getModuleTitle(module)}`
      progress = 0
    } else if (recentPerformance < 60) {
      description = `Melhore sua performance para 70% em ${getModuleTitle(module)}`
      progress = (recentPerformance / 70) * 100
    } else {
      description = `Mantenha consistência de 5 dias em ${getModuleTitle(module)}`
      progress = (moduleStats?.streak || 0) / 5 * 100
      targetDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
    
    return {
      description,
      progress: Math.min(100, Math.max(0, progress)),
      target_date: targetDate
    }
  }

  const getModuleSpecificRecommendations = (module: ModuleType, moduleData: any[], moduleStats: any): string[] => {
    const recommendations: string[] = []
    
    switch (module) {
      case 'estudos':
        recommendations.push("Use a técnica Pomodoro para melhor foco")
        recommendations.push("Varie entre diferentes matérias para manter o interesse")
        break
      case 'simulados':
        recommendations.push("Analise seus erros para identificar pontos fracos")
        recommendations.push("Pratique questões de diferentes níveis de dificuldade")
        break
      case 'financas':
        recommendations.push("Categorize seus gastos para melhor controle")
        recommendations.push("Defina metas de economia mensais")
        break
      case 'saude':
        recommendations.push("Mantenha regularidade nos registros de saúde")
        recommendations.push("Monitore tendências ao longo do tempo")
        break
      default:
        recommendations.push("Mantenha uma rotina consistente")
        recommendations.push("Defina metas pequenas e alcançáveis")
    }
    
    return recommendations
  }

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // =====================================================
  // EFFECTS
  // =====================================================
  
  useEffect(() => {
    if (user) {
      updateDashboardStats()
    }
  }, [user, updateDashboardStats])

  // =====================================================
  // RETURN
  // =====================================================
  
  return {
    // Data
    crossModuleStats,
    moduleWidgets,
    loading,
    error,
    
    // Functions
    generateCrossModuleAnalysis,
    getModuleWidget,
    getPerformanceComparison,
    getRecommendationsForModule,
    
    // Integration functions
    updateDashboardStats,
    refreshAllModuleStats,
    exportCrossModuleReport,
    
    // Utility
    clearError
  }
}