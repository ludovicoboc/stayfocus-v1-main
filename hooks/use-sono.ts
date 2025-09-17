"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-provider"
import { createClient } from "@/lib/supabase"
import { 
  RegistroSono, 
  ConfiguracaoLembretes, 
  EstatisticasSono,
  RegistroSonoInsert,
  ConfiguracaoLembretesInsert
} from "@/types/sono"
import { validateRegistroSono, validateData, sanitizeString, sanitizeDate, sanitizeNumber } from "@/utils/validations"

export function useSono() {
  const { user } = useAuth()
  const supabase = createClient()
  const [registrosSono, setRegistrosSono] = useState<RegistroSono[]>([])
  const [configuracaoLembretes, setConfiguracaoLembretes] = useState<ConfiguracaoLembretes | null>(null)
  const [estatisticas, setEstatisticas] = useState<EstatisticasSono | null>(null)
  const [loading, setLoading] = useState(true)

  // Calcular estatísticas de sono com RPC
  const calcularEstatisticas = useCallback(async () => {
    if (!user) return null

    try {
      const { data, error } = await supabase.rpc('get_sleep_statistics', {
        p_user_id: user.id,
        days_limit: 7
      })

      if (error) throw error

      // A resposta do RPC já corresponde à interface EstatisticasSono
      const stats = data as EstatisticasSono
      setEstatisticas(stats)
      return stats
    } catch (error) {
      console.error("Erro ao calcular estatísticas com RPC:", error)
      setEstatisticas(null) // Limpa estatísticas em caso de erro
      return null
    }
  }, [user, supabase])


  // Carregar registros de sono
  const fetchRegistrosSono = useCallback(async (diasAtras: number = 30) => {
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
      
      // Após carregar os registros, calcula as estatísticas
      if (registros.length > 0) {
        await calcularEstatisticas()
      }
      
      return { data: registros, error: null }
    } catch (error) {
      console.error("Erro ao carregar registros de sono:", error)
      return { data: [], error }
    } finally {
      setLoading(false)
    }
  }, [user, supabase, calcularEstatisticas])

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

  // Carregar configuração de lembretes
  const carregarLembretes = useCallback(async () => {
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
  }, [user, supabase])

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
  }, [user, fetchRegistrosSono, carregarLembretes])

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
