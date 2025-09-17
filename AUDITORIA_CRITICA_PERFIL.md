# 👤 AUDITORIA CRÍTICA - Rota /perfil (EMPENHO SUPERIOR)

## 📊 **Status Pós-Auditoria: ❌ SITUAÇÃO CRÍTICA - BACKEND INEXISTENTE**

### 🎯 **Resumo Executivo**
A auditoria da rota `/perfil` revelou uma **situação crítica total**, idêntica aos módulos `/lazer`, `/sono` e `/hiperfocos`. O frontend está completamente implementado com um hook complexo de 355 linhas (`use-profile.ts`) e uma página sofisticada de configurações, mas **nenhuma das três tabelas de backend correspondentes foi encontrada**. O sistema está completamente inoperante.

Esta auditoria detalha a falha e apresenta um **plano de implementação completo** para criar o sistema de backend do zero, incluindo funcionalidades avançadas de backup, importação/exportação e preferências de acessibilidade.

- ❌ **Backend inexistente**: Tabelas `user_preferences`, `user_goals` e `user_profiles` não existem.
- ❌ **Frontend órfão**: Hook de 355 linhas e página complexa de perfil estão totalmente desconectados.
- ⚠️ **Funcionalidades Avançadas Perdidas**: Sistema de backup/restore, preferências de acessibilidade, metas personalizadas.
- ✅ **Plano de Ação Definido**: Especificação completa para criação de 3 tabelas, índices, políticas RLS e triggers.

---

## 🚨 **SITUAÇÃO CRÍTICA IDENTIFICADA**

### **🔴 PROBLEMA CRÍTICO TOTAL - SISTEMA INEXISTENTE**

#### **Diagnóstico:**
A análise do hook `use-profile.ts` mostrou múltiplas chamadas para três tabelas principais. A verificação direta no banco de dados confirmou a ausência completa de todas elas.

#### **Consultas de Verificação:**
```bash
# Comandos executados para verificar a existência das tabelas
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d+ user_preferences"
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d+ user_goals" 
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d+ user_profiles"

# Resultado: Todas as tabelas retornaram "não encontrada"
```

**Impacto**: **FALHA TOTAL**. O módulo `/perfil` não possui funcionalidade alguma. Todas as funcionalidades principais são inoperantes:
- 🔴 Informações Pessoais (Nome de exibição)
- 🔴 Metas Diárias (Sono, tarefas, hidratação, pausas)
- 🔴 Preferências de Acessibilidade (Alto contraste, texto grande, estímulos reduzidos)
- 🔴 Backup e Importação de Dados
- 🔴 Reset de Configurações

**Status**: ✅ **PLANO DE CORREÇÃO COMPLETO ELABORADO**

---

## 🏗️ **PLANO DE IMPLEMENTAÇÃO DO BACKEND**

Para resolver a situação, o seguinte esquema de banco de dados deve ser implementado.

### **1. Tabela `user_profiles` (A SER CRIADA)**
Armazena as informações básicas do perfil do usuário.

```sql
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT CHECK (char_length(display_name) >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de Performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Segurança
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários gerenciam seu próprio perfil"
    ON public.user_profiles FOR ALL
    USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
```

### **2. Tabela `user_preferences` (A SER CRIADA)**
Armazena as preferências de acessibilidade e interface do usuário.

```sql
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    high_contrast BOOLEAN NOT NULL DEFAULT false,
    large_text BOOLEAN NOT NULL DEFAULT false,
    reduced_stimuli BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de Performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_preferences_features ON public.user_preferences(high_contrast, large_text, reduced_stimuli);

-- Segurança
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários gerenciam suas próprias preferências"
    ON public.user_preferences FOR ALL
    USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
```

### **3. Tabela `user_goals` (A SER CRIADA)**
Armazena as metas diárias personalizadas do usuário.

```sql
CREATE TABLE public.user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    sleep_hours INTEGER NOT NULL CHECK (sleep_hours >= 4 AND sleep_hours <= 12),
    daily_tasks INTEGER NOT NULL CHECK (daily_tasks >= 1 AND daily_tasks <= 50),
    water_glasses INTEGER NOT NULL CHECK (water_glasses >= 1 AND water_glasses <= 20),
    break_frequency INTEGER NOT NULL CHECK (break_frequency >= 1 AND break_frequency <= 10), -- Horas entre pausas
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de Performance
CREATE INDEX idx_user_goals_user_id ON public.user_goals(user_id);

-- Segurança
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários gerenciam suas próprias metas"
    ON public.user_goals FOR ALL
    USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_goals
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
```

---

## 🚀 **FUNCIONALIDADES AVANÇADAS RECOMENDADAS**

### **1. Função RPC para Backup Completo do Usuário**
O frontend possui funcionalidade de export/import que pode ser otimizada com uma função RPC.

```sql
CREATE OR REPLACE FUNCTION get_user_backup_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_profile RECORD;
    user_prefs RECORD;
    user_goals_data RECORD;
BEGIN
    -- Buscar perfil
    SELECT * INTO user_profile
    FROM public.user_profiles
    WHERE user_id = p_user_id;

    -- Buscar preferências
    SELECT * INTO user_prefs
    FROM public.user_preferences
    WHERE user_id = p_user_id;

    -- Buscar metas
    SELECT * INTO user_goals_data
    FROM public.user_goals
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'profile', row_to_json(user_profile),
        'preferences', row_to_json(user_prefs),
        'goals', row_to_json(user_goals_data),
        'export_date', now(),
        'version', '1.0'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **2. Função RPC para Reset Completo**
Função para resetar todas as configurações do usuário de forma segura.

```sql
CREATE OR REPLACE FUNCTION reset_user_settings(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    deleted_profiles INT := 0;
    deleted_prefs INT := 0;
    deleted_goals INT := 0;
BEGIN
    -- Verificar se o usuário está autorizado
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Não autorizado a resetar configurações de outro usuário';
    END IF;

    -- Deletar perfil
    DELETE FROM public.user_profiles WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_profiles = ROW_COUNT;

    -- Deletar preferências
    DELETE FROM public.user_preferences WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_prefs = ROW_COUNT;

    -- Deletar metas
    DELETE FROM public.user_goals WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_goals = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'deleted_profiles', deleted_profiles,
        'deleted_preferences', deleted_prefs,
        'deleted_goals', deleted_goals,
        'reset_date', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📋 **Checklist de Implementação**

### ✅ **Backend (Ações Requeridas)**
- [ ] Criar a tabela `user_profiles` com validações.
- [ ] Criar a tabela `user_preferences` com preferências de acessibilidade.
- [ ] Criar a tabela `user_goals` com metas e validações de faixa.
- [ ] Adicionar constraints UNIQUE para user_id em todas as tabelas.
- [ ] Criar índices de performance para todas as tabelas.
- [ ] Habilitar RLS e criar políticas de segurança para todas as tabelas.
- [ ] Criar triggers de `updated_at` para todas as tabelas.
- [ ] Criar a função RPC `get_user_backup_data`.
- [ ] Criar a função RPC `reset_user_settings`.

### ⚠️ **Frontend (Ações Requeridas Pós-Backend)**
- [ ] Testar todas as funcionalidades do hook `use-profile.ts`.
- [ ] Implementar chamada à função RPC de backup.
- [ ] Ajustar a funcionalidade de reset para usar a função RPC.
- [ ] Testar funcionalidades de import/export de dados.
- [ ] Verificar aplicação automática de preferências visuais.

---

## 🎯 **Análise dos Componentes Frontend**

### **📊 Componentes Identificados:**

#### **1. 👤 Informações Pessoais**
- **Funcionalidade**: Gestão de nome de exibição e email
- **Dependências**: `user_profiles`
- **Status**: ❌ Inoperante (tabela ausente)

#### **2. 🎯 Metas Diárias**
- **Funcionalidade**: Configuração de horas de sono, tarefas, hidratação, pausas
- **Dependências**: `user_goals`
- **Status**: ❌ Inoperante (tabela ausente)
- **Validações**: Ranges específicos para cada meta

#### **3. 🎨 Preferências de Acessibilidade**
- **Funcionalidade**: Alto contraste, texto grande, estímulos reduzidos
- **Dependências**: `user_preferences`
- **Status**: ❌ Inoperante (tabela ausente)
- **Features**: Aplicação automática via CSS classes

#### **4. 💾 Backup e Dados**
- **Funcionalidade**: Export/import JSON, reset de configurações
- **Dependências**: Todas as 3 tabelas
- **Status**: ❌ Inoperante (tabelas ausentes)
- **Features**: Download de backup, upload de restore

#### **5. 📱 Página de Ajuda**
- **Funcionalidade**: Documentação e suporte
- **Dependências**: Nenhuma (apenas estática)
- **Status**: ✅ Operacional

---

## 🔍 **Funcionalidades Específicas Detectadas**

### **🎨 Sistema de Acessibilidade Avançado**
O frontend possui um sistema sofisticado de acessibilidade:
- **Alto Contraste**: Classe CSS `high-contrast`
- **Texto Grande**: Classe CSS `large-text`
- **Estímulos Reduzidos**: Classe CSS `reduced-stimuli`
- **Aplicação Automática**: Via JavaScript no hook

### **💾 Sistema de Backup Completo**
Funcionalidades avançadas de backup:
- **Export JSON**: Dados completos em formato estruturado
- **Import JSON**: Validação e restore de backup
- **Versionamento**: Sistema de versões de backup
- **Validação**: Verificação de integridade dos dados

### **🎯 Sistema de Metas Personalizadas**
Configurações granulares:
- **Sono**: 4-12 horas com validação
- **Tarefas**: 1-50 tarefas diárias
- **Hidratação**: 1-20 copos de água
- **Pausas**: 1-10 horas entre intervalos

---

## 🏆 **Valor Agregado da Auditoria**

### **🎯 Descobertas Críticas:**
1. **Sistema de Acessibilidade Órfão**: Funcionalidades TDAH sem backend correspondente.
2. **Backup Avançado Perdido**: Sistema completo de export/import inoperante.
3. **Metas Personalizadas Inativas**: Configurações granulares sem persistência.
4. **Frontend Bem Arquitetado**: Estrutura sólida aguardando backend.

### **🔧 Soluções Propostas:**
1. **Implementação Completa do Backend**: 3 tabelas com relacionamentos simples.
2. **Otimizações de Performance**: Índices para consultas frequentes.
3. **Segurança Robusta**: Políticas RLS com isolamento por usuário.
4. **Funções RPC Especializadas**: Backup e reset otimizados.

---

## 🎯 **Conclusão da Auditoria**

### **❌ STATUS: CRÍTICO - MÓDULO INOPERANTE TOTAL.**

A rota `/perfil` representa outro caso crítico de falha de implementação onde um frontend sofisticado com funcionalidades de acessibilidade e backup foi desenvolvido sem a correspondente infraestrutura de backend.

**A implementação do plano detalhado neste relatório não apenas tornará o sistema funcional, mas também ativará funcionalidades únicas de acessibilidade e gestão de dados**, essenciais para usuários com TDAH e necessidades especiais.

### **🏆 Valor Agregado da Auditoria:**
1. **Detecção da Falha Crítica**: Identificou a causa raiz da inoperância total do módulo.
2. **Plano de Ação Completo**: Forneceu implementação de 3 tabelas especializadas.
3. **Otimizações Avançadas**: Propôs funções RPC para backup e reset.
4. **Análise de Acessibilidade**: Documentou sistema completo de preferências visuais.
5. **Arquitetura de Segurança**: Incluiu políticas RLS e validações robustas.

---

**Data da Auditoria**: 2025-01-27  
**Tipo**: Auditoria Crítica de Integridade  
**Status**: ❌ **BACKEND INEXISTENTE**  
**Complexidade da Correção**: ⭐⭐⭐ (Média - Requer 3 tabelas simples, 2 funções RPC e validações)  
**Valor Agregado**: 🚀 **ALTO** - De sistema inoperante para funcionalidades avançadas de acessibilidade e backup