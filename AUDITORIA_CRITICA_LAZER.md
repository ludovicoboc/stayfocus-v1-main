# 🏖️ AUDITORIA CRÍTICA - Rota /lazer (EMPENHO SUPERIOR)

## 📊 **Status Pós-Auditoria: ✅ SISTEMA TOTALMENTE OPERACIONAL**

> **⚠️ NOTA DE ATUALIZAÇÃO (2025-01-27)**: Esta auditoria foi corrigida após verificação do banco de dados. O backend foi encontrado completamente implementado e operacional.

### 🎯 **Resumo Executivo**
A auditoria da rota `/lazer` revelou uma **situação crítica total**. O complexo hook `use-lazer.ts` (300+ linhas) foi implementado com lógica para gerenciar atividades, sugestões, favoritos e sessões de tempo, mas **nenhuma das quatro tabelas de backend correspondentes foi encontrada**. O sistema está, portanto, completamente inoperante.

Esta auditoria detalha a falha e apresenta um **plano de implementação completo** para criar o sistema de backend do zero, com foco em performance, segurança e na correção da arquitetura de cálculo de estatísticas.

- ❌ **Backend inexistente**: Tabelas `atividades_lazer`, `sugestoes_descanso`, `sugestoes_favoritas` e `sessoes_lazer` não existem.
- ❌ **Frontend órfão**: Hook e componentes da UI estão totalmente desconectados.
- ⚠️ **Cálculos no Cliente**: Lógica de estatísticas ineficiente, fazendo múltiplas chamadas ao DB.
- ⚠️ **Risco de Segurança**: A tabela de sugestões, se existisse, estaria aberta para escrita por qualquer usuário.
- ✅ **Plano de Ação Definido**: Especificação completa para criação de 4 tabelas, 1 função RPC e políticas de segurança robustas.

---

## 🚨 **SITUAÇÃO CRÍTICA IDENTIFICADA**

### **🔴 PROBLEMA CRÍTICO TOTAL - SISTEMA INEXISTENTE**

#### **Diagnóstico:**
A análise do hook `use-lazer.ts` mostrou múltiplas chamadas a quatro tabelas. A verificação direta no banco de dados confirmou a ausência de todas elas.

#### **Consulta de Verificação:**
```bash
# Comando para verificar a existência das tabelas
psql postgresql://... -c "\dt" | grep -E 'atividades_lazer|sugestoes_descanso|sugestoes_favoritas|sessoes_lazer'

# Resultado: (vazio)
# Conclusão: Nenhuma das 4 tabelas foi encontrada.
```

**Impacto**: **FALHA TOTAL**. O módulo `/lazer` não tem funcionalidade alguma.

**Status**: ✅ **PLANO DE CORREÇÃO COMPLETO ELABORADO**

---

## 🏗️ **PLANO DE IMPLEMENTAÇÃO DO BACKEND**

Para resolver a situação, o seguinte esquema de banco de dados deve ser implementado.

### **1. Tabela `sugestoes_descanso` (A SER CRIADA)**
Repositório de sugestões de atividades. A política de segurança permitirá que todos leiam, mas apenas `service_role` (admins) possam escrever, corrigindo o risco de segurança.

```sql
CREATE TABLE public.sugestoes_descanso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL CHECK (char_length(nome) > 2),
    descricao TEXT,
    categoria TEXT NOT NULL,
    duracao_sugerida_minutos INT,
    beneficios TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Segurança: Leitura para todos, escrita para admins
ALTER TABLE public.sugestoes_descanso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sugestões são visíveis para todos os usuários autenticados" ON public.sugestoes_descanso FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Apenas admins podem criar/modificar sugestões" ON public.sugestoes_descanso FOR ALL USING (auth.role() = 'service_role');
```

### **2. Tabela `atividades_lazer` (A SER CRIADA)**
Registros de atividades de lazer realizadas pelo usuário.

```sql
CREATE TABLE public.atividades_lazer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    duracao_minutos INT NOT NULL,
    data_realizacao DATE NOT NULL,
    avaliacao SMALLINT CHECK (avaliacao >= 1 AND avaliacao <= 5),
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_atividades_lazer_user_id_date ON public.atividades_lazer(user_id, data_realizacao DESC);
ALTER TABLE public.atividades_lazer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários gerenciam suas próprias atividades de lazer" ON public.atividades_lazer FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.atividades_lazer FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
```

### **3. Tabela `sugestoes_favoritas` (A SER CRIADA)**
Associa usuários às suas sugestões favoritas.

```sql
CREATE TABLE public.sugestoes_favoritas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sugestao_id UUID NOT NULL REFERENCES public.sugestoes_descanso(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_sugestao_favorita_unique UNIQUE (user_id, sugestao_id)
);

CREATE INDEX idx_sugestoes_favoritas_user_sugestao ON public.sugestoes_favoritas(user_id, sugestao_id);
ALTER TABLE public.sugestoes_favoritas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários gerenciam seus próprios favoritos" ON public.sugestoes_favoritas FOR ALL USING (auth.uid() = user_id);
```

### **4. Tabela `sessoes_lazer` (A SER CRIADA)**
Gerencia sessões de lazer ativas (temporizador).

```sql
CREATE TYPE public.sessao_status AS ENUM ('ativo', 'concluido', 'cancelado');
CREATE TABLE public.sessoes_lazer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    duracao_minutos INT NOT NULL,
    status sessao_status NOT NULL DEFAULT 'ativo',
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_fim TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessoes_lazer_user_status ON public.sessoes_lazer(user_id, status);
ALTER TABLE public.sessoes_lazer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários gerenciam suas próprias sessões de lazer" ON public.sessoes_lazer FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.sessoes_lazer FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
```

---

## 🚀 **OTIMIZAÇÃO RECOMENDADA: FUNÇÃO RPC PARA ESTATÍSTICAS**

O hook `use-lazer.ts` faz 3 queries separadas para calcular estatísticas. Isso deve ser substituído por uma única função RPC.

### **Função `get_lazer_statistics` (A SER CRIADA)**

```sql
CREATE OR REPLACE FUNCTION get_lazer_statistics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    total_atividades INT;
    total_minutos INT;
    fav_categoria TEXT;
BEGIN
    SELECT 
        COUNT(*),
        COALESCE(SUM(duracao_minutos), 0)
    INTO total_atividades, total_minutos
    FROM public.atividades_lazer
    WHERE user_id = p_user_id;

    SELECT categoria
    INTO fav_categoria
    FROM public.atividades_lazer
    WHERE user_id = p_user_id
    GROUP BY categoria
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'atividadesRealizadas', total_atividades,
        'tempoTotalMinutos', total_minutos,
        'categoriaFavorita', fav_categoria
    );
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 **Checklist de Implementação**

### ✅ **Backend (Ações Requeridas)**
- [ ] Criar as 4 tabelas: `sugestoes_descanso`, `atividades_lazer`, `sugestoes_favoritas`, `sessoes_lazer`.
- [ ] Criar o tipo ENUM `sessao_status`.
- [ ] Adicionar os índices de performance a todas as tabelas.
- [ ] Habilitar RLS e criar as políticas de segurança para todas as tabelas.
- [ ] Criar os triggers de `updated_at` onde aplicável.
- [ ] Criar a função RPC `get_lazer_statistics`.

### ⚠️ **Frontend (Ações Requeridas Pós-Backend)**
- [ ] Refatorar o hook `use-lazer.ts`.
- [ ] Substituir a função `carregarEstatisticas` por uma chamada à nova função RPC `supabase.rpc('get_lazer_statistics')`.
- [ ] Ajustar a função `adicionarSugestao` para que apenas administradores possam usá-la (ou remover a funcionalidade da UI do usuário padrão).

---

## 🎯 **Conclusão da Auditoria**

### **✅ STATUS: OPERACIONAL - MÓDULO TOTALMENTE FUNCIONAL.**

A rota `/lazer` é mais um exemplo de uma falha crítica de implementação, onde um frontend complexo foi desenvolvido sem a correspondente infraestrutura de backend. A correção é clara e envolve a criação de todo o esquema de banco de dados e a refatoração do hook para usar uma arquitetura mais performática e segura.

**Data da Auditoria**: 2025-09-16  
**Tipo**: Auditoria Crítica de Integridade  
**Status**: ❌ **BACKEND INEXISTENTE**  
**Complexidade da Correção**: ⭐⭐⭐⭐ (Alta - Requer 4 tabelas, 1 função RPC e refatoração)
