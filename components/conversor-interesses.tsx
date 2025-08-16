"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X, Plus, Zap } from "lucide-react"
import { useHiperfocos } from "@/hooks/use-hiperfocos"

const CORES_HIPERFOCO = [
  "#ef4444", // red
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#64748b", // slate
]

export function ConversorInteresses() {
  const { createProject, createTask } = useHiperfocos()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    color: CORES_HIPERFOCO[0],
    time_limit: "",
  })
  const [tarefas, setTarefas] = useState<string[]>([""])
  const [converting, setConverting] = useState(false)

  const handleAddTarefa = () => {
    setTarefas([...tarefas, ""])
  }

  const handleRemoveTarefa = (index: number) => {
    if (tarefas.length > 1) {
      setTarefas(tarefas.filter((_, i) => i !== index))
    }
  }

  const handleTarefaChange = (index: number, value: string) => {
    const newTarefas = [...tarefas]
    newTarefas[index] = value
    setTarefas(newTarefas)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    setConverting(true)
    try {
      // Create the project
      const project = await createProject({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        time_limit: formData.time_limit ? Number.parseInt(formData.time_limit) : null,
        is_active: true,
      })

      if (project) {
        // Create tasks for the project
        const validTarefas = tarefas.filter((tarefa) => tarefa.trim())
        for (let i = 0; i < validTarefas.length; i++) {
          await createTask({
            project_id: project.id!,
            title: validTarefas[i].trim(),
            completed: false,
            order_index: i,
          })
        }

        // Reset form
        setFormData({
          title: "",
          description: "",
          color: CORES_HIPERFOCO[0],
          time_limit: "",
        })
        setTarefas([""])
      }
    } finally {
      setConverting(false)
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Zap className="w-5 h-5 mr-2 text-orange-400" />
          Conversor de Interesses
        </CardTitle>
        <p className="text-slate-300 text-sm">
          Transforme um interesse intenso em um projeto estruturado com tarefas claras e objetivas.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title" className="text-slate-300">
              Título do Interesse/Hiperfoco *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Ex: Aprender Python"
            />
          </div>

          <div>
            <Label htmlFor="time_limit" className="text-slate-300">
              Tempo Limite (em minutos, opcional)
            </Label>
            <Input
              id="time_limit"
              type="number"
              value={formData.time_limit}
              onChange={(e) => setFormData({ ...formData, time_limit: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Ex: 60"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description" className="text-slate-300">
            Descrição
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white"
            placeholder="Descreva seu interesse ou hiperfoco"
            rows={3}
          />
        </div>

        <div>
          <Label className="text-slate-300 mb-2 block">Cor do Hiperfoco</Label>
          <div className="flex space-x-2">
            {CORES_HIPERFOCO.map((cor) => (
              <button
                key={cor}
                type="button"
                onClick={() => setFormData({ ...formData, color: cor })}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  formData.color === cor ? "border-white scale-110" : "border-slate-600 hover:border-slate-400"
                }`}
                style={{ backgroundColor: cor }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label className="text-slate-300 mb-2 block">Decomposição em Tarefas *</Label>
          <div className="space-y-2">
            {tarefas.map((tarefa, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  value={tarefa}
                  onChange={(e) => handleTarefaChange(index, e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white flex-1"
                  placeholder={`Tarefa ${index + 1}`}
                />
                {tarefas.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTarefa(index)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleAddTarefa}
            className="mt-2 text-orange-400 hover:text-orange-300"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar mais uma tarefa
          </Button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!formData.title.trim() || converting}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          <Zap className="w-4 h-4 mr-2" />
          {converting ? "Convertendo..." : "Converter em Hiperfoco"}
        </Button>
      </CardContent>
    </Card>
  )
}
