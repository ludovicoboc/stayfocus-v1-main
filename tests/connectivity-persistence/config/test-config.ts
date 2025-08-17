/**
 * Test Configuration for Connectivity and Persistence Tests
 * This file contains all configuration needed for automated testing
 */

export interface TestCredentials {
  email: string;
  password: string;
}

export interface RouteConfig {
  path: string;
  name: string;
  testData: any;
  validationQueries: string[];
  tableNames: string[];
}

export interface TestConfig {
  baseUrl: string;
  credentials: TestCredentials;
  routes: RouteConfig[];
  timeout: number;
  retryAttempts: number;
  cleanupAfterTests: boolean;
}

// Test data templates for each route
export const testDataTemplates = {
  sono: {
    horaDormir: "23:00",
    horaAcordar: "07:00",
    qualidade: 8,
    observacoes: "Teste automatizado - boa noite de sono",
    data: new Date().toISOString().split('T')[0]
  },
  
  saude: {
    medicamento: {
      nome: "Teste Medicamento Auto",
      dosagem: "10mg",
      frequencia: "1x ao dia",
      horarios: ["08:00"],
      data_inicio: new Date().toISOString().split('T')[0]
    },
    humor: {
      data: new Date().toISOString().split('T')[0],
      nivel_humor: 7,
      fatores: ["trabalho", "exercicio"],
      notas: "Teste automatizado de humor"
    }
  },
  
  lazer: {
    nome: "Leitura - Teste Auto",
    categoria: "Relaxamento",
    duracao_minutos: 30,
    data_realizacao: new Date().toISOString().split('T')[0]
  },
  
  hiperfocos: {
    title: "Projeto Teste Automatizado",
    description: "Projeto criado para teste de conectividade",
    color: "#3B82F6",
    time_limit: 120
  },
  
  receitas: {
    nome: "Receita Teste Auto",
    categoria: "Teste",
    ingredientes: ["Ingrediente 1", "Ingrediente 2"],
    modo_preparo: "Modo de preparo para teste automatizado",
    tempo_preparo: 30,
    porcoes: 2
  },
  
  autoconhecimento: {
    category: "reflexoes",
    title: "Nota de Teste Auto",
    content: "Conteúdo de teste para validação de conectividade"
  }
};

// Default test configuration
export const defaultTestConfig: TestConfig = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  credentials: {
    email: process.env.TEST_USER_EMAIL || "test@example.com",
    password: process.env.TEST_USER_PASSWORD || "testpassword123"
  },
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  cleanupAfterTests: true,
  routes: [
    {
      path: "/sono",
      name: "Sono",
      testData: testDataTemplates.sono,
      validationQueries: [
        "SELECT * FROM sleep_records WHERE user_id = $1 AND date = $2 ORDER BY created_at DESC LIMIT 1"
      ],
      tableNames: ["sleep_records"]
    },
    {
      path: "/saude",
      name: "Saúde",
      testData: testDataTemplates.saude,
      validationQueries: [
        "SELECT * FROM medicamentos WHERE user_id = $1 AND nome = $2 ORDER BY created_at DESC LIMIT 1",
        "SELECT * FROM registros_humor WHERE user_id = $1 AND data = $2 ORDER BY created_at DESC LIMIT 1"
      ],
      tableNames: ["medicamentos", "registros_humor"]
    },
    {
      path: "/lazer",
      name: "Lazer",
      testData: testDataTemplates.lazer,
      validationQueries: [
        "SELECT * FROM atividades_lazer WHERE user_id = $1 AND nome = $2 ORDER BY created_at DESC LIMIT 1"
      ],
      tableNames: ["atividades_lazer"]
    },
    {
      path: "/hiperfocos",
      name: "Hiperfocos",
      testData: testDataTemplates.hiperfocos,
      validationQueries: [
        "SELECT * FROM hyperfocus_projects WHERE user_id = $1 AND title = $2 ORDER BY created_at DESC LIMIT 1"
      ],
      tableNames: ["hyperfocus_projects"]
    },
    {
      path: "/receitas",
      name: "Receitas",
      testData: testDataTemplates.receitas,
      validationQueries: [
        "SELECT * FROM receitas WHERE user_id = $1 AND nome = $2 ORDER BY created_at DESC LIMIT 1"
      ],
      tableNames: ["receitas"]
    },
    {
      path: "/autoconhecimento",
      name: "Autoconhecimento",
      testData: testDataTemplates.autoconhecimento,
      validationQueries: [
        "SELECT * FROM self_knowledge_notes WHERE user_id = $1 AND title = $2 ORDER BY created_at DESC LIMIT 1"
      ],
      tableNames: ["self_knowledge_notes"]
    }
  ]
};

// Validation queries for database checks
export const validationQueries = {
  // Check if user exists and get user_id
  getUserId: "SELECT id FROM auth.users WHERE email = $1",
  
  // Generic cleanup query template
  cleanupTestData: (tableName: string) => 
    `DELETE FROM ${tableName} WHERE created_at > $1 AND (
      title LIKE '%Teste Auto%' OR 
      nome LIKE '%Teste Auto%' OR 
      observacoes LIKE '%Teste automatizado%' OR
      notas LIKE '%Teste automatizado%' OR
      content LIKE '%teste para validação%'
    )`
};