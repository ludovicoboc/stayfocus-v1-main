"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Save,
  Settings,
  Target,
  Clock,
  Filter,
  Users,
  Shuffle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase";

interface CriarSimuladoModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  subjects: Subject[];
  onSuccess: () => void;
}

interface Subject {
  id: string;
  name: string;
  progress: number;
}

interface Topic {
  id: string;
  name: string;
  subject_id: string;
  completed: boolean;
}

interface Question {
  id: string;
  question_text: string;
  difficulty: string;
  subject_id: string;
  topic_id: string;
  points: number;
  is_active: boolean;
}

export function CriarSimuladoModal({
  isOpen,
  onClose,
  competitionId,
  subjects,
  onSuccess,
}: CriarSimuladoModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    time_limit_minutes: 60,
    difficulty_filter: "",
    subject_filters: [] as string[],
    topic_filters: [] as string[],
    question_count: 10,
    is_public: false,
    randomize_questions: true,
  });

  const [creationMode, setCreationMode] = useState<"auto" | "manual">("auto");

  const generateQuestionSelection = useCallback(() => {
    if (creationMode !== "auto" || questions.length === 0) return;

    let filteredQuestions = questions.filter((q) => q.is_active);

    // Aplicar filtros
    if (formData.difficulty_filter) {
      filteredQuestions = filteredQuestions.filter(
        (q) => q.difficulty === formData.difficulty_filter,
      );
    }

    if (formData.subject_filters.length > 0) {
      filteredQuestions = filteredQuestions.filter((q) =>
        formData.subject_filters.includes(q.subject_id),
      );
    }

    if (formData.topic_filters.length > 0) {
      filteredQuestions = filteredQuestions.filter((q) =>
        formData.topic_filters.includes(q.topic_id),
      );
    }

    // Embaralhar se necessário
    if (formData.randomize_questions) {
      filteredQuestions = [...filteredQuestions].sort(
        () => Math.random() - 0.5,
      );
    }

    // Selecionar quantidade desejada
    const selected = filteredQuestions
      .slice(0, formData.question_count)
      .map((q) => q.id);

    setSelectedQuestions(selected);
  }, [
    creationMode,
    questions,
    formData.difficulty_filter,
    formData.subject_filters,
    formData.topic_filters,
    formData.question_count,
    formData.randomize_questions,
  ]);

  useEffect(() => {
    if (isOpen && competitionId) {
      loadTopicsAndQuestions();
    }
  }, [isOpen, competitionId]);

  useEffect(() => {
    if (creationMode === "auto") {
      generateQuestionSelection();
    }
  }, [creationMode, generateQuestionSelection]);

  const loadTopicsAndQuestions = async () => {
    try {
      // Carregar tópicos
      const { data: topicsData, error: topicsError } = await supabase
        .from("competition_topics")
        .select("*")
        .in(
          "subject_id",
          subjects.map((s) => s.id),
        )
        .order("name");

      if (topicsError) throw topicsError;
      setTopics(topicsData || []);

      // Carregar questões ativas
      const { data: questionsData, error: questionsError } = await supabase
        .from("competition_questions")
        .select(
          "id, question_text, difficulty, subject_id, topic_id, points, is_active",
        )
        .eq("competition_id", competitionId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    }
  };

  const toggleSubjectFilter = (subjectId: string) => {
    const newFilters = formData.subject_filters.includes(subjectId)
      ? formData.subject_filters.filter((id) => id !== subjectId)
      : [...formData.subject_filters, subjectId];

    setFormData({
      ...formData,
      subject_filters: newFilters,
      topic_filters: [], // Reset topic filters when subject changes
    });
  };

  const toggleTopicFilter = (topicId: string) => {
    const newFilters = formData.topic_filters.includes(topicId)
      ? formData.topic_filters.filter((id) => id !== topicId)
      : [...formData.topic_filters, topicId];

    setFormData({
      ...formData,
      topic_filters: newFilters,
    });
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelection = selectedQuestions.includes(questionId)
      ? selectedQuestions.filter((id) => id !== questionId)
      : [...selectedQuestions, questionId];

    setSelectedQuestions(newSelection);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (selectedQuestions.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma questão.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const simulationData = {
        competition_id: competitionId,
        user_id: user?.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        questions: selectedQuestions,
        question_count: selectedQuestions.length,
        time_limit_minutes:
          formData.time_limit_minutes > 0 ? formData.time_limit_minutes : null,
        difficulty_filter: formData.difficulty_filter || null,
        subject_filters: formData.subject_filters,
        topic_filters: formData.topic_filters,
        status: "active",
        is_favorite: false,
        is_public: formData.is_public,
        attempts_count: 0,
      };

      const { error } = await supabase
        .from("competition_simulations")
        .insert([simulationData]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Simulado criado com sucesso!",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Erro ao criar simulado:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o simulado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      time_limit_minutes: 60,
      difficulty_filter: "",
      subject_filters: [],
      topic_filters: [],
      question_count: 10,
      is_public: false,
      randomize_questions: true,
    });
    setSelectedQuestions([]);
    setCreationMode("auto");
  };

  const filteredTopics = topics.filter(
    (topic) =>
      formData.subject_filters.length === 0 ||
      formData.subject_filters.includes(topic.subject_id),
  );

  const availableQuestions = questions.filter((q) => {
    if (!q.is_active) return false;

    if (
      formData.difficulty_filter &&
      q.difficulty !== formData.difficulty_filter
    ) {
      return false;
    }

    if (
      formData.subject_filters.length > 0 &&
      !formData.subject_filters.includes(q.subject_id)
    ) {
      return false;
    }

    if (
      formData.topic_filters.length > 0 &&
      !formData.topic_filters.includes(q.topic_id)
    ) {
      return false;
    }

    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Simulado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Nome do simulado..."
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição do simulado..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      time_limit_minutes: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="is-public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_public: !!checked,
                    })
                  }
                />
                <Label htmlFor="is-public" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Público (outros usuários podem ver)
                </Label>
              </div>
            </div>
          </div>

          {/* Modo de Criação */}
          <div className="space-y-4">
            <Label>Modo de Criação</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={creationMode === "auto" ? "default" : "outline"}
                onClick={() => setCreationMode("auto")}
                className="flex-1"
              >
                <Target className="h-4 w-4 mr-2" />
                Automático (por filtros)
              </Button>
              <Button
                type="button"
                variant={creationMode === "manual" ? "default" : "outline"}
                onClick={() => setCreationMode("manual")}
                className="flex-1"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manual (seleção individual)
              </Button>
            </div>
          </div>

          {/* Filtros (Modo Automático) */}
          {creationMode === "auto" && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5" />
                  <h3 className="font-semibold">
                    Filtros para Seleção Automática
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Quantidade de Questões</Label>
                    <Input
                      type="number"
                      min="1"
                      max={questions.length}
                      value={formData.question_count}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          question_count: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Dificuldade</Label>
                    <select
                      value={formData.difficulty_filter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          difficulty_filter: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Todas</option>
                      <option value="facil">Fácil</option>
                      <option value="medio">Médio</option>
                      <option value="dificil">Difícil</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Matérias</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subjects.map((subject) => (
                      <Badge
                        key={subject.id}
                        variant={
                          formData.subject_filters.includes(subject.id)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleSubjectFilter(subject.id)}
                      >
                        {subject.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {filteredTopics.length > 0 && (
                  <div>
                    <Label>Tópicos</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filteredTopics.map((topic) => (
                        <Badge
                          key={topic.id}
                          variant={
                            formData.topic_filters.includes(topic.id)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => toggleTopicFilter(topic.id)}
                        >
                          {topic.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="randomize"
                    checked={formData.randomize_questions}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        randomize_questions: !!checked,
                      })
                    }
                  />
                  <Label
                    htmlFor="randomize"
                    className="flex items-center gap-2"
                  >
                    <Shuffle className="h-4 w-4" />
                    Embaralhar questões
                  </Label>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>{selectedQuestions.length}</strong> questões
                    selecionadas de <strong>{availableQuestions.length}</strong>{" "}
                    disponíveis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seleção Manual */}
          {creationMode === "manual" && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Selecionar Questões Manualmente
                  </h3>
                  <Badge variant="outline">
                    {selectedQuestions.length} selecionadas
                  </Badge>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {questions
                    .filter((q) => q.is_active)
                    .map((question) => {
                      const subject = subjects.find(
                        (s) => s.id === question.subject_id,
                      );
                      const topic = topics.find(
                        (t) => t.id === question.topic_id,
                      );

                      return (
                        <Card
                          key={question.id}
                          className={`cursor-pointer transition-colors ${
                            selectedQuestions.includes(question.id)
                              ? "border-blue-500 bg-blue-50"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleQuestionSelection(question.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {question.difficulty}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {question.points} pts
                                  </span>
                                  {subject && (
                                    <span className="text-xs text-muted-foreground">
                                      {subject.name}
                                    </span>
                                  )}
                                  {topic && (
                                    <span className="text-xs text-muted-foreground">
                                      • {topic.name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm line-clamp-2">
                                  {question.question_text}
                                </p>
                              </div>
                              <Checkbox
                                checked={selectedQuestions.includes(
                                  question.id,
                                )}
                                onChange={() => {}}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

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
              disabled={loading || selectedQuestions.length === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Simulado
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
