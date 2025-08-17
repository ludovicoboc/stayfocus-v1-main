# Guia de Desenvolvimento - StayFocus Alimentação

## Abordagem Recomendada para Qualidade de Código

Este documento descreve a nova abordagem implementada para evitar loops de build e melhorar a qualidade do código.

## Scripts Disponíveis

### Verificação de Tipos
```bash
npm run typecheck        # Verifica tipos TypeScript sem fazer build
npm run typecheck:watch  # Verifica tipos em modo watch
```

### Linting
```bash
npm run lint           # Executa ESLint
npm run lint:fix       # Executa ESLint e corrige automaticamente
```

### Verificação Completa
```bash
npm run check          # Executa typecheck + lint em sequência
```

### Build e Desenvolvimento
```bash
npm run dev            # Inicia servidor de desenvolvimento
npm run build          # Faz build da aplicação
npm run start          # Inicia servidor de produção
```

## Fluxo de Trabalho Recomendado

### 1. Durante o Desenvolvimento
```bash
# Antes de começar a trabalhar
npm run check

# Para desenvolvimento com verificação contínua
npm run typecheck:watch
```

### 2. Antes de Commit
```bash
# Verifica tudo antes de commitar
npm run check

# Se houver erros de lint, tenta corrigir automaticamente
npm run lint:fix

# Só então faz o build
npm run build
```

### 3. Benefícios desta Abordagem
- **Evita loops de build**: você vê TODOS os erros de uma vez
- **Build rápido local**: não trava por detalhes de lint/tipos
- **CI rigoroso**: mantém qualidade no ambiente de produção
- **Feedback rápido**: typecheck separado é mais rápido que build completo

## Configurações Implementadas

### TypeScript
- **Local**: `tsconfig.json` exclui testes e arquivos desnecessários
- **Testes**: `tsconfig.test.json` configuração específica para testes
- **Typecheck**: separado do build para performance

### ESLint
- **Ignorados**: `.eslintignore` exclui arquivos de build e cache
- **Regras suaves**: variáveis não usadas como warning (com `_` prefix ignored)
- **Configuração**: foca na qualidade sem ser obstrutivo

### Next.js
- **Local**: ignora erros de TypeScript/ESLint durante build
- **CI**: mantém verificações rigorosas
- **Performance**: otimizações para componentes pesados

## Estrutura de Arquivos

```
├── tsconfig.json           # Config principal (exclui testes)
├── tsconfig.test.json      # Config específica para testes
├── .eslintrc.json          # Regras ESLint suaves
├── .eslintignore           # Arquivos ignorados pelo ESLint
├── next.config.mjs         # Config condicional por ambiente
└── docs/
    └── DEVELOPMENT.md      # Este documento
```

## Tratamento de Erros

### TypeScript
```typescript
// ✅ Preferir @ts-expect-error com explicação
// @ts-expect-error: API externa não tem tipos corretos
const result = externalLib.unstypedMethod();

// ❌ Evitar @ts-ignore (silêncio eterno)
// @ts-ignore
const result = externalLib.unstypedMethod();
```

### ESLint
```typescript
// ✅ Variáveis não usadas com underscore
const handleClick = (_event: MouseEvent) => {
  // lógica sem usar event
};

// ✅ Desabilitar regra específica quando necessário
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dynamicData: any = JSON.parse(response);
```

## Ambientes

### Desenvolvimento Local
- Build rápido sem travamento
- Typecheck e lint separados
- Feedback imediato com watch mode

### CI/Produção
- Verificações rigorosas obrigatórias
- Build falha se houver erros
- Qualidade garantida

## Solução de Problemas

### "Muitos erros TypeScript"
```bash
# Veja todos os erros de uma vez
npm run typecheck

# Corrija todos antes de tentar build
npm run build
```

### "Build muito lento"
```bash
# Use verificação separada durante desenvolvimento
npm run typecheck:watch

# Build será mais rápido depois
```

### "Erros de lint bloqueando"
```bash
# Tente correção automática primeiro
npm run lint:fix

# Depois verifique manualmente
npm run lint
```

## Próximos Passos (Opcional)

Para automatização adicional, considere:

1. **Husky + lint-staged**: validar apenas arquivos modificados
2. **GitHub Actions**: pipeline CI automatizado
3. **Pre-commit hooks**: verificações automáticas antes de commit

## Comandos Rápidos

```bash
# Fluxo completo de verificação
npm run check && npm run build

# Desenvolvimento com watch
npm run typecheck:watch &
npm run dev

# Correção rápida de lint
npm run lint:fix && npm run typecheck
```
