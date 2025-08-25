"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useProfile } from "@/hooks/use-profile"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Target, Eye, Type, Volume, RotateCcw, Download, Upload, HelpCircle, Settings } from "lucide-react"
import Link from "next/link"

export default function PerfilPage() {
  const { user, loading } = useAuth()
  const {
    preferences: userPreferences,
    goals: userGoals,
    profile,
    loadingPreferences,
    loadingGoals,
    loadingProfile,
    savePreferences,
    saveGoals,
    saveProfile,
    exportUserData,
    importUserData,
    resetSettings,
  } = useProfile()

  const [displayName, setDisplayName] = useState("")
  const [localPreferences, setLocalPreferences] = useState({
    highContrast: false,
    largeText: false,
    reducedStimuli: false,
  })
  const [localGoals, setLocalGoals] = useState({
    sleepHours: 8,
    dailyTasks: 5,
    waterGlasses: 8,
    breakFrequency: 2,
  })

  // Sincronizar dados carregados com estados locais
  useEffect(() => {
    if (userPreferences) {
      setLocalPreferences({
        highContrast: userPreferences.high_contrast,
        largeText: userPreferences.large_text,
        reducedStimuli: userPreferences.reduced_stimuli,
      })
    }
  }, [userPreferences])

  useEffect(() => {
    if (userGoals) {
      setLocalGoals({
        sleepHours: userGoals.sleep_hours,
        dailyTasks: userGoals.daily_tasks,
        waterGlasses: userGoals.water_glasses,
        breakFrequency: userGoals.break_frequency,
      })
    }
  }, [userGoals])

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name)
    } else if (user?.email) {
      setDisplayName(user.email.split("@")[0])
    }
  }, [profile, user])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-xl font-bold mb-4">Login Necessário</div>
            <div className="text-muted-foreground text-center mb-6">
              Você precisa estar logado para acessar esta página.
            </div>
            <Link href="/auth">
              <Button className="w-full">Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handlePreferenceChange = (key: string, value: boolean) => {
    setLocalPreferences((prev) => ({ ...prev, [key]: value }))
    // Aplicar preferência imediatamente
    if (key === "highContrast") {
      document.documentElement.classList.toggle("high-contrast", value)
    }
    if (key === "largeText") {
      document.documentElement.classList.toggle("large-text", value)
    }
    if (key === "reducedStimuli") {
      document.documentElement.classList.toggle("reduced-stimuli", value)
    }
  }

  const handleGoalChange = (key: string, value: number) => {
    setLocalGoals((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      alert("Por favor, insira um nome de exibição.")
      return
    }

    const success = await saveProfile({ display_name: displayName.trim() })
    if (success) {
      alert("Informações salvas com sucesso!")
    } else {
      alert("Erro ao salvar informações. Tente novamente.")
    }
  }

  const handleSavePreferences = async () => {
    const success = await savePreferences({
      high_contrast: localPreferences.highContrast,
      large_text: localPreferences.largeText,
      reduced_stimuli: localPreferences.reducedStimuli,
    })
    
    if (success) {
      alert("Preferências salvas com sucesso!")
    } else {
      alert("Erro ao salvar preferências. Tente novamente.")
    }
  }

  const handleSaveGoals = async () => {
    const success = await saveGoals({
      sleep_hours: localGoals.sleepHours,
      daily_tasks: localGoals.dailyTasks,
      water_glasses: localGoals.waterGlasses,
      break_frequency: localGoals.breakFrequency,
    })
    
    if (success) {
      alert("Metas salvas com sucesso!")
    } else {
      alert("Erro ao salvar metas. Tente novamente.")
    }
  }

  const handleExportData = async () => {
    const exportData = await exportUserData()
    if (exportData) {
      alert("Dados exportados com sucesso!")
    } else {
      alert("Erro ao exportar dados. Tente novamente.")
    }
  }

  const handleImportData = async () => {
    const success = await importUserData()
    if (success) {
      alert("Dados importados com sucesso!")
    }
  }

  const handleResetSettings = async () => {
    if (confirm("Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita.")) {
      const success = await resetSettings()
      if (success) {
        alert("Configurações resetadas com sucesso!")
      } else {
        alert("Erro ao resetar configurações. Tente novamente.")
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Perfil"
        breadcrumbs={[{ title: "Dashboard", href: "/" }, { title: "Perfil" }]}
        actions={
          <Link href="/perfil/ajuda">
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Ajuda
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome de Exibição</Label>
              <Input
                id="name"
                placeholder="Como você gostaria de ser chamado?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleSaveProfile}>
              Salvar Informações
            </Button>
          </CardContent>
        </Card>

        {/* Metas Diárias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas Diárias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sleep">Horas de Sono</Label>
                <Input
                  id="sleep"
                  type="number"
                  min="6"
                  max="12"
                  value={localGoals.sleepHours}
                  onChange={(e) => handleGoalChange("sleepHours", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tasks">Tarefas Diárias</Label>
                <Input
                  id="tasks"
                  type="number"
                  min="1"
                  max="20"
                  value={localGoals.dailyTasks}
                  onChange={(e) => handleGoalChange("dailyTasks", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="water">Copos de Água</Label>
                <Input
                  id="water"
                  type="number"
                  min="4"
                  max="15"
                  value={localGoals.waterGlasses}
                  onChange={(e) => handleGoalChange("waterGlasses", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breaks">Pausas por Hora</Label>
                <Input
                  id="breaks"
                  type="number"
                  min="1"
                  max="6"
                  value={localGoals.breakFrequency}
                  onChange={(e) => handleGoalChange("breakFrequency", Number(e.target.value))}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleSaveGoals}>Salvar Metas</Button>
          </CardContent>
        </Card>

        {/* Preferências Visuais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferências Visuais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <Label>Alto Contraste</Label>
                </div>
                <p className="text-sm text-muted-foreground">Melhora a legibilidade com cores mais contrastantes</p>
              </div>
              <Switch
                checked={localPreferences.highContrast}
                onCheckedChange={(checked) => handlePreferenceChange("highContrast", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <Label>Texto Grande</Label>
                </div>
                <p className="text-sm text-muted-foreground">Aumenta o tamanho da fonte em toda a aplicação</p>
              </div>
              <Switch
                checked={localPreferences.largeText}
                onCheckedChange={(checked) => handlePreferenceChange("largeText", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Volume className="h-4 w-4" />
                  <Label>Redução de Estímulos</Label>
                </div>
                <p className="text-sm text-muted-foreground">Interface mais calma com menos animações</p>
              </div>
              <Switch
                checked={localPreferences.reducedStimuli}
                onCheckedChange={(checked) => handlePreferenceChange("reducedStimuli", checked)}
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Badge variant="outline" className="text-xs">
                Preferências aplicadas automaticamente
              </Badge>
              <Button size="sm" onClick={handleSavePreferences}>
                Salvar Preferências
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup e Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Backup e Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados (JSON)
              </Button>
              <Button variant="outline" onClick={handleImportData}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Dados
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-destructive">Zona de Perigo</Label>
              <Button variant="destructive" onClick={handleResetSettings} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar Todas as Configurações
              </Button>
              <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
