"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export interface Question {
  id: string;
  competition_id: string;
  subject_id: string | null;
  topic_id: string | null;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "essay" | "fill_blank";
  options: any[];
  correct_answer: string | null;
  correct_options: number[];
  explanation: string | null;
  difficulty: "facil" | "medio" | "dificil";
  points: number;
  time_limit_seconds: number | null;
  tags: string[];
  source: string | null;
  year: number | null;
  is_ai_generated: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionData {
  competition_id: string;
  subject_id?: string | null;
  topic_id?: string | null;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "essay" | "fill_blank";
  options?: any[];
  correct_answer?: string | null;
  correct_options?: number[];
  explanation?: string | null;
  difficulty: "facil" | "medio" | "dificil";
  points?: number;
  time_limit_seconds?: number | null;
  tags?: string[];
  source?: string | null;
  year?: number | null;
  is_ai_generated?: boolean;
  is_active?: boolean;
}

export interface UpdateQuestionData extends Partial<CreateQuestionData> {
  id: string;
}

export interface QuestionFilters {
  search?: string;
  difficulty?: "facil" | "medio" | "dificil" | "";
  subject_id?: string;
  topic_id?: string;
  question_type?:
    | "multiple_choice"
    | "true_false"
    | "essay"
    | "fill_blank"
    | "";
  is_active?: boolean;
  tags?: string[];
}

export interface QuestionsStats {
  total: number;
  active: number;
  inactive: number;
  by_difficulty: {
    facil: number;
    medio: number;
    dificil: number;
  };
  by_type: {
    multiple_choice: number;
    true_false: number;
    essay: number;
    fill_blank: number;
  };
  most_used: Question[];
  recent: Question[];
}

export function useQuestions(competitionId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(
    async (filters?: QuestionFilters) => {
      if (!user || !competitionId) return;

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from("competition_questions")
          .select(
            `
          *,
          competition_subjects!left(id, name),
          competition_topics!left(id, name)
        `,
          )
          .eq("competition_id", competitionId);

        // Aplicar filtros
        if (filters?.difficulty) {
          query = query.eq("difficulty", filters.difficulty);
        }

        if (filters?.subject_id) {
          query = query.eq("subject_id", filters.subject_id);
        }

        if (filters?.topic_id) {
          query = query.eq("topic_id", filters.topic_id);
        }

        if (filters?.question_type) {
          query = query.eq("question_type", filters.question_type);
        }

        if (filters?.is_active !== undefined) {
          query = query.eq("is_active", filters.is_active);
        }

        // Busca por texto
        if (filters?.search) {
          query = query.or(
            `question_text.ilike.%${filters.search}%,tags.cs.{${filters.search}}`,
          );
        }

        // Busca por tags
        if (filters?.tags && filters.tags.length > 0) {
          query = query.overlaps("tags", filters.tags);
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) throw error;

        setQuestions(data || []);
      } catch (err) {
        console.error("Erro ao carregar questões:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        toast({
          title: "Erro",
          description: "Não foi possível carregar as questões.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [user, competitionId, toast],
  );

  const createQuestion = useCallback(
    async (data: CreateQuestionData): Promise<Question | null> => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const { data: newQuestion, error } = await supabase
          .from("competition_questions")
          .insert([
            {
              ...data,
              is_ai_generated: data.is_ai_generated ?? false,
              is_active: data.is_active ?? true,
              usage_count: 0,
              points: data.points ?? 1,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Recarregar a lista de questões
        await loadQuestions();

        toast({
          title: "Sucesso",
          description: "Questão criada com sucesso!",
        });

        return newQuestion;
      } catch (err) {
        console.error("Erro ao criar questão:", err);
        toast({
          title: "Erro",
          description: "Não foi possível criar a questão.",
          variant: "destructive",
        });
        throw err;
      }
    },
    [user, loadQuestions, toast],
  );

  const updateQuestion = useCallback(
    async (data: UpdateQuestionData): Promise<Question | null> => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const { id, ...updateData } = data;

        const { data: updatedQuestion, error } = await supabase
          .from("competition_questions")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        // Atualizar a lista local
        setQuestions((prev) =>
          prev.map((q) => (q.id === id ? updatedQuestion : q)),
        );

        toast({
          title: "Sucesso",
          description: "Questão atualizada com sucesso!",
        });

        return updatedQuestion;
      } catch (err) {
        console.error("Erro ao atualizar questão:", err);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a questão.",
          variant: "destructive",
        });
        throw err;
      }
    },
    [user, toast],
  );

  const deleteQuestion = useCallback(
    async (questionId: string): Promise<boolean> => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const { error } = await supabase
          .from("competition_questions")
          .delete()
          .eq("id", questionId);

        if (error) throw error;

        // Remover da lista local
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));

        toast({
          title: "Sucesso",
          description: "Questão excluída com sucesso!",
        });

        return true;
      } catch (err) {
        console.error("Erro ao excluir questão:", err);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a questão.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast],
  );

  const toggleQuestionActive = useCallback(
    async (questionId: string, isActive: boolean): Promise<boolean> => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const { error } = await supabase
          .from("competition_questions")
          .update({ is_active: !isActive })
          .eq("id", questionId);

        if (error) throw error;

        // Atualizar a lista local
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, is_active: !isActive } : q,
          ),
        );

        toast({
          title: "Sucesso",
          description: `Questão ${!isActive ? "ativada" : "desativada"} com sucesso!`,
        });

        return true;
      } catch (err) {
        console.error("Erro ao alterar status da questão:", err);
        toast({
          title: "Erro",
          description: "Não foi possível alterar o status da questão.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast],
  );

  const incrementUsageCount = useCallback(
    async (questionId: string): Promise<void> => {
      if (!user) return;

      try {
        const { error } = await supabase.rpc("increment_question_usage", {
          question_id: questionId,
        });

        if (error) throw error;

        // Atualizar a lista local
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, usage_count: q.usage_count + 1 } : q,
          ),
        );
      } catch (err) {
        console.error("Erro ao incrementar uso da questão:", err);
      }
    },
    [user],
  );

  const getQuestionsStats = useCallback((): QuestionsStats => {
    const total = questions.length;
    const active = questions.filter((q) => q.is_active).length;
    const inactive = total - active;

    const by_difficulty = {
      facil: questions.filter((q) => q.difficulty === "facil").length,
      medio: questions.filter((q) => q.difficulty === "medio").length,
      dificil: questions.filter((q) => q.difficulty === "dificil").length,
    };

    const by_type = {
      multiple_choice: questions.filter(
        (q) => q.question_type === "multiple_choice",
      ).length,
      true_false: questions.filter((q) => q.question_type === "true_false")
        .length,
      essay: questions.filter((q) => q.question_type === "essay").length,
      fill_blank: questions.filter((q) => q.question_type === "fill_blank")
        .length,
    };

    const most_used = [...questions]
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 5);

    const recent = [...questions]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 5);

    return {
      total,
      active,
      inactive,
      by_difficulty,
      by_type,
      most_used,
      recent,
    };
  }, [questions]);

  const importQuestionsFromJson = useCallback(
    async (questionsData: any[]): Promise<boolean> => {
      if (!user || !competitionId) {
        throw new Error("Usuário não autenticado ou concurso não especificado");
      }

      try {
        const { error } = await supabase.from("competition_questions").insert(
          questionsData.map((q) => ({
            ...q,
            competition_id: competitionId,
            is_ai_generated: q.is_ai_generated ?? false,
            is_active: q.is_active ?? true,
            usage_count: q.usage_count ?? 0,
          })),
        );

        if (error) throw error;

        // Recarregar questões
        await loadQuestions();

        toast({
          title: "Sucesso",
          description: `${questionsData.length} questões importadas com sucesso!`,
        });

        return true;
      } catch (err) {
        console.error("Erro ao importar questões:", err);
        toast({
          title: "Erro",
          description: "Não foi possível importar as questões.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, competitionId, loadQuestions, toast],
  );

  // Carregar questões automaticamente quando o componente monta
  useEffect(() => {
    if (competitionId) {
      loadQuestions();
    }
  }, [competitionId, loadQuestions]);

  return {
    questions,
    loading,
    error,
    loadQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    toggleQuestionActive,
    incrementUsageCount,
    getQuestionsStats,
    importQuestionsFromJson,
    // Computed values
    stats: getQuestionsStats(),
  };
}
