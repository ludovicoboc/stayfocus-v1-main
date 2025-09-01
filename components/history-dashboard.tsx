"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Calendar,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  Filter,
  Star,
  Award,
  Activity,
  BarChart3,
  PieChart,
  Search,
  Download,
  RefreshCw
} from "lucide-react"
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useHistory } from "@/hooks/use-history"
import type { ModuleType, HistoryFilters, ActivityHistory } from "@/types/history"

interface HistoryDashboardProps {
  defaultModule?: ModuleType
  showAllModules?: boolean
  compact?: boolean
}

export function HistoryDashboard({ 
  defaultModule, 
  showAllModules = true, 
  compact = false 
}: HistoryDashboardProps) {
  const {
    activities,
    goals,
    summary,
    loading,
    error,
    getActivities,
    getModuleStats,
    getDailyActivities,
    getWeeklyProgress,
    toggleFavorite,
    toggleMilestone,
    refreshData,
    clearError
  } = useHistory(defaultModule)

  const [activeTab, setActiveTab] = useState("overview")
  const [selectedModule, setSelectedModule] = useState<ModuleType | "all">(defaultModule || "all")
  const [filters, setFilters] = useState<HistoryFilters>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })

  // Module options
  const moduleOptions = [
    { value: "all", label: "Todos os Módulos" },
    { value: "estudos", label: "Estudos" },
    { value: "simulados", label: "Simulados" },
    { value: "concursos", label: "Concursos" },
    { value: "financas", label: "Finanças" },
    { value: "saude", label: "Saúde" },
    { value: "sono", label: "Sono" },
    { value: "alimentacao", label: "Alimentação" },
    { value: "lazer", label: "Lazer" },
    { value: "hiperfocos", label: "Hiperfocos" },
    { value: "autoconhecimento", label: "Autoconhecimento" }
  ]

  // Filter activities based on search and filters
  const filteredActivities = activities.filter(activity => {
    if (searchTerm && !activity.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !activity.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    if (selectedModule !== "all" && activity.module !== selectedModule) {
      return false
    }
    
    return true
  })

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = activity.activity_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
    return groups
  }, {} as Record<string, ActivityHistory[]>)

  // Get module icon
  const getModuleIcon = (module: ModuleType) => {
    const icons = {
      estudos: "📚",
      simulados: "📝",
      concursos: "🏆",
      financas: "💰",
      saude: "🏥",
      sono: "😴",
      alimentacao: "🍽️",
      lazer: "🎮",
      hiperfocos: "🎯",
      autoconhecimento: "🧠"
    }
    return icons[module] || "📋"
  }

  // Get activity type color
  const getActivityTypeColor = (activityType: string) => {
    const colors = {
      study_session: "bg-blue-500",
      simulation_completed: "bg-purple-500",
      expense_added: "bg-red-500",
      medication_taken: "bg-green-500",
      meal_logged: "bg-orange-500",
      sleep_logged: "bg-indigo-500",
      activity_completed: "bg-pink-500",
      focus_session: "bg-yellow-500",
      reflection_completed: "bg-teal-500"
    }
    return colors[activityType as keyof typeof colors] || "bg-gray-500"
  }

  // Format duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Format score
  const formatScore = (score?: number) => {
    if (score === undefined || score === null) return "N/A"
    return `${score.toFixed(1)}%`
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof HistoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Apply filters
  const applyFilters = async () => {
    const filterOptions = {
      filters: {
        ...filters,
        modules: selectedModule === "all" ? undefined : [selectedModule as ModuleType],
        date_from: dateRange.from,
        date_to: dateRange.to
      },
      limit: 100
    }
    
    await getActivities(filterOptions)
  }

  useEffect(() => {
    applyFilters()
  }, [selectedModule, dateRange])

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800">Erro ao carregar histórico</h3>
              <p className="text-red-600">{error}</p>
            </div>
            <Button onClick={clearError} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Atividades</h2>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e conquistas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={refreshData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Atividades</p>
                  <p className="text-2xl font-bold">{summary.total_activities}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Total</p>
                  <p className="text-2xl font-bold">{formatDuration(summary.total_duration_minutes)}</p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Performance Média</p>
                  <p className="text-2xl font-bold">{formatScore(summary.avg_score)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sequência Atual</p>
                  <p className="text-2xl font-bold">{summary.current_streak} dias</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Módulo</Label>
              <Select value={selectedModule} onValueChange={(value) => setSelectedModule(value as ModuleType | "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moduleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar atividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {filteredActivities.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="text-2xl">{getModuleIcon(activity.module)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{activity.title}</h4>
                            {activity.is_favorite && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                            {activity.is_milestone && (
                              <Award className="w-4 h-4 text-purple-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(activity.activity_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {activity.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(activity.duration_minutes)}
                              </span>
                            )}
                            {activity.score !== undefined && (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {formatScore(activity.score)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {activity.module}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs text-white ${getActivityTypeColor(activity.activity_type)}`}
                            >
                              {activity.activity_type}
                            </Badge>
                            {activity.category && (
                              <Badge variant="outline" className="text-xs">
                                {activity.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleFavorite(activity.id)}
                          >
                            <Star className={`w-4 h-4 ${activity.is_favorite ? "text-yellow-500 fill-current" : ""}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleMilestone(activity.id)}
                          >
                            <Award className={`w-4 h-4 ${activity.is_milestone ? "text-purple-500" : ""}`} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Atividades Favoritas</span>
                    <Badge>{summary?.favorite_count || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Marcos Importantes</span>
                    <Badge>{summary?.milestone_count || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Dia Mais Ativo</span>
                    <Badge>
                      {summary?.most_active_day 
                        ? format(parseISO(summary.most_active_day), "dd/MM", { locale: ptBR })
                        : "N/A"
                      }
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Taxa de Sucesso</span>
                    <Badge>{formatScore(summary?.avg_success_rate)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {Object.entries(groupedActivities)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([date, dayActivities]) => (
                      <div key={date} className="relative">
                        <div className="sticky top-0 bg-background z-10 pb-2">
                          <h3 className="text-lg font-semibold">
                            {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </h3>
                          <Separator className="mt-2" />
                        </div>
                        <div className="space-y-3 mt-4">
                          {dayActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                              <div className="text-xl">{getModuleIcon(activity.module)}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{activity.title}</h4>
                                  {activity.is_favorite && (
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  )}
                                  {activity.is_milestone && (
                                    <Award className="w-4 h-4 text-purple-500" />
                                  )}
                                </div>
                                {activity.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {activity.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {activity.completed_at && (
                                    <span>
                                      {format(parseISO(activity.completed_at), "HH:mm", { locale: ptBR })}
                                    </span>
                                  )}
                                  {activity.duration_minutes && (
                                    <span>{formatDuration(activity.duration_minutes)}</span>
                                  )}
                                  {activity.score !== undefined && (
                                    <span>{formatScore(activity.score)}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {activity.module}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs text-white ${getActivityTypeColor(activity.activity_type)}`}
                                  >
                                    {activity.activity_type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Metas e Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma meta definida ainda.</p>
                    <Button className="mt-4">Criar Meta</Button>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <div key={goal.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{goal.title}</h4>
                        <Badge variant={goal.is_achieved ? "default" : "secondary"}>
                          {goal.is_achieved ? "Concluída" : "Em Progresso"}
                        </Badge>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {goal.description}
                        </p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progresso</span>
                          <span>
                            {goal.current_value} / {goal.target_value} {goal.target_unit}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{goal.module}</span>
                          <span>
                            {Math.round((goal.current_value / goal.target_value) * 100)}% concluído
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}