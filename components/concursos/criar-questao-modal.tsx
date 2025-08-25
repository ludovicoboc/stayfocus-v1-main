'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Plus, 
  Minus, 
  Save, 
  X, 
  CheckCircle, 
  Circle,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'

interface CriarQuestaoModalProps {
  isOpen: boolean
  onClose: () => void
  competitionId: string
  subjects: Subject[]
  topics: Topic[]
  onSuccess: () => void
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

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

export function CriarQuestaoModal({ 
  isOpen, 
  onClose, 
  competitionId, 
  subjects, 
  topics, 
  onSuccess 
}: CriarQuestaoModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank',
    subject_id: '',
    topic_id: '',
    difficulty: 'medio' as 'facil' | 'medio' | 'dificil',
    points: 1,
    time_limit_seconds: 120,
    source: '',
    year: new Date().getFullYear(),
    explanation: '',
    tags: [] as string[],
  })
  
  const [options, setOptions] = useState<Option[]>([
    { id: '1', text: '', isCorrect: false },
    { id: '2', text: '', isCorrect: false }
  ])
  
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null)
  const [essayAnswer, setEssayAnswer] = useState('')
  const [fillBlankAnswer, setFillBlankAnswer] = useState('')
  const [newTag, setNewTag] = useState('')

  const filteredTopics = topics.filter(topic => topic.subject_id === formData.subject_id)

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_type: 'multiple_choice',
      subject_id: '',
      topic_id: '',
      difficulty: 'medio',
      points: 1,
      time_limit_seconds: 120,
      source: '',
      year: new Date().getFullYear(),
      explanation: '',
      tags: [],
    })
    setOptions([
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false }
    ])
    setTrueFalseAnswer(null)
    setEssayAnswer('')
    setFillBlankAnswer('')
    setNewTag('')
  }

  const addOption = () => {
    const newId = (options.length + 1).toString()
    setOptions([...options, { id: newId, text: '', isCorrect: false }])
  }

  const removeOption = (optionId: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== optionId))
    }
  }

  const updateOption = (optionId: string, field: 'text' | 'isCorrect', value: string | boolean) => {
    setOptions(options.map(opt => 
      opt.id === optionId ? { ...opt, [field]: value } : opt
    ))
  }

  const toggleCorrectOption = (optionId: string) => {
    setOptions(options.map(opt => 
      opt.id === optionId 
        ? { ...opt, isCorrect: !opt.isCorrect }
        : { ...opt, isCorrect: false } // Para múltipla escolha simples
    ))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const validateForm = (): string | null => {
    if (!formData.question_text.trim()) {
      return 'Texto da questão é obrigatório'
    }

    if (formData.question_type === 'multiple_choice') {
      const filledOptions = options.filter(opt => opt.text.trim())
      if (filledOptions.length < 2) {
        return 'Pelo menos 2 opções são necessárias para múltipla escolha'
      }
      if (!options.some(opt => opt.isCorrect)) {
        return 'Marque pelo menos uma opção como correta'
      }
    }

    if (formData.question_type === 'true_false' && trueFalseAnswer === null) {
      return 'Selecione a resposta correta para verdadeiro/falso'
    }

    if (formData.question_type === 'essay' && !essayAnswer.trim()) {
      return 'Resposta esperada é obrigatória para questões dissertativas'
    }

    if (formData.question_type === 'fill_blank' && !fillBlankAnswer.trim()) {
      return 'Resposta para preenchimento é obrigatória'
    }

    if (formData.points < 1) {
      return 'Pontuação deve ser pelo menos 1'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      toast({
        title: 'Erro de validação',
        description: validationError,
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      let questionOptions: any[] = []
      let correctAnswer = ''
      let correctOptions: number[] = []

      switch (formData.question_type) {
        case 'multiple_choice':
          questionOptions = options
            .filter(opt => opt.text.trim())
            .map((opt, index) => ({
              id: index,
              text: opt.text.trim(),
              isCorrect: opt.isCorrect
            }))
          correctOptions = questionOptions
            .map((opt, index) => opt.isCorrect ? index : -1)
            .filter(index => index !== -1)
          break

        case 'true_false':
          questionOptions = [
            { id: 0, text: 'Verdadeiro', isCorrect: trueFalseAnswer === true },
            { id: 1, text: 'Falso', isCorrect: trueFalseAnswer === false }
          ]
          correctAnswer = trueFalseAnswer ? 'Verdadeiro' : 'Falso'
          break

        case 'essay':
          correctAnswer = essayAnswer.trim()
          break

        case 'fill_blank':
          correctAnswer = fillBlankAnswer.trim()
          break
      }

      const questionData = {
        competition_id: competitionId,
        subject_id: formData.subject_id || null,
        topic_id: formData.topic_id || null,
        question_text: formData.question_text.trim(),
        question_type: formData.question_type,
        options: questionOptions,
        correct_answer: correctAnswer,
        correct_options: correctOptions,
        explanation: formData.explanation.trim() || null,
        difficulty: formData.difficulty,
        points: formData.points,
        time_limit_seconds: formData.time_limit_seconds > 0 ? formData.time_limit_seconds : null,
        tags: formData.tags,
        source: formData.source.trim() || null,
        year: formData.year,
        is_ai_generated: false,
        is_active: true,
        usage_count: 0
      }

      const { error } = await supabase
        .from('competition_questions')
        .insert([questionData])

      if (error) throw error

      toast({
        title: 'Sucesso!',
        description: 'Questão criada com sucesso!'
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao criar questão:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a questão. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const renderQuestionTypeFields = () => {
    switch (formData.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <Label>Opções de Resposta</Label>
            {options.map((option, index) => (
              <Card key={option.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleCorrectOption(option.id)}
                      className={option.isCorrect ? 'text-green-600' : 'text-gray-400'}
                    >
                      {option.isCorrect ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </Button>
                    
                    <div className="flex-1">
                      <Input
                        placeholder={`Opção ${index + 1}`}
                        value={option.text}
                        onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                      />
                    </div>
                    
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(option.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Opção
            </Button>
          </div>
        )

      case 'true_false':
        return (
          <div className="space-y-4">
            <Label>Resposta Correta</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={trueFalseAnswer === true ? 'default' : 'outline'}
                onClick={() => setTrueFalseAnswer(true)}
                className="flex-1"
              >
                Verdadeiro
              </Button>
              <Button
                type="button"
                variant={trueFalseAnswer === false ? 'default' : 'outline'}
                onClick={() => setTrueFalseAnswer(false)}
                className="flex-1"
              >
                Falso
              </Button>
            </div>
          </div>
        )

      case 'essay':
        return (
          <div className="space-y-4">
            <Label htmlFor="essay-answer">Resposta Esperada</Label>
            <Textarea
              id="essay-answer"
              placeholder="Digite a resposta esperada ou pontos-chave..."
              value={essayAnswer}
              onChange={(e) => setEssayAnswer(e.target.value)}
              rows={4}
            />
          </div>
        )

      case 'fill_blank':
        return (
          <div className="space-y-4">
            <Label htmlFor="fill-answer">Resposta para Preenchimento</Label>
            <Input
              id="fill-answer"
              placeholder="Digite a palavra/frase que preenche a lacuna"
              value={fillBlankAnswer}
              onChange={(e) => setFillBlankAnswer(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Use ___ no texto da questão para indicar onde deve ser preenchido
            </p>
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
          <DialogTitle>Criar Nova Questão</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="question-type">Tipo de Questão</Label>
              <select
                id="question-type"
                value={formData.question_type}
                onChange={(e) => setFormData({
                  ...formData,
                  question_type: e.target.value as any
                })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="multiple_choice">Múltipla Escolha</option>
                <option value="true_false">Verdadeiro/Falso</option>
                <option value="essay">Dissertativa</option>
                <option value="fill_blank">Preencher Lacunas</option>
              </select>
            </div>

            <div>
              <Label htmlFor="difficulty">Dificuldade</Label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) => setFormData({
                  ...formData,
                  difficulty: e.target.value as any
                })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
          </div>

          {/* Matéria e Tópico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Matéria (Opcional)</Label>
              <select
                id="subject"
                value={formData.subject_id}
                onChange={(e) => setFormData({
                  ...formData,
                  subject_id: e.target.value,
                  topic_id: ''
                })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Selecione uma matéria</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="topic">Tópico (Opcional)</Label>
              <select
                id="topic"
                value={formData.topic_id}
                onChange={(e) => setFormData({
                  ...formData,
                  topic_id: e.target.value
                })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                disabled={!formData.subject_id}
              >
                <option value="">Selecione um tópico</option>
                {filteredTopics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Texto da Questão */}
          <div>
            <Label htmlFor="question-text">Texto da Questão *</Label>
            <Textarea
              id="question-text"
              placeholder="Digite o enunciado da questão..."
              value={formData.question_text}
              onChange={(e) => setFormData({
                ...formData,
                question_text: e.target.value
              })}
              rows={4}
              required
            />
          </div>

          {/* Campos específicos por tipo */}
          {renderQuestionTypeFields()}

          {/* Explicação */}
          <div>
            <Label htmlFor="explanation">Explicação (Opcional)</Label>
            <Textarea
              id="explanation"
              placeholder="Explicação da resposta correta..."
              value={formData.explanation}
              onChange={(e) => setFormData({
                ...formData,
                explanation: e.target.value
              })}
              rows={3}
            />
          </div>

          {/* Configurações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="points">Pontuação</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="10"
                value={formData.points}
                onChange={(e) => setFormData({
                  ...formData,
                  points: parseInt(e.target.value) || 1
                })}
              />
            </div>

            <div>
              <Label htmlFor="time-limit">Tempo (segundos)</Label>
              <Input
                id="time-limit"
                type="number"
                min="0"
                value={formData.time_limit_seconds}
                onChange={(e) => setFormData({
                  ...formData,
                  time_limit_seconds: parseInt(e.target.value) || 0
                })}
              />
            </div>

            <div>
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max="2100"
                value={formData.year}
                onChange={(e) => setFormData({
                  ...formData,
                  year: parseInt(e.target.value) || new Date().getFullYear()
                })}
              />
            </div>
          </div>

          {/* Fonte */}
          <div>
            <Label htmlFor="source">Fonte (Opcional)</Label>
            <Input
              id="source"
              placeholder="Ex: ENEM 2023, Livro XYZ, etc."
              value={formData.source}
              onChange={(e) => setFormData({
                ...formData,
                source: e.target.value
              })}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Adicionar tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Botões */}
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
                  Salvar Questão
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}