'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  Download, 
  Save, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Target
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'

interface ImportarSimuladoJsonModalProps {
  isOpen: boolean
  onClose: () => void
  competitionId: string
  onSuccess: () => void
}

interface ImportedSimulation {
  title: string
  description?: string
  questions: string[]
  question_count?: number
  time_limit_minutes?: number
  difficulty_filter?: string
  subject_filters?: string[]
  topic_filters?: string[]
  is_public?: boolean
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  simulation: ImportedSimulation
  index: number
}

export function ImportarSimuladoJsonModal({ 
  isOpen, 
  onClose, 
  competitionId, 
  onSuccess 
}: ImportarSimuladoJsonModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [importPreview, setImportPreview] = useState<ImportedSimulation[]>([])
  const [activeTab, setActiveTab] = useState('upload')
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo JSON válido.',
        variant: 'destructive'
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonText(content)
      validateAndPreview(content)
    }
    reader.readAsText(file)
  }

  const validateAndPreview = async (jsonContent: string) => {
    try {
      // Primeiro, carregar as questões disponíveis do concurso
      const { data: questionsData, error: questionsError } = await supabase
        .from('competition_questions')
        .select('id, question_text, is_active')
        .eq('competition_id', competitionId)
        .eq('is_active', true)

      if (questionsError) throw questionsError
      setAvailableQuestions(questionsData || [])

      const parsed = JSON.parse(jsonContent)
      const simulations = Array.isArray(parsed) ? parsed : [parsed]
      
      const results: ValidationResult[] = []
      const validSimulations: ImportedSimulation[] = []

      simulations.forEach((simulation: any, index: number) => {
        const validation = validateSimulation(simulation, index, questionsData || [])
        results.push(validation)
        
        if (validation.isValid) {
          validSimulations.push(validation.simulation)
        }
      })

      setValidationResults(results)
      setImportPreview(validSimulations)
      setActiveTab('preview')

    } catch (error) {
      console.error('Erro ao validar JSON:', error)
      toast({
        title: 'JSON inválido',
        description: 'O arquivo JSON não pôde ser lido. Verifique a formatação.',
        variant: 'destructive'
      })
    }
  }

  const validateSimulation = (simulation: any, index: number, questions: any[]): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    // Validações obrigatórias
    if (!simulation.title || typeof simulation.title !== 'string') {
      errors.push('Título é obrigatório')
    }

    if (!simulation.questions || !Array.isArray(simulation.questions)) {
      errors.push('Array de questões é obrigatório')
    } else {
      if (simulation.questions.length === 0) {
        errors.push('Pelo menos uma questão deve ser especificada')
      }

      // Verificar se as questões existem no concurso
      const invalidQuestions = simulation.questions.filter((qId: string) => 
        !questions.find(q => q.id === qId)
      )

      if (invalidQuestions.length > 0) {
        errors.push(`${invalidQuestions.length} questões não encontradas no concurso`)
      }
    }

    // Validações opcionais com warnings
    if (simulation.time_limit_minutes && (simulation.time_limit_minutes < 1 || simulation.time_limit_minutes > 480)) {
      warnings.push('Tempo limite recomendado entre 1 e 480 minutos')
    }

    if (simulation.question_count && simulation.questions && simulation.question_count !== simulation.questions.length) {
      warnings.push('question_count não corresponde ao número de questões no array')
    }

    if (simulation.difficulty_filter && !['facil', 'medio', 'dificil'].includes(simulation.difficulty_filter)) {
      warnings.push('difficulty_filter deve ser: facil, medio ou dificil')
    }

    // Simulação processada
    const processedSimulation: ImportedSimulation = {
      title: simulation.title,
      description: simulation.description || '',
      questions: simulation.questions || [],
      question_count: simulation.questions?.length || 0,
      time_limit_minutes: simulation.time_limit_minutes || 60,
      difficulty_filter: simulation.difficulty_filter || '',
      subject_filters: Array.isArray(simulation.subject_filters) ? simulation.subject_filters : [],
      topic_filters: Array.isArray(simulation.topic_filters) ? simulation.topic_filters : [],
      is_public: !!simulation.is_public
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      simulation: processedSimulation,
      index
    }
  }

  const handleImport = async () => {
    if (importPreview.length === 0) {
      toast({
        title: 'Nenhum simulado válido',
        description: 'Não há simulados válidos para importar.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const simulationsToInsert = importPreview.map(simulation => ({
        competition_id: competitionId,
        user_id: user?.id,
        title: simulation.title,
        description: simulation.description || null,
        questions: simulation.questions,
        question_count: simulation.question_count,
        time_limit_minutes: simulation.time_limit_minutes && simulation.time_limit_minutes > 0 ? simulation.time_limit_minutes : null,
        difficulty_filter: simulation.difficulty_filter || null,
        subject_filters: simulation.subject_filters,
        topic_filters: simulation.topic_filters,
        status: 'active',
        is_favorite: false,
        is_public: simulation.is_public,
        attempts_count: 0
      }))

      const { error } = await supabase
        .from('competition_simulations')
        .insert(simulationsToInsert)

      if (error) throw error

      toast({
        title: 'Sucesso!',
        description: `${simulationsToInsert.length} simulados importados com sucesso!`
      })

      onSuccess()
      onClose()
      resetForm()

    } catch (error) {
      console.error('Erro ao importar simulados:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível importar os simulados. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setJsonText('')
    setValidationResults([])
    setImportPreview([])
    setActiveTab('upload')
    setAvailableQuestions([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const template = [
      {
        title: "Simulado Geral - Nível Básico",
        description: "Simulado com questões básicas de todas as matérias",
        questions: [
          "questao-id-1",
          "questao-id-2",
          "questao-id-3"
        ],
        question_count: 3,
        time_limit_minutes: 30,
        difficulty_filter: "facil",
        subject_filters: [],
        topic_filters: [],
        is_public: false
      },
      {
        title: "Simulado Avançado - Matemática",
        description: "Simulado focado em questões avançadas de matemática",
        questions: [
          "questao-id-4",
          "questao-id-5"
        ],
        question_count: 2,
        time_limit_minutes: 45,
        difficulty_filter: "dificil",
        subject_filters: ["subject-id-matematica"],
        topic_filters: ["topic-id-algebra"],
        is_public: true
      }
    ]

    const dataStr = JSON.stringify(template, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template-simulados.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const validSimulations = validationResults.filter(r => r.isValid).length
  const totalSimulations = validationResults.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Simulados via JSON</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload & Validação</TabsTrigger>
            <TabsTrigger value="preview" disabled={importPreview.length === 0}>
              Preview ({validSimulations}/{totalSimulations})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Template Download */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Template JSON
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Baixe um template JSON com exemplos de simulados para facilitar a importação.
                  Lembre-se de substituir os IDs das questões pelos IDs reais do seu concurso.
                </p>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template
                </Button>
              </CardContent>
            </Card>

            {/* Upload Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Arquivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Arraste um arquivo JSON ou clique para selecionar
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Selecionar Arquivo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Direct JSON Input */}
              <Card>
                <CardHeader>
                  <CardTitle>Colar JSON</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Cole seu JSON aqui..."
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => validateAndPreview(jsonText)}
                      disabled={!jsonText.trim()}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Validar & Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Validation Results */}
            {validationResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {validSimulations === totalSimulations ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    Resultado da Validação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {validSimulations} Válidos
                      </Badge>
                      <Badge variant="destructive">
                        {totalSimulations - validSimulations} Com Erro
                      </Badge>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {validationResults.map((result, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {result.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium">Simulado {index + 1}</span>
                            {result.isValid && (
                              <span className="text-sm text-muted-foreground">
                                - {result.simulation.title}
                              </span>
                            )}
                          </div>
                          
                          {result.errors.length > 0 && (
                            <div className="mb-2">
                              {result.errors.map((error, errorIndex) => (
                                <p key={errorIndex} className="text-sm text-red-600">
                                  • {error}
                                </p>
                              ))}
                            </div>
                          )}

                          {result.warnings.length > 0 && (
                            <div>
                              {result.warnings.map((warning, warningIndex) => (
                                <p key={warningIndex} className="text-sm text-yellow-600">
                                  ⚠ {warning}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {/* Preview Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Preview dos Simulados ({importPreview.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('upload')}
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading || importPreview.length === 0}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Importar {importPreview.length} Simulados
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Simulations Preview */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {importPreview.map((simulation, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">
                            {simulation.title}
                          </h4>
                          
                          {simulation.description && (
                            <p className="text-muted-foreground mb-3">
                              {simulation.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4 text-blue-500" />
                              <span>{simulation.question_count} questões</span>
                            </div>
                            
                            {simulation.time_limit_minutes && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-green-500" />
                                <span>{simulation.time_limit_minutes} min</span>
                              </div>
                            )}

                            {simulation.difficulty_filter && (
                              <Badge variant="outline">
                                {simulation.difficulty_filter}
                              </Badge>
                            )}

                            {simulation.is_public && (
                              <Badge variant="secondary">
                                Público
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Questões vinculadas */}
                      <div>
                        <Label className="text-sm font-medium">Questões vinculadas:</Label>
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                          {simulation.questions.map((questionId, qIndex) => {
                            const question = availableQuestions.find(q => q.id === questionId)
                            return (
                              <div key={qIndex} className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className="font-mono">{questionId}</span>
                                {question ? (
                                  <span className="line-clamp-1">- {question.question_text}</span>
                                ) : (
                                  <span className="text-red-500">- Questão não encontrada</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Filtros aplicados */}
                      {(simulation.subject_filters?.length || simulation.topic_filters?.length) && (
                        <div className="text-xs text-muted-foreground">
                          <p>
                            <strong>Filtros:</strong>{' '}
                            {simulation.subject_filters?.length ? `${simulation.subject_filters.length} matérias` : ''}
                            {simulation.subject_filters?.length && simulation.topic_filters?.length ? ', ' : ''}
                            {simulation.topic_filters?.length ? `${simulation.topic_filters.length} tópicos` : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              onClose()
              resetForm()
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}