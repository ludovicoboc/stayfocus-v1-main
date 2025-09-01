"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-provider"
import type { SimuladoResultado } from "@/types/simulados"

export interface PerformanceMetrics {
  total_attempts: number
  total_time_hours: number
  average_score: number
  average_percentage: number
  best_score: number
  best_percentage: number
  worst_score: number
  worst_percentage: number
  median_percentage: number
  standard_deviation: number
  improvement_rate: number // % improvement over time
  consistency_score: number // How consistent performance is (0-100)
}

export interface PerformanceTrend {
  period: string // Date or period identifier
  attempts: number
  average_percentage: number
  best_percentage: number
  total_time_minutes: number
  improvement_from_previous: number
}

export interface SubjectAnalysis {
  subject: string
  attempts: number
  average_percentage: number
  best_percentage: number
  worst_percentage: number
  improvement_trend: number
  difficulty_rating: number // Based on average performance
  time_efficiency: number // Questions per minute
  mastery_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface TimeAnalysis {
  optimal_time_range: {
    min_minutes: number
    max_minutes: number
    average_percentage_in_range: number
  }
  time_vs_performance: Array<{
    time_bucket: string
    average_percentage: number
    attempts: number
  }>
  speed_analysis: {
    average_seconds_per_question: number
    fastest_completion: number
    slowest_completion: number
    optimal_pace: number
  }
}

export interface StreakAnalysis {
  current_streak: number
  longest_streak: number
  streak_threshold: number // Minimum percentage to maintain streak
  streak_history: Array<{
    start_date: string
    end_date: string
    length: number
    average_percentage: number
  }>
}

export interface PredictiveInsights {
  next_score_prediction: {
    predicted_percentage: number
    confidence_level: number
    factors: string[]
  }
  improvement_suggestions: Array<{
    area: string
    suggestion: string
    potential_improvement: number
    priority: 'high' | 'medium' | 'low'
  }>
  goal_recommendations: Array<{
    goal_type: string
    target_value: number
    timeframe_days: number
    achievability: number // 0-100
  }>
}

export interface ComprehensiveStatistics {
  performance_metrics: PerformanceMetrics
  trends: {
    daily: PerformanceTrend[]
    weekly: PerformanceTrend[]
    monthly: PerformanceTrend[]
  }
  subject_analysis: SubjectAnalysis[]
  time_analysis: TimeAnalysis
  streak_analysis: StreakAnalysis
  predictive_insights: PredictiveInsights
  comparative_analysis: {
    percentile_rank: number // Where user stands compared to others
    peer_comparison: {
      above_average_areas: string[]
      below_average_areas: string[]
    }
  }
}

export interface UseSimulationStatisticsReturn {
  statistics: ComprehensiveStatistics | null
  loading: boolean
  error: string | null
  
  // Core functions
  generateStatistics: (options?: {
    date_from?: string
    date_to?: string
    simulation_ids?: string[]
  }) => Promise<ComprehensiveStatistics>
  
  // Specific analytics
  getPerformanceMetrics: () => Promise<PerformanceMetrics>
  getTrendAnalysis: (period: 'daily' | 'weekly' | 'monthly') => Promise<PerformanceTrend[]>
  getSubjectAnalysis: () => Promise<SubjectAnalysis[]>
  getTimeAnalysis: () => Promise<TimeAnalysis>
  getStreakAnalysis: () => Promise<StreakAnalysis>
  getPredictiveInsights: () => Promise<PredictiveInsights>
  
  // Utility functions
  exportStatistics: (format: 'json' | 'csv') => Promise<string>
  refreshStatistics: () => Promise<void>
  clearError: () => void
}

export function useSimulationStatistics(): UseSimulationStatisticsReturn {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [statistics, setStatistics] = useState<ComprehensiveStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // =====================================================
  // CORE STATISTICS GENERATION
  // =====================================================
  
  const generateStatistics = useCallback(async (options?: {
    date_from?: string
    date_to?: string
    simulation_ids?: string[]
  }): Promise<ComprehensiveStatistics> => {
    if (!user) throw new Error("User not authenticated")
    
    try {
      setLoading(true)
      setError(null)

      // Fetch raw data
      let query = supabase
        .from("simulation_history")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: true })

      if (options?.date_from) {
        query = query.gte("completed_at", options.date_from)
      }
      if (options?.date_to) {
        query = query.lte("completed_at", options.date_to)
      }
      if (options?.simulation_ids?.length) {
        query = query.in("simulation_id", options.simulation_ids)
      }

      const { data: rawData, error: fetchError } = await query

      if (fetchError) throw fetchError
      if (!rawData || rawData.length === 0) {
        throw new Error("No data available for analysis")
      }

      // Generate comprehensive statistics
      const [
        performanceMetrics,
        trends,
        subjectAnalysis,
        timeAnalysis,
        streakAnalysis,
        predictiveInsights
      ] = await Promise.all([
        calculatePerformanceMetrics(rawData),
        calculateTrends(rawData),
        calculateSubjectAnalysis(rawData),
        calculateTimeAnalysis(rawData),
        calculateStreakAnalysis(rawData),
        calculatePredictiveInsights(rawData)
      ])

      const comprehensiveStats: ComprehensiveStatistics = {
        performance_metrics: performanceMetrics,
        trends,
        subject_analysis: subjectAnalysis,
        time_analysis: timeAnalysis,
        streak_analysis: streakAnalysis,
        predictive_insights: predictiveInsights,
        comparative_analysis: {
          percentile_rank: 0, // Would need global data to calculate
          peer_comparison: {
            above_average_areas: [],
            below_average_areas: []
          }
        }
      }

      setStatistics(comprehensiveStats)
      return comprehensiveStats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate statistics"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // =====================================================
  // PERFORMANCE METRICS CALCULATION
  // =====================================================
  
  const calculatePerformanceMetrics = useCallback(async (data: SimuladoResultado[]): Promise<PerformanceMetrics> => {
    const scores = data.map(d => d.score)
    const percentages = data.map(d => d.percentage)
    const times = data.filter(d => d.time_taken_minutes).map(d => d.time_taken_minutes!)

    // Basic metrics
    const totalAttempts = data.length
    const totalTimeHours = times.reduce((sum, t) => sum + t, 0) / 60
    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length
    const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length
    const bestScore = Math.max(...scores)
    const bestPercentage = Math.max(...percentages)
    const worstScore = Math.min(...scores)
    const worstPercentage = Math.min(...percentages)

    // Advanced metrics
    const sortedPercentages = [...percentages].sort((a, b) => a - b)
    const medianPercentage = sortedPercentages[Math.floor(sortedPercentages.length / 2)]
    
    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - averagePercentage, 2), 0) / percentages.length
    const standardDeviation = Math.sqrt(variance)

    // Calculate improvement rate (linear regression)
    const improvementRate = calculateImprovementRate(data)
    
    // Calculate consistency score (inverse of coefficient of variation)
    const coefficientOfVariation = standardDeviation / averagePercentage
    const consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 100))

    return {
      total_attempts: totalAttempts,
      total_time_hours: Math.round(totalTimeHours * 100) / 100,
      average_score: Math.round(averageScore * 100) / 100,
      average_percentage: Math.round(averagePercentage * 100) / 100,
      best_score: bestScore,
      best_percentage: Math.round(bestPercentage * 100) / 100,
      worst_score: worstScore,
      worst_percentage: Math.round(worstPercentage * 100) / 100,
      median_percentage: Math.round(medianPercentage * 100) / 100,
      standard_deviation: Math.round(standardDeviation * 100) / 100,
      improvement_rate: Math.round(improvementRate * 100) / 100,
      consistency_score: Math.round(consistencyScore * 100) / 100
    }
  }, [])

  // =====================================================
  // TREND ANALYSIS
  // =====================================================
  
  const calculateTrends = useCallback(async (data: SimuladoResultado[]): Promise<{
    daily: PerformanceTrend[]
    weekly: PerformanceTrend[]
    monthly: PerformanceTrend[]
  }> => {
    const daily = calculatePeriodTrends(data, 'daily')
    const weekly = calculatePeriodTrends(data, 'weekly')
    const monthly = calculatePeriodTrends(data, 'monthly')

    return { daily, weekly, monthly }
  }, [])

  // =====================================================
  // SUBJECT ANALYSIS
  // =====================================================
  
  const calculateSubjectAnalysis = useCallback(async (data: SimuladoResultado[]): Promise<SubjectAnalysis[]> => {
    // Group by simulation_id (as proxy for subject)
    const subjectGroups = data.reduce((groups, record) => {
      const subject = record.simulation_id || 'unknown'
      if (!groups[subject]) {
        groups[subject] = []
      }
      groups[subject].push(record)
      return groups
    }, {} as Record<string, SimuladoResultado[]>)

    return Object.entries(subjectGroups).map(([subject, records]) => {
      const percentages = records.map(r => r.percentage)
      const times = records.filter(r => r.time_taken_minutes).map(r => r.time_taken_minutes!)
      const questions = records.map(r => r.total_questions)

      const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length
      const bestPercentage = Math.max(...percentages)
      const worstPercentage = Math.min(...percentages)
      
      // Calculate improvement trend
      const improvementTrend = calculateImprovementRate(records)
      
      // Calculate difficulty rating (inverse of average performance)
      const difficultyRating = Math.max(1, Math.min(10, 11 - (averagePercentage / 10)))
      
      // Calculate time efficiency (questions per minute)
      const totalQuestions = questions.reduce((sum, q) => sum + q, 0)
      const totalTime = times.reduce((sum, t) => sum + t, 0)
      const timeEfficiency = totalTime > 0 ? totalQuestions / totalTime : 0

      // Determine mastery level
      let masteryLevel: SubjectAnalysis['mastery_level'] = 'beginner'
      if (averagePercentage >= 90) masteryLevel = 'expert'
      else if (averagePercentage >= 75) masteryLevel = 'advanced'
      else if (averagePercentage >= 60) masteryLevel = 'intermediate'

      return {
        subject: subject.slice(-8), // Show last 8 chars of ID
        attempts: records.length,
        average_percentage: Math.round(averagePercentage * 100) / 100,
        best_percentage: Math.round(bestPercentage * 100) / 100,
        worst_percentage: Math.round(worstPercentage * 100) / 100,
        improvement_trend: Math.round(improvementTrend * 100) / 100,
        difficulty_rating: Math.round(difficultyRating * 100) / 100,
        time_efficiency: Math.round(timeEfficiency * 100) / 100,
        mastery_level: masteryLevel
      }
    }).sort((a, b) => b.attempts - a.attempts)
  }, [])

  // =====================================================
  // TIME ANALYSIS
  // =====================================================
  
  const calculateTimeAnalysis = useCallback(async (data: SimuladoResultado[]): Promise<TimeAnalysis> => {
    const recordsWithTime = data.filter(r => r.time_taken_minutes && r.time_taken_minutes > 0)
    
    if (recordsWithTime.length === 0) {
      return {
        optimal_time_range: { min_minutes: 0, max_minutes: 0, average_percentage_in_range: 0 },
        time_vs_performance: [],
        speed_analysis: {
          average_seconds_per_question: 0,
          fastest_completion: 0,
          slowest_completion: 0,
          optimal_pace: 0
        }
      }
    }

    // Find optimal time range (where performance is highest)
    const timePerformancePairs = recordsWithTime.map(r => ({
      time: r.time_taken_minutes!,
      percentage: r.percentage,
      questions: r.total_questions
    }))

    // Sort by performance and take top 25% to find optimal time range
    const topPerformers = timePerformancePairs
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, Math.max(1, Math.floor(timePerformancePairs.length * 0.25)))

    const optimalTimes = topPerformers.map(p => p.time)
    const optimalTimeRange = {
      min_minutes: Math.min(...optimalTimes),
      max_minutes: Math.max(...optimalTimes),
      average_percentage_in_range: topPerformers.reduce((sum, p) => sum + p.percentage, 0) / topPerformers.length
    }

    // Create time buckets for analysis
    const maxTime = Math.max(...timePerformancePairs.map(p => p.time))
    const bucketSize = Math.max(10, Math.ceil(maxTime / 10))
    const timeBuckets: Array<{ time_bucket: string; average_percentage: number; attempts: number }> = []

    for (let i = 0; i < maxTime; i += bucketSize) {
      const bucketRecords = timePerformancePairs.filter(p => p.time >= i && p.time < i + bucketSize)
      if (bucketRecords.length > 0) {
        timeBuckets.push({
          time_bucket: `${i}-${i + bucketSize}min`,
          average_percentage: bucketRecords.reduce((sum, r) => sum + r.percentage, 0) / bucketRecords.length,
          attempts: bucketRecords.length
        })
      }
    }

    // Speed analysis
    const secondsPerQuestion = timePerformancePairs.map(p => (p.time * 60) / p.questions)
    const averageSecondsPerQuestion = secondsPerQuestion.reduce((sum, s) => sum + s, 0) / secondsPerQuestion.length
    const fastestCompletion = Math.min(...timePerformancePairs.map(p => p.time))
    const slowestCompletion = Math.max(...timePerformancePairs.map(p => p.time))
    
    // Optimal pace (from top performers)
    const optimalPace = topPerformers.reduce((sum, p) => sum + ((p.time * 60) / p.questions), 0) / topPerformers.length

    return {
      optimal_time_range: {
        min_minutes: Math.round(optimalTimeRange.min_minutes),
        max_minutes: Math.round(optimalTimeRange.max_minutes),
        average_percentage_in_range: Math.round(optimalTimeRange.average_percentage_in_range * 100) / 100
      },
      time_vs_performance: timeBuckets,
      speed_analysis: {
        average_seconds_per_question: Math.round(averageSecondsPerQuestion),
        fastest_completion: fastestCompletion,
        slowest_completion: slowestCompletion,
        optimal_pace: Math.round(optimalPace)
      }
    }
  }, [])

  // =====================================================
  // STREAK ANALYSIS
  // =====================================================
  
  const calculateStreakAnalysis = useCallback(async (data: SimuladoResultado[]): Promise<StreakAnalysis> => {
    const streakThreshold = 70 // 70% minimum to maintain streak
    const sortedData = [...data].sort((a, b) => 
      new Date(a.completed_at || a.created_at || '').getTime() - 
      new Date(b.completed_at || b.created_at || '').getTime()
    )

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    const streakHistory: StreakAnalysis['streak_history'] = []
    let streakStart: string | null = null

    for (let i = 0; i < sortedData.length; i++) {
      const record = sortedData[i]
      const date = record.completed_at || record.created_at || ''
      
      if (record.percentage >= streakThreshold) {
        if (tempStreak === 0) {
          streakStart = date
        }
        tempStreak++
        
        // If this is the last record or next record breaks streak
        if (i === sortedData.length - 1) {
          currentStreak = tempStreak
        }
      } else {
        if (tempStreak > 0 && streakStart) {
          const streakEnd = i > 0 ? (sortedData[i - 1].completed_at || sortedData[i - 1].created_at || '') : date
          const streakRecords = sortedData.slice(i - tempStreak, i)
          const avgPercentage = streakRecords.reduce((sum, r) => sum + r.percentage, 0) / streakRecords.length
          
          streakHistory.push({
            start_date: streakStart,
            end_date: streakEnd,
            length: tempStreak,
            average_percentage: Math.round(avgPercentage * 100) / 100
          })
          
          longestStreak = Math.max(longestStreak, tempStreak)
        }
        tempStreak = 0
        streakStart = null
        currentStreak = 0
      }
    }

    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      streak_threshold: streakThreshold,
      streak_history: streakHistory.sort((a, b) => b.length - a.length)
    }
  }, [])

  // =====================================================
  // PREDICTIVE INSIGHTS
  // =====================================================
  
  const calculatePredictiveInsights = useCallback(async (data: SimuladoResultado[]): Promise<PredictiveInsights> => {
    const recentData = data.slice(-10) // Last 10 attempts
    const improvementRate = calculateImprovementRate(data)
    const averagePercentage = data.reduce((sum, d) => sum + d.percentage, 0) / data.length
    
    // Simple prediction based on trend
    const predictedPercentage = Math.max(0, Math.min(100, 
      averagePercentage + (improvementRate * 5) // Project 5 attempts ahead
    ))
    
    const confidenceLevel = Math.max(20, Math.min(95, 
      80 - (Math.abs(improvementRate) * 10) // Higher confidence for stable trends
    ))

    // Generate improvement suggestions
    const suggestions: PredictiveInsights['improvement_suggestions'] = []
    
    if (averagePercentage < 70) {
      suggestions.push({
        area: "Conhecimento Base",
        suggestion: "Foque em revisar conceitos fundamentais antes de fazer simulados",
        potential_improvement: 15,
        priority: "high"
      })
    }
    
    if (data.some(d => d.time_taken_minutes && d.time_taken_minutes > 120)) {
      suggestions.push({
        area: "Gestão de Tempo",
        suggestion: "Pratique resolver questões com limite de tempo mais rigoroso",
        potential_improvement: 10,
        priority: "medium"
      })
    }
    
    if (improvementRate < 0) {
      suggestions.push({
        area: "Consistência",
        suggestion: "Mantenha uma rotina regular de estudos para evitar declínio",
        potential_improvement: 12,
        priority: "high"
      })
    }

    // Generate goal recommendations
    const goalRecommendations: PredictiveInsights['goal_recommendations'] = [
      {
        goal_type: "Melhoria de Performance",
        target_value: Math.min(100, averagePercentage + 10),
        timeframe_days: 30,
        achievability: improvementRate > 0 ? 85 : 65
      },
      {
        goal_type: "Consistência",
        target_value: 5, // 5 simulados consecutivos acima da média
        timeframe_days: 14,
        achievability: 75
      }
    ]

    return {
      next_score_prediction: {
        predicted_percentage: Math.round(predictedPercentage * 100) / 100,
        confidence_level: Math.round(confidenceLevel),
        factors: ["Tendência histórica", "Performance recente", "Consistência"]
      },
      improvement_suggestions: suggestions,
      goal_recommendations: goalRecommendations
    }
  }, [])

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================
  
  const calculateImprovementRate = (data: SimuladoResultado[]): number => {
    if (data.length < 2) return 0
    
    const sortedData = [...data].sort((a, b) => 
      new Date(a.completed_at || a.created_at || '').getTime() - 
      new Date(b.completed_at || b.created_at || '').getTime()
    )
    
    // Simple linear regression to find improvement rate
    const n = sortedData.length
    const sumX = (n * (n + 1)) / 2 // Sum of indices
    const sumY = sortedData.reduce((sum, d) => sum + d.percentage, 0)
    const sumXY = sortedData.reduce((sum, d, i) => sum + ((i + 1) * d.percentage), 0)
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6 // Sum of squared indices
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    return slope || 0
  }

  const calculatePeriodTrends = (data: SimuladoResultado[], period: 'daily' | 'weekly' | 'monthly'): PerformanceTrend[] => {
    const groupedData: Record<string, SimuladoResultado[]> = {}
    
    data.forEach(record => {
      const date = new Date(record.completed_at || record.created_at || '')
      let periodKey: string
      
      switch (period) {
        case 'daily':
          periodKey = date.toISOString().split('T')[0]
          break
        case 'weekly':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          periodKey = weekStart.toISOString().split('T')[0]
          break
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
      }
      
      if (!groupedData[periodKey]) {
        groupedData[periodKey] = []
      }
      groupedData[periodKey].push(record)
    })

    const trends = Object.entries(groupedData)
      .map(([period, records]) => {
        const percentages = records.map(r => r.percentage)
        const times = records.filter(r => r.time_taken_minutes).map(r => r.time_taken_minutes!)
        
        return {
          period,
          attempts: records.length,
          average_percentage: Math.round((percentages.reduce((sum, p) => sum + p, 0) / percentages.length) * 100) / 100,
          best_percentage: Math.round(Math.max(...percentages) * 100) / 100,
          total_time_minutes: times.reduce((sum, t) => sum + t, 0),
          improvement_from_previous: 0 // Will be calculated below
        }
      })
      .sort((a, b) => a.period.localeCompare(b.period))

    // Calculate improvement from previous period
    for (let i = 1; i < trends.length; i++) {
      trends[i].improvement_from_previous = Math.round(
        (trends[i].average_percentage - trends[i - 1].average_percentage) * 100
      ) / 100
    }

    return trends
  }

  // =====================================================
  // PUBLIC FUNCTIONS
  // =====================================================
  
  const getPerformanceMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    const stats = await generateStatistics()
    return stats.performance_metrics
  }, [generateStatistics])

  const getTrendAnalysis = useCallback(async (period: 'daily' | 'weekly' | 'monthly'): Promise<PerformanceTrend[]> => {
    const stats = await generateStatistics()
    return stats.trends[period]
  }, [generateStatistics])

  const getSubjectAnalysis = useCallback(async (): Promise<SubjectAnalysis[]> => {
    const stats = await generateStatistics()
    return stats.subject_analysis
  }, [generateStatistics])

  const getTimeAnalysis = useCallback(async (): Promise<TimeAnalysis> => {
    const stats = await generateStatistics()
    return stats.time_analysis
  }, [generateStatistics])

  const getStreakAnalysis = useCallback(async (): Promise<StreakAnalysis> => {
    const stats = await generateStatistics()
    return stats.streak_analysis
  }, [generateStatistics])

  const getPredictiveInsights = useCallback(async (): Promise<PredictiveInsights> => {
    const stats = await generateStatistics()
    return stats.predictive_insights
  }, [generateStatistics])

  const exportStatistics = useCallback(async (format: 'json' | 'csv'): Promise<string> => {
    if (!statistics) {
      throw new Error("No statistics available to export")
    }

    if (format === 'json') {
      return JSON.stringify(statistics, null, 2)
    } else {
      // Convert to CSV format
      const csvRows = [
        'Metric,Value',
        `Total Attempts,${statistics.performance_metrics.total_attempts}`,
        `Average Percentage,${statistics.performance_metrics.average_percentage}`,
        `Best Percentage,${statistics.performance_metrics.best_percentage}`,
        `Improvement Rate,${statistics.performance_metrics.improvement_rate}`,
        `Consistency Score,${statistics.performance_metrics.consistency_score}`
      ]
      return csvRows.join('\n')
    }
  }, [statistics])

  const refreshStatistics = useCallback(async (): Promise<void> => {
    await generateStatistics()
  }, [generateStatistics])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // =====================================================
  // EFFECTS
  // =====================================================
  
  useEffect(() => {
    if (user) {
      generateStatistics().catch(console.error)
    }
  }, [user, generateStatistics])

  // =====================================================
  // RETURN
  // =====================================================
  
  return {
    statistics,
    loading,
    error,
    
    // Core functions
    generateStatistics,
    
    // Specific analytics
    getPerformanceMetrics,
    getTrendAnalysis,
    getSubjectAnalysis,
    getTimeAnalysis,
    getStreakAnalysis,
    getPredictiveInsights,
    
    // Utility functions
    exportStatistics,
    refreshStatistics,
    clearError
  }
}