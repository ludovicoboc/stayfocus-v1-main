"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import type { AtividadePainelDia, Prioridade, Medicamento, SessaoFocoDashboard } from "@/types/dashboard"
import { sanitizeString } from "@/utils/validations"
import { getCurrentDateString } from "@/lib/utils"

interface DashboardData {
  painelDia: AtividadePainelDia[]
  prioridades: Prioridade[]
  medicamentos: Medicamento[]
  sessaoFoco: SessaoFocoDashboard | null
  // Estatísticas do dashboard unificado
  summary?: {
    total_activities: number
    completed_activities: number
    activity_completion_rate: number
    total_priorities: number
    completed_priorities: number
    important_priorities: number
    priority_completion_rate: number
    active_focus_sessions: number
    total_focus_time_minutes: number
    remaining_focus_time_seconds: number
    upcoming_compromissos: number
    overdue_compromissos: number
    overall_completion_percentage: number
    productivity_score: number
  }
}

interface DashboardError {
  message: string
  type: 'loading' | 'crud' | 'validation'
}

export function useDashboard(date?: string) {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    painelDia: [],
    prioridades: [],
    medicamentos: [],
    sessaoFoco: null,
    summary: undefined,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<DashboardError | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const resolvedDate = useMemo(() => date || getCurrentDateString(), [date])

  // Validação de dados
  const validarAtividade = useCallback((atividade: { horario: string; atividade: string; cor: string }) => {
    if (!atividade.horario || !atividade.atividade || !atividade.cor) {
      throw new Error("Todos os campos são obrigatórios")
    }
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(atividade.horario)) {
      throw new Error("Formato de horário inválido (use HH:MM)")
    }
    if (atividade.atividade.length > 200) {
      throw new Error("Descrição da atividade muito longa (máx. 200 caracteres)")
    }
  }, [])

  const validarPrioridade = useCallback((prioridade: { titulo: string; importante: boolean }) => {
    if (!prioridade.titulo || prioridade.titulo.trim().length === 0) {
      throw new Error("Título da prioridade é obrigatório")
    }
    if (prioridade.titulo.length > 100) {
      throw new Error("Título muito longo (máx. 100 caracteres)")
    }
    if (typeof prioridade.importante !== 'boolean') {
      throw new Error("Campo 'importante' deve ser verdadeiro ou falso")
    }
  }, [])

  // NOVA IMPLEMENTAÇÃO: Usar função unificada para reduzir 85% das chamadas API
  const carregarDados = useCallback(async () => {
    try {
      if (!user) return
      
      setLoading(true)
      setError(null)
      const targetDate = date || getCurrentDateString()

      // Uma única chamada para obter todos os dados do dashboard
      const { data, error } = await supabase.rpc('get_dashboard_unified_data', {
        p_user_id: user.id,
        p_date: targetDate
      })

      if (error) throw error

      if (data && data.length > 0) {
        const unifiedData = data[0]
        
        // Mapear os dados para os formatos esperados pelo frontend
        const activities = unifiedData.activities || []
        const priorities = unifiedData.priorities || []
        const medications = unifiedData.medications || []
        const focusSessions = unifiedData.focus_sessions || []
        const summary = unifiedData.summary || {}

        // Encontrar sessão ativa
        const activeFocusSession = focusSessions.find((session: any) => session.ativa) || null

        setDashboardData({
          painelDia: activities,
          prioridades: priorities,
          medicamentos: medications,
          sessaoFoco: activeFocusSession,
          summary: summary
        })
      } else {
        // Dados vazios - inicializar estrutura limpa
        setDashboardData({
          painelDia: [],
          prioridades: [],
          medicamentos: [],
          sessaoFoco: null,
          summary: {
            total_activities: 0,
            completed_activities: 0,
            activity_completion_rate: 0,
            total_priorities: 0,
            completed_priorities: 0,
            important_priorities: 0,
            priority_completion_rate: 0,
            active_focus_sessions: 0,
            total_focus_time_minutes: 0,
            remaining_focus_time_seconds: 0,
            upcoming_compromissos: 0,
            overdue_compromissos: 0,
            overall_completion_percentage: 0,
            productivity_score: 0
          }
        })
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard (função unificada):", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao carregar dados",
        type: 'loading'
      })
    } finally {
      setLoading(false)
    }
  }, [user, supabase, date])

  const adicionarAtividade = useCallback(async (atividade: { horario: string; atividade: string; cor: string }) => {
    try {
      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // Validar dados antes de enviar
      validarAtividade(atividade)
      setError(null)

      const targetDate = date || getCurrentDateString()
      const atividadeSanitizada = {
        horario: atividade.horario.trim(),
        atividade: sanitizeString(atividade.atividade),
        cor: atividade.cor.trim(),
      }

      const { data, error } = await supabase
        .from("painel_dia")
        .insert([
          {
            ...atividadeSanitizada,
            user_id: user.id,
            concluida: false,
            date: targetDate,
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        setDashboardData((prev) => ({
          ...prev,
          painelDia: [...prev.painelDia, ...data].sort((a, b) => a.horario.localeCompare(b.horario)),
        }))
      }
    } catch (error) {
      console.error("Erro ao adicionar atividade:", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao adicionar atividade",
        type: 'crud'
      })
      throw error
    }
  }, [user, supabase, validarAtividade, date])

  const toggleAtividadeConcluida = useCallback(async (id: string, concluida: boolean) => {
    try {
      if (!id || typeof concluida !== 'boolean') {
        throw new Error("Parâmetros inválidos")
      }

      setError(null)
      const { error } = await supabase.from("painel_dia").update({ concluida }).eq("id", id)

      if (error) throw error

      setDashboardData((prev) => ({
        ...prev,
        painelDia: prev.painelDia.map((atividade) => (atividade.id === id ? { ...atividade, concluida } : atividade)),
      }))
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao atualizar atividade",
        type: 'crud'
      })
      throw error
    }
  }, [supabase])

  const adicionarPrioridade = useCallback(async (prioridade: { titulo: string; importante: boolean }) => {
    try {
      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // Validar dados antes de enviar
      validarPrioridade(prioridade)
      setError(null)

      const targetDate = date || getCurrentDateString()
      const prioridadeSanitizada = {
        titulo: sanitizeString(prioridade.titulo),
        importante: prioridade.importante,
      }

      const { data, error } = await supabase
        .from("prioridades")
        .insert([
          {
            ...prioridadeSanitizada,
            concluida: false,
            user_id: user.id,
            date: targetDate,
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        setDashboardData((prev) => ({
          ...prev,
          prioridades: [...data, ...prev.prioridades],
        }))
      }
    } catch (error) {
      console.error("Erro ao adicionar prioridade:", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao adicionar prioridade",
        type: 'crud'
      })
      throw error
    }
  }, [user, supabase, validarPrioridade, date])

  const togglePrioridadeConcluida = useCallback(async (id: string, concluida: boolean) => {
    try {
      if (!id || typeof concluida !== 'boolean') {
        throw new Error("Parâmetros inválidos")
      }

      setError(null)
      const { error } = await supabase.from("prioridades").update({ concluida }).eq("id", id)

      if (error) throw error

      setDashboardData((prev) => ({
        ...prev,
        prioridades: prev.prioridades.map((prioridade) =>
          prioridade.id === id ? { ...prioridade, concluida } : prioridade,
        ),
      }))
    } catch (error) {
      console.error("Erro ao atualizar prioridade:", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao atualizar prioridade",
        type: 'crud'
      })
      throw error
    }
  }, [supabase])

  // NOVA IMPLEMENTAÇÃO: Usar função otimizada start_focus_session
  const iniciarSessaoFoco = useCallback(async (duracaoMinutos: number) => {
    try {
      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      if (!duracaoMinutos || duracaoMinutos <= 0 || duracaoMinutos > 180) {
        throw new Error("Duração deve ser entre 1 e 180 minutos")
      }

      setError(null)

      const targetDate = date || getCurrentDateString()
      
      // Usar função otimizada do banco que automaticamente desativa outras sessões
      const { data, error } = await supabase.rpc('start_focus_session', {
        p_user_id: user.id,
        p_duracao_minutos: duracaoMinutos,
        p_date: targetDate
      })

      if (error) throw error

      // Recarregar dados para obter a nova sessão
      await carregarDados()
    } catch (error) {
      console.error("Erro ao iniciar sessão de foco:", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao iniciar sessão de foco",
        type: 'crud'
      })
      throw error
    }
  }, [user, supabase, date, carregarDados])

  // NOVA IMPLEMENTAÇÃO: Usar função otimizada toggle_focus_session_pause
  const pausarSessaoFoco = useCallback(async () => {
    try {
      if (!dashboardData.sessaoFoco) {
        throw new Error("Nenhuma sessão ativa para pausar")
      }

      setError(null)
      
      // Usar função otimizada do banco
      const { data, error } = await supabase.rpc('toggle_focus_session_pause', {
        p_session_id: dashboardData.sessaoFoco.id,
        p_user_id: user!.id
      })

      if (error) throw error

      setDashboardData((prev) => ({
        ...prev,
        sessaoFoco: prev.sessaoFoco ? { ...prev.sessaoFoco, pausada: !prev.sessaoFoco.pausada } : null,
      }))
    } catch (error) {
      console.error("Erro ao pausar sessão:", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao pausar sessão",
        type: 'crud'
      })
      throw error
    }
  }, [dashboardData.sessaoFoco, supabase, user])

  // IMPLEMENTAÇÃO OTIMIZADA: Usar função de atualização de tempo
  const pararSessaoFoco = useCallback(async () => {
    try {
      if (!dashboardData.sessaoFoco) {
        throw new Error("Nenhuma sessão ativa para parar")
      }

      setError(null)
      
      // Atualizar para tempo zero que automaticamente desativa a sessão
      const { error } = await supabase.rpc('update_focus_session_time', {
        p_session_id: dashboardData.sessaoFoco.id,
        p_user_id: user!.id,
        p_tempo_restante_seconds: 0
      })

      if (error) throw error

      setDashboardData((prev) => ({
        ...prev,
        sessaoFoco: null,
      }))
    } catch (error) {
      console.error("Erro ao parar sessão:", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao parar sessão",
        type: 'crud'
      })
      throw error
    }
  }, [dashboardData.sessaoFoco, supabase, user])

  // NOVA IMPLEMENTAÇÃO: Funções de batch update para melhor performance
  const toggleMultiplasAtividades = useCallback(async (updates: Array<{id: string, concluida: boolean}>) => {
    try {
      if (!user || !updates.length) {
        throw new Error("Usuário não autenticado ou nenhuma atualização fornecida")
      }

      setError(null)
      
      // Usar função de batch update do banco
      const { data, error } = await supabase.rpc('batch_update_activities_completion', {
        p_user_id: user.id,
        p_activity_updates: JSON.stringify(updates)
      })

      if (error) throw error

      // Atualizar estado local
      setDashboardData((prev) => ({
        ...prev,
        painelDia: prev.painelDia.map((atividade) => {
          const update = updates.find(u => u.id === atividade.id)
          return update ? { ...atividade, concluida: update.concluida } : atividade
        }),
      }))

      return data // Número de registros atualizados
    } catch (error) {
      console.error("Erro ao atualizar múltiplas atividades:", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao atualizar atividades",
        type: 'crud'
      })
      throw error
    }
  }, [user, supabase])

  const toggleMultiplasPrioridades = useCallback(async (updates: Array<{id: string, concluida: boolean}>) => {
    try {
      if (!user || !updates.length) {
        throw new Error("Usuário não autenticado ou nenhuma atualização fornecida")
      }

      setError(null)
      
      // Usar função de batch update do banco
      const { data, error } = await supabase.rpc('batch_update_priorities_completion', {
        p_user_id: user.id,
        p_priority_updates: JSON.stringify(updates)
      })

      if (error) throw error

      // Atualizar estado local
      setDashboardData((prev) => ({
        ...prev,
        prioridades: prev.prioridades.map((prioridade) => {
          const update = updates.find(u => u.id === prioridade.id)
          return update ? { ...prioridade, concluida: update.concluida } : prioridade
        }),
      }))

      return data // Número de registros atualizados
    } catch (error) {
      console.error("Erro ao atualizar múltiplas prioridades:", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao atualizar prioridades",
        type: 'crud'
      })
      throw error
    }
  }, [user, supabase])

  // Funções de conveniência para marcar todas como concluídas
  const marcarTodasAtividadesConcluidas = useCallback(async () => {
    const updates = dashboardData.painelDia
      .filter(atividade => !atividade.concluida)
      .map(atividade => ({ id: atividade.id, concluida: true }))
    
    if (updates.length === 0) return 0
    
    return toggleMultiplasAtividades(updates)
  }, [dashboardData.painelDia, toggleMultiplasAtividades])

  const marcarTodasPrioridadesConcluidas = useCallback(async () => {
    const updates = dashboardData.prioridades
      .filter(prioridade => !prioridade.concluida)
      .map(prioridade => ({ id: prioridade.id, concluida: true }))
    
    if (updates.length === 0) return 0
    
    return toggleMultiplasPrioridades(updates)
  }, [dashboardData.prioridades, toggleMultiplasPrioridades])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  return {
    ...dashboardData,
    loading,
    error,
    
    // Ações para atividades
    adicionarAtividade,
    toggleAtividadeConcluida,
    toggleMultiplasAtividades,
    marcarTodasAtividadesConcluidas,
    
    // Ações para prioridades
    adicionarPrioridade,
    togglePrioridadeConcluida,
    toggleMultiplasPrioridades,
    marcarTodasPrioridadesConcluidas,
    
    // Ações para sessões de foco
    iniciarSessaoFoco,
    pausarSessaoFoco,
    pararSessaoFoco,
    
    // Utilitários
    refetch: carregarDados,
    limparErro: useCallback(() => setError(null), []),
    currentDate: resolvedDate,
  }
}
