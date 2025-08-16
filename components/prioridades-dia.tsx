"use client"

import { useState } from "react"
import { useDashboard } from "@/hooks/use-dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Star, Target } from "lucide-react"

export function PrioridadesDia() {
  const { dashboardData, adicionarPrioridade, togglePrioridadeConcluida } = useDashboard()
  const [novaPrioridade, setNovaPrioridade] = useState({ titulo: "", importante: false })
  const [dialogAberto, setDialogAberto] = useState(false)

  const handleAdicionarPrioridade = async () => {
    if (!novaPrioridade.titulo.trim()) return

    try {
      await adicionarPrioridade(novaPrioridade)
      setNovaPrioridade({ titulo: "", importante: false })
      setDialogAberto(false)
    } catch (error) {
      console.error("Erro ao adicionar prioridade:", error)
    }
  }

  const prioridades = dashboardData?.prioridades || []
  const prioridadesOrdenadas = prioridades.sort((a, b) => {
    if (a.importante && !b.importante) return -1
    if (!a.importante && b.importante) return 1
    if (a.concluida && !b.concluida) return 1
    if (!a.concluida && b.concluida) return -1
    return 0
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Prioridades</h3>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Nova Prioridade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Título</label>
                <Input
                  value={novaPrioridade.titulo}
                  onChange={(e) => setNovaPrioridade((prev) => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Descreva a prioridade..."
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="importante"
                  checked={novaPrioridade.importante}
                  onCheckedChange={(checked) => setNovaPrioridade((prev) => ({ ...prev, importante: !!checked }))}
                />
                <label htmlFor="importante" className="text-sm text-slate-300">
                  Marcar como importante
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdicionarPrioridade} className="flex-1 bg-orange-600 hover:bg-orange-700">
                  Adicionar
                </Button>
                <Button
                  onClick={() => setDialogAberto(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {prioridadesOrdenadas.length > 0 ? (
        <div className="space-y-2">
          {prioridadesOrdenadas.map((prioridade) => (
            <div
              key={prioridade.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                prioridade.concluida
                  ? "bg-green-900/20 border-green-700/50"
                  : "bg-slate-700 border-slate-600 hover:bg-slate-600"
              }`}
            >
              <Checkbox
                checked={prioridade.concluida}
                onCheckedChange={(checked) => togglePrioridadeConcluida(prioridade.id, !!checked)}
              />
              {prioridade.importante && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
              <div className="flex-1">
                <span className={`text-white ${prioridade.concluida ? "line-through opacity-75" : ""}`}>
                  {prioridade.titulo}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 mb-4">Nenhuma prioridade definida para hoje</p>
          <p className="text-sm text-slate-500">Adicione suas tarefas mais importantes</p>
        </div>
      )}
    </div>
  )
}
