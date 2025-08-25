"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-provider"
import { sanitizeString, sanitizeDate } from "@/utils/validations"
import { getCurrentDateString } from "@/lib/utils"

export interface Compromisso {
  id: string
  titulo: string
  horario: string
  tipo: string
  data: string
  concluido: boolean
}

export function useCompromissos(date?: string) {
  const { user } = useAuth()
  const [compromissos, setCompromissos] = useState<Compromisso[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const carregarCompromissos = async () => {
    try {
      if (!user) return // ✅ Verificar autenticação
      
      setLoading(true)
      const targetDate = date || getCurrentDateString()
      
      const { data, error } = await supabase
        .from("compromissos")
        .select("*")
        .eq("user_id", user.id) // ✅ Filtrar por user_id
        .eq("data", targetDate)
        .order("horario", { ascending: true })

      if (error) throw error
      
      setCompromissos(data || [])
    } catch (error) {
      console.error("Erro ao carregar compromissos:", error)
      // Dados de fallback para desenvolvimento
      const fallbackDate = date || getCurrentDateString()
      setCompromissos([
        {
          id: "1",
          titulo: "Consulta médica",
          horario: "14:00",
          tipo: "saude",
          data: fallbackDate,
          concluido: false,
        },
        {
          id: "2",
          titulo: "Estudar matemática",
          horario: "16:00",
          tipo: "estudos",
          data: fallbackDate,
          concluido: false,
        },
        {
          id: "3",
          titulo: "Preparar jantar",
          horario: "18:30",
          tipo: "alimentacao",
          data: fallbackDate,
          concluido: false,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const adicionarCompromisso = async (compromisso: Omit<Compromisso, "id" | "concluido">) => {
    try {
      // Sanitizar dados de entrada
      const compromissoSanitizado = {
        ...compromisso,
        titulo: sanitizeString(compromisso.titulo),
        horario: sanitizeString(compromisso.horario),
        tipo: sanitizeString(compromisso.tipo),
        data: sanitizeDate(compromisso.data),
      }

      // Validações básicas
      if (!compromissoSanitizado.titulo) {
        throw new Error("Título é obrigatório")
      }
      if (!compromissoSanitizado.horario) {
        throw new Error("Horário é obrigatório")
      }
      if (!compromissoSanitizado.data) {
        throw new Error("Data é obrigatória")
      }

      // Validar formato do horário
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(compromissoSanitizado.horario)) {
        throw new Error("Horário deve ter formato HH:MM")
      }

      const { data, error } = await supabase
        .from("compromissos")
        .insert([{ ...compromissoSanitizado, concluido: false }])
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