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

  // NOVA IMPLEMENTAÇÃO: Usar view frontend para compatibilidade
  const fetchSessoes = async () => {
    if (!user) return

    try {
      setLoading(true)
      // Usar view frontend que mapeia automaticamente subject->disciplina, topic->topico
      const { data, error } = await supabase
        .from("v_study_sessions_frontend")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      
      // Não é mais necessário mapear campos - a view já retorna no formato correto
      const mapped: SessaoEstudo[] = (data || []).map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        competition_id: s.competition_id,
        disciplina: s.disciplina, // Já mapeado pela view
        topico: s.topico,         // Já mapeado pela view
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

  // NOVA IMPLEMENTAÇÃO: Usar função otimizada insert_study_session_frontend
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

      // Usar função otimizada do banco que aceita campos frontend
      const { data, error } = await supabase.rpc('insert_study_session_frontend', {
        p_user_id: user.id,
        p_disciplina: sessaoSanitizada.disciplina,
        p_duration_minutes: sessaoSanitizada.duration_minutes,
        p_competition_id: sessaoSanitizada.competition_id || null,
        p_topico: sessaoSanitizada.topico || null,
        p_notes: sessaoSanitizada.notes || null
      })

      if (error) throw error

      // Recarregar sessões para obter a nova sessão com todos os campos
      await fetchSessoes()
      
      return data // UUID da nova sessão
    } catch (error) {
      console.error("Error adding study session:", error)
      return null
    }
  }

  // NOVA IMPLEMENTAÇÃO: Usar função otimizada update_study_session_frontend
  const atualizarSessao = async (id: string, updates: Partial<SessaoEstudo>) => {
    if (!user) return false

    try {
      // Preparar updates com campos frontend
      const frontendUpdates: any = {}
      if (updates.disciplina !== undefined) frontendUpdates.p_disciplina = sanitizeString(updates.disciplina)
      if (updates.topico !== undefined) frontendUpdates.p_topico = sanitizeString(updates.topico)
      if (updates.duration_minutes !== undefined) frontendUpdates.p_duration_minutes = sanitizeNumber(updates.duration_minutes)
      if (updates.notes !== undefined) frontendUpdates.p_notes = updates.notes ? sanitizeString(updates.notes) : null
      if (updates.completed !== undefined) frontendUpdates.p_completed = updates.completed
      if (updates.pomodoro_cycles !== undefined) frontendUpdates.p_pomodoro_cycles = sanitizeNumber(updates.pomodoro_cycles)

      // Usar função otimizada do banco
      const { data, error } = await supabase.rpc('update_study_session_frontend', {
        p_session_id: id,
        p_user_id: user.id,
        ...frontendUpdates
      })

      if (error) throw error

      // Recarregar sessões para obter dados atualizados
      await fetchSessoes()
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

  // NOVA IMPLEMENTAÇÃO: Usar função otimizada de estatísticas do banco
  const getEstatisticasOtimizadas = async () => {
    if (!user) return null
    
    try {
      const { data, error } = await supabase.rpc('get_study_statistics_frontend', {
        p_user_id: user.id
      })
      
      if (error) throw error
      
      if (data && data.length > 0) {
        const stats = data[0]
        return {
          sessoesCompletas: stats.completed_sessions,
          totalSessoes: stats.total_sessions,
          tempoTotalMinutos: stats.total_study_time,
          ciclosPomodoro: stats.total_pomodoro_cycles,
          tempoMedioSessao: stats.avg_session_duration,
          disciplinasEstudadas: stats.disciplinas_studied || [],
          tempoTotalFormatado: formatarTempo(stats.total_study_time)
        }
      }
      
      return null
    } catch (error) {
      console.error("Error fetching optimized statistics:", error)
      return null
    }
  }

  // Estatísticas locais (fallback)
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
    getEstatisticasOtimizadas, // Nova função otimizada
    refetch: fetchSessoes,
  }
}
