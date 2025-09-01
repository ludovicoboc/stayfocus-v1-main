"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-provider"
import type { SimuladoResultado } from "@/types/simulados"

export interface SimulationHistoryFilters {
  simulation_id?: string
  date_from?: string
  date_to?: string
  min_score?: number
  max_score?: number
  min_percentage?: number
  max_percentage?: number
}

export interface SimulationHistoryQueryOptions {
  filters?: SimulationHistoryFilters
  sort_by?: 'completed_at' | 'score' | 'percentage' | 'created_at'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface CreateSimulationHistoryInput {
  simulation_id: string
  score: number
  total_questions: number
  percentage: number
  time_taken_minutes?: number
  answers: Record<string, string>
  completed_at?: string
}

export interface UpdateSimulationHistoryInput {
  id: string
  score?: number
  total_questions?: number
  percentage?: number
  time_taken_minutes?: number
  answers?: Record<string, string>
  completed_at?: string
}

export interface UseSimulationHistoryReturn {
  // Data
  history: SimuladoResultado[]
  loading: boolean
  error: string | null
  
  // CRUD Operations
  createRecord: (input: CreateSimulationHistoryInput) => Promise<SimuladoResultado>
  updateRecord: (input: UpdateSimulationHistoryInput) => Promise<SimuladoResultado>
  deleteRecord: (id: string) => Promise<void>
  getRecord: (id: string) => Promise<SimuladoResultado | null>
  
  // Query Operations
  getHistory: (options?: SimulationHistoryQueryOptions) => Promise<SimuladoResultado[]>
  getHistoryBySimulation: (simulationId: string) => Promise<SimuladoResultado[]>
  getBestScore: (simulationId?: string) => Promise<number | null>
  getAverageScore: (simulationId?: string) => Promise<number | null>
  getTotalAttempts: (simulationId?: string) => Promise<number>
  
  // Statistics
  getStatistics: () => Promise<{
    total_attempts: number
    best_score: number | null
    average_score: number | null
    best_percentage: number | null
    average_percentage: number | null
    total_time_minutes: number
    favorite_simulation?: string
  }>
  
  // Utilities
  saveHistoryEntry: (simulationData: {
    simulation_id: string
    score: number
    total_questions: number
    duration_minutes?: number
    answers: Record<string, string>
    completed_at?: string
  }) => Promise<SimuladoResultado>
  refreshData: () => Promise<void>
  clearError: () => void
}

export function useSimulationHistory(): UseSimulationHistoryReturn {
  const { user } = useAuth()
  const supabase = createClient()
  
  // State
  const [history, setHistory] = useState<SimuladoResultado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // =====================================================
  // CRUD OPERATIONS
  // =====================================================
  
  const createRecord = useCallback(async (input: CreateSimulationHistoryInput): Promise<SimuladoResultado> => {
    if (!user) throw new Error("User not authenticated")
    
    try {
      setLoading(true)
      
      const recordData = {
        user_id: user.id,
        simulation_id: input.simulation_id,
        score: input.score,
        total_questions: input.total_questions,
        percentage: input.percentage,
        time_taken_minutes: input.time_taken_minutes,
        answers: input.answers,
        completed_at: input.completed_at || new Date().toISOString()
      }

      const { data, error } = await supabase
        .from("simulation_history")
        .insert(recordData)
        .select()
        .single()

      if (error) throw error
      
      // Update local state
      setHistory(prev => [data, ...prev])
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create simulation history record"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const updateRecord = useCallback(async (input: UpdateSimulationHistoryInput): Promise<SimuladoResultado> => {
    if (!user) throw new Error("User not authenticated")
    
    try {
      setLoading(true)
      
      const { id, ...updateData } = input
      
      const { data, error } = await supabase
        .from("simulation_history")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) throw error
      
      // Update local state
      setHistory(prev => prev.map(record => 
        record.id === id ? data : record
      ))
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update simulation history record"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const deleteRecord = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated")
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from("simulation_history")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error
      
      // Update local state
      setHistory(prev => prev.filter(record => record.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete simulation history record"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const getRecord = useCallback(async (id: string): Promise<SimuladoResultado | null> => {
    if (!user) return null
    
    try {
      const { data, error } = await supabase
        .from("simulation_history")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error("Error fetching simulation history record:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch record")
      return null
    }
  }, [user, supabase])

  // =====================================================
  // QUERY OPERATIONS
  // =====================================================
  
  const getHistory = useCallback(async (options?: SimulationHistoryQueryOptions): Promise<SimuladoResultado[]> => {
    if (!user) return []
    
    try {
      let query = supabase
        .from("simulation_history")
        .select("*")
        .eq("user_id", user.id)

      // Apply filters
      if (options?.filters) {
        const { filters } = options
        
        if (filters.simulation_id) {
          query = query.eq("simulation_id", filters.simulation_id)
        }
        
        if (filters.date_from) {
          query = query.gte("completed_at", filters.date_from)
        }
        
        if (filters.date_to) {
          query = query.lte("completed_at", filters.date_to)
        }
        
        if (filters.min_score !== undefined) {
          query = query.gte("score", filters.min_score)
        }
        
        if (filters.max_score !== undefined) {
          query = query.lte("score", filters.max_score)
        }
        
        if (filters.min_percentage !== undefined) {
          query = query.gte("percentage", filters.min_percentage)
        }
        
        if (filters.max_percentage !== undefined) {
          query = query.lte("percentage", filters.max_percentage)
        }
      }

      // Apply sorting
      const sortBy = options?.sort_by || "completed_at"
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
      console.error("Error fetching simulation history:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch history")
      return []
    }
  }, [user, supabase])

  const getHistoryBySimulation = useCallback(async (simulationId: string): Promise<SimuladoResultado[]> => {
    return getHistory({
      filters: { simulation_id: simulationId },
      sort_by: "completed_at",
      sort_order: "desc"
    })
  }, [getHistory])

  const getBestScore = useCallback(async (simulationId?: string): Promise<number | null> => {
    if (!user) return null
    
    try {
      let query = supabase
        .from("simulation_history")
        .select("score")
        .eq("user_id", user.id)
        .order("score", { ascending: false })
        .limit(1)

      if (simulationId) {
        query = query.eq("simulation_id", simulationId)
      }

      const { data, error } = await query

      if (error) throw error
      return data?.[0]?.score || null
    } catch (err) {
      console.error("Error fetching best score:", err)
      return null
    }
  }, [user, supabase])

  const getAverageScore = useCallback(async (simulationId?: string): Promise<number | null> => {
    if (!user) return null
    
    try {
      let query = supabase
        .from("simulation_history")
        .select("score")
        .eq("user_id", user.id)

      if (simulationId) {
        query = query.eq("simulation_id", simulationId)
      }

      const { data, error } = await query

      if (error) throw error
      
      if (!data || data.length === 0) return null
      
      const total = data.reduce((sum, record) => sum + record.score, 0)
      return total / data.length
    } catch (err) {
      console.error("Error fetching average score:", err)
      return null
    }
  }, [user, supabase])

  const getTotalAttempts = useCallback(async (simulationId?: string): Promise<number> => {
    if (!user) return 0
    
    try {
      let query = supabase
        .from("simulation_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)

      if (simulationId) {
        query = query.eq("simulation_id", simulationId)
      }

      const { count, error } = await query

      if (error) throw error
      return count || 0
    } catch (err) {
      console.error("Error fetching total attempts:", err)
      return 0
    }
  }, [user, supabase])

  // =====================================================
  // STATISTICS
  // =====================================================
  
  const getStatistics = useCallback(async () => {
    if (!user) {
      return {
        total_attempts: 0,
        best_score: null,
        average_score: null,
        best_percentage: null,
        average_percentage: null,
        total_time_minutes: 0
      }
    }
    
    try {
      const { data, error } = await supabase
        .from("simulation_history")
        .select("score, percentage, time_taken_minutes, simulation_id")
        .eq("user_id", user.id)

      if (error) throw error
      
      if (!data || data.length === 0) {
        return {
          total_attempts: 0,
          best_score: null,
          average_score: null,
          best_percentage: null,
          average_percentage: null,
          total_time_minutes: 0
        }
      }

      const scores = data.map(d => d.score)
      const percentages = data.map(d => d.percentage)
      const times = data.filter(d => d.time_taken_minutes).map(d => d.time_taken_minutes!)
      
      // Find most frequent simulation
      const simulationCounts = data.reduce((acc, d) => {
        acc[d.simulation_id] = (acc[d.simulation_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const favoriteSimulation = Object.entries(simulationCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0]

      return {
        total_attempts: data.length,
        best_score: Math.max(...scores),
        average_score: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        best_percentage: Math.max(...percentages),
        average_percentage: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
        total_time_minutes: times.reduce((sum, t) => sum + t, 0),
        favorite_simulation: favoriteSimulation
      }
    } catch (err) {
      console.error("Error fetching statistics:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch statistics")
      return {
        total_attempts: 0,
        best_score: null,
        average_score: null,
        best_percentage: null,
        average_percentage: null,
        total_time_minutes: 0
      }
    }
  }, [user, supabase])

  // =====================================================
  // UTILITIES
  // =====================================================
  
  const saveHistoryEntry = useCallback(async (
    simulationData: {
      simulation_id: string
      score: number
      total_questions: number
      duration_minutes?: number
      answers: Record<string, string>
      completed_at?: string
    }
  ): Promise<SimuladoResultado> => {
    const percentage = (simulationData.score / simulationData.total_questions) * 100
    
    return createRecord({
      simulation_id: simulationData.simulation_id,
      score: simulationData.score,
      total_questions: simulationData.total_questions,
      percentage,
      time_taken_minutes: simulationData.duration_minutes,
      answers: simulationData.answers,
      completed_at: simulationData.completed_at
    })
  }, [createRecord])
  
  const refreshData = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const data = await getHistory({ limit: 50 })
      setHistory(data)
    } catch (err) {
      console.error("Error refreshing data:", err)
      setError(err instanceof Error ? err.message : "Failed to refresh data")
    } finally {
      setLoading(false)
    }
  }, [user, getHistory])

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
    history,
    loading,
    error,
    
    // CRUD Operations
    createRecord,
    updateRecord,
    deleteRecord,
    getRecord,
    
    // Query Operations
    getHistory,
    getHistoryBySimulation,
    getBestScore,
    getAverageScore,
    getTotalAttempts,
    
    // Statistics
    getStatistics,
    
    // Utilities
    saveHistoryEntry,
    refreshData,
    clearError
  }
}