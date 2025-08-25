"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-provider"

export type SelfKnowledgeCategory = "quem_sou" | "meus_porques" | "meus_padroes"

export interface SelfKnowledgeNote {
  id: string
  user_id: string
  category: SelfKnowledgeCategory
  title: string
  content: string
  created_at: string
  updated_at: string
}

export function useSelfKnowledge() {
  const { user } = useAuth()
  const supabase = createClient()
  const [notes, setNotes] = useState<SelfKnowledgeNote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user) {
      fetchNotes()
    }
  }, [user])

  const fetchNotes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("self_knowledge_notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const createNote = async (category: SelfKnowledgeCategory, title: string, content: string) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from("self_knowledge_notes")
        .insert({
          user_id: user.id,
          category,
          title,
          content,
        })
        .select()
        .single()

      if (error) throw error

      setNotes([data, ...notes])
      return data
    } catch (error) {
      console.error("Error creating note:", error)
      return null
    }
  }

  const updateNote = async (id: string, title: string, content: string) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from("self_knowledge_notes")
        .update({
          title,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) throw error

      setNotes(notes.map((note) => (note.id === id ? data : note)))
      return data
    } catch (error) {
      console.error("Error updating note:", error)
      return null
    }
  }

  const deleteNote = async (id: string) => {
    if (!user) return false

    try {
      const { error } = await supabase.from("self_knowledge_notes").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error

      setNotes(notes.filter((note) => note.id !== id))
      return true
    } catch (error) {
      console.error("Error deleting note:", error)
      return false
    }
  }

  const getFilteredNotes = (category: SelfKnowledgeCategory) => {
    return notes
      .filter((note) => note.category === category)
      .filter((note) => {
        if (!searchTerm) return true
        return (
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
  }

  return {
    notes,
    loading,
    searchTerm,
    setSearchTerm,
    createNote,
    updateNote,
    deleteNote,
    getFilteredNotes,
    refetch: fetchNotes,
  }
}
