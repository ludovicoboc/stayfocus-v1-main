"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import type { PomodoroState, PomodoroConfig, SessaoPomodoro } from "@/types/estudos"

export function usePomodoro(studySessionId?: string | null) {
  const { user } = useAuth()
  const supabase = createClient()
  const [state, setState] = useState<PomodoroState>("idle")
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [currentCycle, setCurrentCycle] = useState(1)
  const [cyclesCompleted, setCyclesCompleted] = useState(0)
  const [config, setConfig] = useState<PomodoroConfig>({
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    cyclesUntilLongBreak: 4,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionRef = useRef<SessaoPomodoro | null>(null)

  // Load saved session on mount
  useEffect(() => {
    if (user) {
      loadActiveSession()
    }
  }, [user])

  // Timer effect
  useEffect(() => {
    if (state === "focus" || state === "break" || state === "long-break") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state])

  const loadActiveSession = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (data) {
        sessionRef.current = data
        setCyclesCompleted(data.cycles_completed)
        setCurrentCycle(data.current_cycle)
        
        // Calculate remaining time based on started_at
        if (data.started_at && !data.paused_at && !data.completed_at) {
          const startTime = new Date(data.started_at).getTime()
          const currentTime = new Date().getTime()
          const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)
          
          // Determine what duration to use based on cycles completed
          let sessionDuration: number
          if (data.cycles_completed % config.cyclesUntilLongBreak === 0 && data.cycles_completed > 0) {
            sessionDuration = data.long_break_duration * 60 // Long break
          } else if (data.cycles_completed > 0) {
            sessionDuration = data.break_duration * 60 // Short break
          } else {
            sessionDuration = data.focus_duration * 60 // Focus session
          }
          
          const remainingTime = Math.max(0, sessionDuration - elapsedSeconds)
          setTimeLeft(remainingTime)
          
          if (remainingTime > 0) {
            // Determine the state based on current cycle
            if (data.cycles_completed % config.cyclesUntilLongBreak === 0 && data.cycles_completed > 0) {
              setState("long-break")
            } else if (data.cycles_completed > 0) {
              setState("break")
            } else {
              setState("focus")
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading active session:", error)
    }
  }

  const saveSession = async (updates: Partial<SessaoPomodoro>) => {
    if (!user) return

    try {
      if (sessionRef.current?.id) {
        // Update existing session
        const { error } = await supabase
          .from("pomodoro_sessions")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionRef.current.id)
          .eq("user_id", user.id)

        if (error) throw error
      } else {
        // Create new session
        const { data, error } = await supabase
          .from("pomodoro_sessions")
          .insert({
            user_id: user.id,
            study_session_id: studySessionId,
            focus_duration: config.focusDuration,
            break_duration: config.breakDuration,
            long_break_duration: config.longBreakDuration,
            current_cycle: currentCycle,
            cycles_completed: cyclesCompleted,
            is_active: true,
            started_at: new Date().toISOString(),
            ...updates,
          })
          .select()
          .single()

        if (error) throw error
        sessionRef.current = data
      }
    } catch (error) {
      console.error("Error saving pomodoro session:", error)
    }
  }

  const handleTimerComplete = useCallback(async () => {
    if (state === "focus") {
      const newCyclesCompleted = cyclesCompleted + 1
      setCyclesCompleted(newCyclesCompleted)

      // Update study session with completed pomodoro cycles
      if (studySessionId) {
        try {
          await supabase
            .from("study_sessions")
            .update({ 
              pomodoro_cycles: newCyclesCompleted,
              updated_at: new Date().toISOString()
            })
            .eq("id", studySessionId)
            .eq("user_id", user?.id)
        } catch (error) {
          console.error("Error updating study session:", error)
        }
      }

      // Determine next state
      if (newCyclesCompleted % config.cyclesUntilLongBreak === 0) {
        setState("long-break")
        setTimeLeft(config.longBreakDuration * 60)
      } else {
        setState("break")
        setTimeLeft(config.breakDuration * 60)
      }

      saveSession({ cycles_completed: newCyclesCompleted })
    } else {
      // Break completed, start next focus session
      setState("focus")
      setTimeLeft(config.focusDuration * 60)
      setCurrentCycle(currentCycle + 1)
    }
  }, [state, cyclesCompleted, currentCycle, config, studySessionId, user, supabase])

  const start = () => {
    if (state === "idle") {
      setState("focus")
      setTimeLeft(config.focusDuration * 60)
      saveSession({ started_at: new Date().toISOString() })
    } else if (state === "paused") {
      setState("focus")
    }
  }

  const pause = () => {
    if (state === "focus" || state === "break" || state === "long-break") {
      setState("paused")
      saveSession({ paused_at: new Date().toISOString() })
    }
  }

  const reset = () => {
    setState("idle")
    setTimeLeft(config.focusDuration * 60)
    setCyclesCompleted(0)
    setCurrentCycle(1)

    if (sessionRef.current) {
      saveSession({
        is_active: false,
        completed_at: new Date().toISOString(),
      })
      sessionRef.current = null
    }
  }

  const adjustConfig = (newConfig: Partial<PomodoroConfig>) => {
    setConfig({ ...config, ...newConfig })
    if (state === "idle") {
      setTimeLeft(newConfig.focusDuration ? newConfig.focusDuration * 60 : config.focusDuration * 60)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getStateLabel = () => {
    switch (state) {
      case "focus":
        return "Tempo de foco"
      case "break":
        return "Pausa curta"
      case "long-break":
        return "Pausa longa"
      case "paused":
        return "Pausado"
      default:
        return "Tempo de foco"
    }
  }

  return {
    state,
    timeLeft,
    currentCycle,
    cyclesCompleted,
    config,
    start,
    pause,
    reset,
    adjustConfig,
    formatTime,
    getStateLabel,
    isActive: state !== "idle",
  }
}
