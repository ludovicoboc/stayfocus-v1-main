"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase"
import { 
  RegistroSono, 
  ConfiguracaoLembretes, 
  EstatisticasSono,
  RegistroSonoInsert,
  RegistroSonoUpdate,
  ConfiguracaoLembretesInsert,
  ConfiguracaoLembretesUpdate
} from "@/types/sono"
import { validateRegistroSono, validateData, sanitizeString, sanitizeDate, sanitizeNumber } from "@/utils/validations"

export function useSono() {
  const { user } = useAuth()
  const supabase = createClient()
  const [registrosSono, setRegistrosSono] = useState<RegistroSono[]>([])
  const [configuracaoLembretes, setConfiguracaoLembretes] = useState<ConfiguracaoLembretes | null>(null)
  const [estatisticas, setEstatisticas] = useState<EstatisticasSono | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar registros de sono
  const fetchRegistrosSono = async (diasAtras: number = 30) => {
    if (!user) {
      setLoading(false)
      return { data: [], error: null }
    }

    try {
      setLoading(true)
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - diasAtras)
      
      const { data, error } = await supabase
        .from("sleep_records")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", dataLimite.toISOString().split('T')[0])
        .order("date", { ascending: false })

      if (error) throw error
      
      const registros = data || []
      setRegistrosSono(registros)
      
      return { data: registros, error: null }
    } catch (error) {
      console.error("Erro ao carregar registros de sono:", error)
      return { data: [], error }
    } finally {
      setLoading(false)
    }
  }

  // Salvar novo registro de sono
  const salvarRegistroSono = async (registro: RegistroSonoInsert) => {
    if (!user) return { error: new Error("Usuário não autenticado") }

    try {
      // Sanitizar dados de entrada
      const registroSanitizado = {
        ...registro,
        date: sanitizeDate(registro.date),
        bedtime: sanitizeString(registro.bedtime),
        wake_time: sanitizeString(registro.wake_time),
        sleep_quality: sanitizeNumber(registro.sleep_quality),
        notes: registro.notes ? sanitizeString(registro.notes) : undefined,
      }

      // Validar dados antes de enviar
      validateData(registroSanitizado, validateRegistroSono)

      // Verificar se já existe um registro para a data
      const { data: registroExistente } = await supabase
        .from("sleep_records")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", registroSanitizado.date)
        .single()

      let result

      if (registroExistente) {
        // Atualizar registro existente
        const { data, error } = await supabase
          .from("sleep_records")
          .update({
            bedtime: registroSanitizado.bedtime,
            wake_time: registroSanitizado.wake_time,
            sleep_quality: registroSanitizado.sleep_quality,
            notes: registroSanitizado.notes,
            updated_at: new Date().toISOString()
          })
          .eq("id", registroExistente.id)
          .eq("user_id", user.id)
          .select()
          .single()

        result = { data, error }

        if (!error && data) {
          setRegistrosSono(prev => 
            prev.map(r => r.id === data.id ? data : r)
          )
        }
      } else {
        // Criar novo registro
        const { data, error } = await supabase
          .from("sleep_records")
          .insert({
            user_id: user.id,
            bedtime: registro.bedtime,
            wake_time: registro.wake_time,
            sleep_quality: registro.sleep_quality,
            notes: registro.notes || null,
            date: registro.date
          })
          .select()
          .single()

        result = { data, error }

        if (!error && data) {
          setRegistrosSono(prev => [data, ...prev])
        }
      }

      // Recalcular estatísticas após salvar
      if (!result.error) {
        await calcularEstatisticas()
      }

      return result
    } catch (error) {
      console.error("Erro ao salvar registro de sono:", error)
      return { error }
    }
  }

  // Atualizar configurações de lembretes
  const atualizarLembretes = async (configuracao: ConfiguracaoLembretesInsert) => {
    if (!user) return { error: new Error("Usuário não autenticado") }

    try {
      // Verificar se já existe configuração
      const { data: configExistente } = await supabase
        .from("sleep_reminders")
        .select("id")
        .eq("user_id", user.id)
        .single()

      let result

      if (configExistente) {
        // Atualizar configuração existente
        const { data, error } = await supabase
          .from("sleep_reminders")
          .update({
            bedtime_reminder_enabled: configuracao.bedtime_reminder_enabled,
            bedtime_reminder_time: configuracao.bedtime_reminder_time,
            wake_reminder_enabled: configuracao.wake_reminder_enabled,
            wake_reminder_time: configuracao.wake_reminder_time,
            weekdays: configuracao.weekdays,
            message: configuracao.message || null,
            active: configuracao.active,
            updated_at: new Date().toISOString()
          })
          .eq("id", configExistente.id)
          .eq("user_id", user.id)
          .select()
          .single()

        result = { data, error }
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from("sleep_reminders")
          .insert({
            user_id: user.id,
            bedtime_reminder_enabled: configuracao.bedtime_reminder_enabled,
            bedtime_reminder_time: configuracao.bedtime_reminder_time,
            wake_reminder_enabled: configuracao.wake_reminder_enabled,
            wake_reminder_time: configuracao.wake_reminder_time,
            weekdays: configuracao.weekdays || null,
            message: configuracao.message || null,
            active: configuracao.active
          })
          .select()
          .single()

        result = { data, error }
      }

      if (!result.error && result.data) {
        setConfiguracaoLembretes(result.data)
      }

      return result
    } catch (error) {
      console.error("Erro ao atualizar lembretes:", error)
      return { error }
    }
  }

  // Calcular estatísticas de sono
  const calcularEstatisticas = async (): Promise<EstatisticasSono | null> => {
    if (!user || registrosSono.length === 0) return null

    try {
      // Buscar registros dos últimos 7 dias
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - 7)
      
      const registrosRecentes = registrosSono.filter(registro => 
        new Date(registro.date) >= dataLimite
      )

      if (registrosRecentes.length === 0) {
        return {
          mediaHorasSono: 0,
          mediaQualidade: 0,
          consistencia: 0,
          totalRegistros: 0,
          tendenciaHoras: 'estavel',
          tendenciaQualidade: 'estavel',
          registrosPorDia: {},
          melhorDia: null,
          piorDia: null,
          horaIdealDormir: null,
          horaIdealAcordar: null
        }
      }

      // Calcular horas de sono para cada registro
      const dadosComHoras = registrosRecentes.map(registro => {
        const horasSono = calcularHorasSono(registro.bedtime, registro.wake_time)
        return { ...registro, horasSono }
      })

      // Calcular médias
      const mediaHorasSono = dadosComHoras.reduce((acc, r) => acc + r.horasSono, 0) / dadosComHoras.length
      const mediaQualidade = dadosComHoras.reduce((acc, r) => acc + r.sleep_quality, 0) / dadosComHoras.length

      // Calcular consistência (baseada na variação dos horários)
      const horariosDormir = dadosComHoras.map(r => timeStringToMinutes(r.bedtime))
      const horariosAcordar = dadosComHoras.map(r => timeStringToMinutes(r.wake_time))
      
      const variancaDormir = calcularVariancia(horariosDormir)
      const variancaAcordar = calcularVariancia(horariosAcordar)
      const consistencia = Math.max(0, 100 - (variancaDormir + variancaAcordar) / 120) // Normalizado para 0-100%

      // Encontrar melhor e pior dia
      const melhorRegistro = dadosComHoras.reduce((max, r) => r.sleep_quality > max.sleep_quality ? r : max)
      const piorRegistro = dadosComHoras.reduce((min, r) => r.sleep_quality < min.sleep_quality ? r : min)

      // Horários mais comuns
      const horaIdealDormir = calcularModa(dadosComHoras.map(r => r.bedtime))
      const horaIdealAcordar = calcularModa(dadosComHoras.map(r => r.wake_time))

      // Criar mapa de registros por dia
      const registrosPorDia: EstatisticasSono['registrosPorDia'] = {}
      dadosComHoras.forEach(registro => {
        const dia = new Date(registro.date).toLocaleDateString('pt-BR', { weekday: 'long' })
        registrosPorDia[dia] = {
          horas: registro.horasSono,
          qualidade: registro.sleep_quality,
          horaDormir: registro.bedtime,
          horaAcordar: registro.wake_time
        }
      })

      // Calcular tendências (comparar primeira metade com segunda metade)
      const metade = Math.floor(dadosComHoras.length / 2)
      const primeiraMetade = dadosComHoras.slice(-metade)
      const segundaMetade = dadosComHoras.slice(0, metade)

      const mediaHorasPrimeira = primeiraMetade.reduce((acc, r) => acc + r.horasSono, 0) / primeiraMetade.length
      const mediaHorasSegunda = segundaMetade.reduce((acc, r) => acc + r.horasSono, 0) / segundaMetade.length

      const mediaQualidadePrimeira = primeiraMetade.reduce((acc, r) => acc + r.sleep_quality, 0) / primeiraMetade.length
      const mediaQualidadeSegunda = segundaMetade.reduce((acc, r) => acc + r.sleep_quality, 0) / segundaMetade.length

      const tendenciaHoras = mediaHorasSegunda > mediaHorasPrimeira + 0.5 ? 'aumentando' : 
                            mediaHorasSegunda < mediaHorasPrimeira - 0.5 ? 'diminuindo' : 'estavel'
      
      const tendenciaQualidade = mediaQualidadeSegunda > mediaQualidadePrimeira + 0.5 ? 'melhorando' : 
                                mediaQualidadeSegunda < mediaQualidadePrimeira - 0.5 ? 'piorando' : 'estavel'

      const estatisticasCalculadas: EstatisticasSono = {
        mediaHorasSono: Math.round(mediaHorasSono * 10) / 10,
        mediaQualidade: Math.round(mediaQualidade * 10) / 10,
        consistencia: Math.round(consistencia),
        totalRegistros: registrosRecentes.length,
        tendenciaHoras,
        tendenciaQualidade,
        registrosPorDia,
        melhorDia: new Date(melhorRegistro.date).toLocaleDateString('pt-BR', { weekday: 'long' }),
        piorDia: new Date(piorRegistro.date).toLocaleDateString('pt-BR', { weekday: 'long' }),
        horaIdealDormir,
        horaIdealAcordar
      }

      setEstatisticas(estatisticasCalculadas)
      return estatisticasCalculadas
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error)
      return null
    }
  }

  // Carregar configuração de lembretes
  const carregarLembretes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("sleep_reminders")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!error && data) {
        setConfiguracaoLembretes(data)
      }
    } catch (error) {
      console.error("Erro ao carregar lembretes:", error)
    }
  }

  // Excluir registro de sono
  const excluirRegistroSono = async (id: string) => {
    if (!user) return { error: new Error("Usuário não autenticado") }

    try {
      const { error } = await supabase
        .from("sleep_records")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (!error) {
        setRegistrosSono(prev => prev.filter(r => r.id !== id))
        await calcularEstatisticas()
      }

      return { error }
    } catch (error) {
      console.error("Erro ao excluir registro:", error)
      return { error }
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      fetchRegistrosSono()
      carregarLembretes()
    }
  }, [user])

  // Recalcular estatísticas quando registros mudarem
  useEffect(() => {
    if (registrosSono.length > 0) {
      calcularEstatisticas()
    }
  }, [registrosSono])

  return {
    registrosSono,
    configuracaoLembretes,
    estatisticas,
    loading,
    fetchRegistrosSono,
    salvarRegistroSono,
    atualizarLembretes,
    calcularEstatisticas,
    carregarLembretes,
    excluirRegistroSono
  }
}

// Funções auxiliares
function calcularHorasSono(bedtime: string, wakeTime: string): number {
  const [bedH, bedM] = bedtime.split(':').map(Number)
  const [wakeH, wakeM] = wakeTime.split(':').map(Number)

  const bedMinutes = bedH * 60 + bedM
  let wakeMinutes = wakeH * 60 + wakeM

  // Se wake time é menor que bedtime, passou da meia-noite
  if (wakeMinutes < bedMinutes) {
    wakeMinutes += 24 * 60
  }

  return (wakeMinutes - bedMinutes) / 60
}

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function calcularVariancia(values: number[]): number {
  const mean = values.reduce((acc, val) => acc + val, 0) / values.length
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

function calcularModa(values: string[]): string | null {
  const frequency: { [key: string]: number } = {}
  
  values.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1
  })

  let maxFreq = 0
  let mode = null

  for (const [value, freq] of Object.entries(frequency)) {
    if (freq > maxFreq) {
      maxFreq = freq
      mode = value
    }
  }

  return mode
}
