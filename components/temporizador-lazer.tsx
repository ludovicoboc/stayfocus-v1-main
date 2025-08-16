"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, AlertTriangle } from "lucide-react"
import { useLazer } from "@/hooks/use-lazer"

const PRESETS = [
  { label: "Personalizado", value: "custom" },
  { label: "15 minutos", value: "15" },
  { label: "30 minutos", value: "30" },
  { label: "45 minutos", value: "45" },
  { label: "1 hora", value: "60" },
]

export function TemporizadorLazer() {
  const { sessaoAtual, criarSessaoLazer, atualizarSessao, finalizarSessao } = useLazer()
  const [preset, setPreset] = useState("custom")
  const [duracao, setDuracao] = useState([30])
  const [tempoRestante, setTempoRestante] = useState(30 * 60) // em segundos
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (sessaoAtual) {
      const duracaoSegundos = sessaoAtual.duracao_minutos * 60
      const tempoUsadoSegundos = sessaoAtual.tempo_usado_minutos * 60
      setTempoRestante(duracaoSegundos - tempoUsadoSegundos)
      setIsRunning(sessaoAtual.status === "ativo")
    }
  }, [sessaoAtual])

  useEffect(() => {
    if (isRunning && tempoRestante > 0) {
      intervalRef.current = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            handleStop()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, tempoRestante])

  const handlePresetChange = (value: string) => {
    setPreset(value)
    if (value !== "custom") {
      const minutes = Number.parseInt(value)
      setDuracao([minutes])
      setTempoRestante(minutes * 60)
    }
  }

  const handleDuracaoChange = (value: number[]) => {
    setDuracao(value)
    setTempoRestante(value[0] * 60)
  }

  const handleStart = async () => {
    try {
      if (!sessaoAtual) {
        await criarSessaoLazer(duracao[0])
      }
      setIsRunning(true)
    } catch (error) {
      console.error("Erro ao iniciar sessão:", error)
    }
  }

  const handlePause = async () => {
    setIsRunning(false)
    if (sessaoAtual) {
      const tempoUsadoMinutos = Math.ceil((duracao[0] * 60 - tempoRestante) / 60)
      await atualizarSessao(sessaoAtual.id, {
        status: "pausado",
        tempo_usado_minutos: tempoUsadoMinutos,
      })
    }
  }

  const handleStop = async () => {
    setIsRunning(false)
    if (sessaoAtual) {
      await finalizarSessao(sessaoAtual.id)
    }
    setTempoRestante(duracao[0] * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Play className="w-5 h-5 mr-2" />
          Temporizador de Lazer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display do Timer */}
        <div className="text-center">
          <div className="text-6xl font-bold text-white mb-6">{formatTime(tempoRestante)}</div>

          <div className="flex justify-center space-x-4">
            {!isRunning ? (
              <Button onClick={handleStart} className="bg-blue-600 hover:bg-blue-700">
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </Button>
            ) : (
              <Button onClick={handlePause} variant="outline" className="border-slate-600 text-slate-300">
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            )}

            <Button onClick={handleStop} variant="outline" className="border-slate-600 text-slate-300">
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar
            </Button>
          </div>
        </div>

        {/* Configurações */}
        <div className="space-y-4">
          <h3 className="text-white font-medium">Configurações</h3>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Presets de Tempo</label>
            <Select value={preset} onValueChange={handlePresetChange} disabled={isRunning}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-white hover:bg-slate-600">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {preset === "custom" && (
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Duração (minutos): {duracao[0]}</label>
              <Slider
                value={duracao}
                onValueChange={handleDuracaoChange}
                max={120}
                min={5}
                step={5}
                disabled={isRunning}
                className="w-full"
              />
            </div>
          )}

          {/* Dica */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-200">
                <strong>Dica</strong>
                <p className="mt-1">
                  Use este temporizador para evitar o hiperfoco em atividades de lazer. Intervalos regulares ajudam a
                  manter o equilíbrio em suas atividades diárias.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
