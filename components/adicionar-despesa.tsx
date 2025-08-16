"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFinancas } from "@/hooks/use-financas"

export function AdicionarDespesa() {
  const { categorias, adicionarDespesa } = useFinancas()
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category_id: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description.trim() || !formData.amount || !formData.category_id) return

    setSaving(true)
    try {
      const despesa = {
        description: formData.description.trim(),
        amount: Number.parseFloat(formData.amount),
        category_id: formData.category_id,
        date: formData.date,
      }

      await adicionarDespesa(despesa)

      // Reset form
      setFormData({
        description: "",
        amount: "",
        category_id: "",
        date: new Date().toISOString().split("T")[0],
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Adicionar Despesa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description" className="text-slate-300">
              Descrição
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Mercado"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="amount" className="text-slate-300">
              Valor (R$)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0,00"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300 mb-2 block">Categoria</Label>
            <div className="grid grid-cols-2 gap-2">
              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category_id: categoria.id! })}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    formData.category_id === categoria.id
                      ? "border-white text-white"
                      : "border-slate-600 text-slate-300 hover:border-slate-500"
                  }`}
                  style={{
                    backgroundColor: formData.category_id === categoria.id ? categoria.color + "20" : "transparent",
                  }}
                >
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: categoria.color }}></div>
                  {categoria.name}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!formData.description.trim() || !formData.amount || !formData.category_id || saving}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {saving ? "Adicionando..." : "Adicionar Despesa"}
          </Button>

          <div className="text-xs text-slate-400 space-y-1">
            <div>💡 Dicas para registrar despesas:</div>
            <div>• Registre despesas logo após realizá-las</div>
            <div>• Mantenha recibos para melhor controle</div>
            <div>• Categorize corretamente para melhor visualização</div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
