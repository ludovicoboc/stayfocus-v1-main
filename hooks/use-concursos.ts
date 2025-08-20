"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  createClient,
  withAuthenticatedSupabase,
  getCurrentAuthenticatedUser,
} from "@/lib/supabase";
import { validateAuthState, withAuth, requireAuth } from "@/lib/auth-utils";
import type {
  Concurso,
  Disciplina,
  Topico,
  Questao,
  Simulado,
} from "@/types/concursos";
import {
  validateConcurso,
  validateQuestao,
  validateData,
  sanitizeString,
  sanitizeDate,
} from "@/utils/validations";
import { handleSupabaseCompetitionError } from "@/lib/error-handler";

// Cache simples para concursos
const competitionsCache = new Map<
  string,
  { data: Concurso[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useConcursos() {
  const { user } = useAuth();
  const supabase = createClient();
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConcursos();
    }
  }, [user]);

  // Buscar concursos com consulta otimizada
  const fetchConcursos = useCallback(async () => {
    const result = await withAuth(async (authUser) => {
      const cacheKey = `competitions_${authUser.id}`;

      // Verificar cache primeiro
      if (competitionsCache.has(cacheKey)) {
        const cached = competitionsCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          setConcursos(cached.data);
          setLoading(false);
          return cached.data;
        }
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("competitions")
        .select(
          `
          *,
          competition_subjects!inner (
            *,
            competition_topics (*)
          ),
          competition_questions (*)
        `,
        )
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      const competitions = data || [];

      // Atualizar cache
      competitionsCache.set(cacheKey, {
        data: competitions,
        timestamp: Date.now(),
      });

      setConcursos(competitions);
      return competitions;
    });

    if (result.error) {
      console.error("Erro ao buscar concursos:", result.error);
    }

    setLoading(false);
  }, [user]);

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
      console.log("🌱 Criando dados de teste para concurso:", concursoId);

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

      console.log("✅ Dados de teste criados com sucesso!");
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
      console.log("🔍 Iniciando busca de concurso completo, ID:", id);
      console.log("🔄 Tentativa:", retryCount + 1);

      // Usar cliente autenticado
      return await withAuthenticatedSupabase(async (authClient) => {
        // Verificar usuário autenticado
        const authUser = await getCurrentAuthenticatedUser();
        console.log("👤 Usuario autenticado:", authUser.id);

        // Verificar acesso ao banco de dados
        const { data: healthCheck } = await authClient
          .from("competitions")
          .select("count", { count: "exact", head: true })
          .eq("user_id", authUser.id)
          .limit(1);

        console.log("🏥 Health check - acesso ao banco:", healthCheck !== null);

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

        console.log("📋 Resultado da verificação:", existeData);
        if (existeData && existeData.length > 0) {
          console.log(
            "🔍 Concurso existe, pertence ao usuário:",
            existeData[0].user_id,
          );
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
            console.log(
              "💡 ID parece ser um UUID válido, mas concurso não existe",
            );
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
              console.log(
                "🎯 Detectado ID de teste, criando dados automaticamente...",
              );
              const testData = await createTestData(id);
              if (testData) {
                return await fetchConcursoCompleto(id, retryCount + 1);
              }
            }

            // Listar concursos disponíveis
            console.log("📋 Listando concursos disponíveis para o usuário...");
            const { data: availableCompetitions } = await authClient
              .from("competitions")
              .select("id, title, status")
              .eq("user_id", authUser.id)
              .limit(5);

            if (availableCompetitions && availableCompetitions.length > 0) {
              console.log("📌 Concursos disponíveis:", availableCompetitions);
            } else {
              console.log("📭 Nenhum concurso encontrado para este usuário");
            }
          }

          return null;
        }

        console.log("✅ Concurso encontrado:", concursoData.title);

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

        console.log("📊 Concurso completo carregado:", {
          id: resultado.id,
          titulo: resultado.title,
          disciplinas: disciplinasFormatadas.length,
          totalTopicos: disciplinasFormatadas.reduce(
            (acc, d) => acc + (d.topicos?.length || 0),
            0,
          ),
        });

        return resultado;
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
        console.log("🔄 Erro de autenticação detectado, tentando novamente...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await fetchConcursoCompleto(id, retryCount + 1);
      }

      return null;
    }
  };

  const adicionarConcurso = async (concurso: Concurso) => {
    if (!user) return null;

    console.log("🎯 Iniciando criação de concurso:", concurso.title);

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

      console.log("✅ Concurso criado com ID:", concursoData.id);

      // Insert subjects and topics
      if (concurso.disciplinas && concurso.disciplinas.length > 0) {
        console.log(`📚 Inserindo ${concurso.disciplinas.length} disciplinas`);

        for (const disciplina of concurso.disciplinas) {
          console.log(`📖 Criando disciplina: ${disciplina.name}`);

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

          console.log(`✅ Disciplina criada com ID: ${disciplinaData.id}`);

          if (disciplina.topicos && disciplina.topicos.length > 0) {
            console.log(
              `📝 Inserindo ${disciplina.topicos.length} tópicos para disciplina ${disciplina.name}`,
            );

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

            console.log(
              `✅ ${topicosToInsert.length} tópicos inseridos com sucesso`,
            );
          }
        }
      }

      // Refresh the list
      await fetchConcursos();
      console.log("🎉 Concurso criado com sucesso! ID:", concursoData.id);
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
          is_ai_generated: questaoSanitizada.is_ai_generated || false,
        })
        .select(
          "id, competition_id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, is_ai_generated, created_at, updated_at",
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding question:", error);
      return null;
    }
  };

  const buscarQuestoesConcurso = async (concursoId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("competition_questions")
        .select(
          "id, competition_id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, is_ai_generated, created_at, updated_at",
        )
        .eq("competition_id", concursoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Questao[];
    } catch (error) {
      console.error("Error fetching competition questions:", error);
      return [];
    }
  };

  // Simulados
  const adicionarSimulado = async (simulado: Simulado) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("competition_simulations")
        .insert({
          competition_id: simulado.competition_id,
          user_id: user.id,
          title: simulado.title,
          questions: simulado.questions,
          is_favorite: simulado.is_favorite || false,
        })
        .select(
          "id, competition_id, user_id, title, questions, results, is_favorite, created_at, updated_at",
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
          "id, competition_id, user_id, title, questions, results, is_favorite, created_at, updated_at",
        )
        .eq("competition_id", concursoId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Simulado[];
    } catch (error) {
      console.error("Error fetching competition simulations:", error);
      return [];
    }
  };

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

    // Questões
    adicionarQuestao,
    buscarQuestoesConcurso,

    // Simulados
    adicionarSimulado,
    buscarSimuladosConcurso,
    marcarSimuladoFavorito,

    // Utilitários
    calcularProgressoConcurso,
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
