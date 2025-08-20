"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useConcursos } from "@/hooks/use-concursos";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Award, BookOpen, Brain, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import type { Concurso, Questao } from "@/types/concursos";
import { SeletorQuestoesPersonalizadas } from "@/components/seletor-questoes-personalizadas";

export default function ConcursoDetalhesPage() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    initialized,
  } = useAuth();
  const {
    fetchConcursoCompleto,
    atualizarTopicoCompletado,
    buscarQuestoesConcurso,
    fetchConcursos,
    concursos,
  } = useConcursos();

  const [concurso, setConcurso] = useState<Concurso | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("conteudo");
  const [questoesConcurso, setQuestoesConcurso] = useState<Questao[]>([]);
  const [concursosDisponiveis, setConcursosDisponiveis] = useState<Concurso[]>(
    [],
  );

  // Form states for question generation
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("medio");
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("");
  const [topicoSelecionado, setTopicoSelecionado] = useState("");

  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // Helper function for date formatting
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Não informado";
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      });
    } catch {
      return "Data inválida";
    }
  };

  // Load main competition data
  const loadConcurso = async () => {
    if (!id) {
      console.warn("⚠️ ID do concurso não fornecido");
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      console.warn("⚠️ Usuário não autenticado - aguardando autenticação...");
      return;
    }

    try {
      console.log("📊 Iniciando busca de dados do concurso...", {
        concursoId: id,
        userId: user?.id,
        isAuthenticated,
      });

      setLoading(true);
      const data = await fetchConcursoCompleto(id);

      if (!data) {
        console.warn("⚠️ Concurso não encontrado ou não acessível");
        setConcurso(null);

        // Buscar concursos disponíveis para sugerir
        console.log("🔍 Buscando concursos alternativos...");
        await loadConcursosDisponiveis();
        return;
      }

      console.log("✅ Concurso carregado com sucesso:", {
        id: data.id,
        title: data.title,
        disciplinasCount: data.disciplinas?.length || 0,
      });

      setConcurso(data);

      // Preselect first discipline if available
      if (
        data.disciplinas &&
        data.disciplinas.length > 0 &&
        data.disciplinas[0].id
      ) {
        console.log(
          "🎯 Selecionando primeira disciplina:",
          data.disciplinas[0].name,
        );
        setDisciplinaSelecionada(data.disciplinas[0].id);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar concurso:", error);
      setConcurso(null);
      await loadConcursosDisponiveis();
    } finally {
      setLoading(false);
    }
  };

  // Load available competitions for suggestions
  const loadConcursosDisponiveis = async () => {
    try {
      console.log("🔍 Carregando concursos disponíveis para sugestão...");
      await fetchConcursos();
      setConcursosDisponiveis(concursos.slice(0, 3)); // Show only first 3
    } catch (error) {
      console.error("❌ Erro ao carregar concursos disponíveis:", error);
    }
  };

  // Load competition questions
  const loadQuestoes = async () => {
    if (!id) {
      console.warn("⚠️ ID do concurso não fornecido para carregar questões");
      return;
    }

    if (!isAuthenticated) {
      console.warn(
        "⚠️ Usuário não autenticado - não é possível carregar questões",
      );
      return;
    }

    try {
      console.log("📝 Iniciando carregamento de questões do concurso...", {
        concursoId: id,
        userId: user?.id,
      });

      const questoes = await buscarQuestoesConcurso(id);
      console.log(`✅ ${questoes.length} questões carregadas com sucesso`);
      setQuestoesConcurso(questoes);
    } catch (error) {
      console.error("❌ Erro ao carregar questões:", error);
      setQuestoesConcurso([]);
    }
  };

  // Effects
  useEffect(() => {
    console.log("🔄 Effect triggered - Auth state:", {
      user: !!user,
      userId: user?.id,
      isAuthenticated,
      initialized,
      authLoading,
      concursoId: id,
    });

    // Aguardar a inicialização da autenticação
    if (!initialized || authLoading) {
      console.log("⏳ Aguardando inicialização da autenticação...");
      return;
    }

    if (!isAuthenticated) {
      console.warn("❌ Usuário não autenticado - redirecionamento necessário");
      setLoading(false);
      return;
    }

    if (id && isAuthenticated) {
      console.log("✅ Iniciando carregamento do concurso...");
      loadConcurso();
    }
  }, [user, id, isAuthenticated, initialized, authLoading]);

  useEffect(() => {
    // Carregar questões após o concurso ser carregado
    if (concurso && isAuthenticated && id) {
      console.log(
        "📝 Concurso carregado, iniciando carregamento de questões...",
      );
      loadQuestoes();
    }
  }, [concurso, isAuthenticated, id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!concurso && !loading && user) {
        router.push("/concursos");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [concurso, loading, user, router]);

  // Handle topic completion toggle
  const handleTopicoToggle = async (topicoId: string, completed: boolean) => {
    if (!concurso) return;

    const success = await atualizarTopicoCompletado(topicoId, completed);
    if (success) {
      // Update local state
      const updatedDisciplinas = concurso.disciplinas?.map((disciplina) => {
        const updatedTopicos = disciplina.topicos?.map((topico) => {
          if (topico.id === topicoId) {
            return { ...topico, completed };
          }
          return topico;
        });
        return { ...disciplina, topicos: updatedTopicos };
      });

      setConcurso({
        ...concurso,
        disciplinas: updatedDisciplinas,
      });
    }
  };

  // Form handlers
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Loading state - aguardando autenticação ou carregamento do concurso
  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">
          {authLoading
            ? "Verificando autenticação..."
            : "Carregando concurso..."}
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg mb-4">
            Você precisa estar logado para acessar esta página.
          </div>
          <Link href="/auth">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Competition not found
  if (!concurso && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <div className="text-white text-2xl font-bold mb-4">
              🔍 Concurso não encontrado
            </div>
            <div className="text-slate-400 text-base mb-4">
              O concurso que você está procurando não existe ou não pertence à
              sua conta.
            </div>
            <div className="text-slate-500 text-sm mb-8">
              ID:{" "}
              <code className="bg-slate-800 px-2 py-1 rounded text-slate-300">
                {id}
              </code>
            </div>

            <div className="space-y-4">
              <div className="text-slate-400 text-sm">Possíveis causas:</div>
              <ul className="text-slate-500 text-sm space-y-2 mb-8">
                <li>• O concurso foi deletado</li>
                <li>• O link está incorreto ou expirado</li>
                <li>• Você não tem permissão para acessar este concurso</li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/concursos">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    📋 Ver Meus Concursos
                  </Button>
                </Link>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  🔄 Tentar Novamente
                </Button>
              </div>

              {concursosDisponiveis.length > 0 && (
                <div className="mt-8 p-6 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="text-white text-lg font-semibold mb-4">
                    📋 Seus concursos recentes:
                  </h3>
                  <div className="space-y-2">
                    {concursosDisponiveis.map((concursoItem) => (
                      <Link
                        key={concursoItem.id}
                        href={`/concursos/${concursoItem.id}`}
                        className="block p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-white font-medium">
                              {concursoItem.title}
                            </div>
                            <div className="text-slate-400 text-sm">
                              {concursoItem.organizer}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-slate-500 text-xs mt-8">
                Será redirecionado automaticamente em alguns segundos...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overall progress
  const totalTopicos =
    concurso?.disciplinas?.reduce(
      (acc, disciplina) => acc + (disciplina.topicos?.length || 0),
      0,
    ) || 0;

  const completedTopicos =
    concurso?.disciplinas?.reduce(
      (acc, disciplina) =>
        acc +
        (disciplina.topicos?.filter((topico) => topico.completed).length || 0),
      0,
    ) || 0;

  const overallProgress =
    totalTopicos > 0 ? Math.round((completedTopicos / totalTopicos) * 100) : 0;

  // Get disciplines for the form
  const disciplinas = concurso?.disciplinas || [];
  const topicos =
    disciplinas.find((d) => d.id === disciplinaSelecionada)?.topicos || [];

  // Loading state while authentication is being verified
  if (!initialized || authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-300">🔐 Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect will be handled by middleware
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">❌ Usuário não autenticado</p>
          <p className="text-slate-300">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  // Loading competition data
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="container mx-auto p-6">
          <Link
            href="/concursos"
            className="inline-flex items-center text-slate-400 hover:text-white mb-4"
          >
            ← Voltar para Concursos
          </Link>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-slate-300">
                  📊 Carregando dados do concurso...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Competition not found
  if (!concurso && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="container mx-auto p-6">
          <Link
            href="/concursos"
            className="inline-flex items-center text-slate-400 hover:text-white mb-4"
          >
            ← Voltar para Concursos
          </Link>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-red-400 mb-4">
                ⚠️ Concurso não encontrado
              </h1>
              <p className="text-slate-300 mb-6">
                O concurso solicitado não foi encontrado ou você não tem acesso
                a ele.
              </p>
              {concursosDisponiveis.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Concursos disponíveis:
                  </h2>
                  <div className="space-y-2">
                    {concursosDisponiveis.map((c) => (
                      <Link
                        key={c.id}
                        href={`/concursos/${c.id}`}
                        className="block bg-slate-700 hover:bg-slate-600 p-3 rounded-lg transition-colors"
                      >
                        <div className="font-medium text-white">{c.title}</div>
                        <div className="text-sm text-slate-400">
                          {c.organizer}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto p-6">
        <Link
          href="/concursos"
          className="inline-flex items-center text-slate-400 hover:text-white mb-4"
        >
          ← Voltar para Concursos
        </Link>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {concurso?.title}
              </h1>
              <p className="text-slate-300">
                Organizadora: {concurso?.organizer}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">Progresso Geral</div>
              <div className="text-2xl font-bold text-blue-400">
                {overallProgress}%
              </div>
              <div className="w-32 bg-slate-700 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {disciplinas.length}
              </div>
              <div className="text-sm text-slate-400">Disciplinas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {totalTopicos}
              </div>
              <div className="text-sm text-slate-400">Tópicos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {completedTopicos}
              </div>
              <div className="text-sm text-slate-400">Concluídos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {questoesConcurso.length}
              </div>
              <div className="text-sm text-slate-400">Questões</div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-700">
            <Link href={`/concursos/${id}/questoes`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Brain className="w-4 h-4 mr-2" />
                Ver Questões
              </Button>
            </Link>
            <Link href={`/concursos/${id}/simulados`}>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Award className="w-4 h-4 mr-2" />
                Simulados
              </Button>
            </Link>
          </div>

          {/* Informações das datas */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-slate-300">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  Inscrição: {formatDate(concurso?.registration_date)}
                </span>
              </div>
              <div className="flex items-center text-slate-300">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  Prova: {formatDate(concurso?.exam_date)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  concurso?.status === "planejado"
                    ? "bg-yellow-900 text-yellow-300"
                    : concurso?.status === "inscrito"
                      ? "bg-blue-900 text-blue-300"
                      : concurso?.status === "estudando"
                        ? "bg-green-900 text-green-300"
                        : "bg-purple-900 text-purple-300"
                }`}
              >
                {concurso?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger
              value="conteudo"
              className="flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger
              value="questoes"
              className="flex items-center space-x-2"
            >
              <Brain className="w-4 h-4" />
              <span>Questões</span>
            </TabsTrigger>
            <TabsTrigger
              value="personalizado"
              className="flex items-center space-x-2"
            >
              <Award className="w-4 h-4" />
              <span>Simulado Personalizado</span>
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo - Disciplinas e Tópicos */}
          <TabsContent value="conteudo" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Disciplinas */}
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  📚 Disciplinas
                </h2>
                {disciplinas.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-2">
                    {disciplinas.map((disciplina) => {
                      const completedCount =
                        disciplina.topicos?.filter((t) => t.completed).length ||
                        0;
                      const totalCount = disciplina.topicos?.length || 0;
                      const progress =
                        totalCount > 0
                          ? Math.round((completedCount / totalCount) * 100)
                          : 0;

                      return (
                        <AccordionItem
                          key={disciplina.id || disciplina.name}
                          value={disciplina.id || disciplina.name}
                          className="border border-slate-700 rounded-lg"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                              <div className="text-left">
                                <div className="font-medium text-white">
                                  {disciplina.name}
                                </div>
                                <div className="text-sm text-slate-400">
                                  {completedCount}/{totalCount} tópicos
                                  concluídos
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-blue-400">
                                  {progress}%
                                </div>
                                <div className="w-16 bg-slate-700 rounded-full h-1 mt-1">
                                  <div
                                    className="bg-blue-600 h-1 rounded-full"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {disciplina.topicos &&
                            disciplina.topicos.length > 0 ? (
                              <div className="space-y-3">
                                {disciplina.topicos.map((topico) => (
                                  <div
                                    key={topico.id}
                                    className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <Checkbox
                                        checked={topico.completed}
                                        onCheckedChange={(checked) =>
                                          topico.id &&
                                          handleTopicoToggle(
                                            topico.id,
                                            checked as boolean,
                                          )
                                        }
                                        className="border-slate-500"
                                      />
                                      <span
                                        className={`text-sm ${
                                          topico.completed
                                            ? "text-green-400 line-through"
                                            : "text-slate-300"
                                        }`}
                                      >
                                        {topico.name}
                                      </span>
                                    </div>
                                    {topico.completed && (
                                      <span className="text-green-400 text-xs">
                                        ✓ Concluído
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 text-sm">
                                Nenhum tópico cadastrado para esta disciplina.
                              </p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <p className="text-slate-400 text-center py-8">
                    Nenhuma disciplina cadastrada para este concurso.
                  </p>
                )}
              </div>

              {/* Estatísticas de Progresso */}
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  📊 Estatísticas de Progresso
                </h2>
                <div className="space-y-4">
                  {disciplinas.map((disciplina) => {
                    const completedCount =
                      disciplina.topicos?.filter((t) => t.completed).length ||
                      0;
                    const totalCount = disciplina.topicos?.length || 0;
                    const progress =
                      totalCount > 0
                        ? Math.round((completedCount / totalCount) * 100)
                        : 0;

                    return (
                      <div key={disciplina.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">
                            {disciplina.name}
                          </span>
                          <span className="text-blue-400">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {completedCount} de {totalCount} tópicos concluídos
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Questões do Concurso */}
          <TabsContent value="questoes" className="mt-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Questões do Concurso
              </h2>
              {questoesConcurso.length > 0 ? (
                <div className="space-y-4">
                  {questoesConcurso.map((questao, index) => (
                    <div
                      key={questao.id || index}
                      className="bg-slate-700 p-4 rounded-lg"
                    >
                      <h3 className="text-white font-medium mb-2">
                        Questão {index + 1}
                      </h3>
                      <p className="text-slate-300 text-sm">
                        {questao.question_text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">
                  Nenhuma questão encontrada para este concurso.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Simulado Personalizado */}
          <TabsContent value="personalizado" className="mt-6">
            <SeletorQuestoesPersonalizadas
              questoes={questoesConcurso}
              titulo="Criar Simulado Personalizado"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
