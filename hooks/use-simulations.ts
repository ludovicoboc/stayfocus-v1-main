"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export interface Simulation {
  id: string;
  competition_id: string;
  user_id: string;
  title: string;
  description: string | null;
  questions: string[];
  question_count: number;
  time_limit_minutes: number | null;
  difficulty_filter: string | null;
  subject_filters: string[];
  topic_filters: string[];
  results: any | null;
  status: "draft" | "active" | "completed" | "archived";
  is_favorite: boolean;
  is_public: boolean;
  attempts_count: number;
  best_score: number | null;
  avg_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSimulationData {
  competition_id: string;
  title: string;
  description?: string | null;
  questions: string[];
  time_limit_minutes?: number | null;
  difficulty_filter?: string | null;
  subject_filters?: string[];
  topic_filters?: string[];
  is_public?: boolean;
  status?: "draft" | "active";
}

export interface UpdateSimulationData
  extends Partial<Omit<CreateSimulationData, "status">> {
  id: string;
  is_favorite?: boolean;
  status?: "draft" | "active" | "completed" | "archived";
}

export interface SimulationFilters {
  search?: string;
  status?: "draft" | "active" | "completed" | "archived" | "";
  difficulty_filter?: "facil" | "medio" | "dificil" | "";
  is_favorite?: boolean;
  is_public?: boolean;
  subject_filters?: string[];
}

export interface SimulationResults {
  score: number;
  correct_answers: number;
  total_questions: number;
  time_spent: number;
  answers: Array<{
    question_id: string;
    user_answer: any;
    is_correct: boolean;
    time_spent: number;
  }>;
  completed_at: string;
}

export interface SimulationsStats {
  total: number;
  favorites: number;
  active: number;
  drafts: number;
  completed: number;
  archived: number;
  total_attempts: number;
  avg_score: number | null;
  by_difficulty: {
    facil: number;
    medio: number;
    dificil: number;
  };
  recent: Simulation[];
  popular: Simulation[];
}

export function useSimulations(competitionId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSimulations = useCallback(
    async (filters?: SimulationFilters) => {
      if (!user || !competitionId) return;

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from("competition_simulations")
          .select("*")
          .eq("competition_id", competitionId)
          .eq("user_id", user.id);

        // Aplicar filtros
        if (filters?.status) {
          query = query.eq("status", filters.status);
        }

        if (filters?.difficulty_filter) {
          query = query.eq("difficulty_filter", filters.difficulty_filter);
        }

        if (filters?.is_favorite !== undefined) {
          query = query.eq("is_favorite", filters.is_favorite);
        }

        if (filters?.is_public !== undefined) {
          query = query.eq("is_public", filters.is_public);
        }

        // Busca por texto
        if (filters?.search) {
          query = query.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
          );
        }

        // Busca por matérias
        if (filters?.subject_filters && filters.subject_filters.length > 0) {
          query = query.overlaps("subject_filters", filters.subject_filters);
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) throw error;

        setSimulations(data || []);
      } catch (err) {
        console.error("Erro ao carregar simulados:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        toast({
          title: "Erro",
          description: "Não foi possível carregar os simulados.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [user, competitionId, toast],
  );

  const createSimulation = useCallback(
    async (data: CreateSimulationData): Promise<Simulation | null> => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const { data: newSimulation, error } = await supabase
          .from("competition_simulations")
          .insert([
            {
              ...data,
              user_id: user.id,
              question_count: data.questions.length,
              status: data.status ?? "active",
              is_favorite: false,
              is_public: data.is_public ?? false,
              attempts_count: 0,
              best_score: null,
              avg_score: null,
              subject_filters: data.subject_filters ?? [],
              topic_filters: data.topic_filters ?? [],
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Recarregar a lista de simulados
        await loadSimulations();

        toast({
          title: "Sucesso",
          description: "Simulado criado com sucesso!",
        });

        return newSimulation;
      } catch (err) {
        console.error("Erro ao criar simulado:", err);
        toast({
          title: "Erro",
          description: "Não foi possível criar o simulado.",
          variant: "destructive",
        });
        throw err;
      }
    },
    [user, loadSimulations, toast],
  );

  const updateSimulation = useCallback(
    async (data: UpdateSimulationData): Promise<Simulation | null> => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const { id, ...updateData } = data;

        const { data: updatedSimulation, error } = await supabase
          .from("competition_simulations")
          .update(updateData)
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        // Atualizar a lista local
        setSimulations((prev) =>
          prev.map((s) => (s.id === id ? updatedSimulation : s)),
        );

        toast({
          title: "Sucesso",
          description: "Simulado atualizado com sucesso!",
        });

        return updatedSimulation;
      } catch (err) {
        console.error("Erro ao atualizar simulado:", err);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o simulado.",
          variant: "destructive",
        });
        throw err;
      }
    },
    [user, toast],
  );

  const deleteSimulation = useCallback(
    async (simulationId: string): Promise<boolean> => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const { error } = await supabase
          .from("competition_simulations")
          .delete()
          .eq("id", simulationId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Remover da lista local
        setSimulations((prev) => prev.filter((s) => s.id !== simulationId));

        toast({
          title: "Sucesso",
          description: "Simulado excluído com sucesso!",
        });

        return true;
      } catch (err) {
        console.error("Erro ao excluir simulado:", err);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o simulado.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast],
  );

  const toggleFavorite = useCallback(
    async (simulationId: string, isFavorite: boolean): Promise<boolean> => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const { error } = await supabase
          .from("competition_simulations")
          .update({ is_favorite: !isFavorite })
          .eq("id", simulationId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Atualizar a lista local
        setSimulations((prev) =>
          prev.map((s) =>
            s.id === simulationId ? { ...s, is_favorite: !isFavorite } : s,
          ),
        );

        toast({
          title: "Sucesso",
          description: `Simulado ${!isFavorite ? "adicionado aos" : "removido dos"} favoritos!`,
        });

        return true;
      } catch (err) {
        console.error("Erro ao alterar favorito:", err);
        toast({
          title: "Erro",
          description: "Não foi possível alterar o status de favorito.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast],
  );

  const saveSimulationResults = useCallback(
    async (
      simulationId: string,
      results: SimulationResults,
    ): Promise<boolean> => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        // Buscar simulado atual para calcular estatísticas
        const { data: currentSimulation, error: fetchError } = await supabase
          .from("competition_simulations")
          .select("results, attempts_count, best_score, avg_score")
          .eq("id", simulationId)
          .eq("user_id", user.id)
          .single();

        if (fetchError) throw fetchError;

        // Calcular novas estatísticas
        const newAttemptsCount = currentSimulation.attempts_count + 1;
        const newBestScore = Math.max(
          currentSimulation.best_score || 0,
          results.score,
        );

        // Calcular média de pontuação
        const currentAvg = currentSimulation.avg_score || 0;
        const newAvgScore =
          currentSimulation.attempts_count === 0
            ? results.score
            : (currentAvg * currentSimulation.attempts_count + results.score) /
              newAttemptsCount;

        // Atualizar resultados do simulado
        const allResults = currentSimulation.results || [];
        allResults.push(results);

        const { error } = await supabase
          .from("competition_simulations")
          .update({
            results: allResults,
            attempts_count: newAttemptsCount,
            best_score: newBestScore,
            avg_score: Math.round(newAvgScore * 100) / 100,
            status: "completed",
          })
          .eq("id", simulationId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Incrementar contador de uso das questões
        if (results.answers) {
          const questionIds = results.answers.map((a) => a.question_id);

          // Note: This would ideally be done in a database function for atomicity
          for (const questionId of questionIds) {
            await supabase.rpc("increment_question_usage", {
              question_id: questionId,
            });
          }
        }

        // Atualizar lista local
        setSimulations((prev) =>
          prev.map((s) =>
            s.id === simulationId
              ? {
                  ...s,
                  attempts_count: newAttemptsCount,
                  best_score: newBestScore,
                  avg_score: newAvgScore,
                  status: "completed" as const,
                }
              : s,
          ),
        );

        toast({
          title: "Sucesso",
          description: "Resultado do simulado salvo com sucesso!",
        });

        return true;
      } catch (err) {
        console.error("Erro ao salvar resultado:", err);
        toast({
          title: "Erro",
          description: "Não foi possível salvar o resultado do simulado.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast],
  );

  const getSimulationById = useCallback(
    async (simulationId: string): Promise<Simulation | null> => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from("competition_simulations")
          .select("*")
          .eq("id", simulationId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        return data;
      } catch (err) {
        console.error("Erro ao buscar simulado:", err);
        return null;
      }
    },
    [user],
  );

  const getSimulationsStats = useCallback((): SimulationsStats => {
    const total = simulations.length;
    const favorites = simulations.filter((s) => s.is_favorite).length;
    const active = simulations.filter((s) => s.status === "active").length;
    const drafts = simulations.filter((s) => s.status === "draft").length;
    const completed = simulations.filter(
      (s) => s.status === "completed",
    ).length;
    const archived = simulations.filter((s) => s.status === "archived").length;

    const total_attempts = simulations.reduce(
      (sum, s) => sum + s.attempts_count,
      0,
    );

    const scoresSum = simulations
      .filter((s) => s.avg_score !== null)
      .reduce((sum, s) => sum + (s.avg_score || 0), 0);
    const simulationsWithScores = simulations.filter(
      (s) => s.avg_score !== null,
    ).length;
    const avg_score =
      simulationsWithScores > 0 ? scoresSum / simulationsWithScores : null;

    const by_difficulty = {
      facil: simulations.filter((s) => s.difficulty_filter === "facil").length,
      medio: simulations.filter((s) => s.difficulty_filter === "medio").length,
      dificil: simulations.filter((s) => s.difficulty_filter === "dificil")
        .length,
    };

    const recent = [...simulations]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 5);

    const popular = [...simulations]
      .sort((a, b) => b.attempts_count - a.attempts_count)
      .slice(0, 5);

    return {
      total,
      favorites,
      active,
      drafts,
      completed,
      archived,
      total_attempts,
      avg_score: avg_score ? Math.round(avg_score * 100) / 100 : null,
      by_difficulty,
      recent,
      popular,
    };
  }, [simulations]);

  const importSimulationsFromJson = useCallback(
    async (simulationsData: any[]): Promise<boolean> => {
      if (!user || !competitionId) {
        throw new Error("Usuário não autenticado ou concurso não especificado");
      }

      try {
        const { error } = await supabase.from("competition_simulations").insert(
          simulationsData.map((s) => ({
            ...s,
            competition_id: competitionId,
            user_id: user.id,
            question_count: s.questions?.length || 0,
            status: s.status || "active",
            is_favorite: s.is_favorite || false,
            is_public: s.is_public || false,
            attempts_count: s.attempts_count || 0,
            subject_filters: s.subject_filters || [],
            topic_filters: s.topic_filters || [],
          })),
        );

        if (error) throw error;

        // Recarregar simulados
        await loadSimulations();

        toast({
          title: "Sucesso",
          description: `${simulationsData.length} simulados importados com sucesso!`,
        });

        return true;
      } catch (err) {
        console.error("Erro ao importar simulados:", err);
        toast({
          title: "Erro",
          description: "Não foi possível importar os simulados.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, competitionId, loadSimulations, toast],
  );

  // Carregar simulados automaticamente quando o componente monta
  useEffect(() => {
    if (competitionId) {
      loadSimulations();
    }
  }, [competitionId, loadSimulations]);

  return {
    simulations,
    loading,
    error,
    loadSimulations,
    createSimulation,
    updateSimulation,
    deleteSimulation,
    toggleFavorite,
    saveSimulationResults,
    getSimulationById,
    getSimulationsStats,
    importSimulationsFromJson,
    // Computed values
    stats: getSimulationsStats(),
    // Helper filters
    favoriteSimulations: simulations.filter((s) => s.is_favorite),
    activeSimulations: simulations.filter((s) => s.status === "active"),
    draftSimulations: simulations.filter((s) => s.status === "draft"),
    completedSimulations: simulations.filter((s) => s.status === "completed"),
    archivedSimulations: simulations.filter((s) => s.status === "archived"),
  };
}
