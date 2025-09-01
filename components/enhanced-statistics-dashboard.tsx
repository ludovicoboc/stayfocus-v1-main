"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Award, 
  Brain,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Calendar,
  Trophy,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"
import { useSimulationStatistics } from "@/hooks/use-simulation-statistics"
import type { PerformanceMetrics, SubjectAnalysis, TimeAnalysis } from "@/hooks/use-simulation-statistics"

interface EnhancedStatisticsDashboardProps {
  simulationIds?: string[]
  dateRange?: {
    from: string
    to: string
  }
  compact?: boolean
}

export function EnhancedStatisticsDashboard({ 
  simulationIds, 
  dateRange, 
  compact = false 
}: EnhancedStatisticsDashboardProps) {
  const {
    statistics,
    loading,
    error,
    generateStatistics,
    getTrendAnalysis,
    exportStatistics,
    refreshStatistics,
    clearError
  } = useSimulationStatistics()

  const [activeTab, setActiveTab] = useState("overview")
  const [trendPeriod, setTrendPeriod] = useState<"daily" | "weekly" | "monthly">("weekly")

  useEffect(() => {
    if (simulationIds || dateRange) {
      generateStatistics({
        simulation_ids: simulationIds,
        date_from: dateRange?.from,
        date_to: dateRange?.to
      })
    }
  }, [simulationIds, dateRange, generateStatistics])

  // Helper functions
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="w-4 h-4 text-green-500" />
    if (value < 0) return <ArrowDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getMasteryColor = (level: SubjectAnalysis['mastery_level']) => {
    switch (level) {
      case 'expert': return 'bg-purple-500'
      case 'advanced': return 'bg-blue-500'
      case 'intermediate': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800">Erro ao carregar estatísticas</h3>
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

  if (!statistics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Nenhum dado disponível para análise</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estatísticas Avançadas</h2>
          <p className="text-muted-foreground">
            Análise detalhada do seu desempenho em simulados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={refreshStatistics}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={() => exportStatistics('json')}
            variant="outline"
            size="sm"
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance Média</p>
                <p className="text-2xl font-bold">
                  {formatPercentage(statistics.performance_metrics.average_percentage)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(statistics.performance_metrics.improvement_rate)}
                  <span className="text-xs text-muted-foreground">
                    {formatPercentage(Math.abs(statistics.performance_metrics.improvement_rate))} por tentativa
                  </span>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consistência</p>
                <p className="text-2xl font-bold">
                  {statistics.performance_metrics.consistency_score.toFixed(0)}%
                </p>
                <Progress 
                  value={statistics.performance_metrics.consistency_score} 
                  className="mt-2 h-2"
                />
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sequência Atual</p>
                <p className="text-2xl font-bold">
                  {statistics.streak_analysis.current_streak}
                </p>
                <p className="text-xs text-muted-foreground">
                  Recorde: {statistics.streak_analysis.longest_streak}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Total</p>
                <p className="text-2xl font-bold">
                  {statistics.performance_metrics.total_time_hours.toFixed(1)}h
                </p>
                <p className="text-xs text-muted-foreground">
                  {statistics.performance_metrics.total_attempts} tentativas
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="subjects">Matérias</TabsTrigger>
          <TabsTrigger value="time">Tempo</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Distribuição de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">Excelente (≥90%)</span>
                    </div>
                    <span className="font-medium">
                      {statistics.performance_metrics.total_attempts > 0 
                        ? Math.round((statistics.performance_metrics.total_attempts * 0.2)) // Placeholder
                        : 0
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm">Bom (70-89%)</span>
                    </div>
                    <span className="font-medium">
                      {statistics.performance_metrics.total_attempts > 0 
                        ? Math.round((statistics.performance_metrics.total_attempts * 0.4)) // Placeholder
                        : 0
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span className="text-sm">Regular (50-69%)</span>
                    </div>
                    <span className="font-medium">
                      {statistics.performance_metrics.total_attempts > 0 
                        ? Math.round((statistics.performance_metrics.total_attempts * 0.3)) // Placeholder
                        : 0
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-sm">Precisa Melhorar (&lt;50%)</span>
                    </div>
                    <span className="font-medium">
                      {statistics.performance_metrics.total_attempts > 0 
                        ? Math.round((statistics.performance_metrics.total_attempts * 0.1)) // Placeholder
                        : 0
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Estatísticas Principais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Melhor Performance</span>
                    <span className="font-bold text-green-600">
                      {formatPercentage(statistics.performance_metrics.best_percentage)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Performance Mediana</span>
                    <span className="font-medium">
                      {formatPercentage(statistics.performance_metrics.median_percentage)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Desvio Padrão</span>
                    <span className="font-medium">
                      {formatPercentage(statistics.performance_metrics.standard_deviation)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa de Melhoria</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(statistics.performance_metrics.improvement_rate)}
                      <span className="font-medium">
                        {formatPercentage(Math.abs(statistics.performance_metrics.improvement_rate))}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Análise de Tendências</h3>
            <Select value={trendPeriod} onValueChange={(value: any) => setTrendPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Progresso ao Longo do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.trends[trendPeriod].slice(-10).map((trend, index) => (
                  <div key={trend.period} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{trend.period}</p>
                      <p className="text-sm text-muted-foreground">
                        {trend.attempts} tentativa(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatPercentage(trend.average_percentage)}
                      </p>
                      {index > 0 && (
                        <div className="flex items-center gap-1">
                          {getTrendIcon(trend.improvement_from_previous)}
                          <span className="text-xs text-muted-foreground">
                            {formatPercentage(Math.abs(trend.improvement_from_previous))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Análise por Matéria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.subject_analysis.map((subject) => (
                  <div key={subject.subject} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Simulado #{subject.subject}</h4>
                        <p className="text-sm text-muted-foreground">
                          {subject.attempts} tentativa(s)
                        </p>
                      </div>
                      <Badge className={getMasteryColor(subject.mastery_level)}>
                        {subject.mastery_level}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Média</p>
                        <p className="font-medium">{formatPercentage(subject.average_percentage)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Melhor</p>
                        <p className="font-medium">{formatPercentage(subject.best_percentage)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Dificuldade</p>
                        <p className="font-medium">{subject.difficulty_rating.toFixed(1)}/10</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Eficiência</p>
                        <p className="font-medium">{subject.time_efficiency.toFixed(1)} q/min</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm text-muted-foreground">Tendência:</span>
                        {getTrendIcon(subject.improvement_trend)}
                        <span className="text-sm">
                          {formatPercentage(Math.abs(subject.improvement_trend))} por tentativa
                        </span>
                      </div>
                      <Progress 
                        value={subject.average_percentage} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Análise de Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tempo Ótimo</span>
                    <span className="font-medium">
                      {formatTime(statistics.time_analysis.optimal_time_range.min_minutes)} - {formatTime(statistics.time_analysis.optimal_time_range.max_minutes)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Performance no Tempo Ótimo</span>
                    <span className="font-bold text-green-600">
                      {formatPercentage(statistics.time_analysis.optimal_time_range.average_percentage_in_range)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ritmo Médio</span>
                    <span className="font-medium">
                      {statistics.time_analysis.speed_analysis.average_seconds_per_question}s/questão
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ritmo Ótimo</span>
                    <span className="font-medium">
                      {statistics.time_analysis.speed_analysis.optimal_pace}s/questão
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time vs Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Tempo vs Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.time_analysis.time_vs_performance.map((bucket) => (
                    <div key={bucket.time_bucket} className="flex items-center justify-between">
                      <span className="text-sm">{bucket.time_bucket}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatPercentage(bucket.average_percentage)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({bucket.attempts})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictive Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Previsões e Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Próxima Performance Prevista</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPercentage(statistics.predictive_insights.next_score_prediction.predicted_percentage)}
                    </p>
                    <p className="text-sm text-blue-600">
                      Confiança: {statistics.predictive_insights.next_score_prediction.confidence_level}%
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Fatores Considerados</h4>
                    <div className="space-y-1">
                      {statistics.predictive_insights.next_score_prediction.factors.map((factor, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Improvement Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Sugestões de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.predictive_insights.improvement_suggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{suggestion.area}</h4>
                        <Badge variant={
                          suggestion.priority === 'high' ? 'destructive' :
                          suggestion.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {suggestion.suggestion}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        Potencial de melhoria: +{formatPercentage(suggestion.potential_improvement)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goal Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Metas Recomendadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statistics.predictive_insights.goal_recommendations.map((goal, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{goal.goal_type}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Meta:</span>
                        <span className="font-medium">{goal.target_value}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Prazo:</span>
                        <span className="font-medium">{goal.timeframe_days} dias</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Viabilidade:</span>
                        <span className="font-medium">{goal.achievability}%</span>
                      </div>
                      <Progress value={goal.achievability} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}