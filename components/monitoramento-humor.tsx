"use client"

import { useState } from "react"
import { useSaude } from "@/hooks/use-saude"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, X, Info, Smile, Trash2 } from "lucide-react"
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { NovoRegistroHumor } from "@/types/saude"

export function MonitoramentoHumor() {
  const {
    registrosHumor,
    loadingRegistrosHumor,
    resumoHumor,
    adicionarRegistroHumor,
    excluirRegistroHumor,
    formatarData,
  } = useSaude()

  const [modalAberto, setModalAberto] = useState(false)
  const [novoRegistro, setNovoRegistro] = useState<Partial<NovoRegistroHumor>>({
    data: format(new Date(), "yyyy-MM-dd"),
    nivel_humor: 3,
    fatores: [],
    notas: "",
  })
  const [fatorAtual, setFatorAtual] = useState("")
  const [mesAtual, setMesAtual] = useState(new Date())

  const adicionarFator = () => {
    if (!fatorAtual.trim()) return

    const fatores = [...(novoRegistro.fatores || []), fatorAtual.trim()]
    setNovoRegistro({
      ...novoRegistro,
      fatores,
    })
    setFatorAtual("")
  }

  const removerFator = (index: number) => {
    const fatores = [...(novoRegistro.fatores || [])]
    fatores.splice(index, 1)
    setNovoRegistro({
      ...novoRegistro,
      fatores,
    })
  }

  const handleSubmit = async () => {
    if (novoRegistro.nivel_humor === undefined) return

    await adicionarRegistroHumor({
      data: novoRegistro.data || format(new Date(), "yyyy-MM-dd"),
      nivel_humor: novoRegistro.nivel_humor,
      fatores: novoRegistro.fatores,
      notas: novoRegistro.notas,
    })

    setModalAberto(false)
    resetForm()
  }

  const resetForm = () => {
    setNovoRegistro({
      data: format(new Date(), "yyyy-MM-dd"),
      nivel_humor: 3,
      fatores: [],
      notas: "",
    })
    setFatorAtual("")
  }

  // Gerar dias do calendário
  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual),
  })

  // Obter o primeiro dia da semana (0 = domingo, 1 = segunda, etc.)
  const primeiroDiaSemana = getDay(startOfMonth(mesAtual))

  // Criar array com dias vazios para alinhar o calendário
  const diasVaziosInicio = Array(primeiroDiaSemana).fill(null)

  // Encontrar registros para o mês atual
  const registrosPorDia = diasDoMes.map((dia) => {
    const registro = registrosHumor.find((r) => isSameDay(parseISO(r.data), dia))
    return {
      dia,
      registro,
    }
  })

  // Mudar mês
  const mudarMes = (direcao: number) => {
    const novoMes = new Date(mesAtual)
    novoMes.setMonth(novoMes.getMonth() + direcao)
    setMesAtual(novoMes)
  }

  // Renderizar círculos de humor
  const renderizarNivelHumor = (nivel: number, selecionado: boolean, onClick: () => void) => {
    const cores = {
      1: "bg-red-500",
      2: "bg-orange-500",
      3: "bg-yellow-500",
      4: "bg-green-500",
      5: "bg-emerald-500",
    }

    return (
      <button
        key={nivel}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
          ${cores[nivel as keyof typeof cores]} 
          ${selecionado ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800" : "opacity-70"}`}
        onClick={onClick}
      >
        {nivel}
      </button>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Monitoramento de Humor</h2>
        <Button onClick={() => setModalAberto(true)} className="bg-blue-600 hover:bg-blue-700">
          <PlusCircle className="w-4 h-4 mr-2" />
          Novo Registro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Humor Médio</p>
              <p className="text-2xl font-bold text-white">{resumoHumor.media.toFixed(1)}</p>
              <p className="text-xs text-slate-500">Baseado em todos os registros</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Smile className="w-4 h-4 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400 mb-2">Fatores Mais Comuns</p>
            {resumoHumor.fatoresComuns.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resumoHumor.fatoresComuns.map((fator, index) => (
                  <Badge key={index} className="bg-slate-700 text-white">
                    {fator}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-white">Nenhum fator registrado ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-white text-lg">Calendário de Humor</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-700 text-white"
              onClick={() => mudarMes(-1)}
            >
              &lt;
            </Button>
            <span className="text-white">{format(mesAtual, "MMMM yyyy", { locale: ptBR })}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-700 text-white"
              onClick={() => mudarMes(1)}
            >
              &gt;
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
              <div key={dia} className="text-center text-xs text-slate-400 py-1">
                {dia}
              </div>
            ))}

            {diasVaziosInicio.map((_, index) => (
              <div key={`empty-${index}`} className="h-8 rounded-md"></div>
            ))}

            {registrosPorDia.map(({ dia, registro }) => {
              const nivelHumor = registro?.nivel_humor
              const cores = {
                1: "bg-red-500/20 border-red-500/30",
                2: "bg-orange-500/20 border-orange-500/30",
                3: "bg-yellow-500/20 border-yellow-500/30",
                4: "bg-green-500/20 border-green-500/30",
                5: "bg-emerald-500/20 border-emerald-500/30",
              }

              const corClasse = nivelHumor ? cores[nivelHumor as keyof typeof cores] : ""

              return (
                <div
                  key={dia.toISOString()}
                  className={`h-8 flex items-center justify-center rounded-md text-xs
                    ${isSameDay(dia, new Date()) ? "border border-blue-500/50" : ""}
                    ${nivelHumor ? `${corClasse} border` : ""}
                  `}
                >
                  {dia.getDate()}
                  {nivelHumor && <span className="ml-1 w-2 h-2 rounded-full bg-white"></span>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Registros Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRegistrosHumor ? (
            <div className="text-center py-8">
              <p className="text-slate-400">Carregando registros...</p>
            </div>
          ) : registrosHumor.length === 0 ? (
            <div className="border border-dashed border-slate-700 rounded-lg p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                <Info className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 mb-2">Nenhum registro encontrado</p>
              <p className="text-slate-500 text-sm">
                Adicione seu primeiro registro de humor usando o botão "Novo Registro".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {registrosHumor.slice(0, 5).map((registro) => {
                const cores = {
                  1: "bg-red-500",
                  2: "bg-orange-500",
                  3: "bg-yellow-500",
                  4: "bg-green-500",
                  5: "bg-emerald-500",
                }

                return (
                  <div
                    key={registro.id}
                    className="flex items-center justify-between p-3 bg-slate-750 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center">
                      <div className="flex space-x-1">
                        {Array.from({ length: registro.nivel_humor }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-5 h-5 rounded-full ${cores[registro.nivel_humor as keyof typeof cores]}`}
                          ></div>
                        ))}
                      </div>
                      <div className="ml-3">
                        <p className="text-white font-medium">{formatarData(registro.data)}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {registro.fatores?.map((fator, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-slate-700/50 text-slate-300">
                              {fator}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-400"
                      onClick={() => excluirRegistroHumor(registro.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Novo Registro de Humor</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Data</label>
              <Input
                type="date"
                className="bg-slate-900 border-slate-700 text-white"
                value={novoRegistro.data}
                onChange={(e) => setNovoRegistro({ ...novoRegistro, data: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">Nível de Humor (1-5)</label>
              <div className="flex space-x-2 mt-2">
                {[1, 2, 3, 4, 5].map((nivel) =>
                  renderizarNivelHumor(nivel, nivel === novoRegistro.nivel_humor, () =>
                    setNovoRegistro({ ...novoRegistro, nivel_humor: nivel }),
                  ),
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">Fatores que influenciaram</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Adicionar fator..."
                  className="bg-slate-900 border-slate-700 text-white"
                  value={fatorAtual}
                  onChange={(e) => setFatorAtual(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      adicionarFator()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700 text-white"
                  onClick={adicionarFator}
                >
                  <PlusCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {novoRegistro.fatores?.map((fator, index) => (
                  <Badge key={index} className="bg-slate-700 hover:bg-slate-600 text-white">
                    {fator}
                    <button className="ml-1 hover:text-red-400" onClick={() => removerFator(index)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">Notas (opcional)</label>
              <Textarea
                placeholder="Adicione detalhes sobre como você se sentiu..."
                className="bg-slate-900 border-slate-700 text-white resize-none"
                value={novoRegistro.notas || ""}
                onChange={(e) => setNovoRegistro({ ...novoRegistro, notas: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-700"
              onClick={() => {
                setModalAberto(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
              Adicionar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
