"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "./use-auth"
import type {
  Medicamento,
  RegistroHumor,
  NovoMedicamento,
  NovoRegistroHumor,
  ResumoMedicamentos,
  ResumoHumor,
} from "@/types/saude"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export function useSaude() {
  const supabase = createClientComponentClient()
  const { user } = useAuth()

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [registrosHumor, setRegistrosHumor] = useState<RegistroHumor[]>([])
  const [loadingMedicamentos, setLoadingMedicamentos] = useState(true)
  const [loadingRegistrosHumor, setLoadingRegistrosHumor] = useState(true)
  const [resumoMedicamentos, setResumoMedicamentos] = useState<ResumoMedicamentos>({
    total: 0,
    tomadosHoje: 0,
    proximaDose: null,
  })
  const [resumoHumor, setResumoHumor] = useState<ResumoHumor>({
    media: 0,
    fatoresComuns: [],
  })

  // Carregar medicamentos
  const carregarMedicamentos = useCallback(async () => {
    if (!user) return

    setLoadingMedicamentos(true)

    try {
      const { data, error } = await supabase.from("medicamentos").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setMedicamentos(data || [])
      calcularResumoMedicamentos(data || [])
    } catch (error) {
      console.error("Erro ao carregar medicamentos:", error)
    } finally {
      setLoadingMedicamentos(false)
    }
  }, [supabase, user])

  // Carregar registros de humor
  const carregarRegistrosHumor = useCallback(async () => {
    if (!user) return

    setLoadingRegistrosHumor(true)

    try {
      const { data, error } = await supabase.from("registros_humor").select("*").order("data", { ascending: false })

      if (error) throw error

      setRegistrosHumor(data || [])
      calcularResumoHumor(data || [])
    } catch (error) {
      console.error("Erro ao carregar registros de humor:", error)
    } finally {
      setLoadingRegistrosHumor(false)
    }
  }, [supabase, user])

  // Adicionar medicamento
  const adicionarMedicamento = async (novoMedicamento: NovoMedicamento) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from("medicamentos")
        .insert([
          {
            ...novoMedicamento,
            user_id: user.id,
          },
        ])
        .select()

      if (error) throw error

      await carregarMedicamentos()
      return data?.[0] || null
    } catch (error) {
      console.error("Erro ao adicionar medicamento:", error)
      return null
    }
  }

  // Adicionar registro de humor
  const adicionarRegistroHumor = async (novoRegistro: NovoRegistroHumor) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from("registros_humor")
        .insert([
          {
            ...novoRegistro,
            user_id: user.id,
          },
        ])
        .select()

      if (error) throw error

      await carregarRegistrosHumor()
      return data?.[0] || null
    } catch (error) {
      console.error("Erro ao adicionar registro de humor:", error)
      return null
    }
  }

  // Excluir medicamento
  const excluirMedicamento = async (id: string) => {
    try {
      const { error } = await supabase.from("medicamentos").delete().eq("id", id)

      if (error) throw error

      await carregarMedicamentos()
      return true
    } catch (error) {
      console.error("Erro ao excluir medicamento:", error)
      return false
    }
  }

  // Excluir registro de humor
  const excluirRegistroHumor = async (id: string) => {
    try {
      const { error } = await supabase.from("registros_humor").delete().eq("id", id)

      if (error) throw error

      await carregarRegistrosHumor()
      return true
    } catch (error) {
      console.error("Erro ao excluir registro de humor:", error)
      return false
    }
  }

  // Calcular resumo de medicamentos
  const calcularResumoMedicamentos = (medicamentos: Medicamento[]) => {
    const total = medicamentos.length
    const tomadosHoje = 0 // Implementação simplificada

    // Encontrar a próxima dose
    let proximaDose: string | null = null
    let menorTempo: Date | null = null

    medicamentos.forEach((med) => {
      med.horarios.forEach((horario) => {
        const [hora, minuto] = horario.split(":").map(Number)
        const dataHorario = new Date()
        dataHorario.setHours(hora, minuto, 0, 0)

        // Se o horário já passou hoje, considerar para amanhã
        if (dataHorario < new Date()) {
          dataHorario.setDate(dataHorario.getDate() + 1)
        }

        if (!menorTempo || dataHorario < menorTempo) {
          menorTempo = dataHorario

          // Calcular tempo restante
          const agora = new Date()
          const diferencaMs = dataHorario.getTime() - agora.getTime()
          const horas = Math.floor(diferencaMs / (1000 * 60 * 60))
          const minutos = Math.floor((diferencaMs % (1000 * 60 * 60)) / (1000 * 60))

          proximaDose = `${horas}h ${minutos}m`
        }
      })
    })

    setResumoMedicamentos({
      total,
      tomadosHoje,
      proximaDose,
    })
  }

  // Calcular resumo de humor
  const calcularResumoHumor = (registros: RegistroHumor[]) => {
    if (registros.length === 0) {
      setResumoHumor({
        media: 0,
        fatoresComuns: [],
      })
      return
    }

    // Calcular média de humor
    const somaHumor = registros.reduce((soma, registro) => soma + registro.nivel_humor, 0)
    const media = Number.parseFloat((somaHumor / registros.length).toFixed(1))

    // Encontrar fatores mais comuns
    const contagemFatores: Record<string, number> = {}

    registros.forEach((registro) => {
      if (registro.fatores) {
        registro.fatores.forEach((fator) => {
          contagemFatores[fator] = (contagemFatores[fator] || 0) + 1
        })
      }
    })

    // Ordenar fatores por frequência
    const fatoresOrdenados = Object.entries(contagemFatores)
      .sort((a, b) => b[1] - a[1])
      .map(([fator]) => fator)
      .slice(0, 3) // Pegar os 3 mais comuns

    setResumoHumor({
      media,
      fatoresComuns: fatoresOrdenados,
    })
  }

  // Formatar data para exibição
  const formatarData = (data: string) => {
    return format(parseISO(data), "dd/MM/yyyy", { locale: ptBR })
  }

  // Efeito para carregar dados iniciais
  useEffect(() => {
    if (user) {
      carregarMedicamentos()
      carregarRegistrosHumor()
    }
  }, [user, carregarMedicamentos, carregarRegistrosHumor])

  return {
    medicamentos,
    registrosHumor,
    loadingMedicamentos,
    loadingRegistrosHumor,
    resumoMedicamentos,
    resumoHumor,
    adicionarMedicamento,
    adicionarRegistroHumor,
    excluirMedicamento,
    excluirRegistroHumor,
    carregarMedicamentos,
    carregarRegistrosHumor,
    formatarData,
  }
}
