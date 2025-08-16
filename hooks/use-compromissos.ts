"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

export interface Compromisso {
  id: string
  titulo: string
  horario: string
  tipo: string
  data: string
  concluido: boolean
}

export function useCompromissos() {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const carregarCompromissos = async () => {
    try {
      setLoading(true)
      const hoje = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from("compromissos")
        .select("*")
        .eq("data", hoje)
        .order("horario", { ascending: true })

      if (error) throw error
      
      setCompromissos(data || [])
    } catch (error) {
      console.error("Erro ao carregar compromissos:", error)
      // Dados de fallback para desenvolvimento
      setCompromissos([
        {
          id: "1",
          titulo: "Consulta médica",
          horario: "14:00",
          tipo: "saude",
          data: new Date().toISOString().split('T')[0],
          concluido: false,
        },
        {
          id: "2",
          titulo: "Estudar matemática",
          horario: "16:00",
          tipo: "estudos",
          data: new Date().toISOString().split('T')[0],
          concluido: false,
        },
        {
          id: "3",
          titulo: "Preparar jantar",
          horario: "18:30",
          tipo: "alimentacao",
          data: new Date().toISOString().split('T')[0],
          concluido: false,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const adicionarCompromisso = async (compromisso: Omit<Compromisso, "id" | "concluido">) => {
    try {
      const { data, error } = await supabase
        .from("compromissos")
        .insert([{ ...compromisso, concluido: false }])
        .select()
        .single()

      if (error) throw error

      setCompromissos(prev => [...prev, data].sort((a, b) => a.horario.localeCompare(b.horario)))
      return data
    } catch (error) {
      console.error("Erro ao adicionar compromisso:", error)
      throw error
    }
  }

  const toggleCompromissoConcluido = async (id: string, concluido: boolean) => {
    try {
      const { error } = await supabase
        .from("compromissos")
        .update({ concluido })
        .eq("id", id)

      if (error) throw error

      setCompromissos(prev => 
        prev.map(comp => comp.id === id ? { ...comp, concluido } : comp)
      )
    } catch (error) {
      console.error("Erro ao atualizar compromisso:", error)
      throw error
    }
  }

  useEffect(() => {
    carregarCompromissos()
  }, [])

  return {
    compromissos,
    loading,
    adicionarCompromisso,
    toggleCompromissoConcluido,
    recarregar: carregarCompromissos,
  }
}