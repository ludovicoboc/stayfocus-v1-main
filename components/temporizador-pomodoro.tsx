"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, RotateCcw, Settings, Link } from "lucide-react"
import { usePomodoro } from "@/hooks/use-pomodoro"
import { useEstudos } from "@/hooks/use-estudos"

export function TemporizadorPomodoro() {
  const [studySessionId, setStudySessionId] = useState<string | null>(null)
  const { sessoes } = useEstudos()
  const {
    state,
    timeLeft,
    cyclesCompleted,
    config,
    start,
    pause,
    reset,
    adjustConfig,
    formatTime,
    getStateLabel,
    isActive,
  } = usePomodoro(studySessionId)

  const [showSettings, setShowSettings] = useState(false)
  const [showLinkSession, setShowLinkSession] = useState(false)
  const [tempConfig, setTempConfig] = useState(config)

  const handleStart = () => {
    if (state === "idle" || state === "paused") {
      start()
    } else {
      pause()
    }
  }

  const handleSaveSettings = () => {
    adjustConfig(tempConfig)
    setShowSettings(false)
  }

  const getLinkedSessionInfo = () => {
    if (!studySessionId) return null
    return sessoes.find(s => s.id === studySessionId)
  }

  const linkedSession = getLinkedSessionInfo()
  const availableSessions = sessoes.filter(s => !s.completed)

  const getButtonText = () => {
    if (state === "idle") return "Iniciar"
    if (state === "paused") return "Continuar"
    return "Pausar"
  }

  const getButtonIcon = () => {
    if (state === "idle" || state === "paused") {
      return <Play className="w-4 h-4 mr-2" />
    }
    return <Pause className="w-4 h-4 mr-2" />
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Temporizador Pomodoro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Info */}
          {linkedSession && (
            <div className="bg-blue-800 rounded-lg p-3 mb-4">
              <div className="text-blue-100 text-sm font-medium mb-1">Conectado à sessão:</div>
              <div className="text-blue-100 text-xs">
                {linkedSession.subject}
                {linkedSession.topic && ` - ${linkedSession.topic}`}
              </div>
            </div>
          )}

          {/* Timer Display */}
          <div className="text-center">
            <div className="bg-orange-800 rounded-lg p-4 mb-4">
              <div className="text-orange-100 text-sm mb-1">{getStateLabel()}</div>
              <div className="text-orange-100 text-xs">Ciclos completos: {cyclesCompleted}</div>
            </div>

            <div className="text-6xl font-bold text-white mb-4 font-mono">{formatTime(timeLeft)}</div>

            <div className="flex justify-center space-x-3">
              <Button
                onClick={handleStart}
                className={`${
                  state === "idle" || state === "paused"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                {getButtonIcon()}
                {getButtonText()}
              </Button>

              <Button
                onClick={reset}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                disabled={!isActive && state === "idle"}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>

              <Button
                onClick={() => {
                  setTempConfig(config)
                  setShowSettings(true)
                }}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Ajustar
              </Button>

              <Button
                onClick={() => setShowLinkSession(true)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                disabled={isActive && state !== "idle"}
              >
                <Link className="w-4 h-4 mr-2" />
                {linkedSession ? "Alterar" : "Conectar"}
              </Button>
            </div>
          </div>

          {/* Motivational Text */}
          <div className="text-center">
            <p className="text-orange-300 text-sm italic">Concentre-se em uma única tarefa. Evite distrações.</p>
          </div>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Configurações do Pomodoro</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="focus-duration" className="text-slate-300">
                Duração do Foco (minutos)
              </Label>
              <Input
                id="focus-duration"
                type="number"
                value={tempConfig.focusDuration}
                onChange={(e) => setTempConfig({ ...tempConfig, focusDuration: Number.parseInt(e.target.value) || 25 })}
                className="bg-slate-700 border-slate-600 text-white"
                min="1"
                max="60"
              />
            </div>

            <div>
              <Label htmlFor="break-duration" className="text-slate-300">
                Duração da Pausa (minutos)
              </Label>
              <Input
                id="break-duration"
                type="number"
                value={tempConfig.breakDuration}
                onChange={(e) => setTempConfig({ ...tempConfig, breakDuration: Number.parseInt(e.target.value) || 5 })}
                className="bg-slate-700 border-slate-600 text-white"
                min="1"
                max="30"
              />
            </div>

            <div>
              <Label htmlFor="long-break-duration" className="text-slate-300">
                Duração da Pausa Longa (minutos)
              </Label>
              <Input
                id="long-break-duration"
                type="number"
                value={tempConfig.longBreakDuration}
                onChange={(e) =>
                  setTempConfig({ ...tempConfig, longBreakDuration: Number.parseInt(e.target.value) || 15 })
                }
                className="bg-slate-700 border-slate-600 text-white"
                min="1"
                max="60"
              />
            </div>

            <div>
              <Label htmlFor="cycles-until-long-break" className="text-slate-300">
                Ciclos até Pausa Longa
              </Label>
              <Input
                id="cycles-until-long-break"
                type="number"
                value={tempConfig.cyclesUntilLongBreak}
                onChange={(e) =>
                  setTempConfig({ ...tempConfig, cyclesUntilLongBreak: Number.parseInt(e.target.value) || 4 })
                }
                className="bg-slate-700 border-slate-600 text-white"
                min="2"
                max="10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Session Dialog */}
      <Dialog open={showLinkSession} onOpenChange={setShowLinkSession}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Conectar Sessão de Estudo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300 mb-2 block">
                Selecione uma sessão de estudo para conectar ao Pomodoro:
              </Label>
              {availableSessions.length > 0 ? (
                <Select
                  value={studySessionId || "none"}
                  onValueChange={(value) => setStudySessionId(value === "none" ? null : value)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecionar sessão" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="none" className="text-white">
                      Nenhuma sessão (desconectar)
                    </SelectItem>
                    {availableSessions.map((sessao) => (
                      <SelectItem key={sessao.id} value={sessao.id!} className="text-white">
                        {sessao.subject}
                        {sessao.topic && ` - ${sessao.topic}`}
                        {` (${sessao.duration_minutes} min)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-slate-400 text-sm">
                  Nenhuma sessão de estudo ativa disponível. Crie uma sessão primeiro.
                </div>
              )}
            </div>

            {linkedSession && (
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="text-slate-300 text-sm">
                  <strong>Sessão atual:</strong> {linkedSession.subject}
                  {linkedSession.topic && ` - ${linkedSession.topic}`}
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  Ciclos completados: {linkedSession.pomodoro_cycles || 0}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLinkSession(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => setShowLinkSession(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
