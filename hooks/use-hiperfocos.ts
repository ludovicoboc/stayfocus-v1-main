"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import type {
  HiperfocoProject,
  HiperfocoTask,
  HiperfocoSession,
  AlternationSession,
  ProjectWithTasks,
} from "@/types/hiperfocos"

export function useHiperfocos() {
  const { user } = useAuth()
  const supabase = createClient()
  const [projects, setProjects] = useState<HiperfocoProject[]>([])
  const [tasks, setTasks] = useState<HiperfocoTask[]>([])
  const [sessions, setSessions] = useState<HiperfocoSession[]>([])
  const [alternationSessions, setAlternationSessions] = useState<AlternationSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)
      await Promise.all([fetchProjects(), fetchTasks(), fetchSessions(), fetchAlternationSessions()])
    } catch (error) {
      toast.error("Erro ao carregar dados de hiperfoco. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("hyperfocus_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      toast.error("Erro ao carregar projetos. Verifique sua conexão.")
    }
  }

  const fetchTasks = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("hyperfocus_tasks")
        .select(`
          *,
          project:hyperfocus_projects!inner(user_id)
        `)
        .eq("project.user_id", user.id)
        .order("order_index")

      if (error) throw error
      setTasks(
        data?.map((task) => ({
          id: task.id,
          project_id: task.project_id,
          title: task.title,
          description: task.description,
          completed: task.completed,
          order_index: task.order_index,
          created_at: task.created_at,
          updated_at: task.updated_at,
        })) || [],
      )
    } catch (error) {
      toast.error("Erro ao carregar tarefas. Tente recarregar a página.")
    }
  }

  const fetchSessions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("hyperfocus_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      toast.error("Erro ao carregar sessões de hiperfoco.")
    }
  }

  const fetchAlternationSessions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("alternation_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAlternationSessions(data || [])
    } catch (error) {
      toast.error("Erro ao carregar sessões de alternância.")
    }
  }

  const createProject = async (project: Omit<HiperfocoProject, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from("hyperfocus_projects")
        .insert({
          user_id: user.id,
          ...project,
        })
        .select()
        .single()

      if (error) throw error

      setProjects([data, ...projects])
      toast.success("Projeto criado com sucesso!")
      return data
    } catch (error) {
      toast.error("Erro ao criar projeto. Verifique os dados e tente novamente.")
      return null
    }
  }

  const createTask = async (task: Omit<HiperfocoTask, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase.from("hyperfocus_tasks").insert(task).select().single()

      if (error) throw error

      setTasks([...tasks, data])
      toast.success("Tarefa criada com sucesso!")
      return data
    } catch (error) {
      toast.error("Erro ao criar tarefa. Verifique os dados e tente novamente.")
      return null
    }
  }

  const updateTask = async (id: string, updates: Partial<HiperfocoTask>) => {
    try {
      const { data, error } = await supabase
        .from("hyperfocus_tasks")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setTasks(tasks.map((task) => (task.id === id ? data : task)))
      toast.success("Tarefa atualizada com sucesso!")
      return data
    } catch (error) {
      toast.error("Erro ao atualizar tarefa. Tente novamente.")
      return null
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("hyperfocus_tasks").delete().eq("id", id)

      if (error) throw error

      setTasks(tasks.filter((task) => task.id !== id))
      toast.success("Tarefa excluída com sucesso!")
      return true
    } catch (error) {
      toast.error("Erro ao excluir tarefa. Tente novamente.")
      return false
    }
  }

  const createSession = async (session: Omit<HiperfocoSession, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from("hyperfocus_sessions")
        .insert({
          user_id: user.id,
          ...session,
        })
        .select()
        .single()

      if (error) throw error

      setSessions([data, ...sessions])
      toast.success("Sessão de hiperfoco iniciada!")
      return data
    } catch (error) {
      toast.error("Erro ao criar sessão de hiperfoco. Tente novamente.")
      return null
    }
  }

  const createAlternationSession = async (
    session: Omit<AlternationSession, "id" | "user_id" | "created_at" | "updated_at">,
  ) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from("alternation_sessions")
        .insert({
          user_id: user.id,
          ...session,
        })
        .select()
        .single()

      if (error) throw error

      setAlternationSessions([data, ...alternationSessions])
      toast.success("Sessão de alternância criada com sucesso!")
      return data
    } catch (error) {
      toast.error("Erro ao criar sessão de alternância. Tente novamente.")
      return null
    }
  }

  const updateAlternationSession = async (id: string, updates: Partial<AlternationSession>) => {
    try {
      const { data, error } = await supabase
        .from("alternation_sessions")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setAlternationSessions(alternationSessions.map((session) => (session.id === id ? data : session)))
      toast.success("Sessão de alternância atualizada!")
      return data
    } catch (error) {
      toast.error("Erro ao atualizar sessão de alternância. Tente novamente.")
      return null
    }
  }

  const getProjectsWithTasks = (): ProjectWithTasks[] => {
    return projects.map((project) => ({
      ...project,
      tasks: tasks.filter((task) => task.project_id === project.id),
    }))
  }

  const getActiveAlternationSession = () => {
    return alternationSessions.find((session) => session.is_active)
  }

  return {
    projects,
    tasks,
    sessions,
    alternationSessions,
    loading,
    createProject,
    createTask,
    updateTask,
    deleteTask,
    createSession,
    createAlternationSession,
    updateAlternationSession,
    getProjectsWithTasks,
    getActiveAlternationSession,
    refetch: fetchData,
  }
}
