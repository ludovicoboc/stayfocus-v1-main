"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar,
  Clock,
  TrendingUp,
  Star,
  Award,
  Search,
  Filter,
  RotateCcw,
  Trash2,
  Eye
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useHistory } from "@/hooks/use-history"
import type { ModuleType, ActivityHistory } from "@/types/history"

interface HistoryModalProps {
  open: boolean
  onClose: () => void
  module?: ModuleType
  title?: string
  onActivitySelect?: (activity: ActivityHistory) => void
  onActivityReplay?: (activity: ActivityHistory) => void
  showActions?: boolean
}

export function HistoryModal({ 
  open, 
  onClose, 
  module,
  title = "Histórico de Atividades",
  onActivitySelect,
  onActivityReplay,
  showActions = true
}: HistoryModalProps) {
  const {
    activities,
    summary,
    loading,
    error,
    toggleFavorite,
    toggleMilestone,
    deleteActivity,
    refreshData
  } = useHistory(module)

  const [activeTab, setActiveTab] = useState("recent")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "score" | "duration">("date")
  const [filterBy, setFilterBy] = useState<"all" | "favorites" | "milestones">("all")

  // Filter and sort activities
  const filteredActivities = activities
    .filter(activity => {
      // Search filter
      if (searchTerm && !activity.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !activity.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      // Type filter
      if (filterBy === "favorites" && !activity.is_favorite) return false
      if (filterBy === "milestones" && !activity.is_milestone) return false
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
        case "score":
          return (b.score || 0) - (a.score || 0)
        case "duration":
          return (b.duration_minutes || 0) - (a.duration_minutes || 0)
        default:
          return 0
      }
    })

  // Get module icon
  const getModuleIcon = (moduleType: ModuleType) => {
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
    return icons[moduleType] || "📋"
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

  // Get performance color
  const getPerformanceColor = (score?: number) => {
    if (!score) return "text-muted-foreground"
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  // Handle activity action
  const handleActivityAction = async (action: string, activity: ActivityHistory) => {
    try {
      switch (action) {
        case "favorite":
          await toggleFavorite(activity.id)
          break
        case "milestone":
          await toggleMilestone(activity.id)
          break
        case "delete":
          if (confirm("Tem certeza que deseja excluir esta atividade?")) {
            await deleteActivity(activity.id)
          }
          break
        case "select":
          onActivitySelect?.(activity)
          break
        case "replay":
          onActivityReplay?.(activity)
          break
        case "view":
          onActivitySelect?.(activity)
          break
      }
    } catch (error) {
      console.error("Error handling activity action:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {module && <span className="text-2xl">{getModuleIcon(module)}</span>}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{summary.total_activities}</div>
                <div className="text-sm text-muted-foreground">Atividades</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{formatDuration(summary.total_duration_minutes)}</div>
                <div className="text-sm text-muted-foreground">Tempo Total</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{formatScore(summary.avg_score)}</div>
                <div className="text-sm text-muted-foreground">Média</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{summary.current_streak}</div>
                <div className="text-sm text-muted-foreground">Sequência</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="score">Pontuação</SelectItem>
                <SelectItem value="duration">Duração</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBy} onValueChange={(value) => setFilterBy(value as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="favorites">Favoritas</SelectItem>
                <SelectItem value="milestones">Marcos</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">Recentes</TabsTrigger>
              <TabsTrigger value="favorites">Favoritas</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="flex-1 mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-muted-foreground">Carregando histórico...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-4">{error}</p>
                      <Button onClick={refreshData} variant="outline">
                        Tentar novamente
                      </Button>
                    </div>
                  ) : filteredActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm ? "Nenhuma atividade encontrada." : "Nenhuma atividade realizada ainda."}
                      </p>
                    </div>
                  ) : (
                    filteredActivities.map((activity) => (
                      <div key={activity.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{getModuleIcon(activity.module)}</span>
                              <h4 className="font-medium truncate">{activity.title}</h4>
                              {activity.is_favorite && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                              {activity.is_milestone && (
                                <Award className="w-4 h-4 text-purple-500" />
                              )}
                            </div>
                            
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {activity.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
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
                                <span className={`flex items-center gap-1 ${getPerformanceColor(activity.score)}`}>
                                  <TrendingUp className="w-3 h-3" />
                                  {formatScore(activity.score)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {activity.activity_type}
                              </Badge>
                              {activity.category && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.category}
                                </Badge>
                              )}
                              {activity.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {showActions && (
                            <div className="flex items-center gap-1 ml-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleActivityAction("favorite", activity)}
                                title={activity.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                              >
                                <Star className={`w-4 h-4 ${activity.is_favorite ? "text-yellow-500 fill-current" : ""}`} />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleActivityAction("milestone", activity)}
                                title={activity.is_milestone ? "Remover marco" : "Marcar como marco"}
                              >
                                <Award className={`w-4 h-4 ${activity.is_milestone ? "text-purple-500" : ""}`} />
                              </Button>

                              {onActivitySelect && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleActivityAction("view", activity)}
                                  title="Visualizar detalhes"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}

                              {onActivityReplay && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleActivityAction("replay", activity)}
                                  title="Repetir atividade"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleActivityAction("delete", activity)}
                                title="Excluir atividade"
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="favorites" className="flex-1 mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredActivities.filter(a => a.is_favorite).length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma atividade favorita ainda.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Marque atividades como favoritas para encontrá-las facilmente aqui.
                      </p>
                    </div>
                  ) : (
                    filteredActivities
                      .filter(a => a.is_favorite)
                      .map((activity) => (
                        <div key={activity.id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{getModuleIcon(activity.module)}</span>
                                <h4 className="font-medium">{activity.title}</h4>
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              </div>
                              
                              {activity.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {activity.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{format(parseISO(activity.activity_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                                {activity.duration_minutes && <span>{formatDuration(activity.duration_minutes)}</span>}
                                {activity.score !== undefined && (
                                  <span className={getPerformanceColor(activity.score)}>
                                    {formatScore(activity.score)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {showActions && onActivityReplay && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleActivityAction("replay", activity)}
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Repetir
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}