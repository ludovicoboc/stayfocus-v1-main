"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Trophy, 
  Target,
  TrendingUp,
  Calendar,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SimulationHistory {
  id: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_minutes: number;
  completed_at: string;
  answers: Record<string, string>;
}

interface Simulation {
  id: string;
  title: string;
  description: string;
  attempts_count: number;
  best_score: number | null;
  avg_score: number | null;
}

export default function HistoricoSimuladoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  
  const competitionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const simuladoId = Array.isArray(params.simuladoId) ? params.simuladoId[0] : params.simuladoId;

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [history, setHistory] = useState<SimulationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !simuladoId) return;
    
    loadData();
  }, [user, simuladoId]);

  const loadData = async () => {
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
      setSimulation(simData);

      // Load history
      const { data: historyData, error: historyError } = await supabase
        .from("simulation_history")
        .select("*")
        .eq("simulation_id", simuladoId)
        .eq("user_id", user?.id)
        .order("completed_at", { ascending: false });

      if (historyError) throw historyError;
      setHistory(historyData || []);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Carregando histórico...</p>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">Simulado não encontrado</h1>
          <Button onClick={() => router.push(`/concursos/${competitionId}/simulados`)}>
            Voltar aos Simulados
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/concursos/${competitionId}/simulados`)}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{simulation.title}</h1>
            <p className="text-slate-400">Histórico de Tentativas</p>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total de Tentativas</p>
                  <p className="text-2xl font-bold">{simulation.attempts_count}</p>
                </div>
                <Target className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Melhor Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(simulation.best_score || 0)}`}>
                    {simulation.best_score?.toFixed(1) || 0}%
                  </p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Média</p>
                  <p className={`text-2xl font-bold ${getScoreColor(simulation.avg_score || 0)}`}>
                    {simulation.avg_score?.toFixed(1) || 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Última Tentativa</p>
                  <p className="text-sm">
                    {history.length > 0 
                      ? format(new Date(history[0].completed_at), "dd/MM", { locale: ptBR })
                      : "Nenhuma"
                    }
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Histórico Detalhado</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma tentativa realizada ainda</p>
                <p className="text-sm">Faça sua primeira tentativa para ver o histórico aqui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((attempt, index) => (
                  <div
                    key={attempt.id}
                    className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm text-slate-400">Tentativa</div>
                          <div className="text-lg font-bold">#{history.length - index}</div>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant={getScoreBadgeVariant(attempt.percentage)}>
                              {attempt.percentage.toFixed(1)}%
                            </Badge>
                            <span className="text-sm text-slate-400">
                              {attempt.score}/{attempt.total_questions} acertos
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{attempt.time_taken_minutes} min</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(new Date(attempt.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {index === 0 && (
                          <Badge variant="outline" className="mb-2">
                            Mais Recente
                          </Badge>
                        )}
                        {attempt.percentage === simulation.best_score && (
                          <Badge variant="default">
                            Melhor Score
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center mt-6">
          <Button 
            onClick={() => router.push(`/concursos/${competitionId}/simulados/${simuladoId}/executar`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Nova Tentativa
          </Button>
        </div>
      </div>
    </div>
  );
}