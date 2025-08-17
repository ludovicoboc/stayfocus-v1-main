const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Configuração do Supabase
const supabaseUrl = "https://dajeywbevoxzrffhtapu.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhamV5d2Jldm94enJmZmh0YXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDQyNzgsImV4cCI6MjA3MTAyMDI3OH0.N7RHJuYmjxyR45UthuOGnOuqHpLI_vsnoA--CBS31P8";

console.log("✅ Configuração do Supabase carregada");
console.log("📍 URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugConcursos() {
  console.log("🔍 INICIANDO DEBUG DOS CONCURSOS\n");

  const concursoId = "3c6dff36-4971-4f3e-ac56-701efa04cd86";

  try {
    // 1. Verificar se a tabela competitions existe e tem dados
    console.log("📊 1. Verificando tabela competitions...");
    const { data: allCompetitions, error: allError } = await supabase
      .from("competitions")
      .select("id, title, user_id, status")
      .limit(10);

    if (allError) {
      console.error("❌ Erro ao acessar tabela competitions:", allError);
      return;
    }

    console.log(`✅ Encontrados ${allCompetitions.length} concursos no total`);
    allCompetitions.forEach((comp) => {
      console.log(`   - ${comp.id}: ${comp.title} (user: ${comp.user_id})`);
    });

    // 2. Verificar concurso específico
    console.log(`\n🎯 2. Verificando concurso específico (${concursoId})...`);
    const { data: specificCompetition, error: specificError } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", concursoId)
      .single();

    if (specificError) {
      console.error("❌ Erro ao buscar concurso específico:", specificError);
      if (specificError.code === "PGRST116") {
        console.log("⚠️  Concurso não encontrado - ID pode estar incorreto");
      }
    } else {
      console.log("✅ Concurso encontrado:", {
        id: specificCompetition.id,
        title: specificCompetition.title,
        user_id: specificCompetition.user_id,
        status: specificCompetition.status,
        created_at: specificCompetition.created_at,
      });
    }

    // 3. Verificar subjects (disciplinas)
    console.log(`\n📚 3. Verificando disciplinas para o concurso...`);
    const { data: subjects, error: subjectsError } = await supabase
      .from("competition_subjects")
      .select("*")
      .eq("competition_id", concursoId);

    if (subjectsError) {
      console.error("❌ Erro ao buscar disciplinas:", subjectsError);
    } else {
      console.log(`✅ Encontradas ${subjects.length} disciplinas`);
      subjects.forEach((subject) => {
        console.log(
          `   - ${subject.id}: ${subject.name} (progress: ${subject.progress}%)`,
        );
      });
    }

    // 4. Verificar topics (tópicos)
    console.log(`\n📝 4. Verificando tópicos para o concurso...`);
    const { data: topics, error: topicsError } = await supabase
      .from("competition_topics")
      .select("*, competition_subjects!inner(competition_id)")
      .eq("competition_subjects.competition_id", concursoId);

    if (topicsError) {
      console.error("❌ Erro ao buscar tópicos:", topicsError);
    } else {
      console.log(`✅ Encontrados ${topics.length} tópicos`);
      topics.forEach((topic) => {
        console.log(
          `   - ${topic.id}: ${topic.name} (completed: ${topic.completed})`,
        );
      });
    }

    // 5. Verificar questões
    console.log(`\n❓ 5. Verificando questões para o concurso...`);
    const { data: questions, error: questionsError } = await supabase
      .from("competition_questions")
      .select("*")
      .eq("competition_id", concursoId);

    if (questionsError) {
      console.error("❌ Erro ao buscar questões:", questionsError);
    } else {
      console.log(`✅ Encontradas ${questions.length} questões`);
      questions.forEach((question) => {
        console.log(
          `   - ${question.id}: ${question.question_text.substring(0, 50)}...`,
        );
      });
    }

    // 6. Verificar usuários
    console.log(`\n👤 6. Verificando informações de usuários...`);
    const { data: authUser, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("❌ Erro ao verificar usuário autenticado:", authError);
      console.log(
        "⚠️  Usuário não está autenticado - isso pode explicar o problema",
      );
    } else {
      console.log("✅ Usuário autenticado:", {
        id: authUser.user?.id,
        email: authUser.user?.email,
      });
    }

    // 7. Verificar RLS (Row Level Security)
    console.log(`\n🔒 7. Testando acesso com diferentes usuários...`);
    const { data: allUsersCompetitions, error: rqError } = await supabase
      .from("competitions")
      .select("id, title, user_id")
      .eq("id", concursoId);

    if (rqError) {
      console.error("❌ Erro ao testar RLS:", rqError);
    } else {
      console.log("✅ Dados sem filtro de usuário:", allUsersCompetitions);
    }
  } catch (error) {
    console.error("❌ Erro geral no debug:", error);
  }

  console.log("\n🏁 DEBUG CONCLUÍDO");
}

// Executar o debug
debugConcursos().catch(console.error);
