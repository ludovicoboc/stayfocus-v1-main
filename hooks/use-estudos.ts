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
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSessoes(data || [])
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
        topic: sanitizeString(sessao.topic),
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
          ...sessaoSanitizada,
        })
        .select()
        .single()

      if (error) throw error

      setSessoes([data, ...sessoes])
      return data
    } catch (error) {
      console.error("Error adding study session:", error)
      return null
    }
  }

  const atualizarSessao = async (id: string, updates: Partial<SessaoEstudo>) => {
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from("study_sessions")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) throw error

      setSessoes(sessoes.map((s) => (s.id === id ? data : s)))
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
