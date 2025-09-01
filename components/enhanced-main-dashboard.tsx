"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Settings,
  RefreshCw,
  Download,
  Filter,
  Grid3X3,
  List,
  Maximize2
} from "lucide-react"
import {
  PerformanceOverviewWidget,
  ModuleActivityWidget,
  CrossModuleInsightsWidget,
  SimulationStatisticsWidget,
  QuickActionsWidget,
  GoalsProgressWidget
} from "@/components/enhanced-dashboard-widgets"
import { useCrossModuleStatistics } from "@/hooks/use-cross-module-statistics"
import type { ModuleType } from "@/types/history"

interface EnhancedMainDashboardProps {
  userId?: string
  defaultView?: 'overview' | 'modules' | 'analytics' | 'goals'
  customizable?: boolean
}

export function EnhancedMainDashboard({ 
  userId, 
  defaultView = 'overview',
  customizable = true 
}: EnhancedMainDashboardProps) {
  const {
    crossModuleStats,
    moduleWidgets,
    loading,
    error,
    refreshAllModuleStats,
    exportCrossModuleReport,
    clearError
  } = useCrossModuleStatistics()

  const [activeView, setActiveView] = useState(defaultView)
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid')
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>([
    'estudos', 'simulados', 'financas', 'saude'
  ])
  const [refreshing, setRefreshing] = useState(false)

  // All available modules
  const allModules: ModuleType[] = [
    'estudos', 'simulados', 'financas', 'saude', 'sono', 
    'alimentacao', 'lazer', 'hiperfocos', 'autoconhecimento'
  ]

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshAllModuleStats()
    } catch (error) {
      console.error("Error refreshing dashboard:", error)
    } finally {
      setRefreshing(false)
    }
  }

  // Handle export
  const handleExport = async () => {
    try {
      const report = await exportCrossModuleReport()
      const blob = new Blob([report], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting report:", error)
    }
  }

  // Error handling
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800">Erro no Dashboard</h3>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Inteligente</h1>
          <p className="text-muted-foreground">
            Visão unificada do seu progresso em todas as áreas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {customizable && (
            <>
              <Select value={layoutMode} onValueChange={(value: any) => setLayoutMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="w-4 h-4" />
                      Grid
                    </div>
                  </SelectItem>
                  <SelectItem value="list">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      Lista
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </>
          )}
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing || loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "analytics" | "goals" | "overview" | "modules")}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top Row - Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <PerformanceOverviewWidget />
            <SimulationStatisticsWidget />
            <CrossModuleInsightsWidget />
            <QuickActionsWidget />
          </div>

          {/* Middle Row - Module Highlights */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Módulos em Destaque</h2>
              <Button variant="ghost" size="sm" onClick={() => setActiveView('modules')}>
                Ver Todos
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedModules.slice(0, 4).map((module) => (
                <ModuleActivityWidget key={module} module={module} compact={true} />
              ))}
            </div>
          </div>

          {/* Bottom Row - Goals Progress */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Progresso das Metas</h2>
            <GoalsProgressWidget />
          </div>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Todos os Módulos</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Exibir:</span>
              <Select 
                value={selectedModules.join(',')} 
                onValueChange={(value) => setSelectedModules(value.split(',') as ModuleType[])}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar módulos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={allModules.join(',')}>Todos os Módulos</SelectItem>
                  <SelectItem value="estudos,simulados,financas,saude">Principais</SelectItem>
                  <SelectItem value="sono,alimentacao,lazer">Bem-estar</SelectItem>
                  <SelectItem value="hiperfocos,autoconhecimento">Desenvolvimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={
            layoutMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {selectedModules.map((module) => (
              <ModuleActivityWidget 
                key={module} 
                module={module} 
                compact={layoutMode === 'list'} 
              />
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Análise de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {crossModuleStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {crossModuleStats.overall_performance.total_activities}
                        </div>
                        <div className="text-sm text-blue-600">Atividades Totais</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {crossModuleStats.overall_performance.average_success_rate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-green-600">Taxa de Sucesso</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Módulo Mais Ativo</span>
                        <span className="font-medium capitalize">
                          {crossModuleStats.overall_performance.most_active_module}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Consistência Geral</span>
                        <span className="font-medium">
                          {crossModuleStats.overall_performance.consistency_score.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tendência de Melhoria</span>
                        <div className="flex items-center gap-1">
                          {crossModuleStats.overall_performance.improvement_trend > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                          )}
                          <span className="font-medium">
                            {crossModuleStats.overall_performance.improvement_trend > 0 ? "+" : ""}
                            {crossModuleStats.overall_performance.improvement_trend.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando análises...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Module Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Insights por Módulo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {crossModuleStats && crossModuleStats.module_insights.length > 0 ? (
                  <div className="space-y-4">
                    {crossModuleStats.module_insights.slice(0, 5).map((insight) => (
                      <div key={insight.module} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{insight.module}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            insight.performance_category === 'excellent' 
                              ? 'bg-green-100 text-green-800'
                              : insight.performance_category === 'good'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {insight.performance_category}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Atividades</div>
                            <div className="font-medium">{insight.activity_count}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Performance</div>
                            <div className="font-medium">{insight.average_performance.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Tempo</div>
                            <div className="font-medium">{insight.time_spent_hours.toFixed(1)}h</div>
                          </div>
                        </div>
                        {insight.recommendations.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            💡 {insight.recommendations[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum insight disponível ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cross-Module Correlations */}
          <Card>
            <CardHeader>
              <CardTitle>Correlações Cross-Módulos</CardTitle>
            </CardHeader>
            <CardContent>
              {crossModuleStats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {crossModuleStats.correlations.study_vs_simulation_performance.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Correlação Estudo vs Simulado
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {crossModuleStats.correlations.consistency_across_modules.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Consistência Cross-Módulos
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {crossModuleStats.correlations.peak_performance_hours.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Horários de Pico
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Carregando correlações...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Metas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <GoalsProgressWidget />
              </CardContent>
            </Card>

            {/* Goal Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recomendações de Metas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moduleWidgets.slice(0, 4).map((widget) => (
                    <div key={widget.module} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{widget.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {widget.next_goal.target_date}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {widget.next_goal.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${widget.next_goal.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {widget.next_goal.progress.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}