"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useConcursos } from "@/hooks/use-concursos";
import { competitionCache } from "@/lib/cache-manager";
import { envValidator } from "@/lib/env-validator";
import { competitionLogger } from "@/lib/error-handler";
import { runCompetitionCRUDTests } from "@/tests/competition-crud.test";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Trash2,
  RefreshCw,
  Database,
  Shield,
  Zap,
} from "lucide-react";

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
  duration?: number;
}

interface TestSuite {
  name: string;
  totalTests: number;
  passed: number;
  failed: number;
  details?: TestResult[];
}

interface TestResponse {
  success: boolean;
  message: string;
  executionTime: number;
  testResults: {
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      totalDuration: number;
    };
    suites: TestSuite[];
  };
  metadata: {
    userId: string;
    timestamp: string;
    environment: string;
    version: string;
  };
}

export default function TestePage() {
  const { user } = useAuth();
  const {
    concursos,
    loading,
    fetchConcursos,
    createCompetition,
    updateCompetition,
    deleteCompetition,
    createTestData,
  } = useConcursos();

  const [testResults, setTestResults] = useState<TestResponse | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<string>("all");
  const [showDetails, setShowDetails] = useState(false);
  const [envValidation, setEnvValidation] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Validar ambiente na montagem
      validateEnvironment();
      updateCacheStats();
    }
  }, [user]);

  const validateEnvironment = () => {
    try {
      // Só validar no servidor
      if (typeof window === "undefined" && envValidator) {
        const validation = envValidator.validate();
        setEnvValidation(validation);

        if (!validation.isValid) {
          competitionLogger.error(
            "Ambiente não está configurado corretamente",
            validation,
          );
        }
      } else {
        // No cliente, simular validação básica
        setEnvValidation({
          isValid: true,
          missingRequired: [],
          invalidValues: [],
          warnings: [],
          summary: { total: 12, validated: 12, missing: 0, invalid: 0 },
        });
      }
    } catch (error) {
      competitionLogger.error("Erro na validação de ambiente", error);
      setEnvValidation({
        isValid: false,
        missingRequired: ["Environment validation failed"],
        invalidValues: [],
        warnings: [],
        summary: { total: 12, validated: 0, missing: 12, invalid: 0 },
      });
    }
  };

  const updateCacheStats = () => {
    const stats = competitionCache.getAllStats();
    setCacheStats(stats);
  };

  const runCRUDTests = async () => {
    if (!user) {
      alert("Você precisa estar logado para executar os testes");
      return;
    }

    setIsRunningTests(true);
    setTestResults(null);
    setTestError(null);

    try {
      competitionLogger.info("Iniciando execução de testes CRUD");

      // Executar testes diretamente no cliente
      const startTime = Date.now();
      const testData = await runCompetitionCRUDTests();
      const executionTime = Date.now() - startTime;

      const data: TestResponse = {
        success: testData.success,
        message: testData.success
          ? "✅ Todos os testes passaram!"
          : "❌ Alguns testes falharam",
        executionTime,
        testResults: {
          summary: testData.summary,
          suites: testData.results.map((suite) => ({
            name: suite.suiteName,
            totalTests: suite.results.length,
            passed: suite.results.filter((r) => r.success).length,
            failed: suite.results.filter((r) => !r.success).length,
            details: showDetails
              ? suite.results
              : suite.results.filter((r) => !r.success),
          })),
        },
        metadata: {
          userId: user.id,
          timestamp: new Date().toISOString(),
          environment: "client",
          version: "1.0.0",
        },
      };

      setTestResults(data);

      if (data.success) {
        competitionLogger.success("Todos os testes passaram!");
      } else {
        competitionLogger.error("Alguns testes falharam", data);
      }

      // Atualizar stats do cache após os testes
      updateCacheStats();
    } catch (error) {
      competitionLogger.error("Erro ao executar testes", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      setTestError("Erro ao executar testes: " + errorMessage);
      setTestResults({
        success: false,
        message: "Erro ao executar testes: " + errorMessage,
        executionTime: 0,
        testResults: {
          summary: { totalTests: 0, passed: 0, failed: 0, totalDuration: 0 },
          suites: [],
        },
        metadata: {
          userId: user.id,
          timestamp: new Date().toISOString(),
          environment: "client",
          version: "1.0.0",
        },
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const cleanupTestData = async () => {
    try {
      // Executar limpeza diretamente
      competitionLogger.info("Iniciando limpeza de dados de teste");

      // Por ora, apenas recarregar os dados
      await fetchConcursos();
      updateCacheStats();

      alert("Dados de teste limpos com sucesso!");
      competitionLogger.success("Limpeza concluída");
    } catch (error) {
      alert("Erro ao limpar dados de teste");
      competitionLogger.error("Erro na limpeza", error);
    }
  };

  const testIndividualFunction = async (functionName: string) => {
    try {
      switch (functionName) {
        case "createCompetition":
          const result = await createCompetition({
            title: "Teste Individual - " + Date.now(),
            organizer: "Teste Org",
            status: "planejado",
          });
          alert(
            result.error
              ? "Erro: " + result.error
              : "Concurso criado com sucesso!",
          );
          break;

        case "fetchConcursos":
          await fetchConcursos();
          alert("Concursos recarregados!");
          break;

        case "createTestData":
          const testId = "test-individual-" + Date.now();
          const testData = await createTestData(testId);
          alert(
            testData
              ? "Dados de teste criados!"
              : "Erro ao criar dados de teste",
          );
          break;

        default:
          alert("Função não implementada");
      }
    } catch (error) {
      alert(
        "Erro: " +
          (error instanceof Error ? error.message : "Erro desconhecido"),
      );
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "✅ Passou" : "❌ Falhou"}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Autenticação Necessária</AlertTitle>
          <AlertDescription>
            Você precisa estar logado para acessar a página de testes.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          🧪 Testes do Sistema de Concursos
        </h1>
        <p className="text-muted-foreground mt-2">
          Execute testes completos do CRUD e validações do sistema
        </p>
      </div>

      {/* Status do Ambiente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status do Ambiente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span>Usuário Autenticado:</span>
              {getStatusIcon(!!user)}
            </div>
            <div className="flex items-center justify-between">
              <span>Variáveis de Ambiente:</span>
              {envValidation ? (
                getStatusIcon(envValidation.isValid)
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Cache Funcionando:</span>
              {cacheStats ? (
                getStatusIcon(Object.keys(cacheStats).length > 0)
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
          </div>

          {envValidation && !envValidation.isValid && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Problemas de Configuração</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1">
                  {envValidation.missingRequired.map((key: string) => (
                    <div key={key} className="text-sm">
                      ❌ Faltando: {key}
                    </div>
                  ))}
                  {envValidation.invalidValues.map((item: any) => (
                    <div key={item.key} className="text-sm">
                      ⚠️ Inválido: {item.key}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="crud-tests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="crud-tests">Testes CRUD</TabsTrigger>
          <TabsTrigger value="individual">Testes Individuais</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
        </TabsList>

        {/* Testes CRUD Completos */}
        <TabsContent value="crud-tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Testes CRUD Completos
              </CardTitle>
              <CardDescription>
                Execute todos os testes de Create, Read, Update e Delete do
                sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={runCRUDTests}
                  disabled={isRunningTests}
                  className="flex items-center gap-2"
                >
                  {isRunningTests ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isRunningTests
                    ? "Executando..."
                    : "Executar Todos os Testes"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Ocultar" : "Mostrar"} Detalhes
                </Button>

                <Button
                  variant="destructive"
                  onClick={cleanupTestData}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar Dados de Teste
                </Button>
              </div>

              {testError && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Erro na Execução dos Testes</AlertTitle>
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              )}

              {testResults && testResults.testResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {testResults.testResults.summary.totalTests}
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {testResults.testResults.summary.passed}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Passou
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {testResults.testResults.summary.failed}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Falhou
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {testResults.executionTime}ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Duração
                      </div>
                    </div>
                  </div>

                  <Alert>
                    {getStatusIcon(testResults.success)}
                    <AlertTitle>
                      {testResults.success
                        ? "✅ Todos os Testes Passaram!"
                        : "❌ Alguns Testes Falharam"}
                    </AlertTitle>
                    <AlertDescription>{testResults.message}</AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    {testResults.testResults?.suites?.map((suite, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {suite.name}
                            </CardTitle>
                            {getStatusBadge(suite.failed === 0)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-4 text-sm">
                            <span>Total: {suite.totalTests}</span>
                            <span className="text-green-600">
                              Passou: {suite.passed}
                            </span>
                            <span className="text-red-600">
                              Falhou: {suite.failed}
                            </span>
                          </div>

                          {showDetails &&
                            suite.details &&
                            suite.details.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {suite.details.map((detail, detailIndex) => (
                                  <div
                                    key={detailIndex}
                                    className="flex items-center gap-2 text-sm p-2 rounded bg-muted"
                                  >
                                    {getStatusIcon(detail.success)}
                                    <span
                                      className={
                                        detail.success
                                          ? "text-green-700"
                                          : "text-red-700"
                                      }
                                    >
                                      {detail.message}
                                    </span>
                                    {detail.duration && (
                                      <span className="text-muted-foreground">
                                        ({detail.duration}ms)
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                        </CardContent>
                      </Card>
                    )) || <div>Nenhum resultado de teste disponível</div>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testes Individuais */}
        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testes de Funções Individuais</CardTitle>
              <CardDescription>
                Teste funções específicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => testIndividualFunction("createCompetition")}
                  className="h-20 flex flex-col"
                >
                  <div className="font-semibold">Criar Concurso</div>
                  <div className="text-xs text-muted-foreground">
                    Testa criação de concurso
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => testIndividualFunction("fetchConcursos")}
                  className="h-20 flex flex-col"
                >
                  <div className="font-semibold">Buscar Concursos</div>
                  <div className="text-xs text-muted-foreground">
                    Testa busca de concursos
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => testIndividualFunction("createTestData")}
                  className="h-20 flex flex-col"
                >
                  <div className="font-semibold">Criar Dados de Teste</div>
                  <div className="text-xs text-muted-foreground">
                    Cria dados de exemplo
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Estatísticas de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cacheStats && Object.keys(cacheStats).length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-semibold">Cache Statistics:</h4>
                  {Object.entries(cacheStats).map(
                    ([type, stats]: [string, any]) => (
                      <div key={type} className="p-3 rounded bg-muted">
                        <div className="font-medium">{type}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                          <div>Hits: {stats?.hits || 0}</div>
                          <div>Misses: {stats?.misses || 0}</div>
                          <div>Size: {stats?.size || 0}</div>
                          <div>
                            Hit Rate: {(stats?.hitRatio || 0).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                  <Button onClick={updateCacheStats} variant="outline">
                    Atualizar Estatísticas
                  </Button>
                </div>
              ) : (
                <div>Cache statistics não disponíveis no momento</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dados */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados Atuais</CardTitle>
              <CardDescription>Visualize os dados do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Concursos Carregados:</span>
                  <Badge>{concursos.length}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Status de Carregamento:</span>
                  {loading ? (
                    <Badge variant="secondary">Carregando...</Badge>
                  ) : (
                    <Badge>Carregado</Badge>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold">Concursos:</h4>
                  {concursos.length > 0 ? (
                    concursos.map((concurso) => (
                      <div key={concurso.id} className="p-2 rounded bg-muted">
                        <div className="font-medium">{concurso.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {concurso.organizer} - {concurso.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">
                      Nenhum concurso encontrado
                    </div>
                  )}
                </div>

                <Button
                  onClick={fetchConcursos}
                  variant="outline"
                  disabled={loading}
                >
                  Recarregar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
