"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import type { AtividadePainelDia, Prioridade, Medicamento, SessaoFocoDashboard } from "@/types/dashboard"
import { sanitizeString } from "@/utils/validations"

interface DashboardData {
  painelDia: AtividadePainelDia[]
  prioridades: Prioridade[]
  medicamentos: Medicamento[]
  sessaoFoco: SessaoFocoDashboard | null
}

interface DashboardError {
  message: string
  type: 'loading' | 'crud' | 'validation'
}

export function useDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    painelDia: [],
    prioridades: [],
    medicamentos: [],
    sessaoFoco: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<DashboardError | null>(null)
  const supabase = useMemo(() => createClient(), [])

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

  const carregarDados = useCallback(async () => {
    try {
      if (!user) return
      
      setLoading(true)
      setError(null)

      // Executar todas as queries em paralelo para melhor performance
      const [painelDiaResult, prioridadesResult, medicamentosResult, sessaoFocoResult] = await Promise.all([
        supabase
          .from("painel_dia")
          .select("*")
          .eq("user_id", user.id)
          .order("horario", { ascending: true }),
        supabase
          .from("prioridades")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("medicamentos")
          .select("*")
          .eq("user_id", user.id)
          .order("horario", { ascending: true }),
        supabase
          .from("sessoes_foco")
          .select("*")
          .eq("user_id", user.id)
          .eq("ativa", true)
          .maybeSingle() // Usar maybeSingle ao invés de single para evitar erro se não houver dados
      ])

      // Verificar erros individuais
      if (painelDiaResult.error) throw painelDiaResult.error
      if (prioridadesResult.error) throw prioridadesResult.error
      if (medicamentosResult.error) throw medicamentosResult.error
      if (sessaoFocoResult.error) throw sessaoFocoResult.error

      setDashboardData({
        painelDia: painelDiaResult.data || [],
        prioridades: prioridadesResult.data || [],
        medicamentos: medicamentosResult.data || [],
        sessaoFoco: sessaoFocoResult.data || null,
      })
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao carregar dados",
        type: 'loading'
      })
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const adicionarAtividade = useCallback(async (atividade: { horario: string; atividade: string; cor: string }) => {
    try {
      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // Validar dados antes de enviar
      validarAtividade(atividade)
      setError(null)

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
  }, [user, supabase, validarAtividade])

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
  }, [user, supabase, validarPrioridade])

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

  const iniciarSessaoFoco = useCallback(async (duracaoMinutos: number) => {
    try {
      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      if (!duracaoMinutos || duracaoMinutos <= 0 || duracaoMinutos > 240) {
        throw new Error("Duração deve ser entre 1 e 240 minutos")
      }

      setError(null)

      // Parar qualquer sessão ativa
      await supabase
        .from("sessoes_foco")
        .update({ ativa: false })
        .eq("user_id", user.id)
        .eq("ativa", true)

      // Criar nova sessão
      const { data, error } = await supabase
        .from("sessoes_foco")
        .insert([
          {
            user_id: user.id,
            duracao_minutos: duracaoMinutos,
            tempo_restante: duracaoMinutos * 60,
            ativa: true,
            pausada: false,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setDashboardData((prev) => ({
        ...prev,
        sessaoFoco: data,
      }))
    } catch (error) {
      console.error("Erro ao iniciar sessão de foco:", error)
      setError({
        message: error instanceof Error ? error.message : "Erro ao iniciar sessão de foco",
        type: 'crud'
      })
      throw error
    }
  }, [user, supabase])

  const pausarSessaoFoco = useCallback(async () => {
    try {
      if (!dashboardData.sessaoFoco) {
        throw new Error("Nenhuma sessão ativa para pausar")
      }

      setError(null)
      const { error } = await supabase
        .from("sessoes_foco")
        .update({ pausada: !dashboardData.sessaoFoco.pausada })
        .eq("id", dashboardData.sessaoFoco.id)

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
  }, [dashboardData.sessaoFoco, supabase])

  const pararSessaoFoco = useCallback(async () => {
    try {
      if (!dashboardData.sessaoFoco) {
        throw new Error("Nenhuma sessão ativa para parar")
      }

      setError(null)
      const { error } = await supabase
        .from("sessoes_foco")
        .update({ ativa: false })
        .eq("id", dashboardData.sessaoFoco.id)

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
  }, [dashboardData.sessaoFoco, supabase])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  return {
    dashboardData,
    loading,
    error,
    adicionarAtividadePainelDia: adicionarAtividade,
    toggleAtividadeConcluida,
    adicionarPrioridade,
    togglePrioridadeConcluida,
    iniciarSessaoFoco,
    pausarSessaoFoco,
    pararSessaoFoco,
    recarregarDados: carregarDados,
    limparErro: useCallback(() => setError(null), []),
  }
}
