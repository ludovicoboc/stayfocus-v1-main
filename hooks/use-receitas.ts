"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase"

export interface Receita {
  id: string
  user_id: string
  nome: string
  categoria: string
  ingredientes: string[]
  modo_preparo: string
  tempo_preparo?: number
  porcoes?: number
  dificuldade?: "facil" | "medio" | "dificil"
  favorita: boolean
  created_at: string
  updated_at: string
}

export interface ItemListaCompras {
  id: string
  user_id: string
  nome: string
  categoria: string
  quantidade?: string
  comprado: boolean
  receita_id?: string
  created_at: string
}

export function useReceitas() {
  const { user } = useAuth()
  const supabase = createClient()
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [listaCompras, setListaCompras] = useState<ItemListaCompras[]>([])
  const [loading, setLoading] = useState(true)

  const loadReceitas = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("receitas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setReceitas(data || [])
    } catch (error) {
      console.error("Erro ao carregar receitas:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadListaCompras = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("lista_compras")
        .select("*")
        .eq("user_id", user.id)
        .order("categoria", { ascending: true })

      if (error) throw error
      setListaCompras(data || [])
    } catch (error) {
      console.error("Erro ao carregar lista de compras:", error)
    }
  }

  useEffect(() => {
    loadReceitas()
    loadListaCompras()
  }, [user])

  const adicionarReceita = async (receita: Omit<Receita, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return { error: new Error("Usuário não autenticado") }

    const { data, error } = await supabase
      .from("receitas")
      .insert({
        user_id: user.id,
        ...receita,
      })
      .select()
      .single()

    if (!error && data) {
      setReceitas((prev) => [data, ...prev])
    }

    return { data, error }
  }

  const atualizarReceita = async (id: string, receita: Partial<Receita>) => {
    if (!user) return { error: new Error("Usuário não autenticado") }

    const { data, error } = await supabase
      .from("receitas")
      .update(receita)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (!error && data) {
      setReceitas((prev) => prev.map((r) => (r.id === id ? data : r)))
    }

    return { data, error }
  }

  const excluirReceita = async (id: string) => {
    if (!user) return { error: new Error("Usuário não autenticado") }

    const { error } = await supabase.from("receitas").delete().eq("id", id).eq("user_id", user.id)

    if (!error) {
      setReceitas((prev) => prev.filter((r) => r.id !== id))
    }

    return { error }
  }

  const toggleFavorita = async (id: string, favorita: boolean) => {
    return atualizarReceita(id, { favorita })
  }

  const adicionarItemListaCompras = async (nome: string, categoria: string, quantidade?: string) => {
    if (!user) return { error: new Error("Usuário não autenticado") }

    const { data, error } = await supabase
      .from("lista_compras")
      .insert({
        user_id: user.id,
        nome,
        categoria,
        quantidade,
        comprado: false,
      })
      .select()
      .single()

    if (!error && data) {
      setListaCompras((prev) => [...prev, data])
    }

    return { data, error }
  }

  const toggleItemComprado = async (id: string, comprado: boolean) => {
    if (!user) return { error: new Error("Usuário não autenticado") }

    const { data, error } = await supabase
      .from("lista_compras")
      .update({ comprado })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (!error && data) {
      setListaCompras((prev) => prev.map((item) => (item.id === id ? { ...item, comprado } : item)))
    }

    return { data, error }
  }

  const limparListaCompras = async () => {
    if (!user) return { error: new Error("Usuário não autenticado") }

    const { error } = await supabase.from("lista_compras").delete().eq("user_id", user.id).eq("comprado", true)

    if (!error) {
      setListaCompras((prev) => prev.filter((item) => !item.comprado))
    }

    return { error }
  }

  const gerarListaComprasDeReceitas = async (receitaIds: string[]) => {
    if (!user || receitaIds.length === 0) return { error: new Error("Dados inválidos") }

    try {
      // Buscar receitas selecionadas
      const { data: receitasSelecionadas, error: receitasError } = await supabase
        .from("receitas")
        .select("*")
        .in("id", receitaIds)
        .eq("user_id", user.id)

      if (receitasError) throw receitasError

      // Limpar lista atual
      await supabase.from("lista_compras").delete().eq("user_id", user.id)

      // Gerar itens da lista
      const itensLista: Omit<ItemListaCompras, "id" | "created_at">[] = []

      receitasSelecionadas?.forEach((receita) => {
        receita.ingredientes.forEach((ingrediente: string) => {
          itensLista.push({
            user_id: user.id,
            nome: ingrediente,
            categoria: receita.categoria,
            comprado: false,
            receita_id: receita.id,
          })
        })
      })

      if (itensLista.length > 0) {
        const { data, error } = await supabase.from("lista_compras").insert(itensLista).select()

        if (error) throw error
        setListaCompras(data || [])
      }

      return { error: null }
    } catch (error) {
      console.error("Erro ao gerar lista de compras:", error)
      return { error }
    }
  }

  return {
    receitas,
    listaCompras,
    loading,
    loadReceitas,
    loadListaCompras,
    adicionarReceita,
    atualizarReceita,
    excluirReceita,
    toggleFavorita,
    adicionarItemListaCompras,
    toggleItemComprado,
    limparListaCompras,
    gerarListaComprasDeReceitas,
  }
}
