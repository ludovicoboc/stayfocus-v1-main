"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "./use-auth"
import type { AtividadeLazer, SugestaoDescanso, SugestaoFavorita, SessaoLazer, EstatisticasLazer } from "@/types/lazer"

export function useLazer() {
  const { user } = useAuth()
  const supabase = createClient()
  const [atividades, setAtividades] = useState<AtividadeLazer[]>([])
  const [sugestoes, setSugestoes] = useState<SugestaoDescanso[]>([])
  const [favoritas, setFavoritas] = useState<SugestaoFavorita[]>([])
  const [sessaoAtual, setSessaoAtual] = useState<SessaoLazer | null>(null)
  const [estatisticas, setEstatisticas] = useState<EstatisticasLazer>({
    atividadesRealizadas: 0,
    tempoTotalMinutos: 0,
    categoriaFavorita: null,
  })
  const [loading, setLoading] = useState(true)

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      Promise.all([
        carregarAtividades(),
        carregarSugestoes(),
        carregarFavoritas(),
        carregarSessaoAtual(),
        carregarEstatisticas(),
      ]).finally(() => setLoading(false))
    }
  }, [user])

  const carregarAtividades = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("atividades_lazer")
      .select("*")
      .eq("user_id", user.id)
      .order("data_realizacao", { ascending: false })

    if (error) {
      console.error("Erro ao carregar atividades:", error)
      return
    }

    setAtividades(data || [])
  }

  const carregarSugestoes = async () => {
    const { data, error } = await supabase
      .from("sugestoes_descanso")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao carregar sugestões:", error)
      return
    }

    setSugestoes(data || [])
  }

  const carregarFavoritas = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("sugestoes_favoritas")
      .select(`
        *,
        sugestoes_descanso (*)
      `)
      .eq("user_id", user.id)

    if (error) {
      console.error("Erro ao carregar favoritas:", error)
      return
    }

    setFavoritas(data || [])
  }

  const carregarSessaoAtual = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("sessoes_lazer")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "ativo")
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao carregar sessão atual:", error)
      return
    }

    setSessaoAtual(data)
  }

  const carregarEstatisticas = async () => {
    if (!user) return

    // Contar atividades realizadas
    const { count: totalAtividades } = await supabase
      .from("atividades_lazer")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    // Calcular tempo total
    const { data: tempoData } = await supabase.from("atividades_lazer").select("duracao_minutos").eq("user_id", user.id)

    const tempoTotal = tempoData?.reduce((acc, curr) => acc + (curr.duracao_minutos || 0), 0) || 0

    // Encontrar categoria favorita
    const { data: categoriaData } = await supabase
      .from("atividades_lazer")
      .select("categoria")
      .eq("user_id", user.id)
      .not("categoria", "is", null)

    const categorias = categoriaData?.map((item) => item.categoria) || []
    const categoriaFavorita =
      categorias.length > 0
        ? categorias.reduce((a, b, i, arr) =>
            arr.filter((v) => v === a).length >= arr.filter((v) => v === b).length ? a : b,
          )
        : null

    setEstatisticas({
      atividadesRealizadas: totalAtividades || 0,
      tempoTotalMinutos: tempoTotal,
      categoriaFavorita,
    })
  }

  const adicionarAtividade = async (
    atividade: Omit<AtividadeLazer, "id" | "user_id" | "created_at" | "updated_at">,
  ) => {
    if (!user) return

    const { data, error } = await supabase
      .from("atividades_lazer")
      .insert([{ ...atividade, user_id: user.id }])
      .select()
      .single()

    if (error) {
      console.error("Erro ao adicionar atividade:", error)
      throw error
    }

    await Promise.all([carregarAtividades(), carregarEstatisticas()])
    return data
  }

  const criarSessaoLazer = async (duracaoMinutos: number) => {
    if (!user) return

    // Finalizar sessão anterior se existir
    if (sessaoAtual) {
      await finalizarSessao(sessaoAtual.id)
    }

    const { data, error } = await supabase
      .from("sessoes_lazer")
      .insert([
        {
          user_id: user.id,
          duracao_minutos: duracaoMinutos,
          status: "ativo",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar sessão:", error)
      throw error
    }

    setSessaoAtual(data)
    return data
  }

  const atualizarSessao = async (id: string, updates: Partial<SessaoLazer>) => {
    const { data, error } = await supabase.from("sessoes_lazer").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Erro ao atualizar sessão:", error)
      throw error
    }

    if (sessaoAtual?.id === id) {
      setSessaoAtual(data)
    }

    return data
  }

  const finalizarSessao = async (id: string) => {
    await atualizarSessao(id, {
      status: "concluido",
      data_fim: new Date().toISOString(),
    })

    if (sessaoAtual?.id === id) {
      setSessaoAtual(null)
    }
  }

  const toggleFavorita = async (sugestaoId: string) => {
    if (!user) return

    const jaFavorita = favoritas.find((f) => f.sugestao_id === sugestaoId)

    if (jaFavorita) {
      const { error } = await supabase.from("sugestoes_favoritas").delete().eq("id", jaFavorita.id)

      if (error) {
        console.error("Erro ao remover favorita:", error)
        throw error
      }
    } else {
      const { error } = await supabase.from("sugestoes_favoritas").insert([
        {
          user_id: user.id,
          sugestao_id: sugestaoId,
        },
      ])

      if (error) {
        console.error("Erro ao adicionar favorita:", error)
        throw error
      }
    }

    await carregarFavoritas()
  }

  const adicionarSugestao = async (sugestao: Omit<SugestaoDescanso, "id" | "created_at">) => {
    const { data, error } = await supabase.from("sugestoes_descanso").insert([sugestao]).select().single()

    if (error) {
      console.error("Erro ao adicionar sugestão:", error)
      throw error
    }

    await carregarSugestoes()
    return data
  }

  return {
    atividades,
    sugestoes,
    favoritas,
    sessaoAtual,
    estatisticas,
    loading,
    adicionarAtividade,
    criarSessaoLazer,
    atualizarSessao,
    finalizarSessao,
    toggleFavorita,
    adicionarSugestao,
    carregarAtividades,
    carregarEstatisticas,
  }
}
