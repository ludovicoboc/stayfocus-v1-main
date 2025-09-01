import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

// GET /api/simulation-history/statistics - Get simulation history statistics
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
    const simulationId = searchParams.get("simulation_id")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")

    // Build base query
    let query = supabase
      .from("simulation_history")
      .select("score, percentage, time_taken_minutes, simulation_id, completed_at")
      .eq("user_id", user.id)

    // Apply filters
    if (simulationId) {
      query = query.eq("simulation_id", simulationId)
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
          total_attempts: 0,
          best_score: null,
          average_score: null,
          best_percentage: null,
          average_percentage: null,
          total_time_minutes: 0,
          average_time_minutes: null,
          favorite_simulation: null,
          recent_trend: null,
          performance_distribution: {
            excellent: 0, // >= 90%
            good: 0,      // 70-89%
            average: 0,   // 50-69%
            poor: 0       // < 50%
          },
          monthly_progress: [],
          simulation_breakdown: []
        }
      })
    }

    // Calculate basic statistics
    const scores = data.map(d => d.score)
    const percentages = data.map(d => d.percentage)
    const times = data.filter(d => d.time_taken_minutes).map(d => d.time_taken_minutes!)

    const totalAttempts = data.length
    const bestScore = Math.max(...scores)
    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length
    const bestPercentage = Math.max(...percentages)
    const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length
    const totalTimeMinutes = times.reduce((sum, t) => sum + t, 0)
    const averageTimeMinutes = times.length > 0 ? totalTimeMinutes / times.length : null

    // Find most frequent simulation (favorite)
    const simulationCounts = data.reduce((acc, d) => {
      acc[d.simulation_id] = (acc[d.simulation_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const favoriteSimulation = Object.entries(simulationCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null

    // Calculate performance distribution
    const performanceDistribution = percentages.reduce((acc, p) => {
      if (p >= 90) acc.excellent++
      else if (p >= 70) acc.good++
      else if (p >= 50) acc.average++
      else acc.poor++
      return acc
    }, { excellent: 0, good: 0, average: 0, poor: 0 })

    // Calculate recent trend (last 5 attempts vs previous 5)
    let recentTrend = null
    if (data.length >= 10) {
      const sortedData = [...data].sort((a, b) => 
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      )
      const recent5 = sortedData.slice(0, 5)
      const previous5 = sortedData.slice(5, 10)
      
      const recentAvg = recent5.reduce((sum, d) => sum + d.percentage, 0) / 5
      const previousAvg = previous5.reduce((sum, d) => sum + d.percentage, 0) / 5
      
      recentTrend = recentAvg - previousAvg
    }

    // Calculate monthly progress (last 6 months)
    const monthlyProgress = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthData = data.filter(d => {
        const date = new Date(d.completed_at)
        return date >= monthStart && date <= monthEnd
      })

      monthlyProgress.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        attempts: monthData.length,
        average_percentage: monthData.length > 0 
          ? monthData.reduce((sum, d) => sum + d.percentage, 0) / monthData.length 
          : 0,
        best_percentage: monthData.length > 0 
          ? Math.max(...monthData.map(d => d.percentage)) 
          : 0
      })
    }

    // Calculate simulation breakdown
    const simulationBreakdown = Object.entries(simulationCounts).map(([simId, count]) => {
      const simData = data.filter(d => d.simulation_id === simId)
      const simPercentages = simData.map(d => d.percentage)
      
      return {
        simulation_id: simId,
        attempts: count,
        best_percentage: Math.max(...simPercentages),
        average_percentage: simPercentages.reduce((sum, p) => sum + p, 0) / simPercentages.length,
        last_attempt: Math.max(...simData.map(d => new Date(d.completed_at).getTime()))
      }
    }).sort((a, b) => b.attempts - a.attempts)

    return NextResponse.json({
      data: {
        total_attempts: totalAttempts,
        best_score: bestScore,
        average_score: Math.round(averageScore * 100) / 100,
        best_percentage: Math.round(bestPercentage * 100) / 100,
        average_percentage: Math.round(averagePercentage * 100) / 100,
        total_time_minutes: totalTimeMinutes,
        average_time_minutes: averageTimeMinutes ? Math.round(averageTimeMinutes * 100) / 100 : null,
        favorite_simulation: favoriteSimulation,
        recent_trend: recentTrend ? Math.round(recentTrend * 100) / 100 : null,
        performance_distribution: performanceDistribution,
        monthly_progress: monthlyProgress,
        simulation_breakdown: simulationBreakdown
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}