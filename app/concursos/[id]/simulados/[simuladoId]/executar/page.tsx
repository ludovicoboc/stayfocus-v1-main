"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question_text: string;
  options: { text: string; isCorrect: boolean }[];
  correct_answer: string;
  difficulty: string;
  points: number;
}

interface Simulation {
  id: string;
  title: string;
  description: string;
  question_count: number;
  time_limit_minutes: number | null;
  questions: string[];
}

interface SimulationAttempt {
  answers: Record<string, string>;
  startTime: number;
  currentQuestion: number;
}

export default function ExecutarSimuladoPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  const competitionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const simuladoId = Array.isArray(params.simuladoId)
    ? params.simuladoId[0]
    : params.simuladoId;

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<SimulationAttempt>({
    answers: {},
    startTime: Date.now(),
    currentQuestion: 0,
  });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load simulation and questions
  useEffect(() => {
    if (!isAuthenticated || !simuladoId) return;

    loadSimulation();
  }, [isAuthenticated, simuladoId]);

  // Timer effect
  useEffect(() => {
    if (!simulation?.time_limit_minutes) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - attempt.startTime;
      const totalTime = (simulation.time_limit_minutes || 0) * 60 * 1000;
      const remaining = totalTime - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        handleSubmit();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [simulation, attempt.startTime]);

  const loadSimulation = async () => {
    try {
      setLoading(true);

      // Load simulation
      const { data: simData, error: simError } = await supabase
        .from("competition_simulations")
        .select("*")
        .eq("id", simuladoId)
        .eq("user_id", user?.id)
        .single();

      if (simError) throw simError;
      if (!simData) throw new Error("Simulado não encontrado");

      setSimulation(simData);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("competition_questions")
        .select("*")
        .in("id", simData.questions);

      if (questionsError) throw questionsError;

      setQuestions(questionsData || []);

      // Initialize timer
      if (simData.time_limit_minutes) {
        setTimeLeft(simData.time_limit_minutes * 60 * 1000);
      }
    } catch (error) {
      console.error("Erro ao carregar simulado:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o simulado",
        variant: "destructive",
      });
      router.push(`/concursos/${competitionId}/simulados`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAttempt((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer,
      },
    }));
  };

  const nextQuestion = () => {
    if (attempt.currentQuestion < questions.length - 1) {
      setAttempt((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
      }));
    }
  };

  const prevQuestion = () => {
    if (attempt.currentQuestion > 0) {
      setAttempt((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1,
      }));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Calculate score
      let score = 0;
      questions.forEach((question) => {
        if (attempt.answers[question.id] === question.correct_answer) {
          score += question.points || 1;
        }
      });

      const totalQuestions = questions.length;
      const percentage =
        totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
      const timeTaken = Math.round((Date.now() - attempt.startTime) / 60000); // minutes

      // Save to history
      const { error: historyError } = await supabase
        .from("simulation_history")
        .insert({
          user_id: user?.id,
          simulation_id: simuladoId,
          score,
          total_questions: totalQuestions,
          percentage,
          time_taken_minutes: timeTaken,
          answers: attempt.answers,
          completed_at: new Date().toISOString(),
        });

      if (historyError) throw historyError;

      // Update simulation stats
      const { error: updateError } = await supabase.rpc(
        "update_simulation_stats",
        {
          simulation_id: simuladoId,
          new_score: score,
          new_percentage: percentage,
        },
      );

      if (updateError)
        console.warn("Erro ao atualizar estatísticas:", updateError);

      toast({
        title: "Simulado Concluído!",
        description: `Você acertou ${score} de ${totalQuestions} questões (${percentage.toFixed(1)}%)`,
      });

      router.push(`/concursos/${competitionId}/simulados`);
    } catch (error) {
      console.error("Erro ao submeter simulado:", error);
      toast({
        title: "Erro",
        description: "Erro ao submeter simulado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Carregando simulado...</p>
        </div>
      </div>
    );
  }

  if (!simulation || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Simulado não encontrado</h1>
          <Button
            onClick={() => router.push(`/concursos/${competitionId}/simulados`)}
          >
            Voltar aos Simulados
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[attempt.currentQuestion];
  const progress = ((attempt.currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(attempt.answers).length;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{simulation.title}</h1>
              <p className="text-slate-400">
                Questão {attempt.currentQuestion + 1} de {questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {timeLeft !== null && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span
                    className={
                      timeLeft < 300000 ? "text-red-400" : "text-white"
                    }
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              <Badge variant="outline">
                {answeredCount}/{questions.length} respondidas
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </div>

        {/* Question */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">
              {currentQuestion.question_text}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{currentQuestion.difficulty}</Badge>
              <Badge variant="outline">
                {currentQuestion.points || 1} ponto(s)
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected =
                  attempt.answers[currentQuestion.id] === option.text;

                return (
                  <button
                    key={index}
                    onClick={() =>
                      handleAnswer(currentQuestion.id, option.text)
                    }
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-900/20 text-blue-200"
                        : "border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm ${
                          isSelected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-slate-400"
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          optionLetter
                        )}
                      </div>
                      <span>{option.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={attempt.currentQuestion === 0}
            className="border-slate-600"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" className="border-slate-600">
              <Save className="w-4 h-4 mr-2" />
              Salvar Progresso
            </Button>

            {attempt.currentQuestion === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Enviando..." : "Finalizar"}
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                Próxima
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
