"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Award, 
  Brain,
  BarChart3,
  Zap,
  Calendar,
  Trophy,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Flame,
  Star,
  Activity,
  Users,
  BookOpen,
  DollarSign,
  Heart,
  Moon,
  Utensils,
  Gamepad2
} from "lucide-react"
import { useCrossModuleStatistics } from "@/hooks/use-cross-module-statistics"
import { useSimulationStatistics } from "@/hooks/use-simulation-statistics"
import type { ModuleType } from "@/types/history"

// =====================================================
// PERFORMANCE OVERVIEW WIDGET
// =====================================================

export function PerformanceOverviewWidget() {
  const { crossModuleStats, loading } = useCrossModuleStatistics()

  if (loading || !crossModuleStats) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  const { overall_performance } = crossModuleStats

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5" />
          Performance Geral
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taxa de Sucesso</span>
            <span className="text-2xl font-bold text-green-600">
              {overall_performance.average_success_rate.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Atividades Totais</span>
            <span className="text-lg font-semibold">
              {overall_performance.total_activities}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Consistência</span>
            <div className="flex items-center gap-2">
              <Progress value={overall_performance.consistency_score} className="w-16 h-2" />
              <span className="text-sm font-medium">
                {overall_performance.consistency_score.toFixed(0)}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tendência</span>
            <div className="flex items-center gap-1">
              {overall_performance.improvement_trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : overall_performance.improvement_trend < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Activity className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-sm font-medium">
                {overall_performance.improvement_trend > 0 ? "+" : ""}
                {overall_performance.improvement_trend.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================================
// MODULE ACTIVITY WIDGET
// =====================================================

interface ModuleActivityWidgetProps {
  module: ModuleType
  compact?: boolean
}

export function ModuleActivityWidget({ module, compact = false }: ModuleActivityWidgetProps) {
  const { getModuleWidget, loading } = useCrossModuleStatistics()
  const [widget, setWidget] = useState<any>(null)

  useEffect(() => {
    const loadWidget = async () => {
      try {
        const widgetData = await getModuleWidget(module)
        setWidget(widgetData)
      } catch (error) {
        console.error(`Error loading widget for ${module}:`, error)
      }
    }
    loadWidget()
  }, [module, getModuleWidget])

  const getModuleIcon = (moduleType: ModuleType) => {
    const icons = {
      estudos: BookOpen,
      simulados: Brain,
      concursos: Trophy,
      financas: DollarSign,
      saude: Heart,
      sono: Moon,
      alimentacao: Utensils,
      lazer: Gamepad2,
      hiperfocos: Zap,
      autoconhecimento: Target
    }
    const IconComponent = icons[moduleType] || Activity
    return <IconComponent className="w-5 h-5" />
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-500'
      case 'declining': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4" />
      case 'declining': return <TrendingDown className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  if (loading || !widget) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getModuleIcon(module)}
              <span className="font-medium">{widget.title}</span>
            </div>
            <div className={`flex items-center gap-1 ${getTrendColor(widget.recent_trend)}`}>
              {getTrendIcon(widget.recent_trend)}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold">{widget.quick_stats.this_week}</div>
              <div className="text-xs text-muted-foreground">Semana</div>
            </div>
            <div>
              <div className="text-lg font-bold">{widget.current_streak}</div>
              <div className="text-xs text-muted-foreground">Sequência</div>
            </div>
            <div>
              <div className="text-lg font-bold">{widget.best_performance.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">Melhor</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {getModuleIcon(module)}
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Sequência Atual</span>
            </div>
            <span className="text-xl font-bold">{widget.current_streak} dias</span>
          </div>

          {/* Best Performance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Melhor Performance</span>
            </div>
            <span className="text-lg font-semibold">{widget.best_performance.toFixed(1)}%</span>
          </div>

          {/* Recent Trend */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tendência</span>
            </div>
            <div className={`flex items-center gap-1 ${getTrendColor(widget.recent_trend)}`}>
              {getTrendIcon(widget.recent_trend)}
              <span className="text-sm font-medium capitalize">{widget.recent_trend}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{widget.quick_stats.this_week}</div>
              <div className="text-xs text-muted-foreground">Esta Semana</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{widget.quick_stats.this_month}</div>
              <div className="text-xs text-muted-foreground">Este Mês</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{widget.quick_stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>

          {/* Next Goal */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Próxima Meta</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{widget.next_goal.description}</p>
            <div className="flex items-center gap-2">
              <Progress value={widget.next_goal.progress} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground">
                {widget.next_goal.progress.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================================
// CROSS-MODULE INSIGHTS WIDGET
// =====================================================

export function CrossModuleInsightsWidget() {
  const { crossModuleStats, loading } = useCrossModuleStatistics()

  if (loading || !crossModuleStats) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { comparative_analysis, correlations } = crossModuleStats

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Insights Cross-Módulos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Strongest Areas */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Áreas Mais Fortes
            </h4>
            <div className="flex flex-wrap gap-1">
              {comparative_analysis.strongest_areas.slice(0, 3).map((area) => (
                <Badge key={area} variant="default" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          {/* Improvement Areas */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Áreas para Melhorar
            </h4>
            <div className="flex flex-wrap gap-1">
              {comparative_analysis.improvement_areas.slice(0, 3).map((area) => (
                <Badge key={area} variant="outline" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          {/* Balance Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Equilíbrio Geral</span>
              <span className="text-sm font-medium">
                {comparative_analysis.balanced_score.toFixed(0)}%
              </span>
            </div>
            <Progress value={comparative_analysis.balanced_score} className="h-2" />
          </div>

          {/* Specialization Index */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Índice de Especialização</span>
              <span className="text-sm font-medium">
                {comparative_analysis.specialization_index.toFixed(0)}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {comparative_analysis.specialization_index > 70 
                ? "Perfil especialista" 
                : comparative_analysis.specialization_index > 30 
                ? "Perfil balanceado" 
                : "Perfil generalista"
              }
            </div>
          </div>

          {/* Consistency Across Modules */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Consistência Cross-Módulos</span>
              <span className="text-sm font-medium">
                {correlations.consistency_across_modules.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================================
// SIMULATION STATISTICS WIDGET
// =====================================================

export function SimulationStatisticsWidget() {
  const { statistics, loading } = useSimulationStatistics()

  if (loading || !statistics) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { performance_metrics, predictive_insights } = statistics

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Estatísticas de Simulados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Performance Prediction */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Próxima Previsão</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {predictive_insights.next_score_prediction.predicted_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-blue-600">
              Confiança: {predictive_insights.next_score_prediction.confidence_level}%
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Média Atual</div>
              <div className="text-lg font-bold">
                {performance_metrics.average_percentage.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Consistência</div>
              <div className="text-lg font-bold">
                {performance_metrics.consistency_score.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Improvement Rate */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taxa de Melhoria</span>
            <div className="flex items-center gap-1">
              {performance_metrics.improvement_rate > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {performance_metrics.improvement_rate > 0 ? "+" : ""}
                {performance_metrics.improvement_rate.toFixed(1)}% por tentativa
              </span>
            </div>
          </div>

          {/* Top Suggestion */}
          {predictive_insights.improvement_suggestions.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Sugestão Principal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {predictive_insights.improvement_suggestions[0].suggestion}
              </p>
              <div className="text-xs text-green-600 mt-1">
                Potencial: +{predictive_insights.improvement_suggestions[0].potential_improvement}%
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================================
// QUICK ACTIONS WIDGET
// =====================================================

export function QuickActionsWidget() {
  const { refreshAllModuleStats, loading } = useCrossModuleStatistics()

  const quickActions = [
    {
      title: "Novo Simulado",
      description: "Iniciar um novo simulado",
      icon: Brain,
      action: () => window.location.href = "/simulados",
      color: "bg-blue-500"
    },
    {
      title: "Sessão de Estudo",
      description: "Começar uma sessão focada",
      icon: BookOpen,
      action: () => window.location.href = "/estudos",
      color: "bg-green-500"
    },
    {
      title: "Ver Estatísticas",
      description: "Análise detalhada",
      icon: BarChart3,
      action: () => window.location.href = "/historico",
      color: "bg-purple-500"
    },
    {
      title: "Atualizar Dados",
      description: "Refresh das estatísticas",
      icon: Activity,
      action: refreshAllModuleStats,
      color: "bg-orange-500"
    }
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-3 flex flex-col items-start gap-2"
              onClick={action.action}
              disabled={loading}
            >
              <div className="flex items-center gap-2 w-full">
                <div className={`p-1 rounded ${action.color}`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================================
// GOALS PROGRESS WIDGET
// =====================================================

export function GoalsProgressWidget() {
  const { moduleWidgets, loading } = useCrossModuleStatistics()

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeGoals = moduleWidgets
    .filter(widget => widget.next_goal.progress > 0)
    .sort((a, b) => b.next_goal.progress - a.next_goal.progress)
    .slice(0, 4)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Progresso das Metas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeGoals.length === 0 ? (
            <div className="text-center py-4">
              <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma meta ativa</p>
              <p className="text-xs text-muted-foreground">Use os módulos para gerar metas automáticas</p>
            </div>
          ) : (
            activeGoals.map((widget) => (
              <div key={widget.module} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{widget.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {widget.next_goal.progress.toFixed(0)}%
                  </span>
                </div>
                <Progress value={widget.next_goal.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {widget.next_goal.description}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================================
// EXPORT ALL WIDGETS
// =====================================================

// Export statements removed to avoid duplicate export errors