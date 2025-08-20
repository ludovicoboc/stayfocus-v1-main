'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Play, 
  Heart, 
  Trash2, 
  Eye,
  Target,
  Clock,
  Star,
  Users,
  BarChart3,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { CriarSimuladoModal } from '@/components/concursos/criar-simulado-modal'
import { ImportarSimuladoJsonModal } from '@/components/concursos/importar-simulado-json-modal'
import { ConfigurarSimuladoModal } from '@/components/concursos/configurar-simulado-modal'

interface Simulation {
  id: string
  title: string
  description: string
  questions: string[]
  question_count: number
  time_limit_minutes: number
  difficulty_filter: string
  subject_filters: string[]
  topic_filters: string[]
  results: any
  status: 'draft' | 'active' | 'completed' | 'archived'
  is_favorite: boolean
  is_public: boolean
  attempts_count: number
  best_score: number
  avg_score: number
  created_at: string
  updated_at: string
}

interface Competition {
  id: string
  title: string
  organizer: string
  status: string
}

interface Subject {
  id: string
  name: string
  progress: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800'
    case 'active': return 'bg-green-100 text-green-800'
    case 'completed': return 'bg-blue-100 text-blue-800'
    case 'archived': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'draft': return 'Rascunho'
    case 'active': return 'Ativo'
    case 'completed': return 'Concluído'
    case 'archived': return 'Arquivado'
    default: return status
  }
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'facil': return 'bg-green-100 text-green-800'
    case 'medio': return 'bg-yellow-100 text-yellow-800'
    case 'dificil': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function SimuladosPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const competitionId = params.id as string

  const [competition, setCompetition] = useState<Competition | null>(null)
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [activeTab, setActiveTab] = useState('todos')
  const [showCriarModal, setShowCriarModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null)

  useEffect(() => {
    if (user && competitionId) {
      loadData()
    }
  }, [user, competitionId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar concurso
      const { data: competitionData, error: competitionError } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .eq('user_id', user?.id)
        .single()

      if (competitionError) throw competitionError
      setCompetition(competitionData)

      // Carregar matérias
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('competition_subjects')
        .select('*')
        .eq('competition_id', competitionId)
        .order('name')

      if (subjectsError) throw subjectsError
      setSubjects(subjectsData || [])

      // Carregar simulados
      await loadSimulations()

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do concurso.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSimulations = async () => {
    try {
      const { data, error } = await supabase
        .from('competition_simulations')
        .select('*')
        .eq('competition_id', competitionId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSimulations(data || [])
    } catch (error) {
      console.error('Erro ao carregar simulados:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os simulados.',
        variant: 'destructive'
      })
    }
  }

  const handleToggleFavorite = async (simulationId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('competition_simulations')
        .update({ is_favorite: !isFavorite })
        .eq('id', simulationId)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: `Simulado ${!isFavorite ? 'adicionado aos' : 'removido dos'} favoritos!`
      })

      await loadSimulations()
    } catch (error) {
      console.error('Erro ao alterar favorito:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status de favorito.',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteSimulation = async (simulationId: string) => {
    if (!confirm('Tem certeza que deseja excluir este simulado?')) return

    try {
      const { error } = await supabase
        .from('competition_simulations')
        .delete()
        .eq('id', simulationId)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Simulado excluído com sucesso!'
      })

      await loadSimulations()
    } catch (error) {
      console.error('Erro ao excluir simulado:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o simulado.',
        variant: 'destructive'
      })
    }
  }

  const handleStartSimulation = (simulation: Simulation) => {
    router.push(`/concursos/${competitionId}/simulados/${simulation.id}/executar`)
  }

  const filteredSimulations = simulations.filter(simulation => {
    const matchesSearch = simulation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         simulation.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || simulation.status === filterStatus
    const matchesDifficulty = !filterDifficulty || simulation.difficulty_filter === filterDifficulty
    const matchesFavorites = !showFavoritesOnly || simulation.is_favorite
    const matchesTab = activeTab === 'todos' || 
                      (activeTab === 'favoritos' && simulation.is_favorite) ||
                      (activeTab === 'rascunhos' && simulation.status === 'draft') ||
                      (activeTab === 'ativos' && simulation.status === 'active')

    return matchesSearch && matchesStatus && matchesDifficulty && matchesFavorites && matchesTab
  })

  const exportSimulations = () => {
    const dataStr = JSON.stringify(filteredSimulations, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `simulados-${competition?.title || 'concurso'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Concurso não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O concurso que você está procurando não existe ou não é seu.
            </p>
            <Button onClick={() => router.push('/concursos')}>
              Voltar aos Concursos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const favoriteSimulations = simulations.filter(s => s.is_favorite)
  const draftSimulations = simulations.filter(s => s.status === 'draft')
  const activeSimulations = simulations.filter(s => s.status === 'active')

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Simulados</h1>
          <p className="text-muted-foreground">{competition.title}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar JSON
          </Button>
          <Button
            variant="outline"
            onClick={exportSimulations}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowCriarModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Simulado
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{simulations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Favoritos</p>
                <p className="text-2xl font-bold">{favoriteSimulations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{activeSimulations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tentativas</p>
                <p className="text-2xl font-bold">
                  {simulations.reduce((acc, s) => acc + s.attempts_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar simulados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">Todos Status</option>
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="completed">Concluído</option>
              <option value="archived">Arquivado</option>
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">Todas Dificuldades</option>
              <option value="facil">Fácil</option>
              <option value="medio">Médio</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todos">
            Todos ({simulations.length})
          </TabsTrigger>
          <TabsTrigger value="favoritos">
            Favoritos ({favoriteSimulations.length})
          </TabsTrigger>
          <TabsTrigger value="rascunhos">
            Rascunhos ({draftSimulations.length})
          </TabsTrigger>
          <TabsTrigger value="ativos">
            Ativos ({activeSimulations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredSimulations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum simulado encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {simulations.length === 0 
                      ? 'Comece criando seu primeiro simulado para este concurso.'
                      : 'Nenhum simulado corresponde aos filtros aplicados.'
                    }
                  </p>
                  {simulations.length === 0 && (
                    <Button onClick={() => setShowCriarModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Simulado
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredSimulations.map((simulation) => (
                <Card key={simulation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(simulation.status)}>
                            {getStatusLabel(simulation.status)}
                          </Badge>
                          {simulation.difficulty_filter && (
                            <Badge className={getDifficultyColor(simulation.difficulty_filter)}>
                              {simulation.difficulty_filter}
                            </Badge>
                          )}
                          {simulation.is_favorite && (
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                          )}
                          {simulation.is_public && (
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              Público
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2">{simulation.title}</h3>
                        
                        {simulation.description && (
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {simulation.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{simulation.question_count} questões</span>
                          {simulation.time_limit_minutes && (
                            <span>{simulation.time_limit_minutes} min</span>
                          )}
                          <span>{simulation.attempts_count} tentativas</span>
                          {simulation.best_score !== null && (
                            <span>Melhor: {simulation.best_score}%</span>
                          )}
                        </div>
                        
                        {simulation.subject_filters.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {simulation.subject_filters.slice(0, 3).map((subjectId, index) => {
                              const subject = subjects.find(s => s.id === subjectId)
                              return subject && (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {subject.name}
                                </Badge>
                              )
                            })}
                            {simulation.subject_filters.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{simulation.subject_filters.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {simulation.status === 'active' && (
                          <Button
                            onClick={() => handleStartSimulation(simulation)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Iniciar
                          </Button>
                        )}
                        
                        {simulation.attempts_count > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/concursos/${competitionId}/simulados/${simulation.id}/historico`)}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Histórico
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSimulation(simulation)
                            setShowConfigModal(true)
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFavorite(simulation.id, simulation.is_favorite)}
                        >
                          <Heart className={`h-4 w-4 ${simulation.is_favorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSimulation(simulation.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <CriarSimuladoModal
        isOpen={showCriarModal}
        onClose={() => setShowCriarModal(false)}
        competitionId={competitionId}
        subjects={subjects}
        onSuccess={loadSimulations}
      />

      <ImportarSimuladoJsonModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        competitionId={competitionId}
        onSuccess={loadSimulations}
      />

      {selectedSimulation && (
        <ConfigurarSimuladoModal
          isOpen={showConfigModal}
          onClose={() => {
            setShowConfigModal(false)
            setSelectedSimulation(null)
          }}
          simulation={selectedSimulation}
          subjects={subjects}
          onSuccess={loadSimulations}
        />
      )}
    </div>
  )
}