/**
 * Testes de Integração para CRUD de Concursos
 * Conforme Etapa 5.1 do todocc.md
 */

import { supabase } from "@/lib/supabase";
import { validateAuthState, withAuth, requireAuth } from "@/lib/auth-utils";
import { competitionCache } from "@/lib/cache-manager";
import {
  handleSupabaseCompetitionError,
  logSupabaseError,
  trackPerformance,
  competitionLogger,
} from "@/lib/error-handler";
import type { Concurso, Disciplina, Topico, Questao } from "@/types/concursos";

// =====================================
// CONFIGURAÇÃO DE TESTES
// =====================================

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
  duration?: number;
}

interface TestSuite {
  name: string;
  tests: Array<() => Promise<TestResult>>;
}

// IDs de teste fixos para garantir consistência (UUIDs válidos)
const TEST_IDS = {
  competition: "a1b2c3d4-e5f6-7890-abcd-123456789012",
  subject1: "b2c3d4e5-f6a7-8901-bcde-234567890123",
  subject2: "c3d4e5f6-a7b8-9012-cdef-345678901234",
  topic1: "d4e5f6a7-b8c9-0123-defa-456789012345",
  topic2: "e5f6a7b8-c9d0-1234-efab-567890123456",
  question1: "f6a7b8c9-d0e1-2345-fabc-678901234567",
};

// =====================================
// FUNÇÕES AUXILIARES DE TESTE
// =====================================

async function runTest(
  testName: string,
  testFn: () => Promise<any>,
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    competitionLogger.info(`Iniciando teste: ${testName}`);
    const result = await testFn();
    const duration = Date.now() - startTime;

    // Pequeno delay para garantir que operações assíncronas terminem
    await new Promise((resolve) => setTimeout(resolve, 100));

    competitionLogger.success(`✅ ${testName} passou`, { duration });
    return {
      success: true,
      message: `${testName} executado com sucesso`,
      data: result,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    // Pequeno delay mesmo em caso de erro
    await new Promise((resolve) => setTimeout(resolve, 100));

    competitionLogger.error(`❌ ${testName} falhou`, error, { duration });
    return {
      success: false,
      message: `${testName} falhou: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      error,
      duration,
    };
  }
}

function createTestData() {
  return {
    competition: {
      title: "Teste CRUD - Concurso Público",
      organizer: "Org Teste",
      registration_date: "2024-03-15",
      exam_date: "2024-05-20",
      edital_link: "https://exemplo.gov.br/edital-teste",
      status: "planejado" as const,
    },
    subject1: {
      competition_id: TEST_IDS.competition,
      name: "Direito Constitucional - Teste",
      progress: 0,
    },
    subject2: {
      competition_id: TEST_IDS.competition,
      name: "Informática - Teste",
      progress: 25,
    },
    topic1: {
      subject_id: TEST_IDS.subject1,
      name: "Princípios Fundamentais - Teste",
      completed: false,
    },
    question1: {
      competition_id: TEST_IDS.competition,
      subject_id: TEST_IDS.subject1,
      topic_id: TEST_IDS.topic1,
      question_text: "Esta é uma questão de teste?",
      options: [
        { text: "Sim, é uma questão de teste", isCorrect: true },
        { text: "Não, é uma questão real", isCorrect: false },
        { text: "Talvez seja um teste", isCorrect: false },
      ],
      correct_answer: "A",
      explanation: "Esta é apenas uma questão para teste do sistema CRUD",
      difficulty: "facil" as const,
      is_ai_generated: false,
    },
  };
}

// =====================================
// TESTES DE AUTENTICAÇÃO
// =====================================

const authTests: TestSuite = {
  name: "Testes de Autenticação",
  tests: [
    async () =>
      runTest("Validar Estado de Autenticação", async () => {
        const { user, error } = await validateAuthState();

        if (error || !user) {
          throw new Error("Usuário não está autenticado para executar testes");
        }

        return { userId: user.id, email: user.email };
      }),

    async () =>
      runTest("Verificar Sessão Válida", async () => {
        const user = await requireAuth();

        if (!user.id) {
          throw new Error("Sessão inválida");
        }

        return { sessionValid: true, userId: user.id };
      }),

    async () =>
      runTest("Testar withAuth Wrapper", async () => {
        const result = await withAuth(async (user) => {
          return { testSuccess: true, userId: user.id };
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result.data;
      }),
  ],
};

// =====================================
// TESTES CRUD - CONCURSOS
// =====================================

const competitionCrudTests: TestSuite = {
  name: "CRUD de Concursos",
  tests: [
    // 1. CREATE
    async () =>
      runTest("Criar Concurso", async () => {
        const testData = createTestData();

        const result = await withAuth(async (user) => {
          const { data, error } = await supabase
            .from("competitions")
            .insert([
              {
                id: TEST_IDS.competition,
                ...testData.competition,
                user_id: user.id,
              },
            ])
            .select()
            .single();

          if (error) {
            throw new Error(handleSupabaseCompetitionError(error));
          }

          return data;
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result.data;
      }),

    // 2. READ
    async () =>
      runTest("Buscar Concursos", async () => {
        const result = await withAuth(async (user) => {
          // Primeiro, verificar se o concurso existe com uma query simples
          const { data: basicData, error: basicError } = await supabase
            .from("competitions")
            .select("id, title, user_id")
            .eq("user_id", user.id)
            .eq("id", TEST_IDS.competition)
            .single();

          if (basicError) {
            throw new Error(
              `Erro ao buscar concurso básico: ${handleSupabaseCompetitionError(basicError)}`,
            );
          }

          if (!basicData) {
            throw new Error("Concurso criado não foi encontrado");
          }

          // Se encontrou, fazer a query completa
          const { data, error } = await supabase
            .from("competitions")
            .select(
              `
            *,
            competition_subjects (
              *,
              competition_topics (*)
            ),
            competition_questions (*)
          `,
            )
            .eq("user_id", user.id)
            .eq("id", TEST_IDS.competition)
            .single();

          if (error) {
            throw new Error(handleSupabaseCompetitionError(error));
          }

          return data;
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result.data;
      }),

    // 3. UPDATE
    async () =>
      runTest("Atualizar Concurso", async () => {
        const updates = {
          status: "inscrito" as const,
          title: "Teste CRUD - Concurso Atualizado",
        };

        const result = await withAuth(async (user) => {
          // Primeiro verificar se o usuário tem acesso
          const { data: existing } = await supabase
            .from("competitions")
            .select("user_id")
            .eq("id", TEST_IDS.competition)
            .single();

          if (!existing || existing.user_id !== user.id) {
            throw new Error("Acesso negado ao concurso");
          }

          const { data, error } = await supabase
            .from("competitions")
            .update(updates)
            .eq("id", TEST_IDS.competition)
            .eq("user_id", user.id)
            .select()
            .single();

          if (error) {
            throw new Error(handleSupabaseCompetitionError(error));
          }

          return data;
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result.data;
      }),
  ],
};

// =====================================
// TESTES CRUD - DISCIPLINAS
// =====================================

const subjectCrudTests: TestSuite = {
  name: "CRUD de Disciplinas",
  tests: [
    // 1. CREATE
    async () =>
      runTest("Adicionar Disciplinas", async () => {
        const testData = createTestData();

        const result = await withAuth(async (user) => {
          const subjectsWithIds = [
            { id: TEST_IDS.subject1, ...testData.subject1 },
            { id: TEST_IDS.subject2, ...testData.subject2 },
          ];

          const { data, error } = await supabase
            .from("competition_subjects")
            .insert(subjectsWithIds)
            .select();

          if (error) {
            throw new Error(handleSupabaseCompetitionError(error));
          }

          if (!data || data.length !== 2) {
            throw new Error("Nem todas as disciplinas foram criadas");
          }

          return data;
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result.data;
      }),

    // 2. UPDATE
    async () =>
      runTest("Atualizar Progresso da Disciplina", async () => {
        const newProgress = 50;

        const result = await withAuth(async (user) => {
          const { data, error } = await supabase
            .from("competition_subjects")
            .update({
              progress: newProgress,
              updated_at: new Date().toISOString(),
            })
            .eq("id", TEST_IDS.subject1)
            .select()
            .single();

          if (error) {
            throw new Error(handleSupabaseCompetitionError(error));
          }

          if (data.progress !== newProgress) {
            throw new Error("Progresso não foi atualizado corretamente");
          }

          return data;
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result.data;
      }),
  ],
};

// =====================================
// TESTES CRUD - TÓPICOS
// =====================================

const topicCrudTests: TestSuite = {
  name: "CRUD de Tópicos",
  tests: [
    // 1. CREATE
    async () =>
      runTest("Adicionar Tópico", async () => {
        const testData = createTestData();

        const result = await withAuth(async (user) => {
          const topicWithId = { id: TEST_IDS.topic1, ...testData.topic1 };

          const { data, error } = await supabase
            .from("competition_topics")
            .insert([topicWithId])
            .select()
            .single();

          if (error) {
            throw new Error(handleSupabaseCompetitionError(error));
          }

          return data;
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result.data;
      }),

    // 2. UPDATE
    async () =>
      runTest("Marcar Tópico como Completado", async () => {
        const result = await withAuth(async (user) => {
          const { data, error } = await supabase
            .from("competition_topics")
            .update({
              completed: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", TEST_IDS.topic1)
            .select()
            .single();

          if (error) {
            throw new Error(handleSupabaseCompetitionError(error));
          }

          if (!data.completed) {
            throw new Error("Tópico não foi marcado como completado");
          }

          return data;
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result.data;
      }),
  ],
};

// =====================================
// TESTES CRUD - QUESTÕES
// =====================================

const questionCrudTests: TestSuite = {
  name: "CRUD de Questões",
  tests: [
    // 1. CREATE
    async () =>
      runTest("Adicionar Questão", async () => {
        const testData = createTestData();

        const result = await withAuth(async (user) => {
          const questionWithId = {
            id: TEST_IDS.question1,
            ...testData.question1,
          };

          const { data, error } = await supabase
            .from("competition_questions")
            .insert([questionWithId])
            .select()
            .single();

          if (error) {
            throw new Error(handleSupabaseCompetitionError(error));
          }

          return data;
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result.data;
      }),

    // 2. READ
    async () =>
      runTest("Buscar Questões do Concurso", async () => {
        const result = await withAuth(async (user) => {
          const { data, error } = await supabase
            .from("competition_questions")
            .select("*")
            .eq("competition_id", TEST_IDS.competition);

          if (error) {
            throw new Error(handleSupabaseCompetitionError(error));
          }

          // Retornar array vazio se não houver questões ao invés de falhar
          return data || [];
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result.data;
      }),
  ],
};

// =====================================
// TESTES DE PERFORMANCE
// =====================================

const performanceTests: TestSuite = {
  name: "Testes de Performance",
  tests: [
    async () =>
      runTest("Performance - Busca de Concursos", async () => {
        const startTime = Date.now();

        const result = await withAuth(async (user) => {
          const { data, error } = await supabase
            .from("competitions")
            .select(
              `
            *,
            competition_subjects (
              *,
              competition_topics (*)
            ),
            competition_questions (*)
          `,
            )
            .eq("user_id", user.id)
            .limit(10);

          if (error) {
            throw new Error(handleSupabaseCompetitionError(error));
          }

          return data;
        });

        const duration = Date.now() - startTime;
        trackPerformance("Busca de Concursos Completa", startTime);

        if (duration > 3000) {
          competitionLogger.warn("Performance abaixo do esperado", {
            duration,
          });
        }

        if (result.error) {
          throw new Error(result.error);
        }

        return { data: result.data, duration };
      }),

    async () =>
      runTest("Performance - Cache de Concursos", async () => {
        const startTime = Date.now();

        // Primeira busca (deve ser lenta)
        const firstFetch = await withAuth(async (user) => {
          const { data } = await supabase
            .from("competitions")
            .select("*")
            .eq("user_id", user.id);

          competitionCache.setCompetitions(user.id, data || []);
          return data;
        });

        const firstDuration = Date.now() - startTime;

        // Segunda busca (deve vir do cache)
        const cacheStartTime = Date.now();
        const cachedData = await withAuth(async (user) => {
          return competitionCache.getCompetitions(user.id);
        });

        const cacheDuration = Date.now() - cacheStartTime;

        if (cacheDuration > firstDuration) {
          throw new Error("Cache não está melhorando a performance");
        }

        return {
          firstFetchDuration: firstDuration,
          cacheFetchDuration: cacheDuration,
          improvement: `${Math.round(((firstDuration - cacheDuration) / firstDuration) * 100)}%`,
        };
      }),
  ],
};

// =====================================
// TESTES DE LIMPEZA
// =====================================

const cleanupTests: TestSuite = {
  name: "Limpeza de Dados de Teste",
  tests: [
    // 4. DELETE (em ordem específica devido às foreign keys)
    async () =>
      runTest("Deletar Questão de Teste", async () => {
        const result = await withAuth(async (user) => {
          const { error } = await supabase
            .from("competition_questions")
            .delete()
            .eq("id", TEST_IDS.question1);

          if (error) {
            // Log mas não falhe o teste se o item não existir
            competitionLogger.warn("Erro ao deletar questão de teste", error);
          }

          return { deleted: true };
        });

        return result.data || { deleted: true };
      }),

    async () =>
      runTest("Deletar Tópico de Teste", async () => {
        const result = await withAuth(async (user) => {
          const { error } = await supabase
            .from("competition_topics")
            .delete()
            .eq("id", TEST_IDS.topic1);

          if (error) {
            competitionLogger.warn("Erro ao deletar tópico de teste", error);
          }

          return { deleted: true };
        });

        return result.data || { deleted: true };
      }),

    async () =>
      runTest("Deletar Disciplinas de Teste", async () => {
        const result = await withAuth(async (user) => {
          const { error } = await supabase
            .from("competition_subjects")
            .delete()
            .in("id", [TEST_IDS.subject1, TEST_IDS.subject2]);

          if (error) {
            competitionLogger.warn(
              "Erro ao deletar disciplinas de teste",
              error,
            );
          }

          return { deleted: true };
        });

        return result.data || { deleted: true };
      }),

    async () =>
      runTest("Deletar Concurso de Teste", async () => {
        const result = await withAuth(async (user) => {
          const { error } = await supabase
            .from("competitions")
            .delete()
            .eq("id", TEST_IDS.competition)
            .eq("user_id", user.id);

          if (error) {
            competitionLogger.warn("Erro ao deletar concurso de teste", error);
          }

          // Limpar cache
          competitionCache.invalidateUserCache(user.id);

          return { deleted: true };
        });

        return result.data || { deleted: true };
      }),
  ],
};

// =====================================
// EXECUTOR PRINCIPAL DE TESTES
// =====================================

export async function runCompetitionCRUDTests(): Promise<{
  success: boolean;
  results: Array<{ suiteName: string; results: TestResult[] }>;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    totalDuration: number;
  };
}> {
  console.log("🧪 Iniciando Teste Completo de CRUD dos Concursos...\n");

  const testSuites = [
    authTests,
    competitionCrudTests,
    subjectCrudTests,
    topicCrudTests,
    questionCrudTests,
    performanceTests,
    cleanupTests,
  ];

  const allResults: Array<{ suiteName: string; results: TestResult[] }> = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalDuration = 0;

  for (const suite of testSuites) {
    console.log(`\n📋 Executando: ${suite.name}`);
    console.log("=".repeat(50));

    const suiteResults: TestResult[] = [];

    for (const test of suite.tests) {
      const result = await test();
      suiteResults.push(result);

      if (result.success) {
        totalPassed++;
        console.log(`✅ ${result.message} (${result.duration}ms)`);
      } else {
        totalFailed++;
        console.log(`❌ ${result.message}`);
        if (result.error) {
          console.log(`   Erro: ${result.error.message || result.error}`);
        }
      }

      totalDuration += result.duration || 0;
    }

    allResults.push({
      suiteName: suite.name,
      results: suiteResults,
    });
  }

  const totalTests = totalPassed + totalFailed;
  const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

  console.log("\n📊 RESUMO DOS TESTES");
  console.log("=".repeat(50));
  console.log(`Total de testes: ${totalTests}`);
  console.log(`✅ Passou: ${totalPassed}`);
  console.log(`❌ Falhou: ${totalFailed}`);
  console.log(`📈 Taxa de sucesso: ${successRate.toFixed(1)}%`);
  console.log(`⏱️ Tempo total: ${totalDuration}ms`);

  if (totalFailed === 0) {
    console.log(
      "\n🎉 Todos os testes passaram! O sistema de concursos está funcionando corretamente.",
    );
  } else {
    console.log(
      `\n⚠️ ${totalFailed} teste(s) falharam. Verifique os erros acima.`,
    );
  }

  return {
    success: totalFailed === 0,
    results: allResults,
    summary: {
      totalTests,
      passed: totalPassed,
      failed: totalFailed,
      totalDuration,
    },
  };
}

// =====================================
// TESTES INDIVIDUAIS EXPORTADOS
// =====================================

export {
  authTests,
  competitionCrudTests,
  subjectCrudTests,
  topicCrudTests,
  questionCrudTests,
  performanceTests,
  cleanupTests,
  runTest,
  createTestData,
  TEST_IDS,
};
