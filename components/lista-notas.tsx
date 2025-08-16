"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import type { SelfKnowledgeNote, SelfKnowledgeCategory } from "@/hooks/use-self-knowledge"

interface ListaNotasProps {
  notes: SelfKnowledgeNote[]
  category: SelfKnowledgeCategory
  searchTerm: string
  onSearchChange: (term: string) => void
  onCreateNote: () => void
  onEditNote: (note: SelfKnowledgeNote) => void
  onDeleteNote: (id: string) => void
  selectedNoteId?: string
}

export function ListaNotas({
  notes,
  category,
  searchTerm,
  onSearchChange,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  selectedNoteId,
}: ListaNotasProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDeleteNote(id)
    } finally {
      setDeletingId(null)
    }
  }

  const getCategoryInfo = () => {
    switch (category) {
      case "quem_sou":
        return {
          title: "Quem sou",
          description: "Registre suas preferências, aversões e características pessoais estáveis",
          placeholder: "Suas notas em Quem sou",
        }
      case "meus_porques":
        return {
          title: "Meus porquês",
          description: "Documente motivações e valores fundamentais que guiam suas decisões",
          placeholder: "Suas notas em Meus porquês",
        }
      case "meus_padroes":
        return {
          title: "Meus padrões",
          description: "Anote reações emocionais típicas e estratégias eficazes em momentos de crise",
          placeholder: "Suas notas em Meus padrões",
        }
      default:
        return { title: "", description: "", placeholder: "" }
    }
  }

  const categoryInfo = getCategoryInfo()

  return (
    <div className="h-full flex flex-col">
      {/* Category Header */}
      <div className="bg-orange-800 p-4 rounded-lg mb-6">
        <h2 className="text-white font-semibold mb-2">{categoryInfo.title}</h2>
        <p className="text-orange-100 text-sm">{categoryInfo.description}</p>
      </div>

      {/* Section Title and New Note Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-medium">{categoryInfo.title}</h3>
        <Button onClick={onCreateNote} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova nota
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Buscar notas..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-slate-800 border-slate-600 text-white pl-10"
        />
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">Nenhuma nota registrada nesta seção ainda</p>
          </div>
        ) : (
          notes.map((note) => (
            <Card
              key={note.id}
              className={`bg-slate-800 border-slate-700 cursor-pointer transition-colors hover:bg-slate-750 ${
                selectedNoteId === note.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0" onClick={() => onEditNote(note)}>
                    <h4 className="text-white font-medium truncate mb-1">{note.title}</h4>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-2">{note.content}</p>
                    <p className="text-slate-500 text-xs">
                      {new Date(note.updated_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditNote(note)
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(note.id)
                      }}
                      disabled={deletingId === note.id}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
