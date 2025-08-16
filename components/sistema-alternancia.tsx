"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RotateCcw, Plus, Pause, Square } from "lucide-react"
import { useHiperfocos } from "@/hooks/use-hiperfocos"

export function SistemaAlternancia() {
  const { projects, createAlternationSession, updateAlternationSession, getActiveAlternationSession } = useHiperfocos()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    session_duration: "25",
    selected_projects: [] as string[],
  })

  const activeSession = getActiveAlternationSession()

  const handleProjectToggle = (projectId: string) => {
    const newSelected = formData.selected_projects.includes(projectId)
      ? formData.selected_projects.filter((id) => id !== projectId)
      : [...formData.selected_projects, projectId]

    setFormData({ ...formData, selected_projects: newSelected })
  }

  const handleCreateSession = async () => {
    if (!formData.title.trim() || formData.selected_projects.length < 2) return

    const session = await createAlternationSession({
      title: formData.title.trim(),
      projects: formData.selected_projects,
      current_project_index: 0,
      session_duration: Number.parseInt(formData.session_duration),
      is_active: false,
    })

    if (session) {
      setShowModal(false)
      setFormData({
        title: "",
        session_duration: "25",
        selected_projects: [],
      })
    }
  }

  const handleStartSession = async (sessionId: string) => {
    await updateAlternationSession(sessionId, {
      is_active: true,
      started_at: new Date().toISOString(),
    })
  }

  const handlePauseSession = async (sessionId: string) => {
    await updateAlternationSession(sessionId, {
      is_active: false,
      paused_at: new Date().toISOString(),
    })
  }

  const handleStopSession = async (sessionId: string) => {
    await updateAlternationSession(sessionId, {
      is_active: false,
      completed_at: new Date().toISOString(),
    })
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <RotateCcw className="w-5 h-5 mr-2 text-blue-400" />
            Sistema de Alternância
          </CardTitle>
          <p className="text-slate-300 text-sm">
            Gerencie transições entre diferentes hiperfocos para reduzir o impacto das mudanças de contexto.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSession ? (
            <div className="p-4 bg-slate-700 rounded-lg">
              <h3 className="text-white font-medium mb-2">{activeSession.title}</h3>
              <div className="flex items-center justify-between">
                <div className="text-slate-300 text-sm">
                  Projeto atual: {activeSession.current_project_index + 1} de {activeSession.projects.length}
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handlePauseSession(activeSession.id!)}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pausar
                  </Button>
                  <Button size="sm" onClick={() => handleStopSession(activeSession.id!)} variant="destructive">
                    <Square className="w-4 h-4 mr-1" />
                    Parar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">Nenhuma sessão de alternância ativa no momento.</p>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={projects.length < 2}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Sessão de Alternância
              </Button>
            </div>
          )}

          {projects.length < 2 && (
            <div className="p-4 bg-slate-700 rounded-lg border border-dashed border-slate-600">
              <p className="text-slate-300 text-sm text-center">
                Para criar uma sessão de alternância, primeiro crie hiperfocos na guia "Conversor de Interesses".
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Nova Sessão */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Nova Sessão de Alternância</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="session_title" className="text-slate-300">
                Título da Sessão
              </Label>
              <Input
                id="session_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Sessão de Estudos Alternados"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="session_duration" className="text-slate-300">
                Duração por Projeto (minutos)
              </Label>
              <Input
                id="session_duration"
                type="number"
                value={formData.session_duration}
                onChange={(e) => setFormData({ ...formData, session_duration: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                min="5"
                max="120"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Selecione os Hiperfocos (mínimo 2)</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-3 p-2 bg-slate-700 rounded">
                    <Checkbox
                      checked={formData.selected_projects.includes(project.id!)}
                      onCheckedChange={() => handleProjectToggle(project.id!)}
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                      <span className="text-white text-sm">{project.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={!formData.title.trim() || formData.selected_projects.length < 2}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Criar Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
