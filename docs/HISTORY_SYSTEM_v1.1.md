# Sistema de Histórico v1.1 - Documentação Completa

## 📋 Visão Geral

O Sistema de Histórico v1.1 é uma implementação unificada para rastreamento de atividades em todos os módulos da aplicação StayFocus. Ele substitui e expande os sistemas de histórico fragmentados anteriores, oferecendo uma visão centralizada do progresso do usuário.

## 🎯 Objetivos

- **Unificação**: Centralizar o histórico de todas as atividades em um sistema único
- **Flexibilidade**: Suportar diferentes tipos de atividades e métricas
- **Performance**: Otimizado para consultas rápidas e analytics
- **Escalabilidade**: Preparado para crescimento futuro da aplicação
- **Usabilidade**: Interface intuitiva para visualização e análise

## 🏗️ Arquitetura

### Estrutura de Banco de Dados

#### 1. `activity_history` - Tabela Principal
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- module: TEXT (estudos, simulados, financas, etc.)
- activity_type: TEXT (study_session, simulation_completed, etc.)
- activity_subtype: TEXT (opcional)
- title: TEXT
- description: TEXT (opcional)
- metadata: JSONB (dados específicos do módulo)
- score: NUMERIC (opcional)
- duration_minutes: INTEGER (opcional)
- success_rate: NUMERIC (opcional)
- category: TEXT (opcional)
- tags: TEXT[] (opcional)
- difficulty: TEXT (facil, medio, dificil)
- status: TEXT (completed, in_progress, etc.)
- is_favorite: BOOLEAN
- is_milestone: BOOLEAN
- activity_date: DATE
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. `history_analytics` - Analytics Pré-computados
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- module: TEXT
- period_type: TEXT (daily, weekly, monthly, yearly)
- period_start: DATE
- period_end: DATE
- total_activities: INTEGER
- total_duration_minutes: INTEGER
- avg_score: NUMERIC
- avg_success_rate: NUMERIC
- streak_count: INTEGER
- best_performance: NUMERIC
- activity_breakdown: JSONB
- category_breakdown: JSONB
```

#### 3. `history_goals` - Metas e Objetivos
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- module: TEXT
- goal_type: TEXT
- title: TEXT
- description: TEXT
- target_value: NUMERIC
- target_unit: TEXT
- start_date: DATE
- end_date: DATE
- is_recurring: BOOLEAN
- recurrence_pattern: TEXT
- current_value: NUMERIC
- is_achieved: BOOLEAN
- achieved_at: TIMESTAMP
- is_active: BOOLEAN
```

### Componentes TypeScript

#### 1. Types (`types/history.ts`)
- Definições de tipos TypeScript para todas as entidades
- Interfaces para filtros e consultas
- Tipos para criação e atualização de atividades

#### 2. Hook Principal (`hooks/use-history.ts`)
- `useHistory(defaultModule?)`: Hook principal para gerenciamento de histórico
- Funções para CRUD de atividades
- Consultas otimizadas e analytics
- Gerenciamento de estado local

#### 3. Utilitários de Integração (`lib/history-integration.ts`)
- `HistoryTracker`: Classe para rastreamento simplificado
- Métodos específicos por módulo
- Funções de migração e exportação
- Helpers para integração com módulos existentes

#### 4. Componentes UI
- `HistoryDashboard`: Dashboard completo de histórico
- `HistoryModal`: Modal reutilizável para histórico
- Componentes especializados por módulo

## 🚀 Como Usar

### 1. Rastreamento Básico de Atividade

```typescript
import { useHistory } from "@/hooks/use-history"

function MeuComponente() {
  const { addActivity } = useHistory()

  const registrarAtividade = async () => {
    await addActivity({
      module: 'estudos',
      activity_type: 'study_session',
      title: 'Sessão de Matemática',
      description: 'Estudei álgebra linear',
      duration_minutes: 60,
      category: 'matemática',
      tags: ['álgebra', 'linear']
    })
  }
}
```

### 2. Usando o HistoryTracker

```typescript
import { createHistoryTracker } from "@/lib/history-integration"

const tracker = createHistoryTracker(userId)

// Rastrear sessão de estudo
await tracker.trackStudySession({
  disciplina: 'Matemática',
  topico: 'Álgebra Linear',
  duration_minutes: 60,
  difficulty: 'medio'
})

// Rastrear simulado
await tracker.trackSimulationCompletion({
  simulation_title: 'Simulado ENEM 2024',
  score: 85,
  total_questions: 100,
  duration_minutes: 180
})
```

### 3. Exibindo Histórico

```typescript
import { HistoryModal } from "@/components/history-modal"

function MeuModulo() {
  const [showHistory, setShowHistory] = useState(false)

  return (
    <>
      <Button onClick={() => setShowHistory(true)}>
        Ver Histórico
      </Button>
      
      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        module="estudos"
        title="Histórico de Estudos"
      />
    </>
  )
}
```

## 📊 Tipos de Atividades por Módulo

### Estudos
- `study_session`: Sessões de estudo
- `pomodoro_completed`: Ciclos Pomodoro
- `topic_completed`: Tópicos concluídos
- `note_created`: Notas criadas

### Simulados
- `simulation_completed`: Simulados finalizados
- `practice_test`: Testes práticos
- `question_answered`: Questões respondidas
- `review_session`: Sessões de revisão

### Finanças
- `expense_added`: Despesas adicionadas
- `income_added`: Receitas adicionadas
- `budget_created`: Orçamentos criados
- `goal_achieved`: Metas financeiras alcançadas

### Saúde
- `medication_taken`: Medicamentos tomados
- `mood_logged`: Humor registrado
- `symptom_tracked`: Sintomas acompanhados
- `exercise_completed`: Exercícios realizados

### Sono
- `sleep_logged`: Sono registrado
- `bedtime_routine`: Rotina de dormir
- `wake_up_logged`: Despertar registrado
- `sleep_goal_met`: Meta de sono atingida

### Alimentação
- `meal_logged`: Refeições registradas
- `recipe_created`: Receitas criadas
- `nutrition_goal_met`: Metas nutricionais atingidas

### Lazer
- `activity_completed`: Atividades de lazer
- `hobby_session`: Sessões de hobby
- `social_activity`: Atividades sociais

### Hiperfocos
- `focus_session`: Sessões de foco
- `interest_explored`: Interesses explorados
- `project_completed`: Projetos concluídos

### Autoconhecimento
- `reflection_completed`: Reflexões
- `journal_entry`: Entradas de diário
- `goal_set`: Metas definidas
- `insight_gained`: Insights obtidos

## 🔧 Migração de Dados Existentes

### Migração Automática de Simulados

```typescript
import { migrateSimulationHistory } from "@/lib/history-integration"

// Migrar histórico existente de simulados
await migrateSimulationHistory(userId)
```

### Migração Manual

```typescript
import { batchAddActivities } from "@/lib/history-integration"

const activities = [
  {
    module: 'estudos',
    activity_type: 'study_session',
    title: 'Sessão Antiga',
    // ... outros dados
  }
]

await batchAddActivities(userId, activities)
```

## 📈 Analytics e Relatórios

### Estatísticas por Módulo

```typescript
const { getModuleStats } = useHistory()

const stats = await getModuleStats('estudos')
// Retorna: total_activities, total_duration, avg_performance, streak, etc.
```

### Progresso Semanal

```typescript
const { getWeeklyProgress } = useHistory()

const progress = await getWeeklyProgress('2024-01-01')
// Retorna: atividades diárias, totais, performance média
```

### Exportação de Dados

```typescript
import { exportUserHistory } from "@/lib/history-integration"

const data = await exportUserHistory(
  userId,
  ['estudos', 'simulados'], // módulos específicos
  '2024-01-01', // data inicial
  '2024-12-31'  // data final
)
```

## 🎨 Personalização da Interface

### Dashboard Personalizado

```typescript
<HistoryDashboard 
  defaultModule="estudos"
  showAllModules={false}
  compact={true}
/>
```

### Modal com Ações Customizadas

```typescript
<HistoryModal
  module="simulados"
  onActivityReplay={(activity) => {
    // Lógica para repetir atividade
  }}
  onActivitySelect={(activity) => {
    // Lógica para selecionar atividade
  }}
/>
```

## 🔒 Segurança e Performance

### Row Level Security (RLS)
- Todas as tabelas têm RLS habilitado
- Usuários só acessam seus próprios dados
- Políticas otimizadas para performance

### Índices Otimizados
- Índices compostos para consultas comuns
- Índices GIN para campos JSONB e arrays
- Índices de data para consultas temporais

### Cache e Otimizações
- Cache local no hook para reduzir consultas
- Paginação automática para grandes datasets
- Lazy loading de analytics

## 🚀 Roadmap Futuro

### v1.2 - Melhorias Planejadas
- [ ] Sincronização offline
- [ ] Exportação para diferentes formatos (PDF, CSV)
- [ ] Comparação entre períodos
- [ ] Metas inteligentes baseadas em histórico
- [ ] Notificações de progresso
- [ ] Integração com calendário

### v1.3 - Recursos Avançados
- [ ] Machine Learning para insights
- [ ] Recomendações personalizadas
- [ ] Compartilhamento de progresso
- [ ] Gamificação avançada
- [ ] API pública para integrações

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro ao salvar atividade**
   - Verificar se o usuário está autenticado
   - Validar dados obrigatórios (module, activity_type, title)

2. **Histórico não carrega**
   - Verificar conexão com banco
   - Confirmar políticas RLS

3. **Performance lenta**
   - Verificar índices do banco
   - Implementar paginação
   - Usar filtros para reduzir dataset

### Logs e Debug

```typescript
// Habilitar logs detalhados
localStorage.setItem('debug_history', 'true')

// Verificar estado do hook
const { loading, error } = useHistory()
console.log({ loading, error })
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte esta documentação
2. Verifique os logs do console
3. Teste com dados de exemplo
4. Reporte bugs com detalhes específicos

---

**Versão**: 1.1  
**Data**: Janeiro 2024  
**Autor**: Sistema StayFocus  
**Status**: ✅ Implementado