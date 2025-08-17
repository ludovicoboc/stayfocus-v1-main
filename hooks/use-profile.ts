"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "./use-auth"
import type {
  UserPreferences,
  UserGoals,
  UserProfile,
  NovaPreferencia,
  NovaMeta,
  NovoProfile,
  ExportData,
} from "@/types/profile"

export function useProfile() {
  const supabase = createClient()
  const { user } = useAuth()

  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [goals, setGoals] = useState<UserGoals | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Carregar dados do usuário
  const loadUserData = useCallback(async () => {
    if (!user) return

    try {
      // Carregar preferências
      setLoadingPreferences(true)
      const { data: preferencesData, error: preferencesError } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (preferencesError && preferencesError.code !== "PGRST116") {
        console.error("Erro ao carregar preferências:", preferencesError)
      } else {
        setPreferences(preferencesData || null)
      }

      // Carregar metas
      setLoadingGoals(true)
      const { data: goalsData, error: goalsError } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (goalsError && goalsError.code !== "PGRST116") {
        console.error("Erro ao carregar metas:", goalsError)
      } else {
        setGoals(goalsData || null)
      }

      // Carregar perfil
      setLoadingProfile(true)
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Erro ao carregar perfil:", profileError)
      } else {
        setProfile(profileData || null)
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error)
    } finally {
      setLoadingPreferences(false)
      setLoadingGoals(false)
      setLoadingProfile(false)
    }
  }, [supabase, user])

  // Salvar preferências
  const savePreferences = async (novasPreferencias: NovaPreferencia) => {
    if (!user) return false

    try {
      const dadosPreferencias = {
        user_id: user.id,
        high_contrast: novasPreferencias.high_contrast,
        large_text: novasPreferencias.large_text,
        reduced_stimuli: novasPreferencias.reduced_stimuli,
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .upsert(dadosPreferencias, {
          onConflict: "user_id",
        })
        .select()
        .single()

      if (error) throw error

      setPreferences(data)
      
      // Aplicar preferências visuais imediatamente
      document.documentElement.classList.toggle("high-contrast", novasPreferencias.high_contrast)
      document.documentElement.classList.toggle("large-text", novasPreferencias.large_text)
      document.documentElement.classList.toggle("reduced-stimuli", novasPreferencias.reduced_stimuli)

      return true
    } catch (error) {
      console.error("Erro ao salvar preferências:", error)
      return false
    }
  }

  // Salvar metas
  const saveGoals = async (novasMetas: NovaMeta) => {
    if (!user) return false

    try {
      const dadosMetas = {
        user_id: user.id,
        sleep_hours: novasMetas.sleep_hours,
        daily_tasks: novasMetas.daily_tasks,
        water_glasses: novasMetas.water_glasses,
        break_frequency: novasMetas.break_frequency,
      }

      const { data, error } = await supabase
        .from("user_goals")
        .upsert(dadosMetas, {
          onConflict: "user_id",
        })
        .select()
        .single()

      if (error) throw error

      setGoals(data)
      return true
    } catch (error) {
      console.error("Erro ao salvar metas:", error)
      return false
    }
  }

  // Salvar perfil
  const saveProfile = async (novoProfile: NovoProfile) => {
    if (!user) return false

    try {
      const dadosProfile = {
        user_id: user.id,
        display_name: novoProfile.display_name,
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .upsert(dadosProfile, {
          onConflict: "user_id",
        })
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return true
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      return false
    }
  }

  // Exportar dados do usuário
  const exportUserData = async (): Promise<ExportData | null> => {
    if (!user) return null

    try {
      await loadUserData() // Garantir que temos os dados mais recentes

      const exportData: ExportData = {
        preferences,
        goals,
        profile,
        export_date: new Date().toISOString(),
        version: "1.0",
      }

      // Criar e baixar arquivo JSON
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement("a")
      link.href = url
      link.download = `stayfocus-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return exportData
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
      return null
    }
  }

  // Importar dados do usuário
  const importUserData = async (): Promise<boolean> => {
    if (!user) return false

    return new Promise((resolve) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".json"
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (!file) {
          resolve(false)
          return
        }

        try {
          const text = await file.text()
          const importData: ExportData = JSON.parse(text)

          // Validar estrutura dos dados
          if (!importData.version || !importData.export_date) {
            throw new Error("Arquivo de backup inválido")
          }

          // Confirmar importação
          const confirmImport = confirm(
            `Deseja importar os dados do backup de ${new Date(importData.export_date).toLocaleDateString("pt-BR")}? Isso substituirá suas configurações atuais.`
          )

          if (!confirmImport) {
            resolve(false)
            return
          }

          // Importar preferências
          if (importData.preferences) {
            const success1 = await savePreferences({
              high_contrast: importData.preferences.high_contrast,
              large_text: importData.preferences.large_text,
              reduced_stimuli: importData.preferences.reduced_stimuli,
            })
            if (!success1) throw new Error("Erro ao importar preferências")
          }

          // Importar metas
          if (importData.goals) {
            const success2 = await saveGoals({
              sleep_hours: importData.goals.sleep_hours,
              daily_tasks: importData.goals.daily_tasks,
              water_glasses: importData.goals.water_glasses,
              break_frequency: importData.goals.break_frequency,
            })
            if (!success2) throw new Error("Erro ao importar metas")
          }

          // Importar perfil
          if (importData.profile && importData.profile.display_name) {
            const success3 = await saveProfile({
              display_name: importData.profile.display_name,
            })
            if (!success3) throw new Error("Erro ao importar perfil")
          }

          // Recarregar dados
          await loadUserData()
          resolve(true)
        } catch (error) {
          console.error("Erro ao importar dados:", error)
          alert("Erro ao importar dados. Verifique se o arquivo é um backup válido.")
          resolve(false)
        }
      }
      input.click()
    })
  }

  // Resetar configurações
  const resetSettings = async () => {
    if (!user) return false

    try {
      // Resetar preferências para valores padrão
      const defaultPreferences = {
        high_contrast: false,
        large_text: false,
        reduced_stimuli: false,
      }

      const defaultGoals = {
        sleep_hours: 8,
        daily_tasks: 5,
        water_glasses: 8,
        break_frequency: 2,
      }

      const success1 = await savePreferences(defaultPreferences)
      const success2 = await saveGoals(defaultGoals)

      if (success1 && success2) {
        // Remover classes CSS
        document.documentElement.classList.remove("high-contrast", "large-text", "reduced-stimuli")
        return true
      }

      return false
    } catch (error) {
      console.error("Erro ao resetar configurações:", error)
      return false
    }
  }

  // Aplicar preferências visuais ao carregar
  useEffect(() => {
    if (preferences) {
      document.documentElement.classList.toggle("high-contrast", preferences.high_contrast)
      document.documentElement.classList.toggle("large-text", preferences.large_text)
      document.documentElement.classList.toggle("reduced-stimuli", preferences.reduced_stimuli)
    }
  }, [preferences])

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user, loadUserData])

  return {
    preferences,
    goals,
    profile,
    loadingPreferences,
    loadingGoals,
    loadingProfile,
    savePreferences,
    saveGoals,
    saveProfile,
    loadUserData,
    exportUserData,
    importUserData,
    resetSettings,
  }
}
