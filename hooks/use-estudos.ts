"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import type { SessaoEstudo } from "@/types/estudos"
import { validateSessaoEstudo, validateData, sanitizeString, sanitizeNumber } from "@/utils/validations"

export function useEstudos() {
  const { user } = useAuth()
  const supabase = createClient()
  const [sessoes, setSessoes] = useState<SessaoEstudo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSessoes()
    }
  }, [user])

  const fetchSessoes = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("study_sessions")
        .select(
          "id, user_id, competition_id, subject, topic, duration_minutes, completed, pomodoro_cycles, notes, started_at, completed_at, created_at, updated_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      const mapped: SessaoEstudo[] = (data || []).map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        competition_id: s.competition_id,
        disciplina: s.subject,
        topico: s.topic,
        duration_minutes: s.duration_minutes,
        completed: s.completed,
        pomodoro_cycles: s.pomodoro_cycles,
        notes: s.notes,
        started_at: s.started_at,
        completed_at: s.completed_at,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }))
      setSessoes(mapped)
    } catch (error) {
      console.error("Error fetching study sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const adicionarSessao = async (sessao: Omit<SessaoEstudo, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null

    try {
      // Sanitizar dados de entrada
      const sessaoSanitizada = {
        ...sessao,
        topico: sanitizeString(sessao.topico),
        duration_minutes: sanitizeNumber(sessao.duration_minutes),
        pomodoro_cycles: sanitizeNumber(sessao.pomodoro_cycles) || 0,
        notes: sessao.notes ? sanitizeString(sessao.notes) : undefined,
      }

      // Validar dados antes de enviar
      validateData(sessaoSanitizada, validateSessaoEstudo)

      const { data, error } = await supabase
        .from("study_sessions")
        .insert({
          user_id: user.id,
          subject: sessaoSanitizada.disciplina,
          topic: sessaoSanitizada.topico,
          duration_minutes: sessaoSanitizada.duration_minutes,
          completed: false,
          pomodoro_cycles: sessaoSanitizada.pomodoro_cycles,
          notes: sessaoSanitizada.notes,
          competition_id: sessaoSanitizada.competition_id,
          started_at: new Date().toISOString(),
          completed_at: null,
        })
        .select(
          "id, user_id, competition_id, subject, topic, duration_minutes, completed, pomodoro_cycles, notes, started_at, completed_at, created_at, updated_at"
        )
        .single()

      if (error) throw error

      const mapped: SessaoEstudo = {
        id: data.id,
        user_id: data.user_id,
        competition_id: data.competition_id,
        disciplina: data.subject,
        topico: data.topic,
        duration_minutes: data.duration_minutes,
        completed: data.completed,
        pomodoro_cycles: data.pomodoro_cycles,
        notes: data.notes,
        started_at: data.started_at,
        completed_at: data.completed_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }

      setSessoes([mapped, ...sessoes])
      return mapped
    } catch (error) {
      console.error("Error adding study session:", error)
      return null
    }
  }

  const atualizarSessao = async (id: string, updates: Partial<SessaoEstudo>) => {
    if (!user) return false

    try {
      // Map frontend fields to DB columns
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      }
      if (updates.disciplina !== undefined) dbUpdates.subject = sanitizeString(updates.disciplina)
      if (updates.topico !== undefined) dbUpdates.topic = sanitizeString(updates.topico)
      if (updates.duration_minutes !== undefined)
        dbUpdates.duration_minutes = sanitizeNumber(updates.duration_minutes)
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes ? sanitizeString(updates.notes) : null
      if (updates.competition_id !== undefined) dbUpdates.competition_id = updates.competition_id
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed
      if (updates.pomodoro_cycles !== undefined)
        dbUpdates.pomodoro_cycles = sanitizeNumber(updates.pomodoro_cycles)

      const { data, error } = await supabase
        .from("study_sessions")
        .update(dbUpdates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select(
          "id, user_id, competition_id, subject, topic, duration_minutes, completed, pomodoro_cycles, notes, started_at, completed_at, created_at, updated_at"
        )
        .single()

      if (error) throw error

      const mapped: SessaoEstudo = {
        id: data.id,
        user_id: data.user_id,
        competition_id: data.competition_id,
        disciplina: data.subject,
        topico: data.topic,
        duration_minutes: data.duration_minutes,
        completed: data.completed,
        pomodoro_cycles: data.pomodoro_cycles,
        notes: data.notes,
        started_at: data.started_at,
        completed_at: data.completed_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }

      setSessoes(sessoes.map((s) => (s.id === id ? mapped : s)))
      return true
    } catch (error) {
      console.error("Error updating study session:", error)
      return false
    }
  }

  const marcarSessaoCompleta = async (id: string) => {
    return atualizarSessao(id, {
      completed: true,
      completed_at: new Date().toISOString(),
    })
  }

  const removerSessao = async (id: string) => {
    if (!user) return false

    try {
      const { error } = await supabase.from("study_sessions").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error

      setSessoes(sessoes.filter((s) => s.id !== id))
      return true
    } catch (error) {
      console.error("Error removing study session:", error)
      return false
    }
  }

  // Estatísticas
  const getEstatisticas = () => {
    const sessoesCompletas = sessoes.filter((s) => s.completed).length
    const totalSessoes = sessoes.length
    const tempoTotalMinutos = sessoes.reduce((acc, s) => acc + s.duration_minutes, 0)
    const ciclosPomodoro = sessoes.reduce((acc, s) => acc + s.pomodoro_cycles, 0)

    return {
      sessoesCompletas,
      totalSessoes,
      tempoTotalMinutos,
      ciclosPomodoro,
      tempoTotalFormatado: formatarTempo(tempoTotalMinutos),
    }
  }

  const formatarTempo = (minutos: number) => {
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h ${mins}min`
  }

  return {
    sessoes,
    loading,
    adicionarSessao,
    atualizarSessao,
    marcarSessaoCompleta,
    removerSessao,
    getEstatisticas,
    refetch: fetchSessoes,
  }
}
