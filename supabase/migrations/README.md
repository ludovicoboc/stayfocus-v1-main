# Supabase Migrations

Este diretório contém as migrações organizadas e otimizadas para o projeto StayFocus.

## Estrutura Reorganizada (2024-01-01)

As migrações foram consolidadas e reorganizadas para melhor execução e manutenção:

### Ordem de Execução

1. **20240101_001_core_functions.sql**
   - Extensões básicas (uuid-ossp)
   - Função `update_updated_at_column()` usada por todas as tabelas

2. **20240101_002_user_profile_system.sql**
   - `user_profiles` - Perfis de usuário
   - `user_preferences` - Preferências de interface
   - `user_goals` - Metas diárias do usuário
   - Triggers automáticos para novos usuários

3. **20240101_003_alimentacao_system.sql**
   - `receitas` - Receitas dos usuários
   - `lista_compras` - Listas de compras
   - `meal_plans` - Planejamento de refeições
   - `meal_records` - Registro de refeições
   - `hydration_records` - Controle de hidratação

4. **20240101_004_competitions_system.sql**
   - `competitions` - Concursos
   - `competition_subjects` - Matérias dos concursos
   - `competition_topics` - Tópicos das matérias
   - `competition_questions` - Questões para simulados
   - `competition_simulations` - Simulados salvos
   - `simulation_history` - Histórico de simulados executados

5. **20240101_005_study_system.sql**
   - `study_sessions` - Sessões de estudo
   - `pomodoro_sessions` - Sessões pomodoro
   - Funções de estatísticas de estudo
   - Sincronização automática de ciclos pomodoro

6. **20240101_006_health_sleep_systems.sql**
   - `medicamentos` - Medicamentos cadastrados
   - `registros_humor` - Registros de humor
   - `medicamentos_tomados` - Histórico de medicações
   - `sleep_records` - Registros de sono
   - `sleep_reminders` - Configurações de lembretes de sono

7. **20240101_007_focus_finance_systems.sql**
   - `hyperfocus_projects` - Projetos de hiperfoco
   - `hyperfocus_tasks` - Tarefas dos projetos
   - `hyperfocus_sessions` - Sessões de foco
   - `alternation_sessions` - Sessões de alternância
   - `expense_categories` - Categorias de despesas
   - `expenses` - Registro de despesas
   - `virtual_envelopes` - Envelopes virtuais
   - `scheduled_payments` - Pagamentos agendados

8. **20240101_008_leisure_selfknowledge_systems.sql**
   - `atividades_lazer` - Atividades de lazer
   - `sugestoes_descanso` - Sugestões de descanso (dados pré-populados)
   - `sugestoes_favoritas` - Sugestões favoritas dos usuários
   - `sessoes_lazer` - Sessões de lazer
   - `self_knowledge_notes` - Notas de autoconhecimento
   - Função de busca textual para autoconhecimento

9. **20240101_009_dashboard_system.sql**
   - `painel_dia` - Atividades do painel do dia
   - `prioridades` - Prioridades/tarefas importantes
   - `sessoes_foco` - Sessões de foco para dashboard
   - `compromissos` - Compromissos e agendamentos

10. **20240101_010_functions_and_procedures.sql**
    - `increment_question_usage()` - Incrementa uso de questões
    - `random_competition_questions()` - RPC para questões aleatórias
    - `update_simulation_stats()` - Atualiza estatísticas de simulados
    - `get_dashboard_summary()` - Resumo do dashboard
    - `get_health_overview()` - Visão geral da saúde
    - `cleanup_old_data()` - Limpeza de dados antigos
    - `get_system_stats()` - Estatísticas do sistema
    - Configuração automática completa para novos usuários

## Melhorias Implementadas

### 🔧 Problemas Resolvidos

1. **Função Duplicada**: `update_updated_at_column()` agora definida apenas uma vez
2. **Dependências Organizadas**: Ordem correta de execução garantida
3. **RLS Simplificado**: Políticas consolidadas com `FOR ALL`
4. **Triggers Otimizados**: Removidas duplicações e conflitos
5. **Comentários Padronizados**: Documentação consistente

### 🚀 Funcionalidades Novas

1. **Setup Automático**: Usuários novos recebem dados padrão automaticamente
2. **Estatísticas Integradas**: Funções para relatórios e dashboards
3. **Limpeza Automática**: Função para manter banco limpo
4. **Validações Aprimoradas**: Constraints mais robustas

### 📊 Estrutura de Dados

- **17 arquivos antigos** → **10 arquivos organizados**
- **Dependências claras** entre módulos
- **Execução sequencial** garantida
- **Manutenção simplificada**

## Como Aplicar

```bash
# No diretório do projeto
npx supabase db reset

# Ou aplicar migrações específicas
npx supabase migration up
```

## Monitoramento

Utilize as funções de utilidade para monitorar o sistema:

```sql
-- Estatísticas do dashboard do usuário
SELECT * FROM get_dashboard_summary('user-uuid', CURRENT_DATE);

-- Visão geral de saúde
SELECT * FROM get_health_overview('user-uuid', 30);

-- Estatísticas do sistema (admin)
SELECT * FROM get_system_stats();
```

## Manutenção

```sql
-- Limpeza de dados antigos (manter 1 ano)
SELECT cleanup_old_data(365);

-- Limpeza de sessões pomodoro inativas
SELECT cleanup_old_inactive_pomodoro_sessions();
```

---

**Reorganizado em**: 2024-01-01  
**Status**: ✅ Pronto para produção  
**Compatibilidade**: Supabase v2.0+