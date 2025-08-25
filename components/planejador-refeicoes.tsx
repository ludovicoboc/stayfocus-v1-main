"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, Edit2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-provider"

interface MealPlan {
  id: string
  time: string
  description: string
}

export function PlanejadorRefeicoes() {
  const { user } = useAuth()
  const supabase = createClient()
  const [meals, setMeals] = useState<MealPlan[]>([])
  const [newMealTime, setNewMealTime] = useState("")
  const [newMealDescription, setNewMealDescription] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMeals()
    }
  }, [user])

  const fetchMeals = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("meal_plans").select("*").eq("user_id", user.id).order("time")

      if (error) throw error
      setMeals(data || [])
    } catch (error) {
      console.error("Error fetching meals:", error)
    } finally {
      setLoading(false)
    }
  }

  const addMeal = async () => {
    if (!user || !newMealTime || !newMealDescription) return

    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .insert({
          user_id: user.id,
          time: newMealTime,
          description: newMealDescription,
        })
        .select()
        .single()

      if (error) throw error

      setMeals([...meals, data])
      setNewMealTime("")
      setNewMealDescription("")
    } catch (error) {
      console.error("Error adding meal:", error)
    }
  }

  const deleteMeal = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("meal_plans").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error

      setMeals(meals.filter((meal) => meal.id !== id))
    } catch (error) {
      console.error("Error deleting meal:", error)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Planejador de Refeições</CardTitle>
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
        <CardTitle className="text-white">Planejador de Refeições</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meals.map((meal) => (
          <div key={meal.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-white font-medium">{meal.time}</span>
              <span className="text-slate-300">{meal.description}</span>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-red-400"
                onClick={() => deleteMeal(meal.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="border-t border-slate-600 pt-4">
          <div className="text-white mb-2">Adicionar Nova Refeição</div>
          <div className="flex space-x-2">
            <Input
              type="time"
              value={newMealTime}
              onChange={(e) => setNewMealTime(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Input
              placeholder="Descrição da refeição"
              value={newMealDescription}
              onChange={(e) => setNewMealDescription(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white flex-1"
            />
            <Button
              onClick={addMeal}
              className="bg-green-600 hover:bg-green-700"
              disabled={!newMealTime || !newMealDescription}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
