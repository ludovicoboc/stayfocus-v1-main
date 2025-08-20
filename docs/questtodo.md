# StayFocus Application Implementation Overview

## User


<context>
The following items were attached by the user. They are up-to-date and don't need to be re-read.

<files>
```md stayfocus-alimentacao/docs/do.md
  ✅ IMPLEMENTAÇÃO FINALIZADA COM SUCESSO!

  📋 Resumo do que foi implementado:

  1. Refatoração das Migrations Supabase

  - Questões: Campos expandidos para suporte completo (tipos, pontuação, tempo, tags, fonte, ano, status ativo/inativo)
  - Simulados: Sistema robusto com filtros, favoritos, status, tentativas, pontuações e compartilhamento público
  - Estudos: Integração aprimorada com concursos e funções de estatísticas

  2. Páginas Principais

  - /concursos/[id]/questoes: Gestão completa de questões com filtros avançados, estatísticas e exportação
  - /concursos/[id]/simulados: Sistema de simulados com abas organizadas, favoritos e controle de status

  3. Componentes Funcionais

  - CriarQuestaoModal: Criação manual com todos os tipos de questão (múltipla escolha, V/F, dissertativa, lacunas)
  - ImportarQuestaoJsonModal: Importação robusta com validação completa e preview
  - VisualizarQuestaoModal: Visualização detalhada com opções de cópia
  - CriarSimuladoModal: Criação automática ou manual com filtros inteligentes
  - ImportarSimuladoJsonModal: Importação de simulados com validação de questões
  - ConfigurarSimuladoModal: Configuração completa com estatísticas e ações administrativas

  4. Hooks Personalizados

  - useQuestions: CRUD completo, filtros, estatísticas e importação JSON
  - useSimulations: Gestão de simulados, favoritos, resultados e análises

  5. Sistema de Favoritos Integrado

  - Toggle de favoritos em simulados
  - Filtros por favoritos
  - Aba dedicada aos favoritos
  - Índices otimizados no banco

  🔥 Características Técnicas Implementadas:

  ✅ Criação manual de questões - Formulário completo com 4 tipos
  ✅ Importação via JSON - Validação robusta e templates
  ✅ Simulados completos - Criação automática/manual com filtros
  ✅ Sistema de favoritos - Toggle, filtros e abas organizadas
  ✅ Integração Supabase - RLS, índices otimizados, triggers
  ✅ Rotas dinâmicas - /concursos/[id]/questoes e /simulados
  ✅ TypeScript completo - Tipagem rigorosa em todos os componentes
  ✅ UI/UX moderna - shadcn/ui, responsivo, acessível

  Todas as funcionalidades estão prontas para uso imediato! 🚀
```
</files>
</context>

Consulte o conteudo do arquivo [@do.md](@file:stayfocus-alimentacao/docs/do.md) 

## Agent

Vou consultar o conteúdo do arquivo `do.md` que você mencionou.

**Use Tool: read_file (toolu_01Ww3NHF9o9b7JrwJGuZbXzm)**
```json
{
  "path": "stayfocus-alimentacao/docs/do.md"
}
```

**Tool Results: toolu_01Ww3NHF9o9b7JrwJGuZbXzm**

  ✅ IMPLEMENTAÇÃO FINALIZADA COM SUCESSO!

  📋 Resumo do que foi implementado:

  1. Refatoração das Migrations Supabase

  - Questões: Campos expandidos para suporte completo (tipos, pontuação, tempo, tags, fonte, ano, status ativo/inativo)
  - Simulados: Sistema robusto com filtros, favoritos, status, tentativas, pontuações e compartilhamento público
  - Estudos: Integração aprimorada com concursos e funções de estatísticas

  2. Páginas Principais

  - /concursos/[id]/questoes: Gestão completa de questões com filtros avançados, estatísticas e exportação
  - /concursos/[id]/simulados: Sistema de simulados com abas organizadas, favoritos e controle de status

  3. Componentes Funcionais

  - CriarQuestaoModal: Criação manual com todos os tipos de questão (múltipla escolha, V/F, dissertativa, lacunas)
  - ImportarQuestaoJsonModal: Importação robusta com validação completa e preview
  - VisualizarQuestaoModal: Visualização detalhada com opções de cópia
  - CriarSimuladoModal: Criação automática ou manual com filtros inteligentes
  - ImportarSimuladoJsonModal: Importação de simulados com validação de questões
  - ConfigurarSimuladoModal: Configuração completa com estatísticas e ações administrativas

  4. Hooks Personalizados

  - useQuestions: CRUD completo, filtros, estatísticas e importação JSON
  - useSimulations: Gestão de simulados, favoritos, resultados e análises

  5. Sistema de Favoritos Integrado

  - Toggle de favoritos em simulados
  - Filtros por favoritos
  - Aba dedicada aos favoritos
  - Índices otimizados no banco

  🔥 Características Técnicas Implementadas:

  ✅ Criação manual de questões - Formulário completo com 4 tipos
  ✅ Importação via JSON - Validação robusta e templates
  ✅ Simulados completos - Criação automática/manual com filtros
  ✅ Sistema de favoritos - Toggle, filtros e abas organizadas
  ✅ Integração Supabase - RLS, índices otimizados, triggers
  ✅ Rotas dinâmicas - /concursos/[id]/questoes e /simulados
  ✅ TypeScript completo - Tipagem rigorosa em todos os componentes
  ✅ UI/UX moderna - shadcn/ui, responsivo, acessível

  Todas as funcionalidades estão prontas para uso imediato! 🚀
## Agent

Perfeito! O arquivo `do.md` mostra um resumo completo de uma implementação finalizada com sucesso para um sistema de gestão de concursos e estudos. Aqui está o que foi implementado:

## 📋 Resumo da Implementação

### 1. **Refatoração das Migrations Supabase**
- **Questões**: Campos expandidos com tipos, pontuação, tempo, tags, fonte, ano e status
- **Simulados**: Sistema robusto com filtros, favoritos, tentativas e compartilhamento
- **Estudos**: Integração com concursos e estatísticas

### 2. **Páginas Principais**
- `/concursos/[id]/questoes`: Gestão completa com filtros e exportação
- `/concursos/[id]/simulados`: Sistema organizado com abas e favoritos

### 3. **Componentes Implementados**
- `CriarQuestaoModal`: Criação manual de 4 tipos de questão
- `ImportarQuestaoJsonModal`: Importação com validação e preview
- `VisualizarQuestaoModal`: Visualização detalhada
- `CriarSimuladoModal`: Criação automática/manual com filtros
- `ImportarSimuladoJsonModal`: Importação de simulados
- `ConfigurarSimuladoModal`: Configuração com estatísticas

### 4. **Hooks Personalizados**
- `useQuestions`: CRUD completo, filtros e estatísticas
- `useSimulations`: Gestão de simulados e análises

### 5. **Sistema de Favoritos**
- Toggle de favoritos em simulados
- Filtros e aba dedicada
- Índices otimizados no banco

## 🔥 **Características Técnicas**

✅ **4 tipos de questões** (múltipla escolha, V/F, dissertativa, lacunas)  
✅ **Importação JSON** com validação robusta  
✅ **Simulados completos** com criação automática/manual  
✅ **Sistema de favoritos** integrado  
✅ **Integração Supabase** com RLS e índices otimizados  
✅ **Rotas dinâmicas** Next.js  
✅ **TypeScript completo** com tipagem rigorosa  
✅ **UI/UX moderna** com shadcn/ui

O sistema está **pronto para uso imediato** com todas as funcionalidades implementadas! 🚀

## User


2 images attached as context.

Analise o por que não estão aparecendo os componentes criados

## Agent



**Use Tool: thinking (toolu_01CZUQpsJt6Dd8myfuJi4kxN)**
```json
{
  "content": "Analisando as imagens fornecidas, vejo que:\n\n1. Na primeira imagem, está na aba \"Questões\" e mostra \"Nenhuma questão encontrada para este concurso.\"\n2. Na segunda imagem, está na aba \"Simulado Personalizado\" e mostra \"Nenhuma questão disponível.\"\n\nBaseado no arquivo do.md que foi compartilhado, parece que foi implementado um sistema completo de questões e simulados, mas nas imagens vemos que não há questões sendo exibidas.\n\nPossíveis problemas:\n1. As questões não estão sendo carregadas corretamente do banco de dados\n2. Pode haver um problema com os filtros ou consultas\n3. O concurso específico (Analista Administrativo - CESPE) pode não ter questões cadastradas\n4. Pode haver um problema com os hooks useQuestions ou useSimulations\n5. Pode haver problemas com as rotas dinâmicas\n6. Problemas de permissão/RLS no Supabase\n7. Problemas na integração com o banco de dados\n\nPreciso investigar o código para entender o que está acontecendo."
}
```

**Tool Results: toolu_01CZUQpsJt6Dd8myfuJi4kxN**

Finished thinking.
## Agent

Analisando as imagens, vejo que o sistema está mostrando "Nenhuma questão encontrada" tanto na aba de **Questões** quanto no **Simulado Personalizado**. Vamos investigar os possíveis problemas:

**Use Tool: find_path (toolu_01QNZUq54gYcufMB5Q4kg79o)**
```json
{
  "glob": "**/questoes/**"
}
```

**Tool Results: toolu_01QNZUq54gYcufMB5Q4kg79o**

Found 2 total matches.
stayfocus-alimentacao/app/concursos/[id]/questoes
stayfocus-alimentacao/app/concursos/[id]/questoes/page.tsx


Debug Output:

```json
{
  "glob": "**/questoes/**",
  "paths": [
    "stayfocus-alimentacao/app/concursos/[id]/questoes",
    "stayfocus-alimentacao/app/concursos/[id]/questoes/page.tsx"
  ]
}
```

## Agent



**Use Tool: read_file (toolu_018VcwqwBtKqBJJs5ARfGgtP)**
```json
{
  "path": "stayfocus-alimentacao/app/concursos/[id]/questoes/page.tsx"
}
```

**Tool Results: toolu_018VcwqwBtKqBJJs5ARfGgtP**

This file was too big to read all at once.

Here is an outline of its symbols:


Showing symbols 1-0 (total symbols: 0)


Using the line numbers in this outline, you can call this tool again
while specifying the start_line and end_line fields to see the
implementations of symbols in the outline.

Alternatively, you can fall back to the `grep` tool (if available)
to search the file for specific content.
## Agent



**Use Tool: read_file (toolu_018i16sE4nt6Yp98ihjJ1ucG)**
```json
{
  "path": "stayfocus-alimentacao/app/concursos/[id]/questoes/page.tsx",
  "start_line": 1,
  "end_line": 50
}
```

**Tool Results: toolu_018i16sE4nt6Yp98ihjJ1ucG**

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Edit3, 
  Trash2, 
  Eye,
  BookOpen,
  Target,
  Clock,
  Star
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { CriarQuestaoModal } from '@/components/concursos/criar-questao-modal'
import { ImportarQuestaoJsonModal } from '@/components/concursos/importar-questao-json-modal'
import { VisualizarQuestaoModal } from '@/components/concursos/visualizar-questao-modal'

interface Question {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank'
  options: any[]
  correct_answer: string
  correct_options: number[]
  explanation: string
  difficulty: 'facil' | 'medio' | 'dificil'
  points: number
  time_limit_seconds: number
  tags: string[]
  source: string
  year: number
  is_ai_generated: boolean
  is_active: boolean
  usage_count: number
  subject_id: string
  topic_id: string
  created_at: string
## Agent



**Use Tool: grep (toolu_01QpeAfw4Czb9q3BdsA8G9hx)**
```json
{
  "regex": "useQuestions|fetchQuestions",
  "include_pattern": "**/*.tsx"
}
```

**Tool Results: toolu_01QpeAfw4Czb9q3BdsA8G9hx**

No matches found
## Agent



**Use Tool: grep (toolu_017F9f7pRu7aGVVAZby7DMTe)**
```json
{
  "regex": "const.*questions|useState.*questions",
  "include_pattern": "**/questoes/**"
}
```

**Tool Results: toolu_017F9f7pRu7aGVVAZby7DMTe**

Found 4 matches:

## Matches in stayfocus-alimentacao/app/concursos/[id]/questoes/page.tsx

### function QuestoesPage() › L92-102
```
export default function QuestoesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const competitionId = params.id as string

  const [competition, setCompetition] = useState<Competition | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
```

465 lines remaining in ancestor node. Read the file to see all.

### function QuestoesPage() › L168-172
```
  }

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
```

### function QuestoesPage() › L244-248
```
  }

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
```

### function QuestoesPage() › L254-265
```
  })

  const exportQuestions = () => {
    const dataStr = JSON.stringify(filteredQuestions, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `questoes-${competition?.title || 'concurso'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }
```

## Agent



**Use Tool: read_file (toolu_01J2AvRi7Vm5jJP3qWHQt8yn)**
```json
{
  "path": "stayfocus-alimentacao/app/concursos/[id]/questoes/page.tsx",
  "start_line": 168,
  "end_line": 200
}
```

**Tool Results: toolu_01J2AvRi7Vm5jJP3qWHQt8yn**

  }

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('competition_questions')
        .select(`
          *,
          competition_subjects(name),
          competition_topics(name)
        `)
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Erro ao carregar questões:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as questões.',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta questão?')) return

    try {
      const { error } = await supabase
        .from('competition_questions')
        .delete()
## Agent



**Use Tool: read_file (toolu_01ETGEzu2x1oE1MbzERmkjvk)**
```json
{
  "path": "stayfocus-alimentacao/app/concursos/[id]/questoes/page.tsx",
  "start_line": 140,
  "end_line": 170
}
```

**Tool Results: toolu_01ETGEzu2x1oE1MbzERmkjvk**

        .order('name')

      if (subjectsError) throw subjectsError
      setSubjects(subjectsData || [])

      // Carregar tópicos
      const { data: topicsData, error: topicsError } = await supabase
        .from('competition_topics')
        .select('*')
        .in('subject_id', (subjectsData || []).map(s => s.id))
        .order('name')

      if (topicsError) throw topicsError
      setTopics(topicsData || [])

      // Carregar questões
      await loadQuestions()

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do concurso.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async () => {
## Agent



**Use Tool: read_file (toolu_01HwPUjgTf5f4XakQo4oUkTb)**
```json
{
  "path": "stayfocus-alimentacao/app/concursos/[id]/questoes/page.tsx",
  "start_line": 110,
  "end_line": 140
}
```

**Tool Results: toolu_01HwPUjgTf5f4XakQo4oUkTb**

  const [showImportModal, setShowImportModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)

  useEffect(() => {
    if (user && competitionId) {
      loadData()
    }
  }, [user, competitionId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar concurso
      const { data: competitionData, error: competitionError } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .eq('user_id', user?.id)
        .single()

      if (competitionError) throw competitionError
      setCompetition(competitionData)

      // Carregar matérias
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('competition_subjects')
        .select('*')
        .eq('competition_id', competitionId)
        .order('name')
## Agent

Agora vamos verificar se existe algum hook personalizado `useQuestions`:

**Use Tool: find_path (toolu_01CSyK1MP7uYTiFC1rCasFMg)**
```json
{
  "glob": "**/hooks/**"
}
```

**Tool Results: toolu_01CSyK1MP7uYTiFC1rCasFMg**

Found 20 total matches.
stayfocus-alimentacao/hooks
stayfocus-alimentacao/hooks/use-auth.ts
stayfocus-alimentacao/hooks/use-compromissos.ts
stayfocus-alimentacao/hooks/use-concursos.ts
stayfocus-alimentacao/hooks/use-dashboard.ts
stayfocus-alimentacao/hooks/use-estudos.ts
stayfocus-alimentacao/hooks/use-financas.ts
stayfocus-alimentacao/hooks/use-hiperfocos.ts
stayfocus-alimentacao/hooks/use-lazer.ts
stayfocus-alimentacao/hooks/use-mobile.tsx
stayfocus-alimentacao/hooks/use-pomodoro.ts
stayfocus-alimentacao/hooks/use-profile.ts
stayfocus-alimentacao/hooks/use-questions.ts
stayfocus-alimentacao/hooks/use-receitas.ts
stayfocus-alimentacao/hooks/use-saude.ts
stayfocus-alimentacao/hooks/use-self-knowledge.ts
stayfocus-alimentacao/hooks/use-simulados.ts
stayfocus-alimentacao/hooks/use-simulations.ts
stayfocus-alimentacao/hooks/use-sono.ts
stayfocus-alimentacao/hooks/use-toast.ts


Debug Output:

```json
{
  "glob": "**/hooks/**",
  "paths": [
    "stayfocus-alimentacao/hooks",
    "stayfocus-alimentacao/hooks/use-auth.ts",
    "stayfocus-alimentacao/hooks/use-compromissos.ts",
    "stayfocus-alimentacao/hooks/use-concursos.ts",
    "stayfocus-alimentacao/hooks/use-dashboard.ts",
    "stayfocus-alimentacao/hooks/use-estudos.ts",
    "stayfocus-alimentacao/hooks/use-financas.ts",
    "stayfocus-alimentacao/hooks/use-hiperfocos.ts",
    "stayfocus-alimentacao/hooks/use-lazer.ts",
    "stayfocus-alimentacao/hooks/use-mobile.tsx",
    "stayfocus-alimentacao/hooks/use-pomodoro.ts",
    "stayfocus-alimentacao/hooks/use-profile.ts",
    "stayfocus-alimentacao/hooks/use-questions.ts",
    "stayfocus-alimentacao/hooks/use-receitas.ts",
    "stayfocus-alimentacao/hooks/use-saude.ts",
    "stayfocus-alimentacao/hooks/use-self-knowledge.ts",
    "stayfocus-alimentacao/hooks/use-simulados.ts",
    "stayfocus-alimentacao/hooks/use-simulations.ts",
    "stayfocus-alimentacao/hooks/use-sono.ts",
    "stayfocus-alimentacao/hooks/use-toast.ts"
  ]
}
```

## Agent



**Use Tool: read_file (toolu_01DXhTpH2grFGHirVSaMet6R)**
```json
{
  "path": "stayfocus-alimentacao/hooks/use-questions.ts"
}
```

**Tool Results: toolu_01DXhTpH2grFGHirVSaMet6R**

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

## Agent

Agora vamos verificar se o problema está na página que não está usando o hook `useQuestions`:

**Use Tool: grep (toolu_01TWYJzWrKcWcjvLNf5Zrvzi)**
```json
{
  "regex": "import.*useQuestions",
  "include_pattern": "**/questoes/page.tsx"
}
```

**Tool Results: toolu_01TWYJzWrKcWcjvLNf5Zrvzi**

No matches found
## Agent

Vamos verificar também o banco de dados para ver se há questões cadastradas:

**Use Tool: find_path (toolu_01ME4gSKP4v1bhSf41K6Kiom)**
```json
{
  "glob": "**/supabase/**"
}
```

**Tool Results: toolu_01ME4gSKP4v1bhSf41K6Kiom**

Found 17 total matches.
stayfocus-alimentacao/supabase
stayfocus-alimentacao/supabase/migrations
stayfocus-alimentacao/supabase/migrations/20240101000000_create_alimentacao_tables.sql
stayfocus-alimentacao/supabase/migrations/20240101000001_create_concursos_tables.sql
stayfocus-alimentacao/supabase/migrations/20240101000002_create_estudos_tables.sql
stayfocus-alimentacao/supabase/migrations/20240101000003_create_hiperfocos_tables.sql
stayfocus-alimentacao/supabase/migrations/20240816_create_autoconhecimento_tables.sql
stayfocus-alimentacao/supabase/migrations/20240816_create_dashboard_tables.sql
stayfocus-alimentacao/supabase/migrations/20240816_create_financas_tables.sql
stayfocus-alimentacao/supabase/migrations/20240816_create_lazer_tables.sql
stayfocus-alimentacao/supabase/migrations/20240817_create_perfil_tables.sql
stayfocus-alimentacao/supabase/migrations/20240818_create_sono_tables.sql
stayfocus-alimentacao/supabase/migrations/20240819_fix_saude_tables.sql
stayfocus-alimentacao/supabase/migrations/20240820_create_compromissos_table.sql
stayfocus-alimentacao/supabase/migrations/20250117_add_increment_question_usage_function.sql
stayfocus-alimentacao/supabase/migrations/20250817133400_create_random_competition_questions.sql
stayfocus-alimentacao/supabase/migrations/20250817_add_date_to_dashboard_tables.sql


Debug Output:

```json
{
  "glob": "**/supabase/**",
  "paths": [
    "stayfocus-alimentacao/supabase",
    "stayfocus-alimentacao/supabase/migrations",
    "stayfocus-alimentacao/supabase/migrations/20240101000000_create_alimentacao_tables.sql",
    "stayfocus-alimentacao/supabase/migrations/20240101000001_create_concursos_tables.sql",
    "stayfocus-alimentacao/supabase/migrations/20240101000002_create_estudos_tables.sql",
    "stayfocus-alimentacao/supabase/migrations/20240101000003_create_hiperfocos_tables.sql",
    "stayfocus-alimentacao/supabase/migrations/20240816_create_autoconhecimento_tables.sql",
    "stayfocus-alimentacao/supabase/migrations/20240816_create_dashboard_tables.sql",
    "stayfocus-alimentacao/supabase/migrations/20240816_create_financas_tables.sql",
    "stayfocus-alimentacao/supabase/migrations/20240816_create_lazer_tables.sql",
    "stayfocus-alimentacao/supabase/migrations/20240817_create_perfil_tables.sql",
    "stayfocus-alimentacao/supabase/migrations/20240818_create_sono_tables.sql",
    "stayfocus-alimentacao/supabase/migrations/20240819_fix_saude_tables.sql",
    "stayfocus-alimentacao/supabase/migrations/20240820_create_compromissos_table.sql",
    "stayfocus-alimentacao/supabase/migrations/20250117_add_increment_question_usage_function.sql",
    "stayfocus-alimentacao/supabase/migrations/20250817133400_create_random_competition_questions.sql",
    "stayfocus-alimentacao/supabase/migrations/20250817_add_date_to_dashboard_tables.sql"
  ]
}
```

## Agent



**Use Tool: read_file (toolu_01TvThHGVy7L6TsR4cX8bXsF)**
```json
{
  "path": "stayfocus-alimentacao/supabase/migrations/20240101000001_create_concursos_tables.sql"
}
```

**Tool Results: toolu_01TvThHGVy7L6TsR4cX8bXsF**

This file was too big to read all at once.

Here is an outline of its symbols:


Showing symbols 1-0 (total symbols: 0)


Using the line numbers in this outline, you can call this tool again
while specifying the start_line and end_line fields to see the
implementations of symbols in the outline.

Alternatively, you can fall back to the `grep` tool (if available)
to search the file for specific content.
## Agent



**Use Tool: read_file (toolu_012ZLpj7WJNWyJhtXC8dtbNo)**
```json
{
  "path": "stayfocus-alimentacao/supabase/migrations/20240101000001_create_concursos_tables.sql",
  "start_line": 1,
  "end_line": 50
}
```

**Tool Results: toolu_012ZLpj7WJNWyJhtXC8dtbNo**

BEGIN;

-- ==========================================================================
-- MIGRATION: Create Concursos (Competitions) Tables
-- Description: Creates all tables required for the concursos feature
-- Author: StayFocus App
-- Date: 2024-01-01
-- ==========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================================
-- TABLE: competitions
-- Description: Main table for competitions/concursos
-- ==========================================================================
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    organizer TEXT NOT NULL,
    registration_date DATE,
    exam_date DATE,
    edital_link TEXT,
    status TEXT NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado', 'inscrito', 'estudando', 'realizado', 'aguardando_resultado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to competitions table
COMMENT ON TABLE competitions IS 'Stores competition/concurso information for users';
COMMENT ON COLUMN competitions.title IS 'Title of the competition';
COMMENT ON COLUMN competitions.organizer IS 'Organization responsible for the competition';
COMMENT ON COLUMN competitions.registration_date IS 'Registration deadline date';
COMMENT ON COLUMN competitions.exam_date IS 'Exam date';
COMMENT ON COLUMN competitions.edital_link IS 'Link to the official competition notice';
COMMENT ON COLUMN competitions.status IS 'Current status of the competition for the user';

-- ==========================================================================
-- TABLE: competition_subjects
-- Description: Subjects/disciplines for each competition
-- ==========================================================================
CREATE TABLE IF NOT EXISTS competition_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
## Agent

Vou continuar verificando a estrutura das tabelas para entender melhor:

**Use Tool: grep (toolu_01NpFZ4hAh5oNpg2FGDUGRoY)**
```json
{
  "regex": "competition_questions",
  "include_pattern": "**/migrations/**"
}
```

**Tool Results: toolu_01NpFZ4hAh5oNpg2FGDUGRoY**

Found 16 matches:

## Matches in stayfocus-alimentacao/supabase/migrations/20240101000001_create_concursos_tables.sql

### L74-81
```

-- ==========================================================================
-- TABLE: competition_questions
-- Description: Questions for competitions
-- ==========================================================================
CREATE TABLE IF NOT EXISTS competition_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
```

### L101-121
```
);

-- Add comment to competition_questions table
COMMENT ON TABLE competition_questions IS 'Stores questions for competition practice with enhanced features';
COMMENT ON COLUMN competition_questions.question_text IS 'The question text';
COMMENT ON COLUMN competition_questions.question_type IS 'Type of question: multiple_choice, true_false, essay, fill_blank';
COMMENT ON COLUMN competition_questions.options IS 'JSON array of answer options for multiple choice questions';
COMMENT ON COLUMN competition_questions.correct_answer IS 'The correct answer text for single answer questions';
COMMENT ON COLUMN competition_questions.correct_options IS 'JSON array of correct option indices for multiple answer questions';
COMMENT ON COLUMN competition_questions.explanation IS 'Explanation for the correct answer';
COMMENT ON COLUMN competition_questions.difficulty IS 'Difficulty level of the question';
COMMENT ON COLUMN competition_questions.points IS 'Points awarded for correct answer';
COMMENT ON COLUMN competition_questions.time_limit_seconds IS 'Time limit for answering this question in seconds';
COMMENT ON COLUMN competition_questions.tags IS 'Array of tags for categorizing questions';
COMMENT ON COLUMN competition_questions.source IS 'Source of the question (e.g., book, exam, website)';
COMMENT ON COLUMN competition_questions.year IS 'Year the question was created or from which exam';
COMMENT ON COLUMN competition_questions.is_ai_generated IS 'Whether the question was generated by AI';
COMMENT ON COLUMN competition_questions.is_active IS 'Whether the question is active and can be used in simulations';
COMMENT ON COLUMN competition_questions.usage_count IS 'Number of times this question has been used in simulations';

-- ==========================================================================
```

### L183-197
```

-- Index for competition questions
CREATE INDEX IF NOT EXISTS idx_competition_questions_competition_id ON competition_questions(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_questions_subject_id ON competition_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_competition_questions_topic_id ON competition_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_competition_questions_difficulty ON competition_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_competition_questions_question_type ON competition_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_competition_questions_is_ai_generated ON competition_questions(is_ai_generated);
CREATE INDEX IF NOT EXISTS idx_competition_questions_is_active ON competition_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_competition_questions_tags ON competition_questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_competition_questions_year ON competition_questions(year);
CREATE INDEX IF NOT EXISTS idx_competition_questions_usage_count ON competition_questions(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_competition_questions_created_at ON competition_questions(created_at DESC);

-- Index for competition simulations
```

### L211-216
```
CREATE INDEX IF NOT EXISTS idx_competition_simulations_user_competition ON competition_simulations(user_id, competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_simulations_user_favorite ON competition_simulations(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_competition_questions_competition_active ON competition_questions(competition_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_competition_questions_subject_difficulty ON competition_questions(subject_id, difficulty, is_active) WHERE is_active = true;

-- ==========================================================================
```

### L243-248
```
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_questions_updated_at
    BEFORE UPDATE ON competition_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### L261-265
```
ALTER TABLE competition_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_simulations ENABLE ROW LEVEL SECURITY;

```

### L377-389
```

-- ==========================================================================
-- RLS POLICIES FOR competition_questions
-- ==========================================================================

-- Users can only see questions from their own competitions
CREATE POLICY "Users can view questions from their own competitions" ON competition_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_questions.competition_id 
            AND competitions.user_id = auth.uid()
        )
```

### L391-399
```

-- Users can insert questions for their own competitions
CREATE POLICY "Users can insert questions for their own competitions" ON competition_questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_questions.competition_id 
            AND competitions.user_id = auth.uid()
        )
```

### L401-409
```

-- Users can update questions from their own competitions
CREATE POLICY "Users can update questions from their own competitions" ON competition_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_questions.competition_id 
            AND competitions.user_id = auth.uid()
        )
```

### L411-419
```

-- Users can delete questions from their own competitions
CREATE POLICY "Users can delete questions from their own competitions" ON competition_questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM competitions 
            WHERE competitions.id = competition_questions.competition_id 
            AND competitions.user_id = auth.uid()
        )
```

### L467-472
```
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competition_questions') THEN
        RAISE EXCEPTION 'competition_questions table was not created';
    END IF;
    
```

## Matches in stayfocus-alimentacao/supabase/migrations/20250117_add_increment_question_usage_function.sql

### L9-13
```
AS $$
BEGIN
  UPDATE competition_questions
  SET usage_count = usage_count + 1,
      updated_at = now()
```

## Matches in stayfocus-alimentacao/supabase/migrations/20250817133400_create_random_competition_questions.sql

### L1-8
```
BEGIN;

-- Create RPC: random_competition_questions
-- Returns N random questions for a competition, optionally filtered by difficulties
-- Enforces that the caller can only access their own competition's questions
CREATE OR REPLACE FUNCTION public.random_competition_questions(
  competition_id uuid,
  n int,
```

### L9-13
```
  difficulties text[] DEFAULT NULL
)
RETURNS SETOF public.competition_questions
LANGUAGE sql
SECURITY DEFINER
```

### L15-21
```
AS $$
  SELECT q.*
  FROM public.competition_questions q
  JOIN public.competitions c ON c.id = q.competition_id
  WHERE q.competition_id = random_competition_questions.competition_id
    AND c.user_id = auth.uid()
    AND (
```

### L28-33
```

-- Ensure only authenticated users can execute
REVOKE ALL ON FUNCTION public.random_competition_questions(uuid, int, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.random_competition_questions(uuid, int, text[]) TO authenticated;

COMMIT;
```

## Agent

Agora, **identifiquei o problema principal!** A página `/concursos/[id]/questoes/page.tsx` **não está usando o hook `useQuestions`** que foi criado. Ela está fazendo as consultas diretamente no componente, mas o hook existe e é muito mais robusto.

Vamos verificar se há dados na tabela primeiro. Mas o problema mais provável é que a página não está usando o hook correto. Vamos criar uma versão atualizada da página:

**Use Tool: read_file (toolu_013sb7VtzNYVnSynpEe3ReBM)**
```json
{
  "path": "stayfocus-alimentacao/app/concursos/[id]/questoes/page.tsx",
  "start_line": 1,
  "end_line": 30
}
```

**Tool Results: toolu_013sb7VtzNYVnSynpEe3ReBM**

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Edit3, 
  Trash2, 
  Eye,
  BookOpen,
  Target,
  Clock,
  Star
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { CriarQuestaoModal } from '@/components/concursos/criar-questao-modal'
import { ImportarQuestaoJsonModal } from '@/components/concursos/importar-questao-json-modal'
import { VisualizarQuestaoModal } from '@/components/concursos/visualizar-questao-modal'

## Agent

Agora vou identificar os problemas e criar a correção:

## 🔍 **Análise dos Problemas Identificados:**

1. **❌ Hook `useQuestions` não está sendo usado** - A página está fazendo consultas manuais ao invés de usar o hook robusto criado
2. **❌ Possível problema de permissões RLS** - As consultas podem estar falhando devido às políticas de segurança
3. **❌ Falta de tratamento de erros adequado** - Não há logs detalhados dos erros
4. **❌ Interface não atualizada** - A UI pode não estar refletindo o estado correto

## 💡 **Soluções:**

### 1. **Atualizar a página para usar o hook `useQuestions`**

```stayfocus-alimentacao/app/concursos/[id]/questoes/page.tsx#L1-30
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Edit3, 
  Trash2, 
  Eye,
  BookOpen,
  Target,
  Clock,
  Star
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useQuestions } from '@/hooks/use-questions' // ✅ USAR O HOOK
import { CriarQuestaoModal } from '@/components/concursos/criar-questao-modal'
import { ImportarQuestaoJsonModal } from '@/components/concursos/importar-questao-json-modal'
import { VisualizarQuestaoModal } from '@/components/concursos/visualizar-questao-modal'
```

### 2. **Verificar se existem questões de exemplo no banco**

Vamos verificar se existe um script para criar dados de exemplo:

**Use Tool: find_path (toolu_01416xKCvfiHAWkSDgRsdiT1)**
```json
{
  "glob": "**/*seed*"
}
```

**Tool Results: toolu_01416xKCvfiHAWkSDgRsdiT1**

Found 2 total matches.
stayfocus-alimentacao/app/api/seed-concursos
stayfocus-alimentacao/app/api/seed-concursos/route.ts


Debug Output:

```json
{
  "glob": "**/*seed*",
  "paths": [
    "stayfocus-alimentacao/app/api/seed-concursos",
    "stayfocus-alimentacao/app/api/seed-concursos/route.ts"
  ]
}
```

## Agent



**Use Tool: read_file (toolu_01P71jsxSgHm3iJX8BW3dDPD)**
```json
{
  "path": "stayfocus-alimentacao/app/api/seed-concursos/route.ts"
}
```

**Tool Results: toolu_01P71jsxSgHm3iJX8BW3dDPD**

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

## Agent

Perfect! Agora entendi completamente o problema. Há uma API para criar dados de teste, mas as questões podem não estar sendo exibidas porque:

### 🔥 **Principais Problemas Identificados:**

1. **❌ A página não usa o hook `useQuestions`** - Está fazendo consultas manuais
2. **❌ Pode não haver dados de teste** - Precisa rodar o seed primeiro
3. **❌ Estrutura de dados pode estar inconsistente** - O seed tem estrutura diferente do hook

Vou verificar se o concurso que aparece na imagem existe e tem o ID correto:

**Use Tool: diagnostics (toolu_01Khm5WYjzznpiXEqZDwAb2R)**
```json
{}
```

**Tool Results: toolu_01Khm5WYjzznpiXEqZDwAb2R**

No errors or warnings found in the project.
## Agent

## 💡 **Soluções para Resolver o Problema:**

### **1. Primeira Coisa: Rodar o Seed de Dados**

Se você ainda não rodou, execute esta chamada para criar dados de teste:

```bash
POST http://localhost:3000/api/seed-concursos
```

### **2. Atualizar a Página para Usar o Hook `useQuestions`**

O principal problema é que a página `/concursos/[id]/questoes/page.tsx` não está usando o hook `useQuestions` que foi implementado. Vou mostrar como corrigir:

```stayfocus-alimentacao/app/concursos/[id]/questoes/page.tsx#L1-50
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Edit3, 
  Trash2, 
  Eye,
  BookOpen,
  Target,
  Clock,
  Star
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useQuestions } from '@/hooks/use-questions' // ✅ ADICIONADO
import { CriarQuestaoModal } from '@/components/concursos/criar-questao-modal'
import { ImportarQuestaoJsonModal } from '@/components/concursos/importar-questao-json-modal'
import { VisualizarQuestaoModal } from '@/components/concursos/visualizar-questao-modal'

// ... resto do componente seria atualizado para usar o hook
```

### **3. Verificar Problemas de Estrutura de Dados**

Notei que no seed os dados estão um pouco diferentes. O `correct_answer` está como número (index) mas no hook espera string. Vamos verificar:

**Use Tool: grep (toolu_01AhwgbaAUpp4cCvfr1aicgL)**
```json
{
  "regex": "correct_answer.*number|correct_answer.*string",
  "include_pattern": "**/*.ts"
}
```

**Tool Results: toolu_01AhwgbaAUpp4cCvfr1aicgL**

Found 8 matches:

## Matches in stayfocus-alimentacao/hooks/use-concursos.ts

### function useConcursos() › L847-854
```
      const questaoSanitizada = {
        ...questao,
        question_text: sanitizeString(questao.question_text),
        correct_answer: sanitizeString(questao.correct_answer),
        explanation: questao.explanation
          ? sanitizeString(questao.explanation)
          : undefined,
      };
```

## Matches in stayfocus-alimentacao/hooks/use-questions.ts

### interface Question › L8-18
```
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
```

12 lines remaining in ancestor node. Read the file to see all.

### interface CreateQuestionData › L32-42
```
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
```

8 lines remaining in ancestor node. Read the file to see all.

## Matches in stayfocus-alimentacao/hooks/use-simulations.ts

### interface SimulationResults › L60-70
```
export interface SimulationResults {
  score: number;
  correct_answers: number;
  total_questions: number;
  time_spent: number;
  answers: Array<{
    question_id: string;
    user_answer: any;
    is_correct: boolean;
    time_spent: number;
  }>;
```

2 lines remaining in ancestor node. Read the file to see all.

## Matches in stayfocus-alimentacao/lib/supabase.ts

### type Database › L782-792
```
        Row: {
          id: string;
          competition_id: string;
          subject_id?: string;
          topic_id?: string;
          question_text: string;
          options?: any;
          correct_answer?: string;
          explanation?: string;
          difficulty?: string;
          is_ai_generated?: boolean;
```

3 lines remaining in ancestor node. Read the file to see all.

### type Database › L796-806
```
        Insert: {
          id?: string;
          competition_id: string;
          subject_id?: string;
          topic_id?: string;
          question_text: string;
          options?: any;
          correct_answer?: string;
          explanation?: string;
          difficulty?: string;
          is_ai_generated?: boolean;
```

3 lines remaining in ancestor node. Read the file to see all.

### type Database › L810-820
```
        Update: {
          id?: string;
          competition_id?: string;
          subject_id?: string;
          topic_id?: string;
          question_text?: string;
          options?: any;
          correct_answer?: string;
          explanation?: string;
          difficulty?: string;
          is_ai_generated?: boolean;
```

3 lines remaining in ancestor node. Read the file to see all.

## Matches in stayfocus-alimentacao/types/concursos.ts

### interface Questao › L36-46
```
export interface Questao {
  id?: string
  competition_id?: string
  subject_id?: string
  topic_id?: string | null
  question_text: string
  options?: { text: string; isCorrect: boolean }[]
  correct_answer?: string
  explanation?: string
  difficulty?: "facil" | "medio" | "dificil"
  is_ai_generated?: boolean
```

3 lines remaining in ancestor node. Read the file to see all.

## Agent

Há uma inconsistência! No seed, `correct_answer` está sendo definido como **número** (index da opção), mas o hook espera **string**. Vamos corrigir isso.

## 🎯 **Plano de Correção Completo:**

### **1. Executar o Seed de Dados (se não foi feito)**

Primeiro, vamos testar se você consegue criar dados de teste. Abra o seu navegador e acesse:

```
http://localhost:3000/api/seed-concursos
```

Ou faça uma chamada POST para essa URL.

### **2. Corrigir o Seed para Estrutura Correta**

O problema é que no seed o `correct_answer` está como número, mas deveria ser string. Vamos corrigir:

### **3. Atualizar a Página para Usar o Hook**

A página atual não usa o `useQuestions` hook. Precisa ser atualizada.

## 🚀 **Você quer que eu:**

1. **Corrija o seed** para ter a estrutura correta de dados?
2. **Atualize a página** para usar o hook `useQuestions`?
3. **Crie um script** para verificar se há dados no banco?
4. **Todas as opções acima**?

Qual abordagem você prefere que eu faça primeiro? O mais provável é que o problema seja a combinação de **não ter dados de teste** + **não estar usando o hook correto**.


