# TO-DO: Correções para Problemas de Concursos

## 🎯 Resumo
Este documento detalha os problemas identificados na funcionalidade de concursos e as correções necessárias para garantir que as páginas sejam criadas corretamente após a inserção.

## 🚨 Problemas Identificados

### 1. **Tratamento Inconsistente de Tópicos**
**Arquivo:** `hooks/use-concursos.ts` (linhas 111-115)

**Problema:**
```typescript
const topicosToInsert = disciplina.topicos.map((topico) => ({
  subject_id: disciplinaData.id,
  name: topico.name || topico, // ⚠️ topico pode ser string ou objeto
  completed: false,
}))
```

**Impacto:** Pode causar falhas na inserção de tópicos quando o tipo não corresponde ao esperado.

### 2. **Falta de Tratamento de Erro na Página Dinâmica**
**Arquivo:** `app/concursos/[id]/page.tsx` (linhas 45-50)

**Problema:**
```typescript
const loadConcurso = async () => {
  setLoading(true)
  const data = await fetchConcursoCompleto(id)
  setConcurso(data) // ⚠️ data pode ser null
  setLoading(false)
}
```

**Impacto:** Página não carrega quando o concurso não é encontrado ou há erro na busca.

### 3. **Redirecionamento Pode Falhar**
**Arquivo:** `app/concursos/page.tsx` (linhas 40-44)

**Problema:**
```typescript
const handleSaveConcurso = async (concurso: Concurso) => {
  const novoConcurso = await adicionarConcurso(concurso)
  if (novoConcurso?.id) {
    router.push(`/concursos/${novoConcurso.id}`) // ⚠️ Pode falhar
  }
}
```

**Impacto:** Usuário não é redirecionado para a página do concurso após criação.

### 4. **Validação de URL Muito Restritiva**
**Arquivo:** `utils/validations.ts` (função validateConcurso)

**Problema:** A validação de URL pode estar rejeitando URLs válidas para o campo opcional `edital_link`.

### 5. **Falta de Logs de Debug**
**Impacto:** Dificulta a identificação de problemas em produção.

## 🔧 Correções Necessárias

### ✅ Correção 1: Normalizar Tratamento de Tópicos

**Arquivo:** `hooks/use-concursos.ts`

```typescript
// Antes da inserção de tópicos, normalizar a estrutura
if (disciplina.topicos && disciplina.topicos.length > 0) {
  const topicosToInsert = disciplina.topicos.map((topico) => ({
    subject_id: disciplinaData.id,
    name: typeof topico === 'string' ? topico : topico.name,
    completed: false,
  }))
  
  const { error: topicosError } = await supabase
    .from("competition_topics")
    .insert(topicosToInsert)
    
  if (topicosError) {
    console.error('Erro ao inserir tópicos:', topicosError)
    throw topicosError
  }
}
```

### ✅ Correção 2: Melhorar Tratamento de Erro na Página Dinâmica

**Arquivo:** `app/concursos/[id]/page.tsx`

```typescript
const loadConcurso = async () => {
  setLoading(true)
  try {
    const data = await fetchConcursoCompleto(id)
    if (!data) {
      console.error('Concurso não encontrado:', id)
      // Redirecionar para página de erro ou lista de concursos
      router.push('/concursos')
      return
    }
    setConcurso(data)
  } catch (error) {
    console.error('Erro ao carregar concurso:', error)
    // Mostrar mensagem de erro ao usuário
  } finally {
    setLoading(false)
  }
}
```

### ✅ Correção 3: Melhorar Redirecionamento e Tratamento de Erro

**Arquivo:** `app/concursos/page.tsx`

```typescript
const handleSaveConcurso = async (concurso: Concurso) => {
  try {
    const novoConcurso = await adicionarConcurso(concurso)
    if (novoConcurso?.id) {
      setShowAddModal(false)
      console.log('Concurso criado com sucesso:', novoConcurso.id)
      // Aguardar um breve delay para garantir que o concurso foi salvo
      setTimeout(() => {
        router.push(`/concursos/${novoConcurso.id}`)
      }, 100)
    } else {
      throw new Error('Falha ao criar concurso: ID não retornado')
    }
  } catch (error) {
    console.error('Erro ao salvar concurso:', error)
    // Mostrar mensagem de erro ao usuário
  }
}
```

### ✅ Correção 4: Melhorar Validação de URL

**Arquivo:** `utils/validations.ts`

```typescript
// Na função validateConcurso, melhorar a validação de URL
if (concurso.edital_link && concurso.edital_link.trim() !== "") {
  // Aceitar URLs mais flexíveis
  const urlPattern = /^https?:\/\/.+/i
  if (!urlPattern.test(concurso.edital_link.trim())) {
    rules.push({
      field: "Link do edital",
      value: concurso.edital_link,
      rules: ["url"],
    });
  }
}
```

### ✅ Correção 5: Adicionar Logs de Debug

**Arquivo:** `hooks/use-concursos.ts`

```typescript
const adicionarConcurso = async (concurso: Concurso) => {
  if (!user) {
    console.error('Usuário não autenticado')
    return null
  }

  console.log('Iniciando criação do concurso:', concurso.title)

  try {
    // Logs em cada etapa crítica
    console.log('Dados sanitizados:', concursoSanitizado)
    
    // Após inserção do concurso
    console.log('Concurso inserido com ID:', concursoData.id)
    
    // Após inserção de disciplinas
    if (concurso.disciplinas && concurso.disciplinas.length > 0) {
      console.log(`Inserindo ${concurso.disciplinas.length} disciplinas`)
      // ... logs durante o processo
    }
    
    console.log('Concurso criado com sucesso!')
    return concursoData
  } catch (error) {
    console.error('Erro detalhado ao criar concurso:', {
      error,
      concurso: concurso.title,
      userId: user.id
    })
    throw error
  }
}
```

## 🧪 Testes Recomendados

### Teste 1: Criação de Concurso Simples
1. Criar concurso apenas com título e organizadora
2. Verificar se a página é criada corretamente
3. Verificar logs no console

### Teste 2: Criação de Concurso com Disciplinas
1. Criar concurso com 2-3 disciplinas
2. Verificar se disciplinas são salvas corretamente
3. Verificar se a página de detalhes carrega

### Teste 3: Criação de Concurso com URLs
1. Testar com URL válida
2. Testar com URL inválida
3. Testar sem URL (campo opcional)

### Teste 4: Tratamento de Erros
1. Simular erro de rede
2. Verificar se mensagens de erro são exibidas
3. Verificar se não há redirecionamento em caso de erro

## 📋 Checklist de Implementação

- [ ] Aplicar correção 1: Normalizar tópicos
- [ ] Aplicar correção 2: Tratamento de erro na página dinâmica
- [ ] Aplicar correção 3: Melhorar redirecionamento
- [ ] Aplicar correção 4: Validação de URL
- [ ] Aplicar correção 5: Adicionar logs
- [ ] Executar testes de criação
- [ ] Verificar logs no console do navegador
- [ ] Testar redirecionamento após criação
- [ ] Validar funcionamento em produção

## 🔍 Monitoramento Pós-Correção

Após implementar as correções, monitorar:

1. **Console do navegador** - Para logs de debug
2. **Logs do Supabase** - Para erros de banco de dados
3. **Comportamento de redirecionamento** - Usuários chegam na página correta
4. **Taxa de sucesso na criação** - Concursos são criados sem falhas

---

**Autor:** StayFocus Development Team  
**Data:** Janeiro 2025  
**Prioridade:** Alta 🔴