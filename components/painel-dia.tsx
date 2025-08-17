"use client"

import { useState } from "react"
import { useDashboard } from "@/hooks/use-dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Clock, Check, X } from "lucide-react"
import { getCurrentDateString } from "@/lib/utils"

export function PainelDia({ date }: { date?: string }) {
  const resolvedDate = date || getCurrentDateString()
  const { dashboardData, adicionarAtividadePainelDia, toggleAtividadeConcluida } = useDashboard(resolvedDate)
  const [novaAtividade, setNovaAtividade] = useState({ horario: "", atividade: "", cor: "#3b82f6" })
  const [dialogAberto, setDialogAberto] = useState(false)

  const handleAdicionarAtividade = async () => {
    if (!novaAtividade.horario || !novaAtividade.atividade) return

    try {
      await adicionarAtividadePainelDia(novaAtividade)
      setNovaAtividade({ horario: "", atividade: "", cor: "#3b82f6" })
      setDialogAberto(false)
    } catch (error) {
      console.error("Erro ao adicionar atividade:", error)
    }
  }

  const atividades = dashboardData?.painelDia || []
  const atividadesOrdenadas = atividades.sort((a, b) => a.horario.localeCompare(b.horario))

  const cores = [
    { valor: "#3b82f6", nome: "Azul" },
    { valor: "#ef4444", nome: "Vermelho" },
    { valor: "#10b981", nome: "Verde" },
    { valor: "#f59e0b", nome: "Amarelo" },
    { valor: "#8b5cf6", nome: "Roxo" },
    { valor: "#ec4899", nome: "Rosa" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Hoje</h3>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Nova Atividade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Horário</label>
                <Input
                  type="time"
                  value={novaAtividade.horario}
                  onChange={(e) => setNovaAtividade((prev) => ({ ...prev, horario: e.target.value }))}
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Atividade</label>
                <Input
                  value={novaAtividade.atividade}
                  onChange={(e) => setNovaAtividade((prev) => ({ ...prev, atividade: e.target.value }))}
                  placeholder="Descreva a atividade..."
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cor</label>
                <div className="flex gap-2">
                  {cores.map((cor) => (
                    <button
                      key={cor.valor}
                      type="button"
                      onClick={() => setNovaAtividade((prev) => ({ ...prev, cor: cor.valor }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        novaAtividade.cor === cor.valor ? "border-white" : "border-slate-600"
                      }`}
                      style={{ backgroundColor: cor.valor }}
                      title={cor.nome}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdicionarAtividade} className="flex-1 bg-blue-600 hover:bg-blue-700">
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

      {atividadesOrdenadas.length > 0 ? (
        <div className="space-y-2">
          {atividadesOrdenadas.map((atividade) => (
            <div
              key={atividade.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                atividade.concluida
                  ? "bg-green-900/20 border-green-700/50"
                  : "bg-slate-700 border-slate-600 hover:bg-slate-600"
              }`}
            >
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: atividade.cor }} />
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-mono">{atividade.horario}</span>
              </div>
              <div className="flex-1">
                <span className={`text-white ${atividade.concluida ? "line-through opacity-75" : ""}`}>
                  {atividade.atividade}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleAtividadeConcluida(atividade.id, !atividade.concluida)}
                className={`${
                  atividade.concluida ? "text-green-400 hover:text-green-300" : "text-slate-400 hover:text-white"
                }`}
              >
                {atividade.concluida ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 mb-4">Nenhuma atividade programada para hoje</p>
          <p className="text-sm text-slate-500">Adicione atividades para organizar seu dia</p>
        </div>
      )}
    </div>
  )
}
