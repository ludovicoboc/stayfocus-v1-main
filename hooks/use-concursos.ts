"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-provider";
import { createClient, withAuthenticatedSupabase, getCurrentAuthenticatedUser } from "@/lib/supabase";
import { createDebouncedFunction, DEBOUNCE_CONFIGS } from "@/lib/request-debouncer";
import { optimizedAuthCache } from "@/lib/auth-cache";
import { validateAuthState, withAuth, requireAuth } from "@/lib/auth-utils";
import type { Concurso, Disciplina, Topico, Questao, Simulado } from "@/types/concursos";
import { validateConcurso, validateQuestao, validateQuestionOptions, validateSimulationResults, validateData, sanitizeString, sanitizeDate, sanitizeArray, sanitizeNumber } from "@/utils/validations";
import { handleSupabaseCompetitionError } from "@/lib/error-handler";

// Cache otimizado para concursos
const competitionsCache = new Map<string, { data: Concurso[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const DEBOUNCE_KEY = "concursos";

// Função debounced para fetch de concursos
const debouncedFetchConcursos = createDebouncedFunction(
  `${DEBOUNCE_KEY}_fetch`,
  async (userId: string) => {
    return await performFetchConcursos(userId);
  },
  'API_CALL'
);

/**
 * Executa busca otimizada de concursos
 */
async function performFetchConcursos(userId: string): Promise<Concurso[]> {
  const cacheKey = `competitions_${userId}`;

  // Verificar cache primeiro
  if (competitionsCache.has(cacheKey)) {
    const cached = competitionsCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }
  const supabase = createClient();

  const { data, error } = await supabase
    .from("competitions")
    .select(`
      *,
      competition_subjects!inner (
        *,
        competition_topics (*)
      ),
      competition_questions (
        id, competition_id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, points, time_limit_seconds, tags, source, year, is_active, usage_count, is_ai_generated, created_at, updated_at
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(handleSupabaseCompetitionError(error));
  }

  const competitions = data || [];
  
  // Atualizar cache
  competitionsCache.set(cacheKey, {
    data: competitions,
    timestamp: Date.now(),
  });

  return competitions;
}

export function useConcursos() {
  const { user } = useAuth();
  const supabase = createClient();
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar concursos com debouncing
  const fetchConcursos = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const competitions = await debouncedFetchConcursos(user.id);
      setConcursos(competitions);
    } catch (error) {
      console.error("Erro ao buscar concursos:", error);
      setConcursos([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConcursos();
  }, [fetchConcursos]);

  // Criar concurso otimizado
  const createCompetition = useCallback(
    async (competitionData: Partial<Concurso>) => {
      return await withAuth(async (authUser) => {
        const { data, error } = await supabase
          .from("competitions")
          .insert([
            {
              ...competitionData,
              user_id: authUser.id, // Será inserido automaticamente pelo RLS
            },
          ])
          .select()
          .single();

        if (error) {
          throw new Error(handleSupabaseError(error));
        }

        // Limpar cache
        const cacheKey = `competitions_${authUser.id}`;
        competitionsCache.delete(cacheKey);

        // Atualizar estado local
        setConcursos((prev) => [data, ...prev]);

        return data;
      });
    },
    [],
  );

  // Atualizar concurso
  const updateCompetition = useCallback(
    async (competitionId: string, updates: Partial<Concurso>) => {
      return await withAuth(async (authUser) => {
        // Validar propriedade primeiro
        await validateCompetitionAccess(competitionId);

        const { data, error } = await supabase
          .from("competitions")
          .update(updates)
          .eq("id", competitionId)
          .eq("user_id", authUser.id)
          .select()
          .single();

        if (error) {
          throw new Error(handleSupabaseError(error));
        }

        // Limpar cache
        const cacheKey = `competitions_${authUser.id}`;
        competitionsCache.delete(cacheKey);

        // Atualizar estado local
        setConcursos((prev) =>
          prev.map((comp) =>
            comp.id === competitionId ? { ...comp, ...data } : comp,
          ),
        );

        return data;
      });
    },
    [],
  );

  // Deletar concurso
  const deleteCompetition = useCallback(async (competitionId: string) => {
    return await withAuth(async (authUser) => {
      // Validar propriedade primeiro
      await validateCompetitionAccess(competitionId);

      const { error } = await supabase
        .from("competitions")
        .delete()
        .eq("id", competitionId)
        .eq("user_id", authUser.id);

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      // Limpar cache
      const cacheKey = `competitions_${authUser.id}`;
      competitionsCache.delete(cacheKey);

      // Atualizar estado local
      setConcursos((prev) => prev.filter((comp) => comp.id !== competitionId));

      return true;
    });
  }, []);

  // Adicionar matéria
  const addSubject = useCallback(
    async (competitionId: string, subjectData: Partial<Disciplina>) => {
      return await withAuth(async (authUser) => {
        // Validar propriedade do concurso
        await validateCompetitionAccess(competitionId);

        const { data, error } = await supabase
          .from("competition_subjects")
          .insert([
            {
              competition_id: competitionId,
              ...subjectData,
            },
          ])
          .select()
          .single();

        if (error) {
          throw new Error(handleSupabaseError(error));
        }

        // Limpar cache
        const cacheKey = `competitions_${authUser.id}`;
        competitionsCache.delete(cacheKey);

        return data;
      });
    },
    [],
  );

  // Atualizar matéria
  const updateSubject = useCallback(
    async (subjectId: string, updates: Partial<Disciplina>) => {
      return await withAuth(async (authUser) => {
        const { data, error } = await supabase
          .from("competition_subjects")
          .update(updates)
          .eq("id", subjectId)
          .select()
          .single();

        if (error) {
          throw new Error(handleSupabaseError(error));
        }

        // Limpar cache
        const cacheKey = `competitions_${authUser.id}`;
        competitionsCache.delete(cacheKey);

        return data;
      });
    },
    [],
  );

  // Deletar matéria
  const deleteSubject = useCallback(async (subjectId: string) => {
    return await withAuth(async (authUser) => {
      const { error } = await supabase
        .from("competition_subjects")
        .delete()
        .eq("id", subjectId);

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      // Limpar cache
      const cacheKey = `competitions_${authUser.id}`;
      competitionsCache.delete(cacheKey);

      return true;
    });
  }, []);

  // Adicionar tópico
  const addTopic = useCallback(
    async (subjectId: string, topicData: Partial<Topico>) => {
      return await withAuth(async (authUser) => {
        const { data, error } = await supabase
          .from("competition_topics")
          .insert([
            {
              subject_id: subjectId,
              ...topicData,
            },
          ])
          .select()
          .single();

        if (error) {
          throw new Error(handleSupabaseError(error));
        }

        // Limpar cache
        const cacheKey = `competitions_${authUser.id}`;
        competitionsCache.delete(cacheKey);

        return data;
      });
    },
    [],
  );

  // Validar acesso ao concurso
  const validateCompetitionAccess = async (competitionId: string) => {
    const { data, error } = await supabase.rpc(
      "verify_user_competition_access",
      {
        comp_id: competitionId,
      },
    );

    if (
      error ||
      !data?.find((d: any) => d.test_type === "ownership")?.can_access
    ) {
      throw new Error("Acesso negado ao concurso");
    }
  };

  // Tratamento de erros específico do Supabase
  const handleSupabaseError = (error: any): string => {
    if (error?.code === "PGRST301") {
      return "Você não tem permissão para acessar este concurso";
    }
    if (error?.code === "23505") {
      return "Este concurso já existe";
    }
    if (error?.code === "PGRST116") {
      return "Concurso não encontrado";
    }
    return error?.message || "Erro desconhecido";
  };

  const createTestData = async (concursoId: string) => {
    const result = await withAuth(async (authUser) => {
      // Criar concurso
      const { data: concursoData, error: concursoError } = await supabase
        .from("competitions")
        .upsert({
          id: concursoId,
          user_id: authUser.id,
          title: "Concurso Público Federal - Analista de Sistemas",
          organizer: "Ministério da Educação",
          registration_date: "2024-03-15",
          exam_date: "2024-05-20",
          edital_link: "https://exemplo.gov.br/edital",
          status: "estudando",
        })
        .select()
        .single();

      if (concursoError) {
        throw new Error(handleSupabaseCompetitionError(concursoError));
      }

      // Criar disciplinas
      const disciplinas = [
        {
          id: "d1111111-1111-1111-1111-111111111111",
          competition_id: concursoId,
          name: "Direito Constitucional",
          progress: 25,
        },
        {
          id: "d2222222-2222-2222-2222-222222222222",
          competition_id: concursoId,
          name: "Direito Administrativo",
          progress: 50,
        },
        {
          id: "d3333333-3333-3333-3333-333333333333",
          competition_id: concursoId,
          name: "Informática",
          progress: 75,
        },
      ];

      const { error: disciplinasError } = await supabase
        .from("competition_subjects")
        .upsert(disciplinas);
      if (disciplinasError) {
        throw new Error(handleSupabaseCompetitionError(disciplinasError));
      }

      // Criar tópicos
      const topicos = [
        {
          id: "t1111111-1111-1111-1111-111111111111",
          subject_id: "d1111111-1111-1111-1111-111111111111",
          name: "Princípios Fundamentais",
          completed: true,
        },
        {
          id: "t1111112-1111-1111-1111-111111111111",
          subject_id: "d1111111-1111-1111-1111-111111111111",
          name: "Direitos e Garantias Fundamentais",
          completed: false,
        },
        {
          id: "t2222221-2222-2222-2222-222222222222",
          subject_id: "d2222222-2222-2222-2222-222222222222",
          name: "Atos Administrativos",
          completed: true,
        },
        {
          id: "t3333331-3333-3333-3333-333333333333",
          subject_id: "d3333333-3333-3333-3333-333333333333",
          name: "Sistemas Operacionais",
          completed: true,
        },
      ];

      await supabase.from("competition_topics").upsert(topicos);

      // Criar questões
      const questoes = [
        {
          id: "q1111111-1111-1111-1111-111111111111",
          competition_id: concursoId,
          subject_id: "d1111111-1111-1111-1111-111111111111",
          topic_id: "t1111111-1111-1111-1111-111111111111",
          question_text:
            "Sobre os princípios fundamentais da Constituição Federal de 1988, é correto afirmar que:",
          options: [
            {
              text: "A República Federativa do Brasil é formada pela união indissolúvel dos Estados, Municípios e do Distrito Federal.",
              isCorrect: true,
            },
            {
              text: "O Brasil é uma República Federativa Presidencialista.",
              isCorrect: false,
            },
            {
              text: "A soberania popular é exercida exclusivamente pelo voto direto.",
              isCorrect: false,
            },
          ],
          correct_answer: 0,
          explanation:
            "A Constituição Federal estabelece em seu artigo 1º que a República Federativa do Brasil é formada pela união indissolúvel dos Estados e Municípios e do Distrito Federal.",
          difficulty: "medio",
          is_ai_generated: false,
        },
      ];

      await supabase.from("competition_questions").upsert(questoes);
      return concursoData;
    });

    if (result.error) {
      console.error("❌ Erro ao criar dados de teste:", result.error);
      return null;
    }

    return result.data;
  };

  const fetchConcursoCompleto = async (
    id: string,
    retryCount = 0,
  ): Promise<Concurso | null> => {
    const MAX_RETRIES = 2;

    try {
      // Usar cliente autenticado
      return await withAuthenticatedSupabase(async (authClient) => {
        // Verificar usuário autenticado
        const authUser = await getCurrentAuthenticatedUser();
        // Verificar acesso ao banco de dados
        const { data: healthCheck } = await authClient
          .from("competitions")
          .select("count", { count: "exact", head: true })
          .eq("user_id", authUser.id)
          .limit(1);
        // Primeiro, verificar se o concurso existe
        const { data: existeData, error: existeError } = await authClient
          .from("competitions")
          .select("id, user_id, title")
          .eq("id", id);

        if (existeError) {
          console.error(
            "❌ Erro ao verificar existência do concurso:",
            existeError,
          );
          throw existeError;
        }
        if (existeData && existeData.length > 0) {
          if (existeData[0].user_id !== authUser.id) {
            console.warn(
              "⚠️ Concurso pertence a outro usuário:",
              existeData[0].user_id,
              "≠",
              authUser.id,
            );
          }
        } else {
          console.warn("⚠️ Concurso não existe na base de dados");
          if (
            id.match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            )
          ) {
          }
        }

        // Buscar dados completos do concurso
        const { data: concursoData, error: concursoError } = await authClient
          .from("competitions")
          .select(
            "id, user_id, title, organizer, registration_date, exam_date, edital_link, status, created_at, updated_at",
          )
          .eq("id", id)
          .eq("user_id", authUser.id)
          .single();

        if (concursoError) {
          console.error("❌ Erro ao buscar concurso:", concursoError);
          console.error("❌ Código do erro:", concursoError.code);
          console.error("❌ Detalhes do erro:", concursoError.details);
          console.error("❌ Mensagem:", concursoError.message);

          if (concursoError.code === "PGRST116") {
            console.warn(
              "⚠️ Concurso não encontrado ou não pertence ao usuário",
            );

            // Se for o ID específico do teste, criar dados de teste
            if (id === "3c6dff36-4971-4f3e-ac56-701efa04cd86") {
              const testData = await createTestData(id);
              if (testData) {
                return await fetchConcursoCompleto(id, retryCount + 1);
              }
            }

            // Listar concursos disponíveis
            const { data: availableCompetitions } = await authClient
              .from("competitions")
              .select("id, title, status")
              .eq("user_id", authUser.id)
              .limit(5);

            if (availableCompetitions && availableCompetitions.length > 0) {
            } else {
            }
          }

          return null;
        }
        // Fetch subjects with topics in a single query using JOIN
        const { data: disciplinasComTopicos, error: disciplinasError } =
          await authClient
            .from("competition_subjects")
            .select(
              `
          id, competition_id, name, progress, created_at, updated_at,
          topicos:competition_topics(id, subject_id, name, completed, created_at, updated_at)
        `,
            )
            .eq("competition_id", id)
            .order("created_at", { ascending: true });

        if (disciplinasError) throw disciplinasError;

        // Transform the data to match expected structure
        const disciplinasFormatadas: Disciplina[] =
          disciplinasComTopicos?.map((disciplina) => ({
            ...disciplina,
            topicos: disciplina.topicos || [],
          })) || [];

        const resultado = {
          ...concursoData,
          disciplinas: disciplinasFormatadas,
        } as Concurso;
        
        // NOVO: Enriquecer com dados do histórico
        const concursoEnriquecido = await enriquecerConcursoComHistorico(resultado);
        return concursoEnriquecido;
      });
    } catch (error: any) {
      console.error("❌ Erro inesperado ao buscar concurso:", error);

      // Tentar novamente em caso de erro de autenticação
      if (
        (error?.message?.includes("JWT") ||
          error?.message?.includes("auth") ||
          error?.message?.includes("unauthorized")) &&
        retryCount < MAX_RETRIES
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await fetchConcursoCompleto(id, retryCount + 1);
      }

      return null;
    }
  };

  const adicionarConcurso = async (concurso: Concurso) => {
    if (!user) return null;
    try {
      // Sanitizar dados de entrada
      const concursoSanitizado = {
        ...concurso,
        title: sanitizeString(concurso.title),
        organizer: sanitizeString(concurso.organizer),
        registration_date: concurso.registration_date
          ? sanitizeDate(concurso.registration_date)
          : undefined,
        exam_date: concurso.exam_date
          ? sanitizeDate(concurso.exam_date)
          : undefined,
        edital_link: concurso.edital_link
          ? sanitizeString(concurso.edital_link)
          : undefined,
      };

      // Validar dados antes de enviar
      validateData(concursoSanitizado, validateConcurso);

      // Insert competition
      const { data: concursoData, error: concursoError } = await supabase
        .from("competitions")
        .insert({
          user_id: user.id,
          title: concursoSanitizado.title,
          organizer: concursoSanitizado.organizer,
          registration_date: concursoSanitizado.registration_date,
          exam_date: concursoSanitizado.exam_date,
          edital_link: concursoSanitizado.edital_link,
          status: concursoSanitizado.status,
        })
        .select("id")
        .single();

      if (concursoError) {
        console.error("❌ Erro ao inserir concurso:", concursoError);
        throw concursoError;
      }
      // Insert subjects and topics
      if (concurso.disciplinas && concurso.disciplinas.length > 0) {
        for (const disciplina of concurso.disciplinas) {
          const { data: disciplinaData, error: disciplinaError } =
            await supabase
              .from("competition_subjects")
              .insert({
                competition_id: concursoData.id,
                name: disciplina.name,
                progress: 0,
              })
              .select("id")
              .single();

          if (disciplinaError) {
            console.error("❌ Erro ao inserir disciplina:", disciplinaError);
            throw disciplinaError;
          }
          if (disciplina.topicos && disciplina.topicos.length > 0) {
            const topicosToInsert = disciplina.topicos.map((topico) => {
              // Tratamento seguro para tópicos que podem ser string ou objeto
              const nomeTopico =
                typeof topico === "string"
                  ? topico
                  : topico.name || String(topico);

              return {
                subject_id: disciplinaData.id,
                name: nomeTopico,
                completed: false,
              };
            });

            const { error: topicosError } = await supabase
              .from("competition_topics")
              .insert(topicosToInsert);

            if (topicosError) {
              console.error("❌ Erro ao inserir tópicos:", topicosError);
              throw topicosError;
            }
          }
        }
      }

      // Refresh the list
      await fetchConcursos();
      return concursoData;
    } catch (error) {
      console.error("❌ Erro completo ao adicionar concurso:", error);

      // Fornecer erro mais específico para a interface
      if (error instanceof Error) {
        throw new Error(`Falha ao criar concurso: ${error.message}`);
      } else {
        throw new Error("Erro desconhecido ao criar concurso");
      }
    }
  };

  const atualizarConcurso = async (id: string, dados: Partial<Concurso>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("competitions")
        .update({
          title: dados.title,
          organizer: dados.organizer,
          registration_date: dados.registration_date,
          exam_date: dados.exam_date,
          edital_link: dados.edital_link,
          status: dados.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Refresh the list
      await fetchConcursos();
      return true;
    } catch (error) {
      console.error("Error updating competition:", error);
      return false;
    }
  };

  // Atualizar progresso da disciplina (versão otimizada)
  const atualizarProgressoDisciplina = useCallback(
    async (disciplinaId: string, progresso: number) => {
      return await withAuth(async (authUser) => {
        const { error } = await supabase
          .from("competition_subjects")
          .update({
            progress: progresso,
            updated_at: new Date().toISOString(),
          })
          .eq("id", disciplinaId);

        if (error) {
          throw new Error(handleSupabaseError(error));
        }

        // Limpar cache
        const cacheKey = `competitions_${authUser.id}`;
        competitionsCache.delete(cacheKey);

        return true;
      });
    },
    [],
  );

  // Atualizar tópico completado (versão otimizada)
  const atualizarTopicoCompletado = useCallback(
    async (topicoId: string, completado: boolean) => {
      return await withAuth(async (authUser) => {
        const { error } = await supabase
          .from("competition_topics")
          .update({
            completed: completado,
            updated_at: new Date().toISOString(),
          })
          .eq("id", topicoId);

        if (error) {
          throw new Error(handleSupabaseError(error));
        }

        // Limpar cache
        const cacheKey = `competitions_${authUser.id}`;
        competitionsCache.delete(cacheKey);

        return true;
      });
    },
    [],
  );

  // Questões
  const adicionarQuestao = async (questao: Questao) => {
    if (!user) return null;

    try {
      // Sanitizar dados de entrada
      const questaoSanitizada = {
        ...questao,
        question_text: sanitizeString(questao.question_text),
        correct_answer: sanitizeString(questao.correct_answer),
        explanation: questao.explanation
          ? sanitizeString(questao.explanation)
          : undefined,
      };

      // Validação específica das opções antes da validação geral
      if (questaoSanitizada.options && questaoSanitizada.options.length > 0) {
        validateData(questaoSanitizada.options, validateQuestionOptions);
      }

      // Validar dados antes de enviar
      validateData(questaoSanitizada, validateQuestao);

      const { data, error } = await supabase
        .from("competition_questions")
        .insert({
          competition_id: questaoSanitizada.competition_id,
          subject_id: questaoSanitizada.subject_id,
          topic_id: questaoSanitizada.topic_id,
          question_text: questaoSanitizada.question_text,
          options: questaoSanitizada.options,
          correct_answer: questaoSanitizada.correct_answer,
          explanation: questaoSanitizada.explanation,
          difficulty: questaoSanitizada.difficulty,
          question_type: questaoSanitizada.question_type || "multiple_choice",
          points: questaoSanitizada.points || 1,
          time_limit_seconds: questaoSanitizada.time_limit_seconds,
          tags: questaoSanitizada.tags || [],
          source: questaoSanitizada.source,
          year: questaoSanitizada.year,
          is_active: questaoSanitizada.is_active !== false, // Default true
          usage_count: questaoSanitizada.usage_count || 0,
          is_ai_generated: questaoSanitizada.is_ai_generated || false,
        })
        .select(
          "id, competition_id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, points, time_limit_seconds, tags, source, year, is_active, usage_count, is_ai_generated, created_at, updated_at",
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding question:", error);
      return null;
    }
  };

  // NOVA IMPLEMENTAÇÃO: Buscar questões usando view frontend otimizada
  const buscarQuestoesConcurso = async (concursoId: string, filtros?: {
    subjectId?: string;
    topicId?: string;
    difficulty?: "facil" | "medio" | "dificil";
    questionType?: string;
    limit?: number;
  }) => {
    if (!user) return []

    try {
      // Usar view frontend que é otimizada e filtra automaticamente questões ativas
      let query = supabase
        .from("v_competition_questions_frontend")
        .select("*")
        .eq("competition_id", concursoId)
        .eq("is_active", true) // Só questões ativas

      // Aplicar filtros se fornecidos
      if (filtros?.subjectId) {
        query = query.eq("subject_id", filtros.subjectId)
      }
      
      if (filtros?.topicId) {
        query = query.eq("topic_id", filtros.topicId)
      }
      
      if (filtros?.difficulty) {
        query = query.eq("difficulty", filtros.difficulty)
      }
      
      if (filtros?.questionType) {
        query = query.eq("question_type", filtros.questionType)
      }

      // Ordenação otimizada: primeiro por uso (questões menos usadas), depois por data
      query = query
        .order("usage_count", { ascending: true })
        .order("created_at", { ascending: false })

      // Aplicar limite se fornecido
      if (filtros?.limit) {
        query = query.limit(filtros.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching competition questions:", error)
        throw error
      }
      
      return data as Questao[]
    } catch (error) {
      console.error("Error fetching competition questions:", error)
      return []
    }
  }

  // NOVA IMPLEMENTAÇÃO: Incrementar contagem de uso de questão
  const incrementarUsoQuestao = async (questaoId: string) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .rpc('increment_question_usage', {
          question_id: questaoId
        })

      if (error) {
        console.error("Error incrementing question usage:", error)
        return false
      }
      
      return true
    } catch (error) {
      console.error("Error incrementing question usage:", error)
      return false
    }
  }

  // Simulados
  const adicionarSimulado = async (simulado: Simulado) => {
    if (!user) return null;

    try {
      // Sanitizar dados de entrada
      const simuladoSanitizado = {
        ...simulado,
        title: sanitizeString(simulado.title),
        description: simulado.description ? sanitizeString(simulado.description) : undefined,
        questions: sanitizeArray(simulado.questions),
        question_count: simulado.question_count ? sanitizeNumber(simulado.question_count) : undefined,
        time_limit_minutes: simulado.time_limit_minutes ? sanitizeNumber(simulado.time_limit_minutes) : undefined,
        subject_filters: simulado.subject_filters ? sanitizeArray(simulado.subject_filters) : undefined,
        topic_filters: simulado.topic_filters ? sanitizeArray(simulado.topic_filters) : undefined,
        is_favorite: simulado.is_favorite || false,
        status: simulado.status || 'active',
        is_public: simulado.is_public || false,
        attempts_count: simulado.attempts_count || 0,
        best_score: simulado.best_score ? sanitizeNumber(simulado.best_score) : undefined,
        avg_score: simulado.avg_score ? sanitizeNumber(simulado.avg_score) : undefined,
      };

      // Validar results se fornecidos
      if (simuladoSanitizado.results) {
        validateData(simuladoSanitizado.results, validateSimulationResults);
      }

      const { data, error } = await supabase
        .from("competition_simulations")
        .insert({
          competition_id: simuladoSanitizado.competition_id,
          user_id: user.id,
          title: simuladoSanitizado.title,
          description: simuladoSanitizado.description,
          questions: simuladoSanitizado.questions,
          question_count: simuladoSanitizado.question_count || simuladoSanitizado.questions.length,
          time_limit_minutes: simuladoSanitizado.time_limit_minutes,
          difficulty_filter: simuladoSanitizado.difficulty_filter,
          subject_filters: simuladoSanitizado.subject_filters,
          topic_filters: simuladoSanitizado.topic_filters,
          status: simuladoSanitizado.status,
          is_public: simuladoSanitizado.is_public,
          results: simuladoSanitizado.results,
          is_favorite: simuladoSanitizado.is_favorite,
          attempts_count: simuladoSanitizado.attempts_count,
          best_score: simuladoSanitizado.best_score,
          avg_score: simuladoSanitizado.avg_score,
        })
        .select(
          "id, competition_id, user_id, title, description, questions, question_count, time_limit_minutes, difficulty_filter, subject_filters, topic_filters, status, is_public, results, is_favorite, attempts_count, best_score, avg_score, created_at, updated_at",
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding simulation:", error);
      return null;
    }
  };

  const buscarSimuladosConcurso = async (concursoId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("competition_simulations")
        .select(
          "id, competition_id, user_id, title, description, questions, question_count, time_limit_minutes, difficulty_filter, subject_filters, topic_filters, status, is_public, results, is_favorite, attempts_count, best_score, avg_score, created_at, updated_at",
        )
        .eq("competition_id", concursoId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Validar results de cada simulado retornado
      const simuladosValidados = data?.map((simulado) => {
        if (simulado.results) {
          try {
            validateData(simulado.results, validateSimulationResults);
          } catch (validationError) {
            console.warn(`Simulado ${simulado.id} tem results inválidos:`, validationError);
            // Manter results mas sinalizar problema
          }
        }
        return simulado;
      }) || [];

      return simuladosValidados as Simulado[];
    } catch (error) {
      console.error("Error fetching competition simulations:", error);
      return [];
    }
  };

  // NOVA IMPLEMENTAÇÃO: Usar função otimizada para estatísticas de simulação
  const obterEstatisticasSimulacao = async (simuladoId: string) => {
    if (!user?.id) return null
    
    try {
      const { data, error } = await supabase.rpc('get_simulation_statistics', {
        p_simulation_id: simuladoId,
        p_user_id: user.id
      })
      
      if (error) throw error;
      
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error("Error fetching enhanced simulation statistics:", error)
      return null
    }
  }

  // NOVO: Enriquecer dados com informações do histórico
  const enriquecerConcursoComHistorico = async (concurso: Concurso) => {
    if (!user?.id) return concurso
    
    try {
      // Buscar estatísticas do histórico unificado para este concurso
      const { data: historicoData, error: historicoError } = await supabase
        .from("activity_history")
        .select("*")
        .eq("user_id", user.id)
        .or(`module.eq.concursos,module.eq.simulados`)
        .or(`metadata->>competition_id.eq.${concurso.id},metadata->>simulation_id.eq.${concurso.id}`)
        .order('completed_at', { ascending: false })
        .limit(50)

      if (historicoError) {
        console.warn("Erro ao buscar histórico do concurso:", historicoError)
        return concurso
      }

      const atividades = historicoData || []
      
      // Calcular estatísticas enriquecidas
      const estatisticasEnriquecidas = {
        total_study_sessions: atividades.filter(a => a.activity_type === 'study_session').length,
        total_simulations: atividades.filter(a => a.activity_type === 'simulation_completed').length,
        total_study_time: atividades.reduce((sum, a) => sum + (a.duration_minutes || 0), 0),
        average_performance: atividades.length > 0 
          ? atividades.reduce((sum, a) => sum + (a.score || 0), 0) / atividades.length 
          : 0,
        current_streak: calcularSequenciaEstudos(atividades),
        last_activity: atividades[0]?.activity_date || null,
        performance_trend: calcularTendenciaPerformance(atividades),
        study_consistency: calcularConsistenciaEstudos(atividades),
        favorite_subjects: identificarMateriasPreferidas(atividades),
        weak_areas: identificarAreasFrageis(atividades),
        study_patterns: analisarPadroesEstudo(atividades),
        recent_attempts: atividades?.slice(0, 5) || []
      }

      // Retornar concurso enriquecido
      return {
        ...concurso,
        enriched_stats: estatisticasEnriquecidas,
        has_history_data: atividades.length > 0
      }
    } catch (error) {
      console.error("Erro ao enriquecer concurso com histórico:", error)
      return concurso
    }
  }

  // Funções auxiliares para análise do histórico
  const calcularSequenciaEstudos = (atividades: any[]): number => {
    if (atividades.length === 0) return 0
    
    const datasUnicas = [...new Set(atividades.map(a => a.activity_date))].sort().reverse()
    let sequencia = 0
    const hoje = new Date().toISOString().split('T')[0]
    
    for (let i = 0; i < datasUnicas.length; i++) {
      const dataAtividade = datasUnicas[i]
      const diasDiferenca = Math.floor(
        (new Date(hoje).getTime() - new Date(dataAtividade).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (diasDiferenca <= i + 1) {
        sequencia++
      } else {
        break
      }
    }
    
    return sequencia
  }

  const calcularTendenciaPerformance = (atividades: any[]): 'improving' | 'stable' | 'declining' => {
    if (atividades.length < 4) return 'stable'
    
    const recentes = atividades.slice(0, 2)
    const anteriores = atividades.slice(2, 4)
    
    const mediaRecente = recentes.reduce((sum, a) => sum + (a.score || 0), 0) / recentes.length
    const mediaAnterior = anteriores.reduce((sum, a) => sum + (a.score || 0), 0) / anteriores.length
    
    const diferenca = mediaRecente - mediaAnterior
    
    if (diferenca > 5) return 'improving'
    if (diferenca < -5) return 'declining'
    return 'stable'
  }

  const calcularConsistenciaEstudos = (atividades: any[]): number => {
    if (atividades.length < 7) return 0
    
    // Calcular quantos dos últimos 7 dias tiveram atividades
    const ultimosSete = new Array(7).fill(0).map((_, i) => {
      const data = new Date()
      data.setDate(data.getDate() - i)
      return data.toISOString().split('T')[0]
    })
    
    const diasComAtividade = ultimosSete.filter(data => 
      atividades.some(a => a.activity_date === data)
    ).length
    
    return Math.round((diasComAtividade / 7) * 100)
  }

  const identificarMateriasPreferidas = (atividades: any[]): string[] => {
    const contadorMaterias: Record<string, number> = {}
    
    atividades.forEach(a => {
      const materia = a.category || a.metadata?.subject || 'Geral'
      contadorMaterias[materia] = (contadorMaterias[materia] || 0) + 1
    })
    
    return Object.entries(contadorMaterias)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([materia]) => materia)
  }

  const identificarAreasFrageis = (atividades: any[]): string[] => {
    const performancePorMateria: Record<string, number[]> = {}
    
    atividades.forEach(a => {
      if (a.score && a.score > 0) {
        const materia = a.category || a.metadata?.subject || 'Geral'
        if (!performancePorMateria[materia]) {
          performancePorMateria[materia] = []
        }
        performancePorMateria[materia].push(a.score)
      }
    })
    
    const mediaPorMateria = Object.entries(performancePorMateria)
      .map(([materia, scores]) => ({
        materia,
        media: scores.reduce((sum, s) => sum + s, 0) / scores.length
      }))
      .filter(item => item.media < 70) // Considerar frágeis se média < 70%
      .sort((a, b) => a.media - b.media)
      .slice(0, 3)
      .map(item => item.materia)
    
    return mediaPorMateria
  }

  const analisarPadroesEstudo = (atividades: any[]): any => {
    const padroesPorHora: Record<number, number> = {}
    const padroesPorDia: Record<string, number> = {}
    
    atividades.forEach(a => {
      if (a.completed_at) {
        const data = new Date(a.completed_at)
        const hora = data.getHours()
        const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' })
        
        padroesPorHora[hora] = (padroesPorHora[hora] || 0) + 1
        padroesPorDia[diaSemana] = (padroesPorDia[diaSemana] || 0) + 1
      }
    })
    
    const horarioPreferido = Object.entries(padroesPorHora)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    
    const diaPreferido = Object.entries(padroesPorDia)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    
    return {
      horario_preferido: horarioPreferido ? `${horarioPreferido}:00` : null,
      dia_preferido: diaPreferido || null,
      distribuicao_horarios: padroesPorHora,
      distribuicao_dias: padroesPorDia
    }
  }

  const marcarSimuladoFavorito = async (
    simuladoId: string,
    favorito: boolean,
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("competition_simulations")
        .update({
          is_favorite: favorito,
          updated_at: new Date().toISOString(),
        })
        .eq("id", simuladoId)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error marking simulation as favorite:", error);
      return false;
    }
  };

  const calcularProgressoConcurso = async (concursoId: string) => {
    if (!user) return 0;

    try {
      // Get all study sessions for this competition
      const { data: sessoesData, error: sessoesError } = await supabase
        .from("study_sessions")
        .select("id, user_id, competition_id, topic, completed")
        .eq("user_id", user.id)
        .eq("competition_id", concursoId)
        .eq("completed", true);

      if (sessoesError) throw sessoesError;

      // Map DB field 'topic' -> local 'topico' to keep frontend naming consistent
      const sessoes = (sessoesData || []).map((s) => ({
        ...s,
        topico: s.topic,
      }));

      // Get competition details with subjects and topics
      const concursoCompleto = await fetchConcursoCompleto(concursoId);
      if (!concursoCompleto || !concursoCompleto.disciplinas) return 0;

      // Calculate total topics
      let totalTopicos = 0;
      let topicosComSessoes = new Set<string>();

      for (const disciplina of concursoCompleto.disciplinas) {
        if (disciplina.topicos) {
          totalTopicos += disciplina.topicos.length;
        }
      }

      // Count topics that have study sessions
      if (sessoes && sessoes.length > 0) {
        for (const sessao of sessoes) {
          if (sessao.topico) {
            // Map session topic to actual topics by partial match
            for (const disciplina of concursoCompleto.disciplinas) {
              if (disciplina.topicos) {
                for (const topico of disciplina.topicos) {
                  if (
                    topico.name
                      .toLowerCase()
                      .includes(sessao.topico.toLowerCase()) ||
                    sessao.topico
                      .toLowerCase()
                      .includes(topico.name.toLowerCase())
                  ) {
                    topicosComSessoes.add(topico.id || topico.name);
                  }
                }
              }
            }
          }
        }
      }

      // Calculate progress percentage
      if (totalTopicos === 0) return 0;
      return Math.round((topicosComSessoes.size / totalTopicos) * 100);
    } catch (error) {
      console.error("Error calculating competition progress:", error);
      return 0;
    }
  };

  return {
    // Estado
    concursos,
    loading,

    // Funções de busca
    fetchConcursos,
    fetchConcursoCompleto,
    getUserCompetitions: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("competitions")
        .select("id, title, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },

    // CRUD de Concursos (otimizado)
    createCompetition,
    updateCompetition,
    deleteCompetition,

    // CRUD de Disciplinas (otimizado)
    addSubject,
    updateSubject,
    deleteSubject,

    // CRUD de Tópicos (otimizado)
    addTopic,

    // Funções de progresso (otimizadas)
    atualizarProgressoDisciplina,
    atualizarTopicoCompletado,

    // Questões (otimizadas)
    adicionarQuestao,
    buscarQuestoesConcurso,
    incrementarUsoQuestao,

    // Simulados
    adicionarSimulado,
    buscarSimuladosConcurso,
    marcarSimuladoFavorito,

    // Utilitários
    calcularProgressoConcurso,
    obterEstatisticasSimulacao, // Nova função otimizada
    enriquecerConcursoComHistorico, // NOVO: Enriquecimento com histórico
    validateCompetitionAccess,
    handleSupabaseError,

    // Dados de teste
    createTestData,

    // Funções legadas (manter compatibilidade)
    adicionarConcurso,
    atualizarConcurso,
    removerConcurso: deleteCompetition,
  };
}
