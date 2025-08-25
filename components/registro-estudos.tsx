"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, BookOpen, CheckCircle, Circle, Edit2, Trash2 } from "lucide-react"
import { useEstudos } from "@/hooks/use-estudos"
import { useConcursos } from "@/hooks/use-concursos"
import { toast } from "sonner"

interface SessaoEstudo {
  id: string
  disciplina: string
  topico?: string
  duration_minutes: number
  competition_id?: string
  notes?: string
  completed: boolean
  created_at: string
}

interface NovaSessao {
  disciplina: string
  topico: string
  duration_minutes: number
  competition_id: string | null
  notes: string
}

export function RegistroEstudos() {
  const { sessoes, adicionarSessao, atualizarSessao, removerSessao, marcarSessaoCompleta, getEstatisticas } = useEstudos()
  const { concursos } = useConcursos()
  
  // Obter estatísticas locais
  const estatisticas = getEstatisticas()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [sessaoEditando, setSessaoEditando] = useState<SessaoEstudo | null>(null)

  const [novaSessao, setNovaSessao] = useState<NovaSessao>({
    disciplina: "",
    topico: "",
    duration_minutes: 25,
    competition_id: null,
    notes: ""
  })

  // Reset form when modal closes
  useEffect(() => {
    if (!showAddModal) {
      setNovaSessao({
        disciplina: "",
        topico: "",
        duration_minutes: 25,
        competition_id: null,
        notes: ""
      })
    }
  }, [showAddModal])

  const resetForm = () => {
    setNovaSessao({
      disciplina: "",
      topico: "",
      duration_minutes: 25,
      competition_id: null,
      notes: ""
    })
  }

  const handleAddSessao = async () => {
    if (!novaSessao.disciplina.trim()) {
      toast.error("Por favor, informe a matéria")
      return
    }

    try {
      await adicionarSessao({
        disciplina: novaSessao.disciplina.trim(),
        topico: novaSessao.topico.trim() || undefined,
        duration_minutes: novaSessao.duration_minutes,
        competition_id: novaSessao.competition_id || undefined,
        notes: novaSessao.notes.trim() || undefined,
        completed: false,
        pomodoro_cycles: 0
      })
      
      setShowAddModal(false)
      resetForm()
      toast.success("Sessão de estudo adicionada!")
    } catch (error) {
      toast.error("Erro ao adicionar sessão de estudo")
    }
  }

  const handleEditSessao = (sessao: SessaoEstudo) => {
    setSessaoEditando({ ...sessao })
    setShowEditModal(true)
  }

  const handleUpdateSessao = async () => {
    if (!sessaoEditando || !sessaoEditando.disciplina.trim()) {
      toast.error("Por favor, informe a matéria")
      return
    }

    try {
      await atualizarSessao(sessaoEditando.id!, {
        disciplina: sessaoEditando.disciplina.trim(),
        topico: sessaoEditando.topico?.trim() || undefined,
        duration_minutes: sessaoEditando.duration_minutes,
        competition_id: sessaoEditando.competition_id || undefined,
        notes: sessaoEditando.notes?.trim() || undefined
      })
      
      setShowEditModal(false)
      setSessaoEditando(null)
      toast.success("Sessão atualizada!")
    } catch (error) {
      toast.error("Erro ao atualizar sessão")
    }
  }

  const handleToggleComplete = async (sessao: SessaoEstudo) => {
    try {
      await marcarSessaoCompleta(sessao.id!)
    } catch (error) {
      toast.error("Erro ao atualizar status da sessão")
    }
  }

  const formatarEstatisticas = () => {
    const sessoesCompletas = estatisticas?.sessoesCompletas || 0
    const tempoTotal = estatisticas?.tempoTotalMinutos || 0
    const tempoHoras = Math.floor(tempoTotal / 60)
    const tempoMinutos = tempoTotal % 60

    return {
      sessoesCount: sessoesCompletas.toString(),
      tempoTotal: tempoHoras > 0 ? `${tempoHoras}h ${tempoMinutos}m` : `${tempoMinutos}m`
    }
  }

  const estatisticasFormatadas = formatarEstatisticas()

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Registro de Estudos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700 p-3 rounded-lg">
              <div className="text-sm text-slate-400">Sessões Completas</div>
              <div className="text-lg font-semibold text-white">{estatisticasFormatadas.sessoesCount}</div>
            </div>
            <div className="bg-slate-700 p-3 rounded-lg">
              <div className="text-sm text-slate-400">Tempo Total</div>
              <div className="text-lg font-semibold text-white">{estatisticasFormatadas.tempoTotal}</div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {sessoes.slice(0, 5).map((sessao) => (
              <div
                key={sessao.id}
                className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600"
              >
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => sessao.id && handleToggleComplete(sessao as SessaoEstudo & { id: string })}
                    className="p-0 h-auto"
                  >
                    {sessao.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-400" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{sessao.disciplina}</span>
                      {sessao.topico && (
                        <Badge variant="secondary" className="text-xs">
                          {sessao.topico}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="h-3 w-3" />
                      {sessao.duration_minutes}min
                      {sessao.created_at && (
                        <span>• {new Date(sessao.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => sessao.id && handleEditSessao(sessao as SessaoEstudo & { id: string })}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removerSessao(sessao.id!)}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
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
                  setNovaSessao({ ...novaSessao, duration_minutes: parseInt(e.target.value) || 25 })
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
                  prev ? { ...prev, duration_minutes: parseInt(e.target.value) || 25 } : null
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
                  prev ? { ...prev, competition_id: value === "none" ? undefined : value } : null
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
              onClick={() => setShowEditModal(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateSessao}
              disabled={!sessaoEditando?.disciplina.trim()}
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

// Export default para lazy loading
export default RegistroEstudos