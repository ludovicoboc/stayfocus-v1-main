"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Trophy,
  TrendingUp,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Search
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSimulationHistory } from "@/hooks/use-simulation-history"
import type { SimuladoResultado } from "@/types/simulados"
import type { CreateSimulationHistoryInput, UpdateSimulationHistoryInput, SimulationHistoryFilters } from "@/hooks/use-simulation-history"

interface SimulationHistoryManagerProps {
  simulationId?: string
  showCreateButton?: boolean
  compact?: boolean
}

export function SimulationHistoryManager({ 
  simulationId, 
  showCreateButton = true, 
  compact = false 
}: SimulationHistoryManagerProps) {
  const {
    history,
    loading,
    error,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecord,
    getHistory,
    getHistoryBySimulation,
    getBestScore,
    getAverageScore,
    getTotalAttempts,
    getStatistics,
    refreshData,
    clearError
  } = useSimulationHistory()

  // State
  const [activeTab, setActiveTab] = useState("list")
  const [selectedRecord, setSelectedRecord] = useState<SimuladoResultado | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [filters, setFilters] = useState<SimulationHistoryFilters>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statistics, setStatistics] = useState<any>(null)

  // Form state
  const [createForm, setCreateForm] = useState<CreateSimulationHistoryInput>({
    simulation_id: simulationId || "",
    score: 0,
    total_questions: 0,
    percentage: 0,
    time_taken_minutes: 0,
    answers: {}
  })

  const [editForm, setEditForm] = useState<Partial<UpdateSimulationHistoryInput>>({})

  // Load data
  useEffect(() => {
    if (simulationId) {
      getHistoryBySimulation(simulationId)
    }
    loadStatistics()
  }, [simulationId])

  const loadStatistics = async () => {
    try {
      const stats = await getStatistics()
      setStatistics(stats)
    } catch (error) {
      console.error("Error loading statistics:", error)
    }
  }

  // Filter history
  const filteredHistory = history.filter(record => {
    if (searchTerm && !record.id?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (simulationId && record.simulation_id !== simulationId) {
      return false
    }
    return true
  })

  // Format functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return "Data inválida"
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-500"
    if (percentage >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default"
    if (percentage >= 60) return "secondary"
    return "destructive"
  }

  // CRUD handlers
  const handleCreate = async () => {
    try {
      await createRecord(createForm)
      setShowCreateDialog(false)
      setCreateForm({
        simulation_id: simulationId || "",
        score: 0,
        total_questions: 0,
        percentage: 0,
        time_taken_minutes: 0,
        answers: {}
      })
      await loadStatistics()
    } catch (error) {
      console.error("Error creating record:", error)
    }
  }

  const handleEdit = async () => {
    if (!selectedRecord?.id) return
    
    try {
      await updateRecord({
        id: selectedRecord.id,
        ...editForm
      })
      setShowEditDialog(false)
      setSelectedRecord(null)
      setEditForm({})
      await loadStatistics()
    } catch (error) {
      console.error("Error updating record:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(id)
      await loadStatistics()
    } catch (error) {
      console.error("Error deleting record:", error)
    }
  }

  const handleView = async (record: SimuladoResultado) => {
    setSelectedRecord(record)
    setShowViewDialog(true)
  }

  const handleEditClick = (record: SimuladoResultado) => {
    setSelectedRecord(record)
    setEditForm({
      score: record.score,
      total_questions: record.total_questions,
      percentage: record.percentage,
      time_taken_minutes: record.time_taken_minutes,
      answers: record.answers
    })
    setShowEditDialog(true)
  }

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
          <h2 className="text-2xl font-bold">Histórico de Simulados</h2>
          <p className="text-muted-foreground">
            Gerencie e analise o histórico de simulados realizados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showCreateButton && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Registro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Registro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ID do Simulado</Label>
                      <Input
                        value={createForm.simulation_id}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, simulation_id: e.target.value }))}
                        placeholder="ID do simulado"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total de Questões</Label>
                      <Input
                        type="number"
                        value={createForm.total_questions}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, total_questions: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pontuação</Label>
                      <Input
                        type="number"
                        value={createForm.score}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Percentual (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={createForm.percentage}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tempo (minutos)</Label>
                    <Input
                      type="number"
                      value={createForm.time_taken_minutes}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, time_taken_minutes: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Respostas (JSON)</Label>
                    <Textarea
                      value={JSON.stringify(createForm.answers, null, 2)}
                      onChange={(e) => {
                        try {
                          const answers = JSON.parse(e.target.value)
                          setCreateForm(prev => ({ ...prev, answers }))
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      placeholder='{"1": "a", "2": "b"}'
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreate} disabled={loading}>
                      Criar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
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

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Tentativas</p>
                  <p className="text-2xl font-bold">{statistics.total_attempts}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Melhor Pontuação</p>
                  <p className="text-2xl font-bold">{statistics.best_score || "N/A"}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Média de Acertos</p>
                  <p className="text-2xl font-bold">
                    {statistics.average_percentage ? `${statistics.average_percentage.toFixed(1)}%` : "N/A"}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Total</p>
                  <p className="text-2xl font-bold">{formatDuration(statistics.total_time_minutes)}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setFilters({})}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Registros</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Simulados</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-muted-foreground">Carregando registros...</p>
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm ? "Nenhum registro encontrado." : "Nenhum registro de simulado ainda."}
                      </p>
                    </div>
                  ) : (
                    filteredHistory.map((record) => (
                      <div key={record.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">Simulado #{record.id?.slice(-8)}</h4>
                              <Badge variant={getScoreBadgeVariant(record.percentage)}>
                                {record.percentage.toFixed(1)}%
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-2">
                              <span>
                                <strong>Pontuação:</strong> {record.score}/{record.total_questions}
                              </span>
                              <span>
                                <strong>Tempo:</strong> {formatDuration(record.time_taken_minutes)}
                              </span>
                              <span>
                                <strong>Data:</strong> {formatDate(record.completed_at)}
                              </span>
                              <span>
                                <strong>ID Simulado:</strong> {record.simulation_id?.slice(-8)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleView(record)}
                              title="Visualizar detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditClick(record)}
                              title="Editar registro"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Excluir registro"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => record.id && handleDelete(record.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Detalhados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {statistics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Estatísticas Gerais</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total de Tentativas:</span>
                          <span className="font-medium">{statistics.total_attempts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Melhor Pontuação:</span>
                          <span className="font-medium">{statistics.best_score || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pontuação Média:</span>
                          <span className="font-medium">{statistics.average_score?.toFixed(1) || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Melhor Percentual:</span>
                          <span className="font-medium">{statistics.best_percentage?.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Percentual Médio:</span>
                          <span className="font-medium">{statistics.average_percentage?.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tempo Total:</span>
                          <span className="font-medium">{formatDuration(statistics.total_time_minutes)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Tendências</h3>
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                        <p>Gráficos de tendência em desenvolvimento</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID do Registro</Label>
                  <p className="text-sm font-mono">{selectedRecord.id}</p>
                </div>
                <div>
                  <Label>ID do Simulado</Label>
                  <p className="text-sm font-mono">{selectedRecord.simulation_id}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Pontuação</Label>
                  <p className="text-lg font-bold">{selectedRecord.score}/{selectedRecord.total_questions}</p>
                </div>
                <div>
                  <Label>Percentual</Label>
                  <p className={`text-lg font-bold ${getScoreColor(selectedRecord.percentage)}`}>
                    {selectedRecord.percentage.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <Label>Tempo</Label>
                  <p className="text-lg font-bold">{formatDuration(selectedRecord.time_taken_minutes)}</p>
                </div>
              </div>
              <div>
                <Label>Data de Conclusão</Label>
                <p>{formatDate(selectedRecord.completed_at)}</p>
              </div>
              <div>
                <Label>Respostas</Label>
                <ScrollArea className="h-32 w-full border rounded p-2">
                  <pre className="text-xs">{JSON.stringify(selectedRecord.answers, null, 2)}</pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pontuação</Label>
                <Input
                  type="number"
                  value={editForm.score || 0}
                  onChange={(e) => setEditForm(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Total de Questões</Label>
                <Input
                  type="number"
                  value={editForm.total_questions || 0}
                  onChange={(e) => setEditForm(prev => ({ ...prev, total_questions: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Percentual (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.percentage || 0}
                  onChange={(e) => setEditForm(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tempo (minutos)</Label>
                <Input
                  type="number"
                  value={editForm.time_taken_minutes || 0}
                  onChange={(e) => setEditForm(prev => ({ ...prev, time_taken_minutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Respostas (JSON)</Label>
              <Textarea
                value={JSON.stringify(editForm.answers || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const answers = JSON.parse(e.target.value)
                    setEditForm(prev => ({ ...prev, answers }))
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={loading}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}