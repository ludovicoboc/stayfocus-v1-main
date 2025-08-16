"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useFinancas } from "@/hooks/use-financas"

const CORES_ENVELOPE = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
]

export function EnvelopesVirtuais() {
  const { envelopes, adicionarEnvelope, atualizarEnvelope } = useFinancas()
  const [showModal, setShowModal] = useState(false)
  const [editingEnvelope, setEditingEnvelope] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    color: CORES_ENVELOPE[0],
    total_amount: "",
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleOpenModal = (envelope?: any) => {
    if (envelope) {
      setEditingEnvelope(envelope.id)
      setFormData({
        name: envelope.name,
        color: envelope.color,
        total_amount: envelope.total_amount.toString(),
      })
    } else {
      setEditingEnvelope(null)
      setFormData({
        name: "",
        color: CORES_ENVELOPE[0],
        total_amount: "",
      })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.total_amount) return

    const envelopeData = {
      name: formData.name.trim(),
      color: formData.color,
      total_amount: Number.parseFloat(formData.total_amount),
      used_amount: 0,
    }

    if (editingEnvelope) {
      await atualizarEnvelope(editingEnvelope, envelopeData)
    } else {
      await adicionarEnvelope(envelopeData)
    }

    setShowModal(false)
    setEditingEnvelope(null)
  }

  const registrarGasto = async (envelopeId: string, valor: number) => {
    const envelope = envelopes.find((env) => env.id === envelopeId)
    if (!envelope) return

    const novoValorUsado = envelope.used_amount + valor
    if (novoValorUsado > envelope.total_amount) {
      alert("Valor excede o limite do envelope!")
      return
    }

    await atualizarEnvelope(envelopeId, {
      used_amount: novoValorUsado,
    })
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Envelopes Virtuais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {envelopes.map((envelope) => {
            const porcentagemUsada = (envelope.used_amount / envelope.total_amount) * 100
            const valorRestante = envelope.total_amount - envelope.used_amount

            return (
              <div key={envelope.id} className="p-4 bg-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: envelope.color }}></div>
                    <span className="text-white font-medium">{envelope.name}</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenModal(envelope)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Utilizado: {formatCurrency(envelope.used_amount)}</span>
                    <span className="text-slate-300">Total: {formatCurrency(envelope.total_amount)}</span>
                  </div>
                  <Progress value={porcentagemUsada} className="w-full" />
                  <div className="text-center">
                    <span className="text-slate-400 text-xs">Restante: {formatCurrency(valorRestante)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-600"
                    onClick={() => {
                      const valor = prompt("Valor do gasto:")
                      if (valor && !isNaN(Number.parseFloat(valor))) {
                        registrarGasto(envelope.id!, Number.parseFloat(valor))
                      }
                    }}
                  >
                    Registrar Gasto
                  </Button>
                </div>
              </div>
            )
          })}

          <Button
            onClick={() => handleOpenModal()}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 border border-dashed border-slate-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Envelope
          </Button>
        </CardContent>
      </Card>

      {/* Modal para Adicionar/Editar Envelope */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>{editingEnvelope ? "Editar Envelope" : "Novo Envelope"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">
                Nome do Envelope
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Emergências"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="total_amount" className="text-slate-300">
                Valor Total
              </Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                placeholder="0.00"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Cor</Label>
              <div className="grid grid-cols-4 gap-2">
                {CORES_ENVELOPE.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: cor })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === cor ? "border-white" : "border-slate-600"
                    }`}
                    style={{ backgroundColor: cor }}
                  />
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
              onClick={handleSave}
              disabled={!formData.name.trim() || !formData.total_amount}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingEnvelope ? "Atualizar" : "Criar"} Envelope
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
