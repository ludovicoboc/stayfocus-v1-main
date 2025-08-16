

### **📋 LISTA COMPLETA DE PÁGINAS COM HEADERS DUPLICADOS:**

#### **🔴 Páginas Principais:**
1. **`app/page.tsx`** (Dashboard principal) - ✅ JÁ IDENTIFICADO
2. **`app/dashboard/page.tsx`** (Dashboard alternativo)
3. **`app/alimentacao/page.tsx`**
4. **`app/autoconhecimento/page.tsx`**
5. **`app/concursos/page.tsx`**
6. **`app/estudos/page.tsx`**
7. **`app/financas/page.tsx`**
8. **`app/hiperfocos/page.tsx`**
9. **`app/lazer/page.tsx`**
10. **`app/receitas/page.tsx`**
11. **`app/saude/page.tsx`**
12. **`app/sono/page.tsx`**

#### **🔴 Subpáginas:**
13. **`app/concursos/[id]/page.tsx`** (Detalhes do concurso)
14. **`app/estudos/simulado/page.tsx`**
15. **`app/estudos/simulado-personalizado/page.tsx`**
16. **`app/receitas/adicionar/page.tsx`**
17. **`app/receitas/lista-compras/page.tsx`**

#### **🔴 Páginas de Loading:**
18. **`app/receitas/loading.tsx`** (Até mesmo o loading tem header!)

### **🎯 PADRÃO IDENTIFICADO:**

**TODAS** essas páginas seguem o mesmo padrão problemático:

```typescript
return (
  <div className="min-h-screen bg-slate-900">
    {/* Header DUPLICADO */}
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Conteúdo do header personalizado */}
      </div>
    </header>
    
    {/* Main Content */}
    <main className="max-w-7xl mx-auto p-4">
      {/* Conteúdo da página */}
    </main>
  </div>
)
```

### **💥 PROBLEMA CRÍTICO:**

Cada uma dessas páginas está renderizando **2 HEADERS**:
1. O **`AppHeader`** global (do `layout.tsx`)
2. O **header customizado** de cada página individual

### **🛠️ SOLUÇÃO SISTEMÁTICA RECOMENDADA:**

#### **Opção 1: Remoção Completa dos Headers Duplicados**
```typescript
// EM TODAS AS PÁGINAS LISTADAS ACIMA:
// REMOVER completamente o bloco:
{/* Header */}
<header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
  // ... todo o conteúdo
</header>

// E manter apenas:
<main className="max-w-7xl mx-auto p-4">
  {/* Conteúdo da página */}
</main>
```
