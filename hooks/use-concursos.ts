"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import type { Concurso, Disciplina, Questao, Simulado } from "@/types/concursos"

export function useConcursos() {
  const { user } = useAuth()
  const supabase = createClient()
  const [concursos, setConcursos] = useState<Concurso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchConcursos()
    }
  }, [user])

  const fetchConcursos = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setConcursos(data || [])
    } catch (error) {
      console.error("Error fetching competitions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConcursoCompleto = async (id: string) => {
    if (!user) return null

    try {
      // Fetch competition
      const { data: concursoData, error: concursoError } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (concursoError) throw concursoError

      // Fetch subjects
      const { data: disciplinasData, error: disciplinasError } = await supabase
        .from("competition_subjects")
        .select("*")
        .eq("competition_id", id)
        .order("created_at", { ascending: true })

      if (disciplinasError) throw disciplinasError

      // Fetch topics for each subject
      const disciplinasComTopicos: Disciplina[] = []

      for (const disciplina of disciplinasData) {
        const { data: topicosData, error: topicosError } = await supabase
          .from("competition_topics")
          .select("*")
          .eq("subject_id", disciplina.id)
          .order("created_at", { ascending: true })

        if (topicosError) throw topicosError

        disciplinasComTopicos.push({
          ...disciplina,
          topicos: topicosData,
        })
      }

      return {
        ...concursoData,
        disciplinas: disciplinasComTopicos,
      } as Concurso
    } catch (error) {
      console.error("Error fetching complete competition:", error)
      return null
    }
  }

  const adicionarConcurso = async (concurso: Concurso) => {
    if (!user) return null

    try {
      // Insert competition
      const { data: concursoData, error: concursoError } = await supabase
        .from("competitions")
        .insert({
          user_id: user.id,
          title: concurso.title,
          organizer: concurso.organizer,
          registration_date: concurso.registration_date,
          exam_date: concurso.exam_date,
          edital_link: concurso.edital_link,
          status: concurso.status,
        })
        .select()
        .single()

      if (concursoError) throw concursoError

      // Insert subjects and topics
      if (concurso.disciplinas && concurso.disciplinas.length > 0) {
        for (const disciplina of concurso.disciplinas) {
          const { data: disciplinaData, error: disciplinaError } = await supabase
            .from("competition_subjects")
            .insert({
              competition_id: concursoData.id,
              name: disciplina.name,
              progress: 0,
            })
            .select()
            .single()

          if (disciplinaError) throw disciplinaError

          if (disciplina.topicos && disciplina.topicos.length > 0) {
            const topicosToInsert = disciplina.topicos.map((topico) => ({
              subject_id: disciplinaData.id,
              name: topico.name || topico,
              completed: false,
            }))

            const { error: topicosError } = await supabase.from("competition_topics").insert(topicosToInsert)

            if (topicosError) throw topicosError
          }
        }
      }

      // Refresh the list
      await fetchConcursos()
      return concursoData
    } catch (error) {
      console.error("Error adding competition:", error)
      return null
    }
  }

  const atualizarConcurso = async (id: string, dados: Partial<Concurso>) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from("competitions")
        .update({
          title: dados.title,
          organizer: dados.organizer,
          registration_date: dados.registration_date,
          exam_date: dados.exam_date,
          edital_link: dados.edital_link,
          status: dados.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error

      // Refresh the list
      await fetchConcursos()
      return true
    } catch (error) {
      console.error("Error updating competition:", error)
      return false
    }
  }

  const removerConcurso = async (id: string) => {
    if (!user) return false

    try {
      const { error } = await supabase.from("competitions").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error

      setConcursos(concursos.filter((c) => c.id !== id))
      return true
    } catch (error) {
      console.error("Error removing competition:", error)
      return false
    }
  }

  const atualizarProgressoDisciplina = async (disciplinaId: string, progresso: number) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from("competition_subjects")
        .update({
          progress: progresso,
          updated_at: new Date().toISOString(),
        })
        .eq("id", disciplinaId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error updating subject progress:", error)
      return false
    }
  }

  const atualizarTopicoCompletado = async (topicoId: string, completado: boolean) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from("competition_topics")
        .update({
          completed: completado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", topicoId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error updating topic completion:", error)
      return false
    }
  }

  // Questões
  const adicionarQuestao = async (questao: Questao) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from("competition_questions")
        .insert({
          competition_id: questao.competition_id,
          subject_id: questao.subject_id,
          topic_id: questao.topic_id,
          question_text: questao.question_text,
          options: questao.options,
          correct_answer: questao.correct_answer,
          explanation: questao.explanation,
          difficulty: questao.difficulty,
          is_ai_generated: questao.is_ai_generated || false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error adding question:", error)
      return null
    }
  }

  const buscarQuestoesConcurso = async (concursoId: string) => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from("competition_questions")
        .select("*")
        .eq("competition_id", concursoId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as Questao[]
    } catch (error) {
      console.error("Error fetching competition questions:", error)
      return []
    }
  }

  // Simulados
  const adicionarSimulado = async (simulado: Simulado) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from("competition_simulations")
        .insert({
          competition_id: simulado.competition_id,
          user_id: user.id,
          title: simulado.title,
          questions: simulado.questions,
          is_favorite: simulado.is_favorite || false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error adding simulation:", error)
      return null
    }
  }

  const buscarSimuladosConcurso = async (concursoId: string) => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from("competition_simulations")
        .select("*")
        .eq("competition_id", concursoId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as Simulado[]
    } catch (error) {
      console.error("Error fetching competition simulations:", error)
      return []
    }
  }

  const marcarSimuladoFavorito = async (simuladoId: string, favorito: boolean) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from("competition_simulations")
        .update({
          is_favorite: favorito,
          updated_at: new Date().toISOString(),
        })
        .eq("id", simuladoId)
        .eq("user_id", user.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error marking simulation as favorite:", error)
      return false
    }
  }

  return {
    concursos,
    loading,
    fetchConcursos,
    fetchConcursoCompleto,
    adicionarConcurso,
    atualizarConcurso,
    removerConcurso,
    atualizarProgressoDisciplina,
    atualizarTopicoCompletado,
    adicionarQuestao,
    buscarQuestoesConcurso,
    adicionarSimulado,
    buscarSimuladosConcurso,
    marcarSimuladoFavorito,
  }
}
