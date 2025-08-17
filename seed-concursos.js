const { createClient } = require("@supabase/supabase-js");

// Configuração do Supabase
const supabaseUrl = "https://dajeywbevoxzrffhtapu.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhamV5d2Jldm94enJmZmh0YXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDQyNzgsImV4cCI6MjA3MTAyMDI3OH0.N7RHJuYmjxyR45UthuOGnOuqHpLI_vsnoA--CBS31P8";

const supabase = createClient(supabaseUrl, supabaseKey);

// ID do usuário de teste (você precisará substituir por um ID real)
const TEST_USER_ID = "a763ffe9-8415-4682-810b-689140fe4db5"; // ID do usuário criado

// Dados de teste
const concursosTeste = [
  {
    id: "3c6dff36-4971-4f3e-ac56-701efa04cd86",
    user_id: TEST_USER_ID,
    title: "Concurso Público Federal - Analista de Sistemas",
    organizer: "Ministério da Educação",
    registration_date: "2024-03-15",
    exam_date: "2024-05-20",
    edital_link: "https://exemplo.gov.br/edital",
    status: "estudando",
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    user_id: TEST_USER_ID,
    title: "Concurso Tribunal de Justiça - Técnico Judiciário",
    organizer: "TJ-SP",
    registration_date: "2024-02-01",
    exam_date: "2024-04-15",
    edital_link: "https://tjsp.jus.br/edital",
    status: "planejado",
  },
];

const disciplinasTeste = [
  // Disciplinas para o primeiro concurso
  {
    id: "d1111111-1111-1111-1111-111111111111",
    competition_id: "3c6dff36-4971-4f3e-ac56-701efa04cd86",
    name: "Direito Constitucional",
    progress: 25,
  },
  {
    id: "d2222222-2222-2222-2222-222222222222",
    competition_id: "3c6dff36-4971-4f3e-ac56-701efa04cd86",
    name: "Direito Administrativo",
    progress: 50,
  },
  {
    id: "d3333333-3333-3333-3333-333333333333",
    competition_id: "3c6dff36-4971-4f3e-ac56-701efa04cd86",
    name: "Informática",
    progress: 75,
  },
  // Disciplinas para o segundo concurso
  {
    id: "d4444444-4444-4444-4444-444444444444",
    competition_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Português",
    progress: 30,
  },
  {
    id: "d5555555-5555-5555-5555-555555555555",
    competition_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Matemática",
    progress: 60,
  },
];

const topicosTeste = [
  // Tópicos de Direito Constitucional
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
    id: "t1111113-1111-1111-1111-111111111111",
    subject_id: "d1111111-1111-1111-1111-111111111111",
    name: "Organização do Estado",
    completed: false,
  },
  // Tópicos de Direito Administrativo
  {
    id: "t2222221-2222-2222-2222-222222222222",
    subject_id: "d2222222-2222-2222-2222-222222222222",
    name: "Atos Administrativos",
    completed: true,
  },
  {
    id: "t2222222-2222-2222-2222-222222222222",
    subject_id: "d2222222-2222-2222-2222-222222222222",
    name: "Licitações e Contratos",
    completed: false,
  },
  // Tópicos de Informática
  {
    id: "t3333331-3333-3333-3333-333333333333",
    subject_id: "d3333333-3333-3333-3333-333333333333",
    name: "Sistemas Operacionais",
    completed: true,
  },
  {
    id: "t3333332-3333-3333-3333-333333333333",
    subject_id: "d3333333-3333-3333-3333-333333333333",
    name: "Redes de Computadores",
    completed: true,
  },
  {
    id: "t3333333-3333-3333-3333-333333333333",
    subject_id: "d3333333-3333-3333-3333-333333333333",
    name: "Segurança da Informação",
    completed: false,
  },
];

const questoesTeste = [
  {
    id: "q1111111-1111-1111-1111-111111111111",
    competition_id: "3c6dff36-4971-4f3e-ac56-701efa04cd86",
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
      {
        text: "A cidadania é um dos objetivos fundamentais da República.",
        isCorrect: false,
      },
      {
        text: "A dignidade da pessoa humana é um princípio sensível.",
        isCorrect: false,
      },
    ],
    correct_answer: 0,
    explanation:
      "A Constituição Federal estabelece em seu artigo 1º que a República Federativa do Brasil é formada pela união indissolúvel dos Estados e Municípios e do Distrito Federal.",
    difficulty: "medio",
    is_ai_generated: false,
  },
  {
    id: "q2222222-2222-2222-2222-222222222222",
    competition_id: "3c6dff36-4971-4f3e-ac56-701efa04cd86",
    subject_id: "d2222222-2222-2222-2222-222222222222",
    topic_id: "t2222221-2222-2222-2222-222222222222",
    question_text: "Quanto aos atos administrativos, analise as assertivas:",
    options: [
      {
        text: "Todos os atos administrativos são autoexecutórios.",
        isCorrect: false,
      },
      { text: "A presunção de legitimidade é absoluta.", isCorrect: false },
      {
        text: "A imperatividade é característica de todos os atos administrativos.",
        isCorrect: false,
      },
      {
        text: "Os atos administrativos gozam de presunção relativa de legitimidade.",
        isCorrect: true,
      },
      {
        text: "A tipicidade não é atributo dos atos administrativos.",
        isCorrect: false,
      },
    ],
    correct_answer: 3,
    explanation:
      "Os atos administrativos gozam de presunção relativa (juris tantum) de legitimidade, que pode ser afastada mediante prova em contrário.",
    difficulty: "dificil",
    is_ai_generated: false,
  },
  {
    id: "q3333333-3333-3333-3333-333333333333",
    competition_id: "3c6dff36-4971-4f3e-ac56-701efa04cd86",
    subject_id: "d3333333-3333-3333-3333-333333333333",
    topic_id: "t3333331-3333-3333-3333-333333333333",
    question_text:
      "No sistema operacional Windows, qual tecla de atalho permite alternar entre aplicações abertas?",
    options: [
      { text: "Ctrl + Alt + Del", isCorrect: false },
      { text: "Alt + Tab", isCorrect: true },
      { text: "Ctrl + Shift + Esc", isCorrect: false },
      { text: "Windows + Tab", isCorrect: false },
      { text: "Ctrl + Tab", isCorrect: false },
    ],
    correct_answer: 1,
    explanation:
      "A combinação Alt + Tab é o atalho padrão para alternar entre aplicações abertas no Windows.",
    difficulty: "facil",
    is_ai_generated: false,
  },
];

async function seedDatabase() {
  console.log(
    "🌱 Iniciando população da base de dados com dados de teste...\n",
  );

  try {
    // Autenticar com o usuário de teste primeiro
    console.log("🔐 Autenticando usuário de teste...");
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "teste@stayfocus.com",
        password: "senha123!@#",
      });

    if (authError) {
      console.error("❌ Erro na autenticação:", authError);
      return;
    }
    console.log("✅ Usuário autenticado:", authData.user?.email);
    // 1. Limpar dados existentes (opcional)
    console.log("🧹 Limpando dados existentes...");
    await supabase
      .from("competition_questions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("competition_topics")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("competition_subjects")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("competitions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // 2. Inserir concursos
    console.log("🎯 Inserindo concursos...");
    const { data: concursosData, error: concursosError } = await supabase
      .from("competitions")
      .insert(concursosTeste);

    if (concursosError) {
      console.error("❌ Erro ao inserir concursos:", concursosError);
      return;
    }
    console.log(`✅ ${concursosTeste.length} concursos inseridos`);

    // 3. Inserir disciplinas
    console.log("📚 Inserindo disciplinas...");
    const { data: disciplinasData, error: disciplinasError } = await supabase
      .from("competition_subjects")
      .insert(disciplinasTeste);

    if (disciplinasError) {
      console.error("❌ Erro ao inserir disciplinas:", disciplinasError);
      return;
    }
    console.log(`✅ ${disciplinasTeste.length} disciplinas inseridas`);

    // 4. Inserir tópicos
    console.log("📝 Inserindo tópicos...");
    const { data: topicosData, error: topicosError } = await supabase
      .from("competition_topics")
      .insert(topicosTeste);

    if (topicosError) {
      console.error("❌ Erro ao inserir tópicos:", topicosError);
      return;
    }
    console.log(`✅ ${topicosTeste.length} tópicos inseridos`);

    // 5. Inserir questões
    console.log("❓ Inserindo questões...");
    const { data: questoesData, error: questoesError } = await supabase
      .from("competition_questions")
      .insert(questoesTeste);

    if (questoesError) {
      console.error("❌ Erro ao inserir questões:", questoesError);
      return;
    }
    console.log(`✅ ${questoesTeste.length} questões inseridas`);

    console.log("\n🎉 Base de dados populada com sucesso!");
    console.log("📊 Resumo:");
    console.log(`   • ${concursosTeste.length} concursos`);
    console.log(`   • ${disciplinasTeste.length} disciplinas`);
    console.log(`   • ${topicosTeste.length} tópicos`);
    console.log(`   • ${questoesTeste.length} questões`);
    console.log("\n🔍 IDs para teste:");
    console.log(`   • Concurso principal: ${concursosTeste[0].id}`);
    console.log(`   • Usuário de teste: ${TEST_USER_ID}`);
  } catch (error) {
    console.error("❌ Erro geral ao popular base de dados:", error);
  }
}

async function createTestUser() {
  console.log("👤 Verificando usuário de teste...");

  try {
    // Tentar fazer login primeiro
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: "teste@stayfocus.com",
        password: "senha123!@#",
      });

    if (
      loginError &&
      loginError.message.includes("Invalid login credentials")
    ) {
      // Se não conseguir fazer login, criar o usuário
      console.log("📝 Criando novo usuário de teste...");
      const { data, error } = await supabase.auth.signUp({
        email: "teste@stayfocus.com",
        password: "senha123!@#",
      });

      if (error) {
        console.log("⚠️  Erro ao criar usuário:", error.message);
      } else {
        console.log("✅ Usuário de teste criado:", data.user?.id);
        console.log("📧 Email:", data.user?.email);
      }
    } else if (loginData.user) {
      console.log("✅ Usuário de teste já existe:", loginData.user.id);
      console.log("📧 Email:", loginData.user.email);
    } else {
      console.log("⚠️  Erro inesperado:", loginError?.message);
    }
  } catch (error) {
    console.log("⚠️  Erro ao verificar usuário:", error.message);
  }
}

// Executar o seeding
async function main() {
  console.log("🚀 INICIANDO SEEDING DA BASE DE DADOS\n");

  // Primeiro verificar/criar usuário de teste
  await createTestUser();

  console.log("\n" + "=".repeat(50) + "\n");

  // Depois popular com dados (já autenticado)
  await seedDatabase();

  console.log("\n🏁 PROCESSO CONCLUÍDO");
  console.log(
    "🔗 Para testar, acesse: http://localhost:3000/concursos/3c6dff36-4971-4f3e-ac56-701efa04cd86",
  );
}

main().catch(console.error);
