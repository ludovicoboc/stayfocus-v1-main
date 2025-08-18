/**
 * Sistema de Testes CRUD para Concursos
 * Conforme Etapa 5.1 e 5.2 do todocc.md
 */

import { supabase } from "./supabase";
import { validateAuthState, requireAuth } from "./auth-utils";
import {
  competitionLogger,
  trackPerformance,
  withPerformanceTracking,
} from "./error-handler";
import { competitionCache } from "./cache-manager";
import type { Concurso, Disciplina, Topico, Questao } from "@/types/concursos";

// =====================================
// TIPOS E INTERFACES PARA TESTES
// =====================================

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  success: boolean;
}

interface TestData {
  competition: Partial<Concurso>;
  subjects: Partial<Disciplina>[];
  topics: Partial<Topico>[];
  questions: Partial<Questao>[];
}

// =====================================
// DADOS DE TESTE
// =====================================

const createTestData = (): TestData => ({
  competition: {
    id: `test-comp-${Date.now()}`,
    title: "Teste - Concurso Público Federal",
    organizer: "Órgão de Teste",
    registration_date: "2024-03-15",
    exam_date: "2024-05-20",
    edital_link: "https://exemplo.gov.br/edital-teste",
    status: "planejado" as const,
  },
  subjects: [
    {
      id: `test-subj-1-${Date.now()}`,
      name: "Direito Constitucional - Teste",
      progress: 0,
    },
    {
      id: `test-subj-2-${Date.now()}`,
      name: "Direito Administrativo - Teste",
      progress: 25,
    },
  ],
  topics: [
    {
      id: `test-topic-1-${Date.now()}`,
      name: "Princípios Constitucionais - Teste",
      completed: false,
    },
    {
      id: `test-topic-2-${Date.now()}`,
      name: "Atos Administrativos - Teste",
      completed: true,
    },
  ],
  questions: [
    {
      id: `test-quest-1-${Date.now()}`,
      question_text: "Pergunta de teste sobre princípios constitucionais?",
      options: [
        { text: "Opção A", isCorrect: true },
        { text: "Opção B", isCorrect: false },
        { text: "Opção C", isCorrect: false },
        { text: "Opção D", isCorrect: false },
      ],
      correct_answer: "Opção A",
      explanation: "Explicação da resposta correta",
      difficulty: "medio" as const,
    },
  ],
});

// =====================================
// UTILITÁRIOS DE TESTE
// =====================================

class TestRunner {
  private results: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;

  startSuite(name: string): void {
    this.currentSuite = {
      name,
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      success: false,
    };
  }

  async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const data = await testFn();
      const duration = Date.now() - startTime;

      const result: TestResult = {
        name,
        success: true,
        duration,
        data,
      };

      this.addTestResult(result);
      competitionLogger.success(`✅ ${name} - ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        name,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      };

      this.addTestResult(result);
      competitionLogger.error(`❌ ${name} - ${duration}ms`, error);
      return result;
    }
  }

  private addTestResult(result: TestResult): void {
    if (!this.currentSuite) return;

    this.currentSuite.tests.push(result);
    this.currentSuite.totalTests++;
    this.currentSuite.totalDuration += result.duration;

    if (result.success) {
      this.currentSuite.passedTests++;
    } else {
      this.currentSuite.failedTests++;
    }
  }

  finishSuite(): TestSuite | null {
    if (!this.currentSuite) return null;

    this.currentSuite.success = this.currentSuite.failedTests === 0;
    this.results.push(this.currentSuite);

    const suite = this.currentSuite;
    this.currentSuite = null;

    competitionLogger.info(`📊 Suite: ${suite.name}`, {
      total: suite.totalTests,
      passed: suite.passedTests,
      failed: suite.failedTests,
      duration: suite.totalDuration,
      success: suite.success,
    });

    return suite;
  }

  getResults(): TestSuite[] {
    return [...this.results];
  }

  generateReport(): string {
    const totalSuites = this.results.length;
    const passedSuites = this.results.filter((s) => s.success).length;
    const totalTests = this.results.reduce((sum, s) => sum + s.totalTests, 0);
    const passedTests = this.results.reduce((sum, s) => sum + s.passedTests, 0);
    const totalDuration = this.results.reduce(
      (sum, s) => sum + s.totalDuration,
      0,
    );

    return `
🏆 RELATÓRIO DE TESTES - CONCURSOS

📈 RESUMO GERAL:
- Suites: ${passedSuites}/${totalSuites} (${((passedSuites / totalSuites) * 100).toFixed(1)}%)
- Testes: ${passedTests}/${totalTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)
- Duração Total: ${totalDuration}ms
- Status: ${passedSuites === totalSuites ? "✅ PASSOU" : "❌ FALHOU"}

📋 DETALHES POR SUITE:
${this.results
  .map(
    (suite) => `
- ${suite.name}: ${suite.passedTests}/${suite.totalTests} (${suite.totalDuration}ms) ${suite.success ? "✅" : "❌"}
`,
  )
  .join("")}

⚠️ TESTES FALHARAM:
${this.results
  .flatMap((suite) =>
    suite.tests
      .filter((test) => !test.success)
      .map((test) => `- ${suite.name} > ${test.name}: ${test.error}`),
  )
  .join("\n")}
    `;
  }
}

// =====================================
// TESTES BÁSICOS DE CRUD
// =====================================

export class CompetitionCRUDTests {
  private runner = new TestRunner();
  private testData: TestData;
  private createdIds: {
    competitionId?: string;
    subjectIds: string[];
    topicIds: string[];
    questionIds: string[];
  } = { subjectIds: [], topicIds: [], questionIds: [] };

  constructor() {
    this.testData = createTestData();
  }

  /**
   * Executa todos os testes CRUD
   */
  async runAllTests(): Promise<TestSuite[]> {
    competitionLogger.info("🚀 Iniciando testes CRUD de concursos");

    await this.testAuthentication();
    await this.testCompetitionCRUD();
    await this.testSubjectCRUD();
    await this.testTopicCRUD();
    await this.testQuestionCRUD();
    await this.testPerformance();
    await this.testCache();
    await this.cleanup();

    const report = this.runner.generateReport();
    competitionLogger.info(report);

    return this.runner.getResults();
  }

  /**
   * Teste de Autenticação
   */
  private async testAuthentication(): Promise<void> {
    this.runner.startSuite("Autenticação");

    await this.runner.runTest("Validar estado de autenticação", async () => {
      const { user, error } = await validateAuthState();
      if (error || !user) {
        throw new Error("Usuário não autenticado");
      }
      return { userId: user.id, email: user.email };
    });

    await this.runner.runTest("Exigir autenticação", async () => {
      const user = await requireAuth();
      return { userId: user.id };
    });

    this.runner.finishSuite();
  }

  /**
   * Testes CRUD de Concursos
   */
  private async testCompetitionCRUD(): Promise<void> {
    this.runner.startSuite("CRUD - Concursos");

    // CREATE
    await this.runner.runTest("Criar concurso", async () => {
      const user = await requireAuth();
      const { data, error } = await supabase
        .from("competitions")
        .insert([
          {
            ...this.testData.competition,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      this.createdIds.competitionId = data.id;
      return data;
    });

    // READ
    await this.runner.runTest("Buscar concursos", async () => {
      const user = await requireAuth();
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Nenhum concurso encontrado");
      }
      return data;
    });

    // UPDATE
    await this.runner.runTest("Atualizar concurso", async () => {
      if (!this.createdIds.competitionId) {
        throw new Error("ID do concurso não encontrado");
      }

      const { data, error } = await supabase
        .from("competitions")
        .update({ status: "inscrito" })
        .eq("id", this.createdIds.competitionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    // READ SPECIFIC
    await this.runner.runTest("Buscar concurso específico", async () => {
      if (!this.createdIds.competitionId) {
        throw new Error("ID do concurso não encontrado");
      }

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
        .eq("id", this.createdIds.competitionId)
        .single();

      if (error) throw error;
      return data;
    });

    this.runner.finishSuite();
  }

  /**
   * Testes CRUD de Disciplinas
   */
  private async testSubjectCRUD(): Promise<void> {
    this.runner.startSuite("CRUD - Disciplinas");

    // CREATE
    await this.runner.runTest("Adicionar disciplinas", async () => {
      if (!this.createdIds.competitionId) {
        throw new Error("Concurso não criado");
      }

      const subjects = this.testData.subjects.map((subject) => ({
        ...subject,
        competition_id: this.createdIds.competitionId,
      }));

      const { data, error } = await supabase
        .from("competition_subjects")
        .insert(subjects)
        .select();

      if (error) throw error;
      this.createdIds.subjectIds = data.map((s) => s.id);
      return data;
    });

    // READ
    await this.runner.runTest("Buscar disciplinas", async () => {
      if (!this.createdIds.competitionId) {
        throw new Error("Concurso não criado");
      }

      const { data, error } = await supabase
        .from("competition_subjects")
        .select("*")
        .eq("competition_id", this.createdIds.competitionId);

      if (error) throw error;
      return data;
    });

    // UPDATE
    await this.runner.runTest("Atualizar progresso disciplina", async () => {
      if (this.createdIds.subjectIds.length === 0) {
        throw new Error("Nenhuma disciplina criada");
      }

      const { data, error } = await supabase
        .from("competition_subjects")
        .update({ progress: 50 })
        .eq("id", this.createdIds.subjectIds[0])
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    this.runner.finishSuite();
  }

  /**
   * Testes CRUD de Tópicos
   */
  private async testTopicCRUD(): Promise<void> {
    this.runner.startSuite("CRUD - Tópicos");

    // CREATE
    await this.runner.runTest("Adicionar tópicos", async () => {
      if (this.createdIds.subjectIds.length === 0) {
        throw new Error("Nenhuma disciplina criada");
      }

      const topics = this.testData.topics.map((topic, index) => ({
        ...topic,
        subject_id:
          this.createdIds.subjectIds[index % this.createdIds.subjectIds.length],
      }));

      const { data, error } = await supabase
        .from("competition_topics")
        .insert(topics)
        .select();

      if (error) throw error;
      this.createdIds.topicIds = data.map((t) => t.id);
      return data;
    });

    // UPDATE
    await this.runner.runTest("Marcar tópico como completado", async () => {
      if (this.createdIds.topicIds.length === 0) {
        throw new Error("Nenhum tópico criado");
      }

      const { data, error } = await supabase
        .from("competition_topics")
        .update({ completed: true })
        .eq("id", this.createdIds.topicIds[0])
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    this.runner.finishSuite();
  }

  /**
   * Testes CRUD de Questões
   */
  private async testQuestionCRUD(): Promise<void> {
    this.runner.startSuite("CRUD - Questões");

    // CREATE
    await this.runner.runTest("Adicionar questões", async () => {
      if (
        !this.createdIds.competitionId ||
        this.createdIds.subjectIds.length === 0
      ) {
        throw new Error("Concurso ou disciplinas não criados");
      }

      const questions = this.testData.questions.map((question) => ({
        ...question,
        competition_id: this.createdIds.competitionId,
        subject_id: this.createdIds.subjectIds[0],
        topic_id: this.createdIds.topicIds[0] || null,
      }));

      const { data, error } = await supabase
        .from("competition_questions")
        .insert(questions)
        .select();

      if (error) throw error;
      this.createdIds.questionIds = data.map((q) => q.id);
      return data;
    });

    // READ
    await this.runner.runTest("Buscar questões do concurso", async () => {
      if (!this.createdIds.competitionId) {
        throw new Error("Concurso não criado");
      }

      const { data, error } = await supabase
        .from("competition_questions")
        .select("*")
        .eq("competition_id", this.createdIds.competitionId);

      if (error) throw error;
      return data;
    });

    this.runner.finishSuite();
  }

  /**
   * Testes de Performance
   */
  private async testPerformance(): Promise<void> {
    this.runner.startSuite("Performance");

    await this.runner.runTest(
      "Teste de performance - busca múltipla",
      async () => {
        const startTime = Date.now();

        const promises = Array.from({ length: 5 }, async () => {
          const { data, error } = await supabase
            .from("competitions")
            .select("*")
            .limit(10);

          if (error) throw error;
          return data;
        });

        await Promise.all(promises);
        const duration = Date.now() - startTime;

        if (duration > 5000) {
          throw new Error(`Performance muito lenta: ${duration}ms`);
        }

        return { duration };
      },
    );

    this.runner.finishSuite();
  }

  /**
   * Testes de Cache
   */
  private async testCache(): Promise<void> {
    this.runner.startSuite("Cache");

    await this.runner.runTest("Teste de cache de competições", async () => {
      const userId = "test-user-123";
      const testData = [{ id: "1", title: "Test" }];

      // Set cache
      competitionCache.setCompetitions(userId, testData);

      // Get cache
      const cached = competitionCache.getCompetitions(userId);

      if (!cached || JSON.stringify(cached) !== JSON.stringify(testData)) {
        throw new Error("Cache não funcionou corretamente");
      }

      return { cached };
    });

    this.runner.finishSuite();
  }

  /**
   * Limpeza dos dados de teste
   */
  private async cleanup(): Promise<void> {
    this.runner.startSuite("Limpeza");

    // Deletar questões
    if (this.createdIds.questionIds.length > 0) {
      await this.runner.runTest("Deletar questões de teste", async () => {
        const { error } = await supabase
          .from("competition_questions")
          .delete()
          .in("id", this.createdIds.questionIds);

        if (error) throw error;
        return { deleted: this.createdIds.questionIds.length };
      });
    }

    // Deletar tópicos
    if (this.createdIds.topicIds.length > 0) {
      await this.runner.runTest("Deletar tópicos de teste", async () => {
        const { error } = await supabase
          .from("competition_topics")
          .delete()
          .in("id", this.createdIds.topicIds);

        if (error) throw error;
        return { deleted: this.createdIds.topicIds.length };
      });
    }

    // Deletar disciplinas
    if (this.createdIds.subjectIds.length > 0) {
      await this.runner.runTest("Deletar disciplinas de teste", async () => {
        const { error } = await supabase
          .from("competition_subjects")
          .delete()
          .in("id", this.createdIds.subjectIds);

        if (error) throw error;
        return { deleted: this.createdIds.subjectIds.length };
      });
    }

    // Deletar concurso
    if (this.createdIds.competitionId) {
      await this.runner.runTest("Deletar concurso de teste", async () => {
        const { error } = await supabase
          .from("competitions")
          .delete()
          .eq("id", this.createdIds.competitionId);

        if (error) throw error;
        return { deleted: 1 };
      });
    }

    this.runner.finishSuite();
  }
}

// =====================================
// UTILITÁRIOS PARA EXECUÇÃO
// =====================================

/**
 * Executa todos os testes de concursos
 */
export async function runCompetitionTests(): Promise<TestSuite[]> {
  const tests = new CompetitionCRUDTests();
  return await tests.runAllTests();
}

/**
 * Executa testes específicos por suite
 */
export async function runSpecificTests(
  suiteNames: string[],
): Promise<TestSuite[]> {
  const tests = new CompetitionCRUDTests();
  const allResults = await tests.runAllTests();

  return allResults.filter((suite) => suiteNames.includes(suite.name));
}

/**
 * Valida se o sistema está pronto para testes
 */
export async function validateTestEnvironment(): Promise<boolean> {
  try {
    // Verificar autenticação
    const { user, error } = await validateAuthState();
    if (error || !user) {
      competitionLogger.error("Ambiente de teste: usuário não autenticado");
      return false;
    }

    // Verificar conexão com banco
    const { data, error: dbError } = await supabase
      .from("competitions")
      .select("count(*)")
      .limit(1);

    if (dbError) {
      competitionLogger.error(
        "Ambiente de teste: erro de conexão com banco",
        dbError,
      );
      return false;
    }

    competitionLogger.success("Ambiente de teste validado com sucesso");
    return true;
  } catch (error) {
    competitionLogger.error("Erro na validação do ambiente de teste", error);
    return false;
  }
}
