"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Save, X, ArrowLeft } from "lucide-react"
import type { SelfKnowledgeNote, SelfKnowledgeCategory } from "@/hooks/use-self-knowledge"

interface EditorNotasProps {
  note?: SelfKnowledgeNote | null
  category: SelfKnowledgeCategory
  onSave: (title: string, content: string) => Promise<void>
  onCancel: () => void
  isCreating?: boolean
}

export function EditorNotas({ note, category, onSave, onCancel, isCreating = false }: EditorNotasProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    } else {
      setTitle("")
      setContent("")
    }
  }, [note])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return

    setSaving(true)
    try {
      await onSave(title.trim(), content.trim())
    } finally {
      setSaving(false)
    }
  }

  const getCategoryTitle = () => {
    switch (category) {
      case "quem_sou":
        return "Quem sou"
      case "meus_porques":
        return "Meus porquês"
      case "meus_padroes":
        return "Meus padrões"
      default:
        return ""
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-white">
            {isCreating ? `Nova nota - ${getCategoryTitle()}` : `Editando - ${getCategoryTitle()}`}
          </h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim() || saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <div>
          <Input
            placeholder="Título da nota..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white text-lg font-medium"
          />
        </div>

        <div className="flex-1">
          <Textarea
            placeholder="Escreva suas reflexões aqui..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white min-h-[400px] resize-none"
          />
        </div>
      </div>
    </div>
  )
}
