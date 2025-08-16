"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, Square, Clock, Volume2 } from "lucide-react"
import { useHiperfocos } from "@/hooks/use-hiperfocos"

export function TemporizadorFoco() {
  const { projects, createSession } = useHiperfocos()
  const [selectedProject, setSelectedProject] = useState("")
  const [customTime, setCustomTime] = useState("30")
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize audio for alarm
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/alarm.mp3")
    }
  }, [])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const handleTimerComplete = async () => {
    setIsRunning(false)
    setIsPaused(false)

    // Play alarm sound
    if (soundEnabled && audioRef.current) {
      try {
        await audioRef.current.play()
      } catch (error) {
        console.log("Could not play alarm sound:", error)
      }
    }

    // Save session to database
    if (selectedProject && sessionStartTime) {
      const durationMinutes = Math.round((Date.now() - sessionStartTime.getTime()) / (1000 * 60))
      await createSession({
        project_id: selectedProject,
        duration_minutes: durationMinutes,
        completed: true,
        completed_at: new Date().toISOString(),
      })
    }

    alert("Tempo de foco concluído! 🎉")
  }

  const handleStart = () => {
    if (!selectedProject || (!timeLeft && !customTime)) return

    if (!isRunning && !isPaused) {
      // Starting new session
      const minutes = Number.parseInt(customTime)
      setTimeLeft(minutes * 60)
      setSessionStartTime(new Date())
    }

    setIsRunning(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsRunning(false)
    setIsPaused(true)
  }

  const handleStop = () => {
    setIsRunning(false)
    setIsPaused(false)
    setTimeLeft(0)
    setSessionStartTime(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getProgress = () => {
    if (!customTime) return 0
    const totalSeconds = Number.parseInt(customTime) * 60
    const elapsedSeconds = totalSeconds - timeLeft
    return totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0
  }

  const selectedProjectData = projects.find((p) => p.id === selectedProject)

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-purple-400" />
          Temporizador de Foco
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-select" className="text-slate-300">
                Hiperfoco para temporizador
              </Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione um hiperfoco" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id!}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        <span>{project.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="custom-time" className="text-slate-300">
                Tempo personalizado (minutos)
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="custom-time"
                  type="number"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white flex-1"
                  min="1"
                  max="180"
                  placeholder="Ex: 30"
                />
                <Button
                  onClick={() => setCustomTime("30")}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Definir
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sound-alarm"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="sound-alarm" className="text-slate-300 flex items-center">
                <Volume2 className="w-4 h-4 mr-1" />
                Som de alarme
              </Label>
            </div>
          </div>

          {/* Timer Display */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                  className="text-purple-400 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  disabled={!selectedProject || (!timeLeft && !customTime)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {isPaused ? "Continuar" : "Iniciar"}
                </Button>
              ) : (
                <Button onClick={handlePause} className="bg-yellow-600 hover:bg-yellow-700">
                  <Pause className="w-4 h-4 mr-1" />
                  Pausar
                </Button>
              )}

              <Button onClick={handleStop} disabled={!isRunning && !isPaused} variant="destructive">
                <Square className="w-4 h-4 mr-1" />
                Parar
              </Button>
            </div>

            <div className="text-center text-slate-400 text-sm">
              {isRunning ? "Temporizador rodando" : isPaused ? "Temporizador pausado" : "Temporizador parado"}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-blue-400 text-sm">💡</div>
            <div className="text-blue-300 text-sm">
              <strong>Dica para gerenciar o tempo:</strong>
              <br />
              Utilizar temporizadores ajuda a manter o foco e evitar o hiperfoco prolongado. Defina intervalos de
              trabalho e pausas regulares para melhorar a produtividade.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
