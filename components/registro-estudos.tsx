"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, CheckCircle, Circle, Clock, Edit, Trash2 } from "lucide-react"
import { useEstudos } from "@/hooks/use-estudos"
import { useConcursos } from "@/hooks/use-concursos"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SessaoEstudo } from "@/types/estudos"

export function RegistroEstudos() {
  const { sessoes, adicionarSessao, atualizarSessao, marcarSessaoCompleta, removerSessao, getEstatisticas } = useEstudos()
  const { concursos } = useConcursos()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [sessaoEditando, setSessaoEditando] = useState<SessaoEstudo | null>(null)
  const [novaSessao, setNovaSessao] = useState({
    disciplina: "",
    topico: "",
    duration_minutes: 25,
    notes: "",
    competition_id: null as string | null,
  })

  const estatisticas = getEstatisticas()

  const handleAddSessao = async () => {
    if (!novaSessao.disciplina.trim()) return

    const sessao: Omit<SessaoEstudo, "id" | "user_id" | "created_at" | "updated_at"> = {
      disciplina: novaSessao.disciplina.trim(),
      topico: novaSessao.topico.trim() || null,
      duration_minutes: novaSessao.duration_minutes,
      completed: false,
      pomodoro_cycles: 0,
      notes: novaSessao.notes.trim() || null,
      competition_id: novaSessao.competition_id,
      started_at: new Date().toISOString(),
      completed_at: null,
    }

    const result = await adicionarSessao(sessao)
    if (result) {
      setShowAddModal(false)
      setNovaSessao({
        disciplina: "",
        topico: "",
        duration_minutes: 25,
        notes: "",
        competition_id: null,
      })
    }
  }

  const handleEditSessao = (sessao: SessaoEstudo) => {
    setSessaoEditando(sessao)
    setShowEditModal(true)
  }

  const handleUpdateSessao = async () => {
    if (!sessaoEditando?.id || !sessaoEditando.disciplina.trim()) return

    const updates = {
      disciplina: sessaoEditando.disciplina.trim(),
      topico: sessaoEditando.topico?.trim() || null,
      duration_minutes: sessaoEditando.duration_minutes,
      notes: sessaoEditando.notes?.trim() || null,
      competition_id: sessaoEditando.competition_id,
    }

    const result = await atualizarSessao(sessaoEditando.id, updates)
    if (result) {
      setShowEditModal(false)
      setSessaoEditando(null)
    }
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setSessaoEditando(null)
  }

  const handleToggleComplete = async (sessao: SessaoEstudo) => {
    if (!sessao.id) return

    if (!sessao.completed) {
      await marcarSessaoCompleta(sessao.id)
    }
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Registro de Estudos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-800 rounded-lg p-3">
              <div className="text-orange-100 text-sm">Sessões Completas</div>
              <div className="text-orange-100 text-lg font-bold">
                {estatisticas.sessoesCompletas}/{estatisticas.totalSessoes}
              </div>
            </div>
            <div className="bg-orange-800 rounded-lg p-3">
              <div className="text-orange-100 text-sm">Tempo Total</div>
              <div className="text-orange-100 text-lg font-bold">{estatisticas.tempoTotalFormatado}</div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {sessoes.slice(0, 5).map((sessao) => (
              <div
                key={sessao.id}
                className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-650 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleComplete(sessao)}
                    className="text-green-400 hover:text-green-300"
                    disabled={sessao.completed}
                  >
                    {sessao.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="flex-1">
                    <div
                      className={`text-sm font-medium ${sessao.completed ? "text-slate-400 line-through" : "text-white"}`}
                    >
                      {sessao.disciplina}
                      {sessao.topico && ` - ${sessao.topico}`}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {sessao.duration_minutes} min
                      {sessao.pomodoro_cycles > 0 && ` • ${sessao.pomodoro_cycles} ciclos`}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-white"
                    onClick={() => handleEditSessao(sessao)}
                    disabled={sessao.completed}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-red-400"
                    onClick={() => sessao.id && removerSessao(sessao.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Session Button */}
          <Button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 border border-dashed border-slate-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Sessão de Estudo
          </Button>
        </CardContent>
      </Card>

      {/* Add Session Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Nova Sessão de Estudo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="disciplina" className="text-slate-300">
                Matéria *
              </Label>
              <Input
                id="disciplina"
                placeholder="Ex: Matemática"
                value={novaSessao.disciplina}
                onChange={(e) => setNovaSessao({ ...novaSessao, disciplina: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="topico" className="text-slate-300">
                Tópico (opcional)
              </Label>
              <Input
                id="topico"
                placeholder="Ex: Álgebra Linear"
                value={novaSessao.topico}
                onChange={(e) => setNovaSessao({ ...novaSessao, topico: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="duration" className="text-slate-300">
                Duração Planejada (minutos)
              </Label>
              <Input
                id="duration"
                type="number"
                value={novaSessao.duration_minutes}
                onChange={(e) =>
                  setNovaSessao({ ...novaSessao, duration_minutes: Number.parseInt(e.target.value) || 25 })
                }
                className="bg-slate-700 border-slate-600 text-white"
                min="1"
                max="480"
              />
            </div>

            <div>
              <Label htmlFor="competition" className="text-slate-300">
                Concurso (opcional)
              </Label>
              <Select
                value={novaSessao.competition_id || "none"}
                onValueChange={(value) =>
                  setNovaSessao({ ...novaSessao, competition_id: value === "none" ? null : value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Selecionar concurso" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="none" className="text-white">
                    Nenhum concurso
                  </SelectItem>
                  {concursos.map((concurso) => (
                    <SelectItem key={concurso.id} value={concurso.id!} className="text-white">
                      {concurso.title} - {concurso.organizer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-slate-300">
                Observações (opcional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Anotações sobre a sessão de estudo..."
                value={novaSessao.notes}
                onChange={(e) => setNovaSessao({ ...novaSessao, notes: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddSessao}
              disabled={!novaSessao.disciplina.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Adicionar Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Editar Sessão de Estudo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-disciplina" className="text-slate-300">
                Matéria *
              </Label>
              <Input
                id="edit-disciplina"
                placeholder="Ex: Matemática"
                value={sessaoEditando?.disciplina || ""}
                onChange={(e) => setSessaoEditando(prev => 
                  prev ? { ...prev, disciplina: e.target.value } : null
                )}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="edit-topico" className="text-slate-300">
                Tópico (opcional)
              </Label>
              <Input
                id="edit-topico"
                placeholder="Ex: Álgebra Linear"
                value={sessaoEditando?.topico || ""}
                onChange={(e) => setSessaoEditando(prev => 
                  prev ? { ...prev, topico: e.target.value } : null
                )}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="edit-duration" className="text-slate-300">
                Duração Planejada (minutos)
              </Label>
              <Input
                id="edit-duration"
                type="number"
                value={sessaoEditando?.duration_minutes || 25}
                onChange={(e) => setSessaoEditando(prev => 
                  prev ? { ...prev, duration_minutes: Number.parseInt(e.target.value) || 25 } : null
                )}
                className="bg-slate-700 border-slate-600 text-white"
                min="1"
                max="480"
              />
            </div>

            <div>
              <Label htmlFor="edit-competition" className="text-slate-300">
                Concurso (opcional)
              </Label>
              <Select
                value={sessaoEditando?.competition_id || "none"}
                onValueChange={(value) => setSessaoEditando(prev => 
                  prev ? { ...prev, competition_id: value === "none" ? null : value } : null
                )}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Selecionar concurso" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="none" className="text-white">
                    Nenhum concurso
                  </SelectItem>
                  {concursos.map((concurso) => (
                    <SelectItem key={concurso.id} value={concurso.id!} className="text-white">
                      {concurso.title} - {concurso.organizer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-notes" className="text-slate-300">
                Observações (opcional)
              </Label>
              <Textarea
                id="edit-notes"
                placeholder="Anotações sobre a sessão de estudo..."
                value={sessaoEditando?.notes || ""}
                onChange={(e) => setSessaoEditando(prev => 
                  prev ? { ...prev, notes: e.target.value } : null
                )}
                className="bg-slate-700 border-slate-600 text-white"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateSessao}
              disabled={!sessaoEditando?.disciplina?.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
