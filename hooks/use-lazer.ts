"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "./use-auth"
import type { AtividadeLazer, SugestaoDescanso, SugestaoFavorita, SessaoLazer, EstatisticasLazer } from "@/types/lazer"
import { validateAtividadeLazer, validateData, sanitizeString, sanitizeNumber, sanitizeDate } from "@/utils/validations"

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
  const [error, setError] = useState<string | null>(null)
  const [operationLoading, setOperationLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const carregarEstatisticas = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: rpcError } = await supabase.rpc('get_lazer_statistics', {
        p_user_id: user.id,
      });

      if (rpcError) {
        console.error("Erro ao carregar estatísticas com RPC:", rpcError);
        setError("Erro ao carregar estatísticas");
        return;
      }

      setEstatisticas(data);
    } catch (err) {
      console.error("Erro na chamada RPC de estatísticas:", err);
      setError("Erro ao processar estatísticas");
    }
  }, [user, supabase]);

  const carregarAtividades = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from("atividades_lazer")
      .select("*")
      .eq("user_id", user.id)
      .order("data_realizacao", { ascending: false })

    if (fetchError) {
      console.error("Erro ao carregar atividades:", fetchError)
      setError("Erro ao carregar atividades")
      return
    }

    setAtividades(data || [])
  }, [user, supabase])

  const carregarSugestoes = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("sugestoes_descanso")
      .select("*")
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("Erro ao carregar sugestões:", fetchError)
      setError("Erro ao carregar sugestões")
      return
    }

    setSugestoes(data || [])
  }, [supabase])

  const carregarFavoritas = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from("sugestoes_favoritas")
      .select(`
        *,
        sugestoes_descanso (*)
      `)
      .eq("user_id", user.id)

    if (fetchError) {
      console.error("Erro ao carregar favoritas:", fetchError)
      setError("Erro ao carregar favoritas")
      return
    }

    setFavoritas(data || [])
  }, [user, supabase])

  const carregarSessaoAtual = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from("sessoes_lazer")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "ativo")
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Erro ao carregar sessão atual:", fetchError)
      setError("Erro ao carregar sessão atual")
      return
    }

    setSessaoAtual(data)
  }, [user, supabase])

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        carregarAtividades(),
        carregarSugestoes(),
        carregarFavoritas(),
        carregarSessaoAtual(),
        carregarEstatisticas(),
      ]).finally(() => setLoading(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const adicionarAtividade = useCallback(async (
    atividade: Omit<AtividadeLazer, "id" | "user_id" | "created_at" | "updated_at">,
  ) => {
    if (!user) return

    setOperationLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Sanitizar dados de entrada
      const atividadeSanitizada = {
        ...atividade,
        nome: sanitizeString(atividade.nome),
        categoria: sanitizeString(atividade.categoria),
        duracao_minutos: sanitizeNumber(atividade.duracao_minutos),
        data_realizacao: sanitizeDate(atividade.data_realizacao),
        avaliacao: atividade.avaliacao ? sanitizeNumber(atividade.avaliacao) : undefined,
        observacoes: atividade.observacoes ? sanitizeString(atividade.observacoes) : undefined,
      }

      // Validar dados antes de enviar
      validateData(atividadeSanitizada, validateAtividadeLazer)

      const { data, error: insertError } = await supabase
        .from("atividades_lazer")
        .insert([{ ...atividadeSanitizada, user_id: user.id }])
        .select()
        .single()

      if (insertError) {
        console.error("Erro ao adicionar atividade:", insertError)
        setError("Erro ao adicionar atividade")
        throw insertError
      }

      await Promise.all([carregarAtividades(), carregarEstatisticas()])
      setSuccessMessage("Atividade adicionada com sucesso!")
      return data
    } catch (validationError) {
      console.error("Erro de validação:", validationError)
      setError("Dados inválidos. Verifique os campos preenchidos.")
      throw validationError
    } finally {
      setOperationLoading(false)
    }
  }, [user, supabase, carregarAtividades, carregarEstatisticas])

  const criarSessaoLazer = useCallback(async (duracaoMinutos: number) => {
    if (!user) return

    setOperationLoading(true)
    setError(null)

    try {
      // Finalizar sessão anterior se existir
      if (sessaoAtual) {
        await finalizarSessao(sessaoAtual.id)
      }

      const { data, error: insertError } = await supabase
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

      if (insertError) {
        console.error("Erro ao criar sessão:", insertError)
        setError("Erro ao criar sessão de lazer")
        throw insertError
      }

      setSessaoAtual(data)
      setSuccessMessage("Sessão iniciada com sucesso!")
      return data
    } finally {
      setOperationLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supabase, sessaoAtual])

  const atualizarSessao = async (id: string, updates: Partial<SessaoLazer>) => {
    const { data, error: updateError } = await supabase.from("sessoes_lazer").update(updates).eq("id", id).select().single()

    if (updateError) {
      console.error("Erro ao atualizar sessão:", updateError)
      throw updateError
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

  const toggleFavorita = useCallback(async (sugestaoId: string) => {
    if (!user) return

    setOperationLoading(true)
    setError(null)

    try {
      const jaFavorita = favoritas.find((f) => f.sugestao_id === sugestaoId)

      if (jaFavorita) {
        const { error: deleteError } = await supabase.from("sugestoes_favoritas").delete().eq("id", jaFavorita.id)

        if (deleteError) {
          console.error("Erro ao remover favorita:", deleteError)
          setError("Erro ao remover dos favoritos")
          throw deleteError
        }
        setSuccessMessage("Removido dos favoritos!")
      } else {
        const { error: insertError } = await supabase.from("sugestoes_favoritas").insert([
          {
            user_id: user.id,
            sugestao_id: sugestaoId,
          },
        ])

        if (insertError) {
          console.error("Erro ao adicionar favorita:", insertError)
          setError("Erro ao adicionar aos favoritos")
          throw insertError
        }
        setSuccessMessage("Adicionado aos favoritos!")
      }

      await carregarFavoritas()
    } finally {
      setOperationLoading(false)
    }
  }, [user, supabase, favoritas, carregarFavoritas])

  const adicionarSugestao = useCallback(async (sugestao: Omit<SugestaoDescanso, "id" | "created_at">) => {
    const { data, error: insertError } = await supabase.from("sugestoes_descanso").insert([sugestao]).select().single()

    if (insertError) {
      console.error("Erro ao adicionar sugestão:", insertError)
      throw insertError
    }

    await carregarSugestoes()
    return data
  }, [supabase, carregarSugestoes])

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccessMessage(null)
  }, [])

  return {
    atividades,
    sugestoes,
    favoritas,
    sessaoAtual,
    estatisticas,
    loading,
    error,
    operationLoading,
    successMessage,
    adicionarAtividade,
    criarSessaoLazer,
    atualizarSessao,
    finalizarSessao,
    toggleFavorita,
    adicionarSugestao,
    carregarAtividades,
    carregarEstatisticas,
    clearMessages,
  }
}
