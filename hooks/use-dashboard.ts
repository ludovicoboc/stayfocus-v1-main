"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import type { AtividadePainelDia, Prioridade, Medicamento, SessaoFocoDashboard } from "@/types/dashboard"

interface DashboardData {
  painelDia: AtividadePainelDia[]
  prioridades: Prioridade[]
  medicamentos: Medicamento[]
  sessaoFoco: SessaoFocoDashboard | null
}

export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    painelDia: [],
    prioridades: [],
    medicamentos: [],
    sessaoFoco: null,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const carregarDados = async () => {
    try {
      setLoading(true)

      // Carregar atividades do painel do dia
      const { data: painelDia } = await supabase.from("painel_dia").select("*").order("horario", { ascending: true })

      // Carregar prioridades
      const { data: prioridades } = await supabase
        .from("prioridades")
        .select("*")
        .order("created_at", { ascending: false })

      // Carregar medicamentos
      const { data: medicamentos } = await supabase
        .from("medicamentos")
        .select("*")
        .order("horario", { ascending: true })

      // Carregar sessão de foco ativa
      const { data: sessaoFoco } = await supabase.from("sessoes_foco").select("*").eq("ativa", true).single()

      setDashboardData({
        painelDia: painelDia || [],
        prioridades: prioridades || [],
        medicamentos: medicamentos || [],
        sessaoFoco: sessaoFoco || null,
      })
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const adicionarAtividadePainelDia = async (atividade: { horario: string; atividade: string; cor: string }) => {
    try {
      const { data, error } = await supabase
        .from("painel_dia")
        .insert([
          {
            horario: atividade.horario,
            atividade: atividade.atividade,
            cor: atividade.cor,
            concluida: false,
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        setDashboardData((prev) => ({
          ...prev,
          painelDia: [...prev.painelDia, ...data],
        }))
      }
    } catch (error) {
      console.error("Erro ao adicionar atividade:", error)
      throw error
    }
  }

  const toggleAtividadeConcluida = async (id: string, concluida: boolean) => {
    try {
      const { error } = await supabase.from("painel_dia").update({ concluida }).eq("id", id)

      if (error) throw error

      setDashboardData((prev) => ({
        ...prev,
        painelDia: prev.painelDia.map((atividade) => (atividade.id === id ? { ...atividade, concluida } : atividade)),
      }))
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error)
      throw error
    }
  }

  const adicionarPrioridade = async (prioridade: { titulo: string; importante: boolean }) => {
    try {
      const { data, error } = await supabase
        .from("prioridades")
        .insert([
          {
            titulo: prioridade.titulo,
            importante: prioridade.importante,
            concluida: false,
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
      throw error
    }
  }

  const togglePrioridadeConcluida = async (id: string, concluida: boolean) => {
    try {
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
      throw error
    }
  }

  const iniciarSessaoFoco = async (duracaoMinutos: number) => {
    try {
      // Parar qualquer sessão ativa
      await supabase.from("sessoes_foco").update({ ativa: false }).eq("ativa", true)

      // Criar nova sessão
      const { data, error } = await supabase
        .from("sessoes_foco")
        .insert([
          {
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
      throw error
    }
  }

  const pausarSessaoFoco = async () => {
    try {
      if (!dashboardData.sessaoFoco) return

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
      throw error
    }
  }

  const pararSessaoFoco = async () => {
    try {
      if (!dashboardData.sessaoFoco) return

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
      throw error
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  return {
    dashboardData,
    loading,
    adicionarAtividadePainelDia,
    toggleAtividadeConcluida,
    adicionarPrioridade,
    togglePrioridadeConcluida,
    iniciarSessaoFoco,
    pausarSessaoFoco,
    pararSessaoFoco,
    recarregarDados: carregarDados,
  }
}
