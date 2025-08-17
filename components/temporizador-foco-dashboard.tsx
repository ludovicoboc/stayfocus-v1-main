"use client"

import { useState, useEffect } from "react"
import { useDashboard } from "@/hooks/use-dashboard"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Square } from "lucide-react"
import { getCurrentDateString } from "@/lib/utils"

export function TemporizadorFocoDashboard({ date }: { date?: string }) {
  const resolvedDate = date || getCurrentDateString()
  const { dashboardData, iniciarSessaoFoco, pausarSessaoFoco, pararSessaoFoco } = useDashboard(resolvedDate)
  const [tempoLocal, setTempoLocal] = useState(0)

  const sessaoAtiva = dashboardData?.sessaoFoco

  useEffect(() => {
    if (sessaoAtiva && sessaoAtiva.ativa && !sessaoAtiva.pausada) {
      const interval = setInterval(() => {
        setTempoLocal((prev) => {
          const novoTempo = prev - 1
          if (novoTempo <= 0) {
            // Sessão finalizada
            pararSessaoFoco()
            return 0
          }
          return novoTempo
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [sessaoAtiva, pararSessaoFoco])

  useEffect(() => {
    if (sessaoAtiva) {
      setTempoLocal(sessaoAtiva.tempo_restante)
    }
  }, [sessaoAtiva])

  const formatarTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`
  }

  const calcularProgresso = () => {
    if (!sessaoAtiva) return 0
    const tempoTotal = sessaoAtiva.duracao_minutos * 60
    const tempoDecorrido = tempoTotal - tempoLocal
    return (tempoDecorrido / tempoTotal) * 100
  }

  const handleIniciarSessao = async (duracao: number) => {
    try {
      await iniciarSessaoFoco(duracao)
    } catch (error) {
      console.error("Erro ao iniciar sessão:", error)
    }
  }

  const handlePausar = async () => {
    try {
      await pausarSessaoFoco()
    } catch (error) {
      console.error("Erro ao pausar sessão:", error)
    }
  }

  const handleParar = async () => {
    try {
      await pararSessaoFoco()
      setTempoLocal(0)
    } catch (error) {
      console.error("Erro ao parar sessão:", error)
    }
  }

  if (!sessaoAtiva || !sessaoAtiva.ativa) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-mono text-slate-400 mb-2">00:00</div>
          <p className="text-sm text-slate-500">Nenhuma sessão ativa</p>
        </div>

        <div className="space-y-2">
          <Button onClick={() => handleIniciarSessao(25)} className="w-full bg-green-600 hover:bg-green-700" size="sm">
            <Play className="w-4 h-4 mr-2" />
            Pomodoro (25min)
          </Button>
          <Button onClick={() => handleIniciarSessao(15)} className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
            <Play className="w-4 h-4 mr-2" />
            Foco Curto (15min)
          </Button>
          <Button
            onClick={() => handleIniciarSessao(45)}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Foco Longo (45min)
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-mono text-white mb-2">{formatarTempo(tempoLocal)}</div>
        <p className="text-sm text-slate-400">{sessaoAtiva.pausada ? "Pausado" : "Em andamento"}</p>
      </div>

      <Progress value={calcularProgresso()} className="h-2" />

      <div className="flex gap-2">
        {sessaoAtiva.pausada ? (
          <Button
            onClick={() => iniciarSessaoFoco(sessaoAtiva.duracao_minutos)}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Continuar
          </Button>
        ) : (
          <Button onClick={handlePausar} className="flex-1 bg-yellow-600 hover:bg-yellow-700" size="sm">
            <Pause className="w-4 h-4 mr-2" />
            Pausar
          </Button>
        )}
        <Button
          onClick={handleParar}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
          size="sm"
        >
          <Square className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-center">
        <p className="text-xs text-slate-500">Sessão de {sessaoAtiva.duracao_minutos} minutos</p>
      </div>
    </div>
  )
}
