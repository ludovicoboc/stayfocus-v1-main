'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Target, 
  BookOpen, 
  Tag,
  Calendar,
  ExternalLink,
  Copy
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { type Question } from '@/hooks/use-questions'

interface VisualizarQuestaoModalProps {
  isOpen: boolean
  onClose: () => void
  question: Question
  subjects: Subject[]
  topics: Topic[]
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

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
}

export function VisualizarQuestaoModal({ 
  isOpen, 
  onClose, 
  question, 
  subjects, 
  topics 
}: VisualizarQuestaoModalProps) {
  const { toast } = useToast()

  const subject = subjects.find(s => s.id === question.subject_id)
  const topic = topics.find(t => t.id === question.topic_id)

  const copyQuestionText = () => {
    navigator.clipboard.writeText(question.question_text)
    toast({
      title: 'Copiado!',
      description: 'Texto da questão copiado para a área de transferência.'
    })
  }

  const copyQuestionJson = () => {
    const questionData = {
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options,
      correct_answer: question.correct_answer,
      correct_options: question.correct_options,
      explanation: question.explanation,
      difficulty: question.difficulty,
      points: question.points,
      time_limit_seconds: question.time_limit_seconds,
      tags: question.tags,
      source: question.source,
      year: question.year,
      subject_name: subject?.name,
      topic_name: topic?.name
    }

    navigator.clipboard.writeText(JSON.stringify(questionData, null, 2))
    toast({
      title: 'Copiado!',
      description: 'Dados da questão copiados em formato JSON.'
    })
  }

  const renderQuestionContent = () => {
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <h4 className="font-medium">Opções:</h4>
            {question.options.map((option: any, index: number) => (
              <Card key={index} className={option.isCorrect ? 'border-green-500 bg-green-50' : ''}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {option.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="font-medium text-sm">
                      {String.fromCharCode(65 + index)})
                    </span>
                    <span className={option.isCorrect ? 'font-medium text-green-800' : ''}>
                      {option.text}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )

      case 'true_false':
        return (
          <div className="space-y-3">
            <h4 className="font-medium">Resposta:</h4>
            <Card className="border-green-500 bg-green-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    {question.correct_answer}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'essay':
        return (
          <div className="space-y-3">
            <h4 className="font-medium">Resposta Esperada:</h4>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {question.correct_answer}
                </p>
              </CardContent>
            </Card>
          </div>
        )

      case 'fill_blank':
        return (
          <div className="space-y-3">
            <h4 className="font-medium">Resposta para Preenchimento:</h4>
            <Card className="border-blue-500 bg-blue-50">
              <CardContent className="p-3">
                <span className="font-medium text-blue-800">
                  {question.correct_answer}
                </span>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Questão</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho da Questão */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty}
                </Badge>
                <Badge variant="outline">
                  {getQuestionTypeLabel(question.question_type)}
                </Badge>
                {!question.is_active && (
                  <Badge variant="secondary">Inativa</Badge>
                )}
                {question.is_ai_generated && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    IA
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span>{question.points} pts</span>
                </div>
                {question.time_limit_seconds != null && question.time_limit_seconds > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>{formatTime(question.time_limit_seconds)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  <span>Usada {question.usage_count}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span>{question.year}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={copyQuestionText}
                title="Copiar texto"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={copyQuestionJson}
                title="Copiar JSON"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Texto da Questão */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enunciado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-base leading-relaxed">
                {question.question_text}
              </p>
            </CardContent>
          </Card>

          {/* Conteúdo Específico por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resposta</CardTitle>
            </CardHeader>
            <CardContent>
              {renderQuestionContent()}
            </CardContent>
          </Card>

          {/* Explicação */}
          {question.explanation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Explicação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {question.explanation}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categorização */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Categorização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subject && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Matéria</Label>
                    <p className="text-sm">{subject.name}</p>
                  </div>
                )}
                {topic && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tópico</Label>
                    <p className="text-sm">{topic.name}</p>
                  </div>
                )}
                {question.source && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Fonte</Label>
                    <p className="text-sm">{question.source}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags e Metadados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags e Metadados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {question.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {question.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Criada em</Label>
                  <p className="text-sm">
                    {new Date(question.created_at).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ID</Label>
                  <p className="text-xs font-mono text-muted-foreground">{question.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={className}>{children}</label>
}