"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, Settings } from "lucide-react"
import { usePomodoro } from "@/hooks/use-pomodoro"

export function TemporizadorPomodoro() {
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
  } = usePomodoro()

  const [showSettings, setShowSettings] = useState(false)
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
    </>
  )
}
