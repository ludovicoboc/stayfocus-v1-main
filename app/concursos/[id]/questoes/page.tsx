'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Trash2, 
  Eye,
  BookOpen,
  Target,
  Clock,
  Star
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useQuestions, type Question } from '@/hooks/use-questions'
import { supabase } from '@/lib/supabase'
import { CriarQuestaoModal } from '@/components/concursos/criar-questao-modal'
import { ImportarQuestaoJsonModal } from '@/components/concursos/importar-questao-json-modal'
import { VisualizarQuestaoModal } from '@/components/concursos/visualizar-questao-modal'

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

interface Competition {
  id: string
  title: string
  organizer: string
  status: string
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'facil': return 'bg-green-100 text-green-800'
    case 'medio': return 'bg-yellow-100 text-yellow-800'
    case 'dificil': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getQuestionTypeLabel = (type: string) => {
  switch (type) {
    case 'multiple_choice': return 'Múltipla Escolha'
    case 'true_false': return 'Verdadeiro/Falso'
    case 'essay': return 'Dissertativa'
    case 'fill_blank': return 'Preencher Lacunas'
    default: return type
  }
}

export default function QuestoesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const competitionId = params.id as string

  // Use o hook useQuestions
  const {
    questions,
    loading: questionsLoading,
    loadQuestions,
    deleteQuestion,
    stats
  } = useQuestions(competitionId)

  const [competition, setCompetition] = useState<Competition | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)

  useEffect(() => {
    if (user && competitionId) {
      loadCompetitionData()
    }
  }, [user, competitionId])

  const loadCompetitionData = async () => {
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

      // Carregar tópicos
      const { data: topicsData, error: topicsError } = await supabase
        .from('competition_topics')
        .select('*')
        .in('subject_id', (subjectsData || []).map(s => s.id))
        .order('name')

      if (topicsError) throw topicsError
      setTopics(topicsData || [])

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

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta questão?')) return
    await deleteQuestion(questionId)
  }

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesDifficulty = !selectedDifficulty || question.difficulty === selectedDifficulty
    const matchesSubject = !selectedSubject || question.subject_id === selectedSubject
    const matchesTopic = !selectedTopic || question.topic_id === selectedTopic
    const matchesType = !selectedType || question.question_type === selectedType

    return matchesSearch && matchesDifficulty && matchesSubject && matchesTopic && matchesType
  })

  const exportQuestions = () => {
    const dataStr = JSON.stringify(filteredQuestions, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `questoes-${competition?.title || 'concurso'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading || questionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Concurso não encontrado</h1>
          <Button onClick={() => router.push('/concursos')}>
            Voltar aos Concursos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{competition.title}</h1>
        </div>
        <p className="text-muted-foreground">{competition.organizer}</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Ativas</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Fáceis</p>
                <p className="text-2xl font-bold">{stats.by_difficulty.facil}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Difíceis</p>
                <p className="text-2xl font-bold">{stats.by_difficulty.dificil}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar questões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Questão
          </Button>
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar JSON
          </Button>
          <Button variant="outline" onClick={exportQuestions}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">Todas as dificuldades</option>
          <option value="facil">Fácil</option>
          <option value="medio">Médio</option>
          <option value="dificil">Difícil</option>
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">Todas as matérias</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>

        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">Todos os tópicos</option>
          {topics.filter(topic => !selectedSubject || topic.subject_id === selectedSubject).map(topic => (
            <option key={topic.id} value={topic.id}>{topic.name}</option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">Todos os tipos</option>
          <option value="multiple_choice">Múltipla Escolha</option>
          <option value="true_false">Verdadeiro/Falso</option>
          <option value="essay">Dissertativa</option>
          <option value="fill_blank">Preencher Lacunas</option>
        </select>

        <Button variant="outline" onClick={() => {
          setSearchTerm('')
          setSelectedDifficulty('')
          setSelectedSubject('')
          setSelectedTopic('')
          setSelectedType('')
        }}>
          Limpar Filtros
        </Button>
      </div>

      {/* Lista de Questões */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma questão encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {questions.length === 0 
                  ? 'Comece criando sua primeira questão ou importando questões.'
                  : 'Tente ajustar os filtros para encontrar questões.'
                }
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Questão
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card key={question.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {getQuestionTypeLabel(question.question_type)}
                      </Badge>
                      {question.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm font-medium mb-2">
                      {question.question_text.substring(0, 200)}
                      {question.question_text.length > 200 && '...'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Pontos: {question.points}</span>
                      <span>Uso: {question.usage_count}x</span>
                      {question.time_limit_seconds && (
                        <span>Tempo: {question.time_limit_seconds}s</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedQuestion(question)
                        setShowViewModal(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteQuestion(question.id)}
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

      {/* Modals */}
      <CriarQuestaoModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        competitionId={competitionId}
        subjects={subjects}
        topics={topics}
        onSuccess={() => loadQuestions()}
      />

      <ImportarQuestaoJsonModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        competitionId={competitionId}
        subjects={subjects}
        onSuccess={() => loadQuestions()}
      />

      {selectedQuestion && (
        <VisualizarQuestaoModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setSelectedQuestion(null)
          }}
          question={selectedQuestion}
          subjects={subjects}
          topics={topics}
        />
      )}
    </div>
  )
}