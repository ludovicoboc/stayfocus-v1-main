import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

// GET /api/simulation-history/enhanced-statistics - Get comprehensive statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const simulationIds = searchParams.get("simulation_ids")?.split(",")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const includeComparative = searchParams.get("include_comparative") === "true"

    // Build base query
    let query = supabase
      .from("simulation_history")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: true })

    // Apply filters
    if (simulationIds?.length) {
      query = query.in("simulation_id", simulationIds)
    }
    if (dateFrom) {
      query = query.gte("completed_at", dateFrom)
    }
    if (dateTo) {
      query = query.lte("completed_at", dateTo)
    }

    const { data, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        data: {
          performance_metrics: {
            total_attempts: 0,
            total_time_hours: 0,
            average_score: 0,
            average_percentage: 0,
            best_score: 0,
            best_percentage: 0,
            worst_score: 0,
            worst_percentage: 0,
            median_percentage: 0,
            standard_deviation: 0,
            improvement_rate: 0,
            consistency_score: 0
          },
          trends: {
            daily: [],
            weekly: [],
            monthly: []
          },
          subject_analysis: [],
          time_analysis: {
            optimal_time_range: { min_minutes: 0, max_minutes: 0, average_percentage_in_range: 0 },
            time_vs_performance: [],
            speed_analysis: {
              average_seconds_per_question: 0,
              fastest_completion: 0,
              slowest_completion: 0,
              optimal_pace: 0
            }
          },
          streak_analysis: {
            current_streak: 0,
            longest_streak: 0,
            streak_threshold: 70,
            streak_history: []
          },
          predictive_insights: {
            next_score_prediction: {
              predicted_percentage: 0,
              confidence_level: 0,
              factors: []
            },
            improvement_suggestions: [],
            goal_recommendations: []
          },
          comparative_analysis: {
            percentile_rank: 0,
            peer_comparison: {
              above_average_areas: [] as string[],
              below_average_areas: [] as string[]
            }
          }
        }
      })
    }

    // Calculate comprehensive statistics
    const performanceMetrics = calculatePerformanceMetrics(data)
    const trends = calculateTrends(data)
    const subjectAnalysis = calculateSubjectAnalysis(data)
    const timeAnalysis = calculateTimeAnalysis(data)
    const streakAnalysis = calculateStreakAnalysis(data)
    const predictiveInsights = calculatePredictiveInsights(data)

    // Optional: Get comparative analysis
    let comparativeAnalysis = {
      percentile_rank: 0,
      peer_comparison: {
        above_average_areas: [] as string[],
        below_average_areas: [] as string[]
      }
    }

    if (includeComparative) {
      comparativeAnalysis = await calculateComparativeAnalysis(supabase, user.id, performanceMetrics)
    }

    return NextResponse.json({
      data: {
        performance_metrics: performanceMetrics,
        trends,
        subject_analysis: subjectAnalysis,
        time_analysis: timeAnalysis,
        streak_analysis: streakAnalysis,
        predictive_insights: predictiveInsights,
        comparative_analysis: comparativeAnalysis
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper functions
function calculatePerformanceMetrics(data: any[]) {
  const scores = data.map(d => d.score)
  const percentages = data.map(d => d.percentage)
  const times = data.filter(d => d.time_taken_minutes).map(d => d.time_taken_minutes)

  const totalAttempts = data.length
  const totalTimeHours = times.reduce((sum, t) => sum + t, 0) / 60
  const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length
  const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length
  const bestScore = Math.max(...scores)
  const bestPercentage = Math.max(...percentages)
  const worstScore = Math.min(...scores)
  const worstPercentage = Math.min(...percentages)

  const sortedPercentages = [...percentages].sort((a, b) => a - b)
  const medianPercentage = sortedPercentages[Math.floor(sortedPercentages.length / 2)]
  
  const variance = percentages.reduce((sum, p) => sum + Math.pow(p - averagePercentage, 2), 0) / percentages.length
  const standardDeviation = Math.sqrt(variance)

  const improvementRate = calculateImprovementRate(data)
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
}

function calculateImprovementRate(data: any[]): number {
  if (data.length < 2) return 0
  
  const n = data.length
  const sumX = (n * (n + 1)) / 2
  const sumY = data.reduce((sum, d) => sum + d.percentage, 0)
  const sumXY = data.reduce((sum, d, i) => sum + ((i + 1) * d.percentage), 0)
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope || 0
}

function calculateTrends(data: any[]) {
  return {
    daily: calculatePeriodTrends(data, 'daily'),
    weekly: calculatePeriodTrends(data, 'weekly'),
    monthly: calculatePeriodTrends(data, 'monthly')
  }
}

function calculatePeriodTrends(data: any[], period: 'daily' | 'weekly' | 'monthly') {
  const groupedData: Record<string, any[]> = {}
  
  data.forEach(record => {
    const date = new Date(record.completed_at || record.created_at)
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
      const typedRecords = records as any[]
      const percentages = typedRecords.map(r => r.percentage)
      const times = typedRecords.filter(r => r.time_taken_minutes).map(r => r.time_taken_minutes)

      return {
        period,
        attempts: typedRecords.length,
        average_percentage: Math.round((percentages.reduce((sum, p) => sum + p, 0) / percentages.length) * 100) / 100,
        best_percentage: Math.round(Math.max(...percentages) * 100) / 100,
        total_time_minutes: times.reduce((sum, t) => sum + t, 0),
        improvement_from_previous: 0
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

function calculateSubjectAnalysis(data: any[]) {
  const subjectGroups = data.reduce((groups, record) => {
    const subject = record.simulation_id || 'unknown'
    if (!groups[subject]) {
      groups[subject] = []
    }
    groups[subject].push(record)
    return groups
  }, {} as Record<string, any[]>)

  return Object.entries(subjectGroups).map(([subject, records]) => {
    const typedRecords = records as any[]
    const percentages = typedRecords.map(r => r.percentage)
    const times = typedRecords.filter(r => r.time_taken_minutes).map(r => r.time_taken_minutes)
    const questions = typedRecords.map(r => r.total_questions)

    const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length
    const bestPercentage = Math.max(...percentages)
    const worstPercentage = Math.min(...percentages)
    
    const improvementTrend = calculateImprovementRate(typedRecords)
    const difficultyRating = Math.max(1, Math.min(10, 11 - (averagePercentage / 10)))
    
    const totalQuestions = questions.reduce((sum, q) => sum + q, 0)
    const totalTime = times.reduce((sum, t) => sum + t, 0)
    const timeEfficiency = totalTime > 0 ? totalQuestions / totalTime : 0

    let masteryLevel = 'beginner'
    if (averagePercentage >= 90) masteryLevel = 'expert'
    else if (averagePercentage >= 75) masteryLevel = 'advanced'
    else if (averagePercentage >= 60) masteryLevel = 'intermediate'

    return {
      subject: subject.slice(-8),
      attempts: typedRecords.length,
      average_percentage: Math.round(averagePercentage * 100) / 100,
      best_percentage: Math.round(bestPercentage * 100) / 100,
      worst_percentage: Math.round(worstPercentage * 100) / 100,
      improvement_trend: Math.round(improvementTrend * 100) / 100,
      difficulty_rating: Math.round(difficultyRating * 100) / 100,
      time_efficiency: Math.round(timeEfficiency * 100) / 100,
      mastery_level: masteryLevel
    }
  }).sort((a, b) => b.attempts - a.attempts)
}

function calculateTimeAnalysis(data: any[]) {
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

  const timePerformancePairs = recordsWithTime.map(r => ({
    time: r.time_taken_minutes,
    percentage: r.percentage,
    questions: r.total_questions
  }))

  const topPerformers = timePerformancePairs
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, Math.max(1, Math.floor(timePerformancePairs.length * 0.25)))

  const optimalTimes = topPerformers.map(p => p.time)
  const optimalTimeRange = {
    min_minutes: Math.min(...optimalTimes),
    max_minutes: Math.max(...optimalTimes),
    average_percentage_in_range: topPerformers.reduce((sum, p) => sum + p.percentage, 0) / topPerformers.length
  }

  const maxTime = Math.max(...timePerformancePairs.map(p => p.time))
  const bucketSize = Math.max(10, Math.ceil(maxTime / 10))
  const timeBuckets = []

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

  const secondsPerQuestion = timePerformancePairs.map(p => (p.time * 60) / p.questions)
  const averageSecondsPerQuestion = secondsPerQuestion.reduce((sum, s) => sum + s, 0) / secondsPerQuestion.length
  const fastestCompletion = Math.min(...timePerformancePairs.map(p => p.time))
  const slowestCompletion = Math.max(...timePerformancePairs.map(p => p.time))
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
}

function calculateStreakAnalysis(data: any[]) {
  const streakThreshold = 70
  const sortedData = [...data].sort((a, b) => 
    new Date(a.completed_at || a.created_at).getTime() - 
    new Date(b.completed_at || b.created_at).getTime()
  )

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  const streakHistory = []
  let streakStart = null

  for (let i = 0; i < sortedData.length; i++) {
    const record = sortedData[i]
    const date = record.completed_at || record.created_at
    
    if (record.percentage >= streakThreshold) {
      if (tempStreak === 0) {
        streakStart = date
      }
      tempStreak++
      
      if (i === sortedData.length - 1) {
        currentStreak = tempStreak
      }
    } else {
      if (tempStreak > 0 && streakStart) {
        const streakEnd = i > 0 ? (sortedData[i - 1].completed_at || sortedData[i - 1].created_at) : date
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
}

function calculatePredictiveInsights(data: any[]) {
  const improvementRate = calculateImprovementRate(data)
  const averagePercentage = data.reduce((sum, d) => sum + d.percentage, 0) / data.length
  
  const predictedPercentage = Math.max(0, Math.min(100, 
    averagePercentage + (improvementRate * 5)
  ))
  
  const confidenceLevel = Math.max(20, Math.min(95, 
    80 - (Math.abs(improvementRate) * 10)
  ))

  const suggestions = []
  
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

  const goalRecommendations = [
    {
      goal_type: "Melhoria de Performance",
      target_value: Math.min(100, averagePercentage + 10),
      timeframe_days: 30,
      achievability: improvementRate > 0 ? 85 : 65
    },
    {
      goal_type: "Consistência",
      target_value: 5,
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
}

async function calculateComparativeAnalysis(supabase: any, userId: string, userMetrics: any) {
  // This would require aggregated data from other users
  // For now, return placeholder data
  return {
    percentile_rank: 75, // Placeholder
    peer_comparison: {
      above_average_areas: ["Consistência", "Tempo de Resposta"],
      below_average_areas: ["Performance Geral"]
    }
  }
}