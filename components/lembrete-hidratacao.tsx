"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplets } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-provider"

export function LembreteHidratacao() {
  const { user } = useAuth()
  const supabase = createClient()
  const [glassesCount, setGlassesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const targetGlasses = 8

  useEffect(() => {
    if (user) {
      fetchHydrationData()
    }
  }, [user])

  const fetchHydrationData = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("hydration_records")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single()

      if (error && error.code !== "PGRST116") throw error

      setGlassesCount(data?.glasses_count || 0)
    } catch (error) {
      console.error("Error fetching hydration data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateHydration = async (newCount: number) => {
    if (!user || newCount < 0) return

    try {
      const today = new Date().toISOString().split("T")[0]

      const { error } = await supabase.from("hydration_records").upsert({
        user_id: user.id,
        date: today,
        glasses_count: newCount,
      })

      if (error) throw error

      setGlassesCount(newCount)
    } catch (error) {
      console.error("Error updating hydration:", error)
    }
  }

  const addGlass = () => updateHydration(glassesCount + 1)
  const removeGlass = () => updateHydration(Math.max(0, glassesCount - 1))

  const percentage = Math.round((glassesCount / targetGlasses) * 100)

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Hidratação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Hidratação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-slate-300 mb-2">Acompanhamento de Hidratação</div>
          <div className="text-sm text-slate-400 mb-4">Mantenha-se sempre bem hidratado ao longo do dia.</div>
        </div>

        <div className="text-right">
          <span className="text-slate-300">
            {glassesCount} de {targetGlasses} copos
          </span>
          <div className="text-2xl font-bold text-blue-400">{percentage}%</div>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: targetGlasses }, (_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg border-2 flex items-center justify-center ${
                i < glassesCount ? "bg-blue-500 border-blue-400" : "bg-slate-700 border-slate-600"
              }`}
            >
              <Droplets className={`w-6 h-6 ${i < glassesCount ? "text-white" : "text-slate-500"}`} />
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <Button onClick={addGlass} className="bg-blue-600 hover:bg-blue-700 flex-1">
            Registrar Copo
          </Button>
          <Button
            onClick={removeGlass}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            disabled={glassesCount === 0}
          >
            Remover Copo
          </Button>
        </div>

        <div className="text-xs text-slate-400 space-y-1">
          <div>Dicas de Hidratação:</div>
          <div>• Mantenha uma garrafa de água sempre próxima</div>
          <div>• Beba um copo ao acordar e antes de cada refeição</div>
          <div>• Configure lembretes no celular a cada 1-2 horas</div>
        </div>
      </CardContent>
    </Card>
  )
}
