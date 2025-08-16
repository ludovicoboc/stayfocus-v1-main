"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useSelfKnowledge, type SelfKnowledgeCategory, type SelfKnowledgeNote } from "@/hooks/use-self-knowledge"
import { ListaNotas } from "@/components/lista-notas"
import { EditorNotas } from "@/components/editor-notas"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Menu, User, BookOpen, Lightbulb } from "lucide-react"
import Link from "next/link"

type ViewMode = "list" | "editor"

export default function AutoconhecimentoPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { loading, searchTerm, setSearchTerm, createNote, updateNote, deleteNote, getFilteredNotes } =
    useSelfKnowledge()

  const [activeTab, setActiveTab] = useState<SelfKnowledgeCategory>("quem_sou")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedNote, setSelectedNote] = useState<SelfKnowledgeNote | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Login Necessário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-300 text-center mb-4">Você precisa estar logado para acessar esta página.</div>
            <Link href="/auth">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreateNote = () => {
    setSelectedNote(null)
    setIsCreating(true)
    setViewMode("editor")
  }

  const handleEditNote = (note: SelfKnowledgeNote) => {
    setSelectedNote(note)
    setIsCreating(false)
    setViewMode("editor")
  }

  const handleSaveNote = async (title: string, content: string) => {
    if (isCreating) {
      await createNote(activeTab, title, content)
    } else if (selectedNote) {
      await updateNote(selectedNote.id, title, content)
    }
    setViewMode("list")
    setSelectedNote(null)
    setIsCreating(false)
  }

  const handleCancelEdit = () => {
    setViewMode("list")
    setSelectedNote(null)
    setIsCreating(false)
  }

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id)
  }

  const filteredNotes = getFilteredNotes(activeTab)

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-slate-400">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-orange-400" />
              <h1 className="text-xl font-semibold text-white">Notas de Autoconhecimento</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-slate-400">
              <Lightbulb className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-400" onClick={signOut}>
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {viewMode === "list" ? (
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SelfKnowledgeCategory)}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-800 mb-6">
                <TabsTrigger value="quem_sou" className="text-slate-300 data-[state=active]:bg-orange-600">
                  Quem sou
                </TabsTrigger>
                <TabsTrigger value="meus_porques" className="text-slate-300 data-[state=active]:bg-orange-600">
                  Meus porquês
                </TabsTrigger>
                <TabsTrigger value="meus_padroes" className="text-slate-300 data-[state=active]:bg-orange-600">
                  Meus padrões
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quem_sou" className="mt-0">
                <ListaNotas
                  notes={filteredNotes}
                  category="quem_sou"
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onCreateNote={handleCreateNote}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  selectedNoteId={selectedNote?.id}
                />
              </TabsContent>

              <TabsContent value="meus_porques" className="mt-0">
                <ListaNotas
                  notes={filteredNotes}
                  category="meus_porques"
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onCreateNote={handleCreateNote}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  selectedNoteId={selectedNote?.id}
                />
              </TabsContent>

              <TabsContent value="meus_padroes" className="mt-0">
                <ListaNotas
                  notes={filteredNotes}
                  category="meus_padroes"
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onCreateNote={handleCreateNote}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  selectedNoteId={selectedNote?.id}
                />
              </TabsContent>
            </Tabs>

            {/* Footer Quote */}
            <div className="text-center py-8 mt-12">
              <blockquote className="text-slate-400 italic text-sm max-w-2xl mx-auto">
                "Utiliza-te do autoconhecimento, tu és aquilo que, não há mudança maior" - Provérbio da língua Māori
                Tradução: "Sempre a mente que você mais valoriza, se você buscar a cultura, que seja para uma melhoria
                elevada."
              </blockquote>
              <div className="text-slate-500 text-xs mt-2">StayFocus Oficial</div>
            </div>
          </div>
        ) : (
          <div className="h-screen">
            <EditorNotas
              note={selectedNote}
              category={activeTab}
              onSave={handleSaveNote}
              onCancel={handleCancelEdit}
              isCreating={isCreating}
            />
          </div>
        )}
      </main>
    </div>
  )
}
