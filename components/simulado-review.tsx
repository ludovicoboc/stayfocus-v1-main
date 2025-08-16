"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Flag, CheckCircle } from "lucide-react"
import { useSimulados } from "@/hooks/use-simulados"

export function SimuladoReview() {
  const { simuladoAtual, responderQuestao, finalizarSimulado } = useSimulados()
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostaSelecionada, setRespostaSelecionada] = useState("")

  useEffect(() => {
    if (simuladoAtual) {
      const resposta = simuladoAtual.user_answers[simuladoAtual.questions[questaoAtual]?.id]
      setRespostaSelecionada(resposta || "")
    }
  }, [questaoAtual, simuladoAtual])

  if (!simuladoAtual) {
    return (
      <div className="text-center text-white">
        <p>Nenhum simulado carregado.</p>
      </div>
    )
  }

  const questao = simuladoAtual.questions[questaoAtual]
  const totalQuestoes = simuladoAtual.questions.length
  const progresso = ((questaoAtual + 1) / totalQuestoes) * 100
  const respostasCompletas = Object.keys(simuladoAtual.user_answers).length

  const handleRespostaChange = async (resposta: string) => {
    setRespostaSelecionada(resposta)
    await responderQuestao(questao.id, resposta)
  }

  const handleProximaQuestao = () => {
    if (questaoAtual < totalQuestoes - 1) {
      setQuestaoAtual(questaoAtual + 1)
    }
  }

  const handleQuestaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(questaoAtual - 1)
    }
  }

  const handleFinalizarSimulado = async () => {
    if (window.confirm("Tem certeza que deseja finalizar o simulado?")) {
      await finalizarSimulado()
    }
  }

  const getAlternativaLabel = (key: string) => key.toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">{simuladoAtual.title}</CardTitle>
            <div className="text-slate-300 text-sm">
              Questão {questaoAtual + 1} de {totalQuestoes}
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={progresso} className="w-full" />
            <div className="flex justify-between text-xs text-slate-400">
              <span>Progresso: {Math.round(progresso)}%</span>
              <span>
                Respondidas: {respostasCompletas}/{totalQuestoes}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Question */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            {questao.id}. {questao.enunciado}
          </CardTitle>
          {questao.assunto && (
            <div className="text-sm text-slate-400">
              <Flag className="w-4 h-4 inline mr-1" />
              {questao.assunto}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(questao.alternativas).map(([key, texto]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                respostaSelecionada === key
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-650"
              }`}
              onClick={() => handleRespostaChange(key)}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                    respostaSelecionada === key
                      ? "border-white bg-white text-blue-600"
                      : "border-slate-400 text-slate-400"
                  }`}
                >
                  {getAlternativaLabel(key)}
                </div>
                <div className="flex-1">{texto}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          onClick={handleQuestaoAnterior}
          disabled={questaoAtual === 0}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <div className="flex space-x-2">
          {questaoAtual === totalQuestoes - 1 ? (
            <Button
              onClick={handleFinalizarSimulado}
              className="bg-green-600 hover:bg-green-700"
              disabled={respostasCompletas < totalQuestoes}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalizar Simulado
            </Button>
          ) : (
            <Button
              onClick={handleProximaQuestao}
              disabled={questaoAtual === totalQuestoes - 1}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Próxima
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Navegação Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {simuladoAtual.questions.map((q, index) => {
              const respondida = simuladoAtual.user_answers[q.id]
              return (
                <button
                  key={q.id}
                  onClick={() => setQuestaoAtual(index)}
                  className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                    index === questaoAtual
                      ? "bg-blue-600 text-white"
                      : respondida
                        ? "bg-green-600 text-white"
                        : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                  }`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
