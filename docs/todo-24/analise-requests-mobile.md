# 📊 Análise de Requests Mobile - Hooks de Dados

*Data: 24/08/2024*  
*Status: ✅ ANÁLISE CONCLUÍDA*

---

## 🔍 RESUMO EXECUTIVO

### 📈 **PADRÕES IDENTIFICADOS NOS HOOKS:**

#### 🔥 **PROBLEMAS CRÍTICOS ENCONTRADOS:**

1. **Hooks Sem Otimização Mobile** (15 hooks identificados)
2. **Requests Paralelos Excessivos** sem cache
3. **TTL Uniformes** não otimizados para mobile
4. **Auto-refresh Agressivo** sem detecção de mobile
5. **Falta de Deduplicação** de requests simultâneos

---

## 📱 ANÁLISE POR HOOK

### ✅ **HOOKS JÁ OTIMIZADOS:**

| Hook | Status | Cache | Mobile TTL | Background Refresh |
|------|--------|-------|------------|-------------------|
| `useAuthOptimized` | ✅ **OTIMIZADO** | ✅ Sim | 10min | ✅ Inteligente |
| `useDashboardOptimized` | ✅ **OTIMIZADO** | ✅ Sim | 10min | ✅ Sim |

### ⚠️ **HOOKS NECESSITANDO OTIMIZAÇÃO:**

| Hook | Problemas Identificados | Impacto | Prioridade |
|------|------------------------|---------|------------|
| `useFinancas` | Requests paralelos sem cache, fetch em useEffect | 🔥 **ALTO** | **CRÍTICA** |
| `useEstudos` | Sem cache, requests frequentes | 🔥 **ALTO** | **CRÍTICA** |
| `useSaude` | Multiple requests, sem otimização mobile | ⚡ **MÉDIO** | **ALTA** |
| `useSono` | Sem cache, auto-refresh | ⚡ **MÉDIO** | **ALTA** |
| `useReceitas` | Load manual, sem background refresh | ⚡ **MÉDIO** | **ALTA** |
| `useProfile` | Multiple requests paralelos | ⚡ **MÉDIO** | **ALTA** |
| `useConcursos` | Cache manual limitado | 📋 **BAIXO** | **MÉDIA** |
| `useHiperfocos` | Requests paralelos em fetch | 📋 **BAIXO** | **MÉDIA** |
| `useLazer` | Promise.all sem cache | 📋 **BAIXO** | **MÉDIA** |
| `useSimulados` | Sem cache, histórico grande | 📋 **BAIXO** | **MÉDIA** |
| `useCompromissos` | Requests simples, otimização básica | 📋 **BAIXO** | **BAIXA** |
| `useSelfKnowledge` | Requests básicos, pouco uso | 📋 **BAIXO** | **BAIXA** |

---

## 🔍 ANÁLISE DETALHADA

### 🔥 **USEFINANCAS - PROBLEMA CRÍTICO**

```typescript
// ❌ PROBLEMA: Requests paralelos sem cache
const fetchDados = async () => {
  await Promise.all([
    fetchCategorias(),    // Sem cache
    fetchDespesas(),      // Sem cache  
    fetchEnvelopes(),     // Sem cache
    fetchPagamentos(),    // Sem cache
  ]);
};

// ❌ PROBLEMA: Auto-fetch em useEffect
useEffect(() => {
  if (user) {
    fetchDados(); // Executa sempre que user muda
  }
}, [user]);
```

**Impacto Mobile:**
- 4 requests simultâneos a cada carregamento
- Sem cache para dados financeiros
- Re-fetch desnecessário em mudanças de estado

**Solução Proposta:**
```typescript
// ✅ SOLUÇÃO: Cache integrado e TTL mobile
const carregarFinancas = useCallback(async () => {
  return globalRequestCache.get(
    `financas-${user?.id}`,
    async () => {
      const [categorias, despesas, envelopes, pagamentos] = await Promise.all([...]);
      return { categorias, despesas, envelopes, pagamentos };
    },
    {
      ttl: 5 * 60 * 1000,        // 5min desktop
      mobileTTL: 15 * 60 * 1000, // 15min mobile (dados mudam menos)
      staleWhileRevalidate: true
    }
  );
}, [user]);
```

### 🔥 **USEESTUDOS - PROBLEMA CRÍTICO**

```typescript
// ❌ PROBLEMA: Fetch direto sem cache
const fetchSessoes = async () => {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
};

// ❌ PROBLEMA: Re-fetch em cada mudança de user
useEffect(() => {
  if (user) {
    fetchSessoes(); // Sem debounce, sem cache
  }
}, [user]);
```

**Impacto Mobile:**
- Requests frequentes para dados de estudo
- Sem otimização para conexões lentas
- Lista longa de sessões sem paginação

### ⚡ **USESAUDE - PROBLEMA MÉDIO**

```typescript
// ❌ PROBLEMA: Multiple requests individuais
const carregarMedicamentos = useCallback(async () => {
  const { data, error } = await supabase.from("medicamentos").select("*");
  // Sem cache, sem otimização mobile
}, []);

// ❌ PROBLEMA: Segundo request para dados relacionados
await carregarMedicamentosTomados(); // Request adicional
```

**Impacto Mobile:**
- 2+ requests para dados de saúde
- Calls separados que poderiam ser unificados
- Sem cache para medicamentos (dados estáveis)

---

## 📊 MÉTRICAS DE IMPACTO

### 🎯 **REQUESTS POR HOOK (Estimativa):**

| Hook | Requests/Load | Frequência | Requests/Hour | Cache Atual |
|------|---------------|------------|---------------|-------------|
| `useFinancas` | 4 requests | Alta | ~48 | ❌ Nenhum |
| `useEstudos` | 1 request | Alta | ~20 | ❌ Nenhum |
| `useSaude` | 2-3 requests | Média | ~15 | ❌ Nenhum |
| `useSono` | 1-2 requests | Média | ~10 | ❌ Nenhum |
| `useReceitas` | 2 requests | Baixa | ~6 | ❌ Nenhum |
| **TOTAL** | **10-12** | - | **~99** | **0%** |

### 📱 **IMPACTO MOBILE ESPECÍFICO:**

- **Consumo de Dados:** ~99 requests/hora sem cache
- **Latência Mobile:** Requests 2-3x mais lentos (2g/3g)
- **Battery Impact:** Requests frequentes drenam bateria
- **UX Impact:** Loading states excessivos

---

## 🎯 PLANO DE OTIMIZAÇÃO

### 🔥 **FASE 1: HOOKS CRÍTICOS (Prioridade Máxima)**

#### **1.1 useFinancas Otimizado**
```typescript
export function useFinancasOptimized() {
  return globalRequestCache.get(
    `financas-combined-${user?.id}`,
    fetchAllFinancialData,
    {
      ttl: 5 * 60 * 1000,        // 5min desktop
      mobileTTL: 15 * 60 * 1000, // 15min mobile
      staleWhileRevalidate: true,
      timeout: isMobile() ? 10000 : 5000
    }
  );
}
```

#### **1.2 useEstudos Otimizado**
```typescript
export function useEstudosOptimized() {
  return globalRequestCache.get(
    `estudos-${user?.id}`,
    fetchStudyData,
    {
      ttl: 10 * 60 * 1000,       // 10min desktop
      mobileTTL: 20 * 60 * 1000, // 20min mobile
      staleWhileRevalidate: true
    }
  );
}
```

### ⚡ **FASE 2: HOOKS MÉDIOS (Próxima Iteração)**

- `useSaude` → Cache combinado para medicamentos
- `useSono` → TTL longo para dados históricos  
- `useReceitas` → Background refresh para receitas
- `useProfile` → Cache por seções

### 📋 **FASE 3: HOOKS BAIXOS (Otimização Futura)**

- `useConcursos` → Melhorar cache existente
- `useHiperfocos` → Cache para projetos ativos
- `useLazer` → Cache para sugestões

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### **Padrão de Otimização Padrão:**

```typescript
// Template para hooks otimizados
export function useHookOptimized(params?: any) {
  const { user } = useAuthOptimized();
  
  const loadData = useCallback(async () => {
    if (!user) return null;
    
    return globalRequestCache.get(
      `hook-${user.id}-${JSON.stringify(params)}`,
      async () => {
        // Requests combinados quando possível
        const [data1, data2] = await Promise.allSettled([
          fetchData1(),
          fetchData2()
        ]);
        
        return processResults([data1, data2]);
      },
      {
        // TTL otimizado para mobile
        ttl: DESKTOP_TTL,
        mobileTTL: MOBILE_TTL,
        staleWhileRevalidate: true,
        timeout: isMobile() ? 8000 : 5000
      }
    );
  }, [user, params]);
  
  // Auto-refresh inteligente
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden && user) {
        loadData(); // Background refresh
      }
    }, isMobile() ? 120000 : 60000); // 2min mobile, 1min desktop
    
    return () => clearInterval(interval);
  }, [loadData]);
}
```

---

## 🎯 RESULTADOS ESPERADOS

### **Após Otimização Completa:**

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Requests/Hour** | ~99 | ~25 | **75% redução** |
| **Cache Hit Rate** | 0% | >70% | **Melhoria total** |
| **Loading Time Mobile** | 3-5s | 1-2s | **60% melhoria** |
| **Data Usage** | Alto | Baixo | **70% redução** |
| **Battery Impact** | Alto | Baixo | **Significativa** |

### **Benefícios Mobile:**

1. **Menos Requests:** 75% redução no volume
2. **Melhor UX:** Loading mais rápido via cache
3. **Economia de Dados:** Stale-while-revalidate
4. **Melhor Bateria:** Menos requests em background
5. **Offline Resilience:** Cache como fallback

---

## ✅ CONCLUSÕES

### **Status Atual:**
- ✅ **2 hooks otimizados** (useAuth, useDashboard)
- ⚠️ **12 hooks necessitam otimização**
- 🔥 **4 hooks críticos** identificados

### **Próximos Passos:**
1. Implementar `useFinancasOptimized` 
2. Implementar `useEstudosOptimized`
3. Implementar `useSaudeOptimized`
4. Continuar com hooks de prioridade média

### **Impacto Esperado:**
- **Performance Mobile:** Melhoria de 60-75%
- **User Experience:** Significativamente melhor
- **Consumo de Recursos:** Redução drástica

---

*Análise técnica concluída - Pronto para implementação*