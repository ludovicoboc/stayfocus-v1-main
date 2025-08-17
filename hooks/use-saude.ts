"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "./use-auth"
import type {
  Medicamento,
  RegistroHumor,
  NovoMedicamento,
  NovoRegistroHumor,
  ResumoMedicamentos,
  ResumoHumor,
  MedicamentoTomado,
  NovoMedicamentoTomado,
} from "@/types/saude"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { validateMedicamento, validateRegistroHumor, validateData, sanitizeString, sanitizeArray, sanitizeDate } from "@/utils/validations"

export function useSaude() {
  const supabase = createClient()
  const { user } = useAuth()

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [registrosHumor, setRegistrosHumor] = useState<RegistroHumor[]>([])
  const [medicamentosTomados, setMedicamentosTomados] = useState<MedicamentoTomado[]>([])
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

  // Carregar medicamentos tomados
  const carregarMedicamentosTomados = useCallback(async () => {
    if (!user) return

    try {
      const hoje = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from("medicamentos_tomados")
        .select("*")
        .eq("data_tomada", hoje)
        .order("created_at", { ascending: false })

      if (error) throw error

      setMedicamentosTomados(data || [])
    } catch (error) {
      console.error("Erro ao carregar medicamentos tomados:", error)
    }
  }, [supabase, user])

  // Carregar medicamentos
  const carregarMedicamentos = useCallback(async () => {
    if (!user) return

    setLoadingMedicamentos(true)

    try {
      const { data, error } = await supabase.from("medicamentos").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setMedicamentos(data || [])
      await carregarMedicamentosTomados()
      calcularResumoMedicamentos(data || [])
    } catch (error) {
      console.error("Erro ao carregar medicamentos:", error)
    } finally {
      setLoadingMedicamentos(false)
    }
  }, [supabase, user, carregarMedicamentosTomados])

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
      // Sanitizar dados de entrada
      const medicamentoSanitizado = {
        ...novoMedicamento,
        nome: sanitizeString(novoMedicamento.nome),
        dosagem: sanitizeString(novoMedicamento.dosagem),
        frequencia: sanitizeString(novoMedicamento.frequencia),
        horarios: sanitizeArray(novoMedicamento.horarios),
        data_inicio: sanitizeDate(novoMedicamento.data_inicio),
        observacoes: novoMedicamento.observacoes ? sanitizeString(novoMedicamento.observacoes) : undefined,
      }

      // Validar dados
      validateData(medicamentoSanitizado, validateMedicamento)

      const { data, error } = await supabase
        .from("medicamentos")
        .insert([
          {
            ...medicamentoSanitizado,
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
      // Sanitizar dados de entrada
      const registroSanitizado = {
        ...novoRegistro,
        data: sanitizeDate(novoRegistro.data),
        fatores: novoRegistro.fatores ? sanitizeArray(novoRegistro.fatores) : undefined,
        notas: novoRegistro.notas ? sanitizeString(novoRegistro.notas) : undefined,
      }

      // Validar dados
      validateData(registroSanitizado, validateRegistroHumor)

      const { data, error } = await supabase
        .from("registros_humor")
        .insert([
          {
            ...registroSanitizado,
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

  // Marcar medicamento como tomado
  const marcarMedicamentoTomado = async (novoMedicamentoTomado: NovoMedicamentoTomado) => {
    if (!user) return null

    try {
      // Sanitizar dados de entrada
      const medicamentoTomadoSanitizado = {
        ...novoMedicamentoTomado,
        data_tomada: sanitizeDate(novoMedicamentoTomado.data_tomada),
        horario_tomada: sanitizeString(novoMedicamentoTomado.horario_tomada),
      }

      // Validações básicas
      if (!medicamentoTomadoSanitizado.medicamento_id) {
        throw new Error("ID do medicamento é obrigatório")
      }
      
      if (!medicamentoTomadoSanitizado.data_tomada) {
        throw new Error("Data da tomada é obrigatória")
      }
      
      if (!medicamentoTomadoSanitizado.horario_tomada) {
        throw new Error("Horário da tomada é obrigatório")
      }

      // Validar formato do horário
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(medicamentoTomadoSanitizado.horario_tomada)) {
        throw new Error("Horário deve ter formato HH:MM")
      }

      const { data, error } = await supabase
        .from("medicamentos_tomados")
        .insert([
          {
            ...medicamentoTomadoSanitizado,
            user_id: user.id,
          },
        ])
        .select()

      if (error) throw error

      await carregarMedicamentosTomados()
      await carregarMedicamentos() // Recarregar para atualizar resumo
      return data?.[0] || null
    } catch (error) {
      console.error("Erro ao marcar medicamento como tomado:", error)
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
    
    // Calcular medicamentos tomados hoje baseado nos registros
    const hoje = new Date().toISOString().split('T')[0]
    const medicamentosUnicos = new Set()
    
    medicamentosTomados.forEach((tomado) => {
      if (tomado.data_tomada === hoje) {
        medicamentosUnicos.add(tomado.medicamento_id)
      }
    })
    
    const tomadosHoje = medicamentosUnicos.size

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
    medicamentosTomados,
    loadingMedicamentos,
    loadingRegistrosHumor,
    resumoMedicamentos,
    resumoHumor,
    adicionarMedicamento,
    adicionarRegistroHumor,
    marcarMedicamentoTomado,
    excluirMedicamento,
    excluirRegistroHumor,
    carregarMedicamentos,
    carregarRegistrosHumor,
    carregarMedicamentosTomados,
    formatarData,
  }
}
