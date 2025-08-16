"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Award, Clock, RotateCcw } from "lucide-react"
import { useSimulados } from "@/hooks/use-simulados"

export function SimuladoResults() {
  const { simuladoAtual, resetSimulado } = useSimulados()

  if (!simuladoAtual) {
    return (
      <div className="text-center text-white">
        <p>Nenhum resultado disponível.</p>
      </div>
    )
  }

  const { score, total_questions, questions, user_answers } = simuladoAtual
  const percentage = (score / total_questions) * 100

  const getPerformanceColor = () => {
    if (percentage >= 80) return "text-green-400"
    if (percentage >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const getPerformanceMessage = () => {
    if (percentage >= 80) return "Excelente desempenho!"
    if (percentage >= 60) return "Bom desempenho!"
    return "Continue estudando!"
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Results Summary */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-center">Resultado do Simulado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-6xl font-bold ${getPerformanceColor()}`}>{percentage.toFixed(1)}%</div>
            <div className="text-slate-300 text-lg mt-2">{getPerformanceMessage()}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <Award className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{score}</div>
              <div className="text-slate-300 text-sm">Acertos</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{total_questions - score}</div>
              <div className="text-slate-300 text-sm">Erros</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{total_questions}</div>
              <div className="text-slate-300 text-sm">Total</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Progresso</span>
              <span>
                {score}/{total_questions}
              </span>
            </div>
            <Progress value={percentage} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Revisão das Questões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((questao) => {
            const respostaUsuario = user_answers[questao.id]
            const acertou = respostaUsuario === questao.gabarito

            return (
              <div key={questao.id} className="border border-slate-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-white font-medium">
                    {questao.id}. {questao.enunciado}
                  </h4>
                  {acertou ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 ml-2" />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Sua resposta:</span>
                    <span className={acertou ? "text-green-400" : "text-red-400"}>
                      {respostaUsuario
                        ? `${respostaUsuario.toUpperCase()}) ${questao.alternativas[respostaUsuario as keyof typeof questao.alternativas]}`
                        : "Não respondida"}
                    </span>
                  </div>

                  {!acertou && (
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Resposta correta:</span>
                      <span className="text-green-400">
                        {questao.gabarito.toUpperCase()}) {questao.alternativas[questao.gabarito as keyof typeof questao.alternativas]}
                      </span>
                    </div>
                  )}

                  {questao.explicacao && (
                    <div className="mt-3 p-3 bg-slate-700 rounded">
                      <div className="text-slate-400 text-xs mb-1">Explicação:</div>
                      <div className="text-slate-200">{questao.explicacao}</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center">
        <Button onClick={resetSimulado} className="bg-blue-600 hover:bg-blue-700">
          <RotateCcw className="w-4 h-4 mr-2" />
          Fazer Novo Simulado
        </Button>
      </div>
    </div>
  )
}
