"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, Square, Clock, Volume2, VolumeX } from "lucide-react"
import { useHiperfocos } from "@/hooks/use-hiperfocos"
import { toast } from "sonner"

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
        // Audio play failed, show notification instead
        toast.success("Sessão de foco concluída! 🎉")
      }
    }

    // Save session if project selected and duration > 5 minutes
    if (selectedProject && sessionStartTime) {
      const durationMinutes = parseInt(customTime)
      if (durationMinutes >= 5) {
        try {
          await createSession({
            project_id: selectedProject,
            duration_minutes: durationMinutes,
            completed: true,
            started_at: sessionStartTime.toISOString(),
            completed_at: new Date().toISOString()
          })
          toast.success("Sessão salva com sucesso!")
        } catch (error) {
          toast.error("Erro ao salvar sessão")
        }
      }
    }

    setSessionStartTime(null)
    toast.success("Sessão de foco concluída! 🎉")
  }

  const startTimer = () => {
    const minutes = parseInt(customTime)
    if (minutes > 0) {
      setTimeLeft(minutes * 60)
      setIsRunning(true)
      setIsPaused(false)
      setSessionStartTime(new Date())
    }
  }

  const pauseTimer = () => {
    setIsRunning(false)
    setIsPaused(true)
  }

  const resumeTimer = () => {
    setIsRunning(true)
    setIsPaused(false)
  }

  const stopTimer = () => {
    setIsRunning(false)
    setIsPaused(false)
    setTimeLeft(0)
    setSessionStartTime(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const presetTimes = [
    { label: "15 min", value: "15" },
    { label: "25 min", value: "25" },
    { label: "30 min", value: "30" },
    { label: "45 min", value: "45" },
    { label: "60 min", value: "60" },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Temporizador de Foco
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Selection */}
        <div className="space-y-2">
          <Label htmlFor="project-select">Projeto (opcional)</Label>
          <Select 
            value={selectedProject} 
            onValueChange={setSelectedProject}
            disabled={isRunning}
          >
            <SelectTrigger id="project-select">
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id || ''}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Selection */}
        <div className="space-y-4">
          <Label>Duração</Label>
          
          {/* Preset Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {presetTimes.map((preset) => (
              <Button
                key={preset.value}
                variant={customTime === preset.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCustomTime(preset.value)}
                disabled={isRunning}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Time Input */}
          <div className="flex items-center gap-2">
            <Label htmlFor="custom-time" className="whitespace-nowrap">
              Personalizado:
            </Label>
            <Input
              id="custom-time"
              type="number"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              disabled={isRunning}
              min="1"
              max="180"
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">minutos</span>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold mb-4">
            {timeLeft > 0 ? formatTime(timeLeft) : "00:00"}
          </div>
          
          {timeLeft > 0 && (
            <div className="w-full bg-secondary rounded-full h-2 mb-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${((parseInt(customTime) * 60 - timeLeft) / (parseInt(customTime) * 60)) * 100}%` 
                }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2">
          {!isRunning && !isPaused && (
            <Button onClick={startTimer} disabled={parseInt(customTime) <= 0}>
              <Play className="h-4 w-4 mr-2" />
              Iniciar
            </Button>
          )}
          
          {isRunning && (
            <Button onClick={pauseTimer} variant="secondary">
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </Button>
          )}
          
          {isPaused && (
            <Button onClick={resumeTimer}>
              <Play className="h-4 w-4 mr-2" />
              Continuar
            </Button>
          )}
          
          {(isRunning || isPaused) && (
            <Button onClick={stopTimer} variant="destructive">
              <Square className="h-4 w-4 mr-2" />
              Parar
            </Button>
          )}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Status */}
        {sessionStartTime && (
          <div className="text-center text-sm text-muted-foreground">
            Sessão iniciada às {sessionStartTime.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}