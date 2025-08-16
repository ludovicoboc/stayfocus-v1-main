"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useConcursos } from "@/hooks/use-concursos"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Menu, Calendar, Award, Edit, Trash2, BookOpen, Brain } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import type { Concurso, Questao } from "@/types/concursos"
import { SeletorQuestoesPersonalizadas } from "@/components/seletor-questoes-personalizadas"

export default function ConcursoDetalhesPage() {
  const { user, loading: authLoading } = useAuth()
  const { fetchConcursoCompleto, atualizarTopicoCompletado, adicionarQuestao, buscarQuestoesConcurso } = useConcursos()
  const [concurso, setConcurso] = useState<Concurso | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("conteudo")
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [questoesConcurso, setQuestoesConcurso] = useState<Questao[]>([])

  // Form states for question generation
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("")
  const [topicoSelecionado, setTopicoSelecionado] = useState("")
  const [nivelDificuldade, setNivelDificuldade] = useState("facil")
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState("3")
  const [resumoContexto, setResumoContexto] = useState("")
  const [gerando, setGerando] = useState(false)

  useEffect(() => {
    if (user && id) {
      loadConcurso()
      loadQuestoes()
    }
  }, [user, id])

  const loadConcurso = async () => {
    setLoading(true)
    const data = await fetchConcursoCompleto(id)
    setConcurso(data)
    setLoading(false)
  }

  const loadQuestoes = async () => {
    const questoes = await buscarQuestoesConcurso(id)
    setQuestoesConcurso(questoes)
  }

  const handleTopicoChange = async (topicoId: string, completed: boolean) => {
    if (!concurso) return

    const success = await atualizarTopicoCompletado(topicoId, completed)
    if (success) {
      // Update local state
      const updatedDisciplinas = concurso.disciplinas?.map((disciplina) => {
        const updatedTopicos = disciplina.topicos?.map((topico) => {
          if (topico.id === topicoId) {
            return { ...topico, completed }
          }
          return topico
        })
        return { ...disciplina, topicos: updatedTopicos }
      })

      setConcurso({ ...concurso, disciplinas: updatedDisciplinas })
    }
  }

  const handleGerarQuestoes = async () => {
    if (!concurso || !disciplinaSelecionada || !topicoSelecionado) return

    setGerando(true)
    try {
      // In a real app, this would call an AI service to generate questions
      // For now, we'll just simulate it with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Create a sample question
      const questao: Questao = {
        competition_id: concurso.id,
        subject_id: disciplinaSelecionada,
        topic_id: topicoSelecionado,
        question_text: `Questão gerada automaticamente sobre o tópico selecionado. Nível: ${nivelDificuldade}`,
        options: [
          { text: "Alternativa A", isCorrect: false },
          { text: "Alternativa B", isCorrect: true },
          { text: "Alternativa C", isCorrect: false },
          { text: "Alternativa D", isCorrect: false },
          { text: "Alternativa E", isCorrect: false },
        ],
        difficulty: nivelDificuldade as "facil" | "medio" | "dificil",
        is_ai_generated: true,
        explanation: "Esta é uma explicação gerada automaticamente para a questão.",
      }

      await adicionarQuestao(questao)
      alert("Questões geradas com sucesso!")
    } finally {
      setGerando(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Você precisa estar logado para acessar esta página.</div>
      </div>
    )
  }

  if (!concurso) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Concurso não encontrado.</div>
      </div>
    )
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Data não definida"
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return "Data inválida"
    }
  }

  // Calculate overall progress
  const totalTopicos =
    concurso.disciplinas?.reduce((acc, disciplina) => acc + (disciplina.topicos?.length || 0), 0) || 0
  const completedTopicos =
    concurso.disciplinas?.reduce(
      (acc, disciplina) => acc + (disciplina.topicos?.filter((t) => t.completed)?.length || 0),
      0,
    ) || 0
  const overallProgress = totalTopicos > 0 ? Math.round((completedTopicos / totalTopicos) * 100) : 0

  // Get disciplines for the form
  const disciplinas = concurso.disciplinas || []
  const topicos = disciplinas.find((d) => d.id === disciplinaSelecionada)?.topicos || []

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link href="/concursos">
              <Button variant="ghost" size="icon" className="text-slate-400">
                <Menu className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-blue-400 mr-2" />
              <h1 className="text-xl font-semibold text-white">{concurso.title}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-1" />
              Remover
            </Button>
          </div>
        </div>
      </header>

      {/* Concurso Info */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="space-y-2 mb-4 md:mb-0">
              <div className="flex items-center text-slate-300">
                <Award className="w-4 h-4 mr-2 text-slate-400" />
                <span>Fundação Getúlio Vargas (FGV)</span>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-slate-300">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  <span>Data da Prova: {formatDate(concurso.exam_date)}</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  <span>Inscrição: {formatDate(concurso.registration_date)}</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Progresso Geral</span>
                  <span>{overallProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${overallProgress}%` }}
                    role="progressbar"
                    aria-valuenow={overallProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="conteudo" className="data-[state=active]:bg-blue-600">
              Conteúdo Programático
            </TabsTrigger>
            <TabsTrigger value="gerar" className="data-[state=active]:bg-blue-600">
              Gerar Questões Automáticas
            </TabsTrigger>
            <TabsTrigger value="questoes" className="data-[state=active]:bg-blue-600">
              Questões do Concurso
            </TabsTrigger>
            <TabsTrigger value="simulados" className="data-[state=active]:bg-blue-600">
              Simulados Salvos
            </TabsTrigger>
            <TabsTrigger value="personalizado" className="data-[state=active]:bg-blue-600">
              Simulado Personalizado
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo Programático */}
          <TabsContent value="conteudo" className="mt-6">
            {disciplinas.map((disciplina) => (
              <Accordion key={disciplina.id} type="single" collapsible className="mb-4">
                <AccordionItem value={disciplina.id || disciplina.name} className="border-slate-700">
                  <AccordionTrigger className="text-white hover:no-underline py-4 px-4 bg-slate-800 rounded-lg hover:bg-slate-750">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <Brain className="w-5 h-5 mr-3 text-blue-400" />
                        <span>{disciplina.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 mr-4">
                        <div className="text-sm text-slate-400">
                          {disciplina.topicos?.filter((t) => t.completed)?.length || 0}/
                          {disciplina.topicos?.length || 0}
                        </div>
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                disciplina.topicos?.length
                                  ? Math.round(
                                      ((disciplina.topicos?.filter((t) => t.completed)?.length || 0) /
                                        disciplina.topicos?.length) *
                                        100,
                                    )
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-slate-900 rounded-b-lg p-2">
                    <div className="space-y-2 p-2">
                      {disciplina.topicos?.map((topico) => (
                        <div
                          key={topico.id || topico.name}
                          className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                        >
                          <div className="flex items-center">
                            <Checkbox
                              id={`topico-${topico.id}`}
                              checked={topico.completed}
                              onCheckedChange={(checked) => topico.id && handleTopicoChange(topico.id, !!checked)}
                              className="mr-3"
                            />
                            <label
                              htmlFor={`topico-${topico.id}`}
                              className={`text-sm ${topico.completed ? "text-slate-400 line-through" : "text-white"}`}
                            >
                              {topico.name}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </TabsContent>

          {/* Gerar Questões */}
          <TabsContent value="gerar" className="mt-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Gerar Questões Automáticas</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="disciplina" className="text-sm text-white">
                    Disciplina
                  </label>
                  <Select
                    value={disciplinaSelecionada}
                    onValueChange={setDisciplinaSelecionada}
                  >
                    <SelectTrigger className="bg-slate-900 text-white">
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 text-white">
                      {disciplinas.map((disciplina) => (
                        <SelectItem key={disciplina.id} value={disciplina.id || ''}>
                          {disciplina.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="topico" className="text-sm text-white">
                    Tópico
                  </label>
                  <Select value={topicoSelecionado} onValueChange={setTopicoSelecionado}>
                    <SelectTrigger className="bg-slate-900 text-white">
                      <SelectValue placeholder="Selecione um tópico" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 text-white">
                      {topicos.map((topico) => (
                        <SelectItem key={topico.id} value={topico.id || ''}>
                          {topico.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="nivelDificuldade" className="text-sm text-white">
                    Nível de Dificuldade
                  </label>
                  <Select
                    value={nivelDificuldade}
                    onValueChange={setNivelDificuldade}
                  >
                    <SelectTrigger className="bg-slate-900 text-white">
                      <SelectValue placeholder="Selecione um nível" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 text-white">
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="quantidadeQuestoes" className="text-sm text-white">
                    Quantidade de Questões
                  </label>
                  <Input
                    id="quantidadeQuestoes"
                    value={quantidadeQuestoes}
                    onChange={(e) => setQuantidadeQuestoes(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="resumoContexto" className="text-sm text-white">
                    Resumo do Contexto
                  </label>
                  <Textarea
                    id="resumoContexto"
                    value={resumoContexto}
                    onChange={(e) => setResumoContexto(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button onClick={handleGerarQuestoes} disabled={gerando} className="w-full bg-blue-600 text-white">
                  {gerando ? "Gerando Questões..." : "Gerar Questões"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Questões do Concurso */}
          <TabsContent value="questoes" className="mt-6">
            {/* Placeholder for Questões do Concurso */}
          </TabsContent>

          {/* Simulados Salvos */}
          <TabsContent value="simulados" className="mt-6">
            {/* Placeholder for Simulados Salvos */}
          </TabsContent>
          <TabsContent value="personalizado" className="mt-6">
            <SeletorQuestoesPersonalizadas questoes={questoesConcurso} titulo="Criar Simulado Personalizado" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
