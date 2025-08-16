"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, CheckSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Questao } from "@/types/concursos"

interface SeletorQuestoesPersonalizadasProps {
  questoes: Questao[]
  titulo?: string
}

export function SeletorQuestoesPersonalizadas({
  questoes,
  titulo = "Selecionar Questões para Simulado",
}: SeletorQuestoesPersonalizadasProps) {
  const [questoesSelecionadas, setQuestoesSelecionadas] = useState<Set<string>>(new Set())
  const router = useRouter()

  const handleToggleQuestao = (questaoId: string) => {
    const novasSelecoes = new Set(questoesSelecionadas)
    if (novasSelecoes.has(questaoId)) {
      novasSelecoes.delete(questaoId)
    } else {
      novasSelecoes.add(questaoId)
    }
    setQuestoesSelecionadas(novasSelecoes)
  }

  const handleSelecionarTodas = () => {
    if (questoesSelecionadas.size === questoes.length) {
      setQuestoesSelecionadas(new Set())
    } else {
      setQuestoesSelecionadas(new Set(questoes.map((q) => q.id!)))
    }
  }

  const handleIniciarSimulado = () => {
    if (questoesSelecionadas.size === 0) return

    const questoesSelecionadasData = questoes.filter((q) => questoesSelecionadas.has(q.id!))

    // Store in localStorage
    localStorage.setItem("simulado_personalizado_questoes", JSON.stringify(questoesSelecionadasData))

    // Navigate to personalized simulation page
    router.push("/estudos/simulado-personalizado")
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "facil":
        return "bg-green-600"
      case "medio":
        return "bg-yellow-600"
      case "dificil":
        return "bg-red-600"
      default:
        return "bg-slate-600"
    }
  }

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case "facil":
        return "Fácil"
      case "medio":
        return "Médio"
      case "dificil":
        return "Difícil"
      default:
        return "N/A"
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">{titulo}</CardTitle>
          <div className="flex space-x-2">
            <Button
              onClick={handleSelecionarTodas}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              {questoesSelecionadas.size === questoes.length ? "Desmarcar Todas" : "Selecionar Todas"}
            </Button>
            <Button
              onClick={handleIniciarSimulado}
              disabled={questoesSelecionadas.size === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-1" />
              Iniciar Simulado ({questoesSelecionadas.size})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {questoes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">Nenhuma questão disponível.</p>
          </div>
        ) : (
          questoes.map((questao) => (
            <div
              key={questao.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                questoesSelecionadas.has(questao.id!)
                  ? "bg-blue-900/30 border-blue-600"
                  : "bg-slate-700 border-slate-600 hover:bg-slate-650"
              }`}
              onClick={() => handleToggleQuestao(questao.id!)}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={questoesSelecionadas.has(questao.id!)}
                  onChange={() => handleToggleQuestao(questao.id!)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-white font-medium mb-2">{questao.question_text}</div>
                  <div className="flex items-center space-x-2">
                    {questao.difficulty && (
                      <Badge className={`${getDifficultyColor(questao.difficulty)} text-white`}>
                        {getDifficultyLabel(questao.difficulty)}
                      </Badge>
                    )}
                    {questao.is_ai_generated && <Badge className="bg-purple-600 text-white">IA</Badge>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
