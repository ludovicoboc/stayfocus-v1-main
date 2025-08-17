import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    console.log("🎯 Criando dados de teste para usuário:", user.email);

    // Dados de teste
    const concursoId = "3c6dff36-4971-4f3e-ac56-701efa04cd86";

    // 1. Criar concurso
    const { data: concursoData, error: concursoError } = await supabase
      .from("competitions")
      .upsert({
        id: concursoId,
        user_id: user.id,
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
      console.error("Erro ao criar concurso:", concursoError);
      return NextResponse.json(
        { error: "Erro ao criar concurso", details: concursoError.message },
        { status: 500 }
      );
    }

    // 2. Criar disciplinas
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

    const { data: disciplinasData, error: disciplinasError } = await supabase
      .from("competition_subjects")
      .upsert(disciplinas)
      .select();

    if (disciplinasError) {
      console.error("Erro ao criar disciplinas:", disciplinasError);
      return NextResponse.json(
        { error: "Erro ao criar disciplinas", details: disciplinasError.message },
        { status: 500 }
      );
    }

    // 3. Criar tópicos
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
        id: "t1111113-1111-1111-1111-111111111111",
        subject_id: "d1111111-1111-1111-1111-111111111111",
        name: "Organização do Estado",
        completed: false,
      },
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

    const { data: topicosData, error: topicosError } = await supabase
      .from("competition_topics")
      .upsert(topicos)
      .select();

    if (topicosError) {
      console.error("Erro ao criar tópicos:", topicosError);
      return NextResponse.json(
        { error: "Erro ao criar tópicos", details: topicosError.message },
        { status: 500 }
      );
    }

    // 4. Criar questões
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
        competition_id: concursoId,
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
        competition_id: concursoId,
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

    const { data: questoesData, error: questoesError } = await supabase
      .from("competition_questions")
      .upsert(questoes)
      .select();

    if (questoesError) {
      console.error("Erro ao criar questões:", questoesError);
      return NextResponse.json(
        { error: "Erro ao criar questões", details: questoesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Dados de teste criados com sucesso!",
      data: {
        concurso: concursoData,
        disciplinas: disciplinasData?.length || 0,
        topicos: topicosData?.length || 0,
        questoes: questoesData?.length || 0,
        concursoId: concursoId,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Erro geral no seeding:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Endpoint para criar dados de teste de concursos",
    usage: "Faça uma requisição POST para criar os dados de teste",
  });
}
