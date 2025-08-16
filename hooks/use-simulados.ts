"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useConcursos } from "@/hooks/use-concursos"
import type { Simulado, SimuladoData, SimuladoResultado, SimuladoStatus } from "@/types/simulados"

export function useSimulados() {
  const { user } = useAuth()
  const supabase = createClient()
  const { concursos } = useConcursos()
  const [simuladoAtual, setSimuladoAtual] = useState<Simulado | null>(null)
  const [status, setStatus] = useState<SimuladoStatus>("idle")
  const [historico, setHistorico] = useState<SimuladoResultado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchHistorico()
    }
  }, [user])

  const fetchHistorico = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("simulation_history")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setHistorico(data || [])
    } catch (error) {
      console.error("Error fetching simulation history:", error)
    }
  }

  const gerarSimulado = async (concursoId: string, numeroQuestoes: number) => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      // Fetch questions from the competition
      const { data: questoes, error: questoesError } = await supabase
        .from("competition_questions")
        .select("*")
        .eq("competition_id", concursoId)
        .limit(numeroQuestoes)

      if (questoesError) throw questoesError

      if (!questoes || questoes.length === 0) {
        setError("Nenhuma questão encontrada para este concurso.")
        return false
      }

      if (questoes.length < numeroQuestoes) {
        setError(`Apenas ${questoes.length} questões disponíveis para este concurso.`)
        return false
      }

      // Get competition info
      const concurso = concursos.find((c) => c.id === concursoId)
      if (!concurso) {
        setError("Concurso não encontrado.")
        return false
      }

      // Convert to simulado format
      const simuladoData: SimuladoData = {
        metadata: {
          titulo: `Simulado - ${concurso.title}`,
          concurso: concurso.title,
          ano: new Date().getFullYear(),
          totalQuestoes: questoes.length,
          autor: "StayFocus",
        },
        questoes: questoes.map((q, index) => ({
          id: index + 1,
          enunciado: q.question_text,
          alternativas: q.options?.reduce((acc: any, opt: any, idx: number) => {
            const letter = String.fromCharCode(97 + idx) // a, b, c, d, e...
            acc[letter] = opt.text
            return acc
          }, {}) || { a: "Opção A", b: "Opção B", c: "Opção C", d: "Opção D" },
          gabarito: q.correct_answer || "a",
          assunto: q.topic_id || undefined,
          explicacao: q.explanation || undefined,
        })),
      }

      return await carregarSimulado(simuladoData, concursoId)
    } catch (error) {
      console.error("Error generating simulation:", error)
      setError("Erro ao gerar simulado. Tente novamente.")
      return false
    } finally {
      setLoading(false)
    }
  }

  const carregarSimulado = async (data: SimuladoData, concursoId?: string) => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      // Validate data
      if (!data.metadata || !data.questoes || data.questoes.length === 0) {
        setError("Dados do simulado inválidos.")
        return false
      }

      // Create simulation in database
      const { data: simulado, error: simuladoError } = await supabase
        .from("simulations")
        .insert({
          user_id: user.id,
          competition_id: concursoId || null,
          title: data.metadata.titulo,
          metadata: data.metadata,
          questions: data.questoes,
          total_questions: data.questoes.length,
          user_answers: {},
          score: 0,
          completed: false,
        })
        .select()
        .single()

      if (simuladoError) throw simuladoError

      setSimuladoAtual(simulado)
      setStatus("reviewing")
      return true
    } catch (error) {
      console.error("Error loading simulation:", error)
      setError("Erro ao carregar simulado. Tente novamente.")
      return false
    } finally {
      setLoading(false)
    }
  }

  const carregarDeArquivo = async (file: File) => {
    setLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text) as SimuladoData

      return await carregarSimulado(data)
    } catch (error) {
      console.error("Error loading file:", error)
      setError("Erro ao carregar arquivo. Verifique o formato JSON.")
      return false
    } finally {
      setLoading(false)
    }
  }

  const carregarDeTexto = async (jsonText: string) => {
    setLoading(true)
    setError(null)

    try {
      const data = JSON.parse(jsonText) as SimuladoData
      return await carregarSimulado(data)
    } catch (error) {
      console.error("Error parsing JSON:", error)
      setError("Erro ao processar JSON. Verifique o formato.")
      return false
    } finally {
      setLoading(false)
    }
  }

  const responderQuestao = async (questaoId: number, resposta: string) => {
    if (!simuladoAtual?.id) return false

    try {
      const novasRespostas = {
        ...simuladoAtual.user_answers,
        [questaoId]: resposta,
      }

      const { error } = await supabase
        .from("simulations")
        .update({
          user_answers: novasRespostas,
          updated_at: new Date().toISOString(),
        })
        .eq("id", simuladoAtual.id)
        .eq("user_id", user?.id)

      if (error) throw error

      setSimuladoAtual({
        ...simuladoAtual,
        user_answers: novasRespostas,
      })

      return true
    } catch (error) {
      console.error("Error saving answer:", error)
      return false
    }
  }

  const finalizarSimulado = async () => {
    if (!simuladoAtual?.id || !user) return false

    try {
      // Calculate score
      let score = 0
      simuladoAtual.questions.forEach((questao) => {
        const resposta = simuladoAtual.user_answers[questao.id]
        if (resposta === questao.gabarito) {
          score++
        }
      })

      const percentage = (score / simuladoAtual.total_questions) * 100

      // Update simulation
      const { error: updateError } = await supabase
        .from("simulations")
        .update({
          score,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", simuladoAtual.id)
        .eq("user_id", user.id)

      if (updateError) throw updateError

      // Add to history
      const { error: historyError } = await supabase.from("simulation_history").insert({
        user_id: user.id,
        simulation_id: simuladoAtual.id,
        score,
        total_questions: simuladoAtual.total_questions,
        percentage,
        answers: simuladoAtual.user_answers,
      })

      if (historyError) throw historyError

      setSimuladoAtual({
        ...simuladoAtual,
        score,
        completed: true,
        completed_at: new Date().toISOString(),
      })

      setStatus("results")
      await fetchHistorico()

      return true
    } catch (error) {
      console.error("Error finalizing simulation:", error)
      return false
    }
  }

  const resetSimulado = () => {
    setSimuladoAtual(null)
    setStatus("idle")
    setError(null)
  }

  const carregarSimuladoPersonalizado = async () => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      // Try to get questions from localStorage
      const questoesStorage = localStorage.getItem("simulado_personalizado_questoes")
      if (!questoesStorage) {
        setError("Nenhuma questão personalizada encontrada.")
        return false
      }

      const questoesData = JSON.parse(questoesStorage)
      if (!Array.isArray(questoesData) || questoesData.length === 0) {
        setError("Dados de questões inválidos.")
        return false
      }

      // Transform questions to simulado format
      const simuladoData: SimuladoData = {
        metadata: {
          titulo: "Simulado Personalizado",
          concurso: "Questões Selecionadas",
          ano: new Date().getFullYear(),
          totalQuestoes: questoesData.length,
          autor: "StayFocus",
        },
        questoes: questoesData.map((q: any, index: number) => {
          // Convert options array to object with letters
          const alternativas: any = {}
          if (q.options && Array.isArray(q.options)) {
            q.options.forEach((opt: any, idx: number) => {
              const letter = String.fromCharCode(97 + idx) // a, b, c, d, e...
              alternativas[letter] = opt.text || opt
            })
          } else if (q.alternativas) {
            // If already in the correct format
            Object.assign(alternativas, q.alternativas)
          }

          // Find correct answer key
          let gabarito = "a"
          if (q.options && Array.isArray(q.options)) {
            const correctIndex = q.options.findIndex((opt: any) => opt.isCorrect)
            if (correctIndex >= 0) {
              gabarito = String.fromCharCode(97 + correctIndex)
            }
          } else if (q.gabarito) {
            gabarito = q.gabarito
          } else if (q.correct_answer) {
            gabarito = q.correct_answer
          }

          return {
            id: index + 1,
            enunciado: q.question_text || q.enunciado || q.pergunta || "",
            alternativas,
            gabarito,
            assunto: q.topic || q.assunto || q.subject,
            dificuldade: q.difficulty || q.dificuldade,
            explicacao: q.explanation || q.explicacao,
          }
        }),
      }

      // Get competition ID from first question if available
      const competitionId = questoesData[0]?.competition_id || null

      return await carregarSimulado(simuladoData, competitionId)
    } catch (error) {
      console.error("Error loading personalized simulation:", error)
      setError("Erro ao carregar simulado personalizado.")
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    simuladoAtual,
    status,
    historico,
    loading,
    error,
    gerarSimulado,
    carregarDeArquivo,
    carregarDeTexto,
    responderQuestao,
    finalizarSimulado,
    resetSimulado,
    clearError: () => setError(null),
    carregarSimuladoPersonalizado,
  }
}
