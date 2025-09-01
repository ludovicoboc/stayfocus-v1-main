"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-provider"
import type {
  ActivityHistory,
  HistoryAnalytics,
  HistoryGoal,
  ActivitySummary,
  ModuleStats,
  DailyActivity,
  WeeklyProgress,
  CreateActivityInput,
  UpdateActivityInput,
  CreateGoalInput,
  UpdateGoalInput,
  HistoryQueryOptions,
  ModuleType,
  UseHistoryReturn
} from "@/types/history"

export function useHistory(defaultModule?: ModuleType): UseHistoryReturn {
  const { user } = useAuth()
  const supabase = createClient()
  
  // State
  const [activities, setActivities] = useState<ActivityHistory[]>([])
  const [analytics, setAnalytics] = useState<HistoryAnalytics[]>([])
  const [goals, setGoals] = useState<HistoryGoal[]>([])
  const [summary, setSummary] = useState<ActivitySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // =====================================================
  // FETCH FUNCTIONS
  // =====================================================
  
  const fetchActivities = useCallback(async (options?: HistoryQueryOptions) => {
    if (!user) return []
    
    try {
      let query = supabase
        .from("activity_history")
        .select("*")
        .eq("user_id", user.id)

      // Apply filters
      if (options?.filters) {
        const { filters } = options
        
        if (filters.modules?.length) {
          query = query.in("module", filters.modules)
        } else if (defaultModule) {
          query = query.eq("module", defaultModule)
        }
        
        if (filters.activity_types?.length) {
          query = query.in("activity_type", filters.activity_types)
        }
        
        if (filters.categories?.length) {
          query = query.in("category", filters.categories)
        }
        
        if (filters.status?.length) {
          query = query.in("status", filters.status)
        }
        
        if (filters.difficulty?.length) {
          query = query.in("difficulty", filters.difficulty)
        }
        
        if (filters.date_from) {
          query = query.gte("activity_date", filters.date_from)
        }
        
        if (filters.date_to) {
          query = query.lte("activity_date", filters.date_to)
        }
        
        if (filters.is_favorite !== undefined) {
          query = query.eq("is_favorite", filters.is_favorite)
        }
        
        if (filters.is_milestone !== undefined) {
          query = query.eq("is_milestone", filters.is_milestone)
        }
        
        if (filters.min_score !== undefined) {
          query = query.gte("score", filters.min_score)
        }
        
        if (filters.max_score !== undefined) {
          query = query.lte("score", filters.max_score)
        }
        
        if (filters.min_duration !== undefined) {
          query = query.gte("duration_minutes", filters.min_duration)
        }
        
        if (filters.max_duration !== undefined) {
          query = query.lte("duration_minutes", filters.max_duration)
        }
        
        if (filters.tags?.length) {
          query = query.overlaps("tags", filters.tags)
        }
      } else if (defaultModule) {
        query = query.eq("module", defaultModule)
      }

      // Apply sorting
      const sortBy = options?.sort_by || "activity_date"
      const sortOrder = options?.sort_order || "desc"
      query = query.order(sortBy, { ascending: sortOrder === "asc" })

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit)
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (err) {
      console.error("Error fetching activities:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch activities")
      return []
    }
  }, [user, supabase, defaultModule])

  const fetchSummary = useCallback(async (module?: ModuleType, daysBack = 30) => {
    if (!user) return null
    
    try {
      const { data, error } = await supabase.rpc("get_user_activity_summary", {
        p_user_id: user.id,
        p_module: module || defaultModule,
        p_days_back: daysBack
      })

      if (error) throw error
      return data?.[0] || null
    } catch (err) {
      console.error("Error fetching summary:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch summary")
      return null
    }
  }, [user, supabase, defaultModule])

  const fetchGoals = useCallback(async (module?: ModuleType) => {
    if (!user) return []
    
    try {
      let query = supabase
        .from("history_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (module || defaultModule) {
        query = query.eq("module", module || defaultModule)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (err) {
      console.error("Error fetching goals:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch goals")
      return []
    }
  }, [user, supabase, defaultModule])

  // =====================================================
  // ACTIVITY MANAGEMENT
  // =====================================================
  
  const addActivity = useCallback(async (input: CreateActivityInput): Promise<ActivityHistory> => {
    if (!user) throw new Error("User not authenticated")
    
    try {
      setLoading(true)
      
      const activityData = {
        user_id: user.id,
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

      const { data, error } = await supabase
        .from("activity_history")
        .insert(activityData)
        .select()
        .single()

      if (error) throw error
      
      // Update local state
      setActivities(prev => [data, ...prev])
      
      // Refresh summary
      const newSummary = await fetchSummary()
      setSummary(newSummary)
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add activity"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase, fetchSummary])

  const updateActivity = useCallback(async (input: UpdateActivityInput): Promise<ActivityHistory> => {
    if (!user) throw new Error("User not authenticated")
    
    try {
      setLoading(true)
      
      const { id, ...updateData } = input
      
      const { data, error } = await supabase
        .from("activity_history")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) throw error
      
      // Update local state
      setActivities(prev => prev.map(activity => 
        activity.id === id ? data : activity
      ))
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update activity"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const deleteActivity = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated")
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from("activity_history")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error
      
      // Update local state
      setActivities(prev => prev.filter(activity => activity.id !== id))
      
      // Refresh summary
      const newSummary = await fetchSummary()
      setSummary(newSummary)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete activity"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase, fetchSummary])

  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const activity = activities.find(a => a.id === id)
    if (!activity) return
    
    await updateActivity({
      id,
      is_favorite: !activity.is_favorite
    })
  }, [activities, updateActivity])

  const toggleMilestone = useCallback(async (id: string): Promise<void> => {
    const activity = activities.find(a => a.id === id)
    if (!activity) return
    
    await updateActivity({
      id,
      is_milestone: !activity.is_milestone
    })
  }, [activities, updateActivity])

  // =====================================================
  // GOAL MANAGEMENT
  // =====================================================
  
  const createGoal = useCallback(async (input: CreateGoalInput): Promise<HistoryGoal> => {
    if (!user) throw new Error("User not authenticated")
    
    try {
      setLoading(true)
      
      const goalData = {
        user_id: user.id,
        ...input,
        current_value: 0,
        is_achieved: false,
        is_active: true
      }

      const { data, error } = await supabase
        .from("history_goals")
        .insert(goalData)
        .select()
        .single()

      if (error) throw error
      
      setGoals(prev => [data, ...prev])
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create goal"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const updateGoal = useCallback(async (input: UpdateGoalInput): Promise<HistoryGoal> => {
    if (!user) throw new Error("User not authenticated")
    
    try {
      setLoading(true)
      
      const { id, ...updateData } = input
      
      const { data, error } = await supabase
        .from("history_goals")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) throw error
      
      setGoals(prev => prev.map(goal => 
        goal.id === id ? data : goal
      ))
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update goal"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated")
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from("history_goals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error
      
      setGoals(prev => prev.filter(goal => goal.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete goal"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // =====================================================
  // ANALYTICS AND QUERIES
  // =====================================================
  
  const getModuleStats = useCallback(async (module: ModuleType): Promise<ModuleStats> => {
    const moduleActivities = await fetchActivities({
      filters: { modules: [module] },
      limit: 1000
    })
    
    const totalActivities = moduleActivities.length
    const totalDuration = moduleActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
    const scores = moduleActivities.filter(a => a.score !== null).map(a => a.score!)
    const avgPerformance = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0
    
    // Calculate streak (consecutive days with activities)
    const dates = [...new Set(moduleActivities.map(a => a.activity_date))].sort().reverse()
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    let currentDate = today
    
    for (const date of dates) {
      if (date === currentDate) {
        streak++
        const prevDate = new Date(currentDate)
        prevDate.setDate(prevDate.getDate() - 1)
        currentDate = prevDate.toISOString().split('T')[0]
      } else {
        break
      }
    }
    
    return {
      module,
      total_activities: totalActivities,
      total_duration: totalDuration,
      avg_performance: avgPerformance,
      last_activity: moduleActivities[0]?.activity_date,
      streak,
      achievements: moduleActivities.filter(a => a.is_milestone).length
    }
  }, [fetchActivities])

  const getDailyActivities = useCallback(async (date: string): Promise<DailyActivity> => {
    const dayActivities = await fetchActivities({
      filters: { date_from: date, date_to: date }
    })
    
    const totalDuration = dayActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
    const scores = dayActivities.filter(a => a.score !== null).map(a => a.score!)
    const avgPerformance = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : undefined
    
    return {
      date,
      activities: dayActivities,
      total_duration: totalDuration,
      activity_count: dayActivities.length,
      avg_performance: avgPerformance
    }
  }, [fetchActivities])

  const getWeeklyProgress = useCallback(async (weekStart: string): Promise<WeeklyProgress> => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().split('T')[0]
    
    const weekActivities = await fetchActivities({
      filters: { date_from: weekStart, date_to: weekEndStr }
    })
    
    // Group by day
    const dailyActivities: DailyActivity[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayActivities = weekActivities.filter(a => a.activity_date === dateStr)
      const totalDuration = dayActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
      const scores = dayActivities.filter(a => a.score !== null).map(a => a.score!)
      const avgPerformance = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : undefined
      
      dailyActivities.push({
        date: dateStr,
        activities: dayActivities,
        total_duration: totalDuration,
        activity_count: dayActivities.length,
        avg_performance: avgPerformance
      })
    }
    
    const totalActivities = weekActivities.length
    const totalDuration = weekActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
    const goalsAchieved = weekActivities.filter(a => a.is_milestone).length
    const allScores = weekActivities.filter(a => a.score !== null).map(a => a.score!)
    const avgPerformance = allScores.length > 0 ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length : undefined
    
    return {
      week_start: weekStart,
      week_end: weekEndStr,
      daily_activities: dailyActivities,
      total_activities: totalActivities,
      total_duration: totalDuration,
      goals_achieved: goalsAchieved,
      avg_performance: avgPerformance
    }
  }, [fetchActivities])

  // =====================================================
  // UTILITIES
  // =====================================================
  
  const refreshData = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      const [newActivities, newSummary, newGoals] = await Promise.all([
        fetchActivities({ limit: 50 }),
        fetchSummary(),
        fetchGoals()
      ])
      
      setActivities(newActivities)
      setSummary(newSummary)
      setGoals(newGoals)
    } catch (err) {
      console.error("Error refreshing data:", err)
      setError(err instanceof Error ? err.message : "Failed to refresh data")
    } finally {
      setLoading(false)
    }
  }, [user, fetchActivities, fetchSummary, fetchGoals])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // =====================================================
  // EFFECTS
  // =====================================================
  
  useEffect(() => {
    if (user) {
      refreshData()
    }
  }, [user, refreshData])

  // =====================================================
  // RETURN
  // =====================================================
  
  return {
    // Data
    activities,
    analytics,
    goals,
    summary,
    
    // State
    loading,
    error,
    
    // Actions
    addActivity,
    updateActivity,
    deleteActivity,
    toggleFavorite,
    toggleMilestone,
    
    // Goals
    createGoal,
    updateGoal,
    deleteGoal,
    
    // Queries
    getActivities: fetchActivities,
    getModuleStats,
    getDailyActivities,
    getWeeklyProgress,
    
    // Utilities
    refreshData,
    clearError
  }
}