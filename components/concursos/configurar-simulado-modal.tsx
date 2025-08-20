'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save, 
  Settings, 
  Archive, 
  Trash2, 
  Users,
  Clock,
  Target,
  Filter,
  Eye,
  BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface ConfigurarSimuladoModalProps {
  isOpen: boolean
  onClose: () => void
  simulation: Simulation
  subjects: Subject[]
  onSuccess: () => void
}

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

interface Subject {
  id: string
  name: string
  progress: number
}

interface Topic {
  id: string
  name: string
  subject_id: string
  completed: boolean
}

interface Question {
  id: string
  question_text: string
  difficulty: string
  subject_id: string
  topic_id: string
  points: number
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

export function ConfigurarSimuladoModal({ 
  isOpen, 
  onClose, 
  simulation, 
  subjects, 
  onSuccess 
}: ConfigurarSimuladoModalProps) {
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [topics, setTopics] = useState<Topic[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [activeTab, setActiveTab] = useState('config')
  
  const [formData, setFormData] = useState({
    title: simulation.title,
    description: simulation.description || '',
    time_limit_minutes: simulation.time_limit_minutes || 60,
    status: simulation.status,
    is_public: simulation.is_public,
    is_favorite: simulation.is_favorite
  })

  useEffect(() => {
    if (isOpen) {
      loadData()
      setFormData({
        title: simulation.title,
        description: simulation.description || '',
        time_limit_minutes: simulation.time_limit_minutes || 60,
        status: simulation.status,
        is_public: simulation.is_public,
        is_favorite: simulation.is_favorite
      })
    }
  }, [isOpen, simulation])

  const loadData = async () => {
    try {
      // Carregar tópicos
      const { data: topicsData, error: topicsError } = await supabase
        .from('competition_topics')
        .select('*')
        .in('subject_id', subjects.map(s => s.id))
        .order('name')

      if (topicsError) throw topicsError
      setTopics(topicsData || [])

      // Carregar questões do simulado
      if (simulation.questions.length > 0) {
        const { data: questionsData, error: questionsError } = await supabase
          .from('competition_questions')
          .select('id, question_text, difficulty, subject_id, topic_id, points')
          .in('id', simulation.questions)

        if (questionsError) throw questionsError
        setQuestions(questionsData || [])
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateSimulation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({
        title: 'Erro',
        description: 'Título é obrigatório.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('competition_simulations')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          time_limit_minutes: formData.time_limit_minutes > 0 ? formData.time_limit_minutes : null,
          status: formData.status,
          is_public: formData.is_public,
          is_favorite: formData.is_favorite
        })
        .eq('id', simulation.id)

      if (error) throw error

      toast({
        title: 'Sucesso!',
        description: 'Simulado atualizado com sucesso!'
      })

      onSuccess()
      onClose()

    } catch (error) {
      console.error('Erro ao atualizar simulado:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o simulado.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveSimulation = async () => {
    if (!confirm('Tem certeza que deseja arquivar este simulado?')) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('competition_simulations')
        .update({ status: 'archived' })
        .eq('id', simulation.id)

      if (error) throw error

      toast({
        title: 'Sucesso!',
        description: 'Simulado arquivado com sucesso!'
      })

      onSuccess()
      onClose()

    } catch (error) {
      console.error('Erro ao arquivar simulado:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível arquivar o simulado.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSimulation = async () => {
    if (!confirm('Tem certeza que deseja excluir este simulado? Esta ação não pode ser desfeita.')) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('competition_simulations')
        .delete()
        .eq('id', simulation.id)

      if (error) throw error

      toast({
        title: 'Sucesso!',
        description: 'Simulado excluído com sucesso!'
      })

      onSuccess()
      onClose()

    } catch (error) {
      console.error('Erro ao excluir simulado:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o simulado.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || 'Matéria desconhecida'
  }

  const getTopicName = (topicId: string) => {
    return topics.find(t => t.id === topicId)?.name || 'Tópico desconhecido'
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
  const difficultyCount = {
    facil: questions.filter(q => q.difficulty === 'facil').length,
    medio: questions.filter(q => q.difficulty === 'medio').length,
    dificil: questions.filter(q => q.difficulty === 'dificil').length
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Simulado
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config">Configurações</TabsTrigger>
            <TabsTrigger value="questions">Questões ({questions.length})</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="actions">Ações</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            <form onSubmit={handleUpdateSimulation} className="space-y-6">
              {/* Status atual */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Status Atual</h3>
                      <p className="text-sm text-muted-foreground">
                        Criado em {new Date(simulation.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(simulation.status)}>
                      {simulation.status === 'draft' ? 'Rascunho' :
                       simulation.status === 'active' ? 'Ativo' :
                       simulation.status === 'completed' ? 'Concluído' :
                       'Arquivado'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Informações básicas */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      title: e.target.value
                    })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({
                      ...formData,
                      description: e.target.value
                    })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="time-limit">Tempo Limite (minutos)</Label>
                    <Input
                      id="time-limit"
                      type="number"
                      min="0"
                      value={formData.time_limit_minutes}
                      onChange={(e) => setFormData({
                        ...formData,
                        time_limit_minutes: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({
                        ...formData,
                        status: e.target.value as any
                      })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="draft">Rascunho</option>
                      <option value="active">Ativo</option>
                      <option value="completed">Concluído</option>
                      <option value="archived">Arquivado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-favorite"
                      checked={formData.is_favorite}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        is_favorite: !!checked
                      })}
                    />
                    <Label htmlFor="is-favorite">Marcar como favorito</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-public"
                      checked={formData.is_public}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        is_public: !!checked
                      })}
                    />
                    <Label htmlFor="is-public" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Público (outros usuários podem ver)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            {/* Resumo das questões */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{questions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pontos</p>
                      <p className="text-2xl font-bold">{totalPoints}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tempo</p>
                      <p className="text-2xl font-bold">
                        {formData.time_limit_minutes || '∞'}
                        {formData.time_limit_minutes ? 'm' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribuição por dificuldade */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Distribuição por Dificuldade</h3>
                <div className="flex gap-4">
                  <Badge variant="outline" className="bg-green-50">
                    Fácil: {difficultyCount.facil}
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50">
                    Médio: {difficultyCount.medio}
                  </Badge>
                  <Badge variant="outline" className="bg-red-50">
                    Difícil: {difficultyCount.dificil}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Lista de questões */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Questões Incluídas</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {questions.map((question, index) => {
                    const subject = subjects.find(s => s.id === question.subject_id)
                    const topic = topics.find(t => t.id === question.topic_id)

                    return (
                      <div key={question.id} className="border rounded p-3">
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-mono text-muted-foreground">
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="text-sm line-clamp-2 mb-2">
                              {question.question_text}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {question.difficulty}
                              </Badge>
                              <span>{question.points} pts</span>
                              {subject && <span>{subject.name}</span>}
                              {topic && <span>• {topic.name}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            {/* Estatísticas gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Estatísticas de Uso</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tentativas:</span>
                      <span className="font-medium">{simulation.attempts_count}</span>
                    </div>
                    {simulation.best_score !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Melhor pontuação:</span>
                        <span className="font-medium">{simulation.best_score}%</span>
                      </div>
                    )}
                    {simulation.avg_score !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pontuação média:</span>
                        <span className="font-medium">{simulation.avg_score}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Informações do Simulado</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criado em:</span>
                      <span className="font-medium">
                        {new Date(simulation.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última atualização:</span>
                      <span className="font-medium">
                        {new Date(simulation.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Visibilidade:</span>
                      <span className="font-medium">
                        {simulation.is_public ? 'Público' : 'Privado'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros aplicados */}
            {(simulation.difficulty_filter || simulation.subject_filters.length > 0) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Filtros Aplicados</h3>
                  <div className="space-y-3">
                    {simulation.difficulty_filter && (
                      <div>
                        <span className="text-muted-foreground">Dificuldade: </span>
                        <Badge variant="outline">{simulation.difficulty_filter}</Badge>
                      </div>
                    )}
                    
                    {simulation.subject_filters.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Matérias: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {simulation.subject_filters.map(subjectId => (
                            <Badge key={subjectId} variant="outline" className="text-xs">
                              {getSubjectName(subjectId)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {simulation.topic_filters.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Tópicos: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {simulation.topic_filters.map(topicId => (
                            <Badge key={topicId} variant="outline" className="text-xs">
                              {getTopicName(topicId)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-orange-600">Ações de Gerenciamento</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Arquivar Simulado</h4>
                        <p className="text-sm text-muted-foreground">
                          Move o simulado para arquivados, mantendo os dados mas removendo da lista principal
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleArchiveSimulation}
                        disabled={loading || simulation.status === 'archived'}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Arquivar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-red-600">Zona de Perigo</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <h4 className="font-medium text-red-800">Excluir Simulado</h4>
                        <p className="text-sm text-red-600">
                          Remove permanentemente o simulado. Esta ação não pode ser desfeita.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteSimulation}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}