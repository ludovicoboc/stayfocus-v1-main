# Sistema de Validação de Dados - StayFocus

Este documento explica o sistema de validação implementado para garantir a integridade dos dados antes de enviá-los para o Supabase.

## Visão Geral

O sistema de validação foi implementado para:
- **Sanitizar** dados de entrada (remover espaços extras, formatar datas, etc.)
- **Validar** campos obrigatórios, formatos, limites e tipos de dados
- **Prevenir** erros de banco de dados e problemas de segurança
- **Melhorar** a experiência do usuário com mensagens de erro claras

## Estrutura

### Arquivos Principais

- `utils/validations.ts` - Sistema principal de validação
- `utils/validations.test.ts` - Exemplos e testes das validações
- Todos os hooks em `hooks/` - Aplicação das validações

### Classes e Funções

#### `DataValidator`
Classe principal que fornece validação flexível através de regras.

```typescript
const validator = new DataValidator()
const resultado = validator.validateFields([
  { field: 'Nome', value: 'João', rules: ['required', 'string', 'minLength:2'] },
  { field: 'Email', value: 'joao@email.com', rules: ['required', 'email'] }
])
```

#### Funções de Validação Específicas
- `validateReceita()` - Validação de receitas
- `validateMedicamento()` - Validação de medicamentos
- `validateRegistroHumor()` - Validação de registros de humor
- `validateDespesa()` - Validação de despesas
- `validateConcurso()` - Validação de concursos
- `validateSessaoEstudo()` - Validação de sessões de estudo
- `validateRegistroSono()` - Validação de registros de sono
- `validateAtividadeLazer()` - Validação de atividades de lazer
- `validateQuestao()` - Validação de questões
- `validateItemListaCompras()` - Validação de itens de lista de compras

#### Funções Utilitárias
- `validateData()` - Aplica validação e lança erro se inválida
- `sanitizeString()` - Limpa e formata strings
- `sanitizeArray()` - Remove valores vazios de arrays
- `sanitizeNumber()` - Converte e valida números
- `sanitizeDate()` - Formata e valida datas

## Regras de Validação Disponíveis

### Campos Obrigatórios
- `required` - Campo não pode ser vazio, null ou undefined

### Tipos de Dados
- `string` - Deve ser uma string
- `number` - Deve ser um número
- `boolean` - Deve ser true ou false
- `array` - Deve ser um array
- `arrayNotEmpty` - Array deve ter pelo menos 1 item

### Validações Numéricas
- `positive` - Número deve ser positivo (> 0)
- `min:N` - Valor mínimo (ex: `min:18`)
- `max:N` - Valor máximo (ex: `max:100`)
- `range:N-M` - Valor deve estar entre N e M (ex: `range:1-10`)

### Validações de String
- `minLength:N` - Tamanho mínimo (ex: `minLength:3`)
- `maxLength:N` - Tamanho máximo (ex: `maxLength:200`)
- `email` - Formato de email válido
- `url` - URL válida

### Validações de Data/Hora
- `date` - Data válida (ISO: YYYY-MM-DD ou BR: DD/MM/YYYY)
- `time` - Horário válido (HH:MM)

### Validações Específicas
- `uuid` - UUID válido
- `enum:val1,val2,val3` - Valor deve estar na lista (ex: `enum:facil,medio,dificil`)

## Como Usar

### 1. Em um Hook

```typescript
import { validateReceita, validateData, sanitizeString, sanitizeArray } from "@/utils/validations"

const adicionarReceita = async (receita) => {
  try {
    // Sanitizar dados
    const receitaSanitizada = {
      ...receita,
      nome: sanitizeString(receita.nome),
      ingredientes: sanitizeArray(receita.ingredientes)
    }

    // Validar dados
    validateData(receitaSanitizada, validateReceita)

    // Salvar no Supabase
    const { data, error } = await supabase.from("receitas").insert(receitaSanitizada)
    
    return { data, error }
  } catch (validationError) {
    return { error: validationError, data: null }
  }
}
```

### 2. Validação Personalizada

```typescript
import { DataValidator } from "@/utils/validations"

const validator = new DataValidator()
const resultado = validator.validateFields([
  { field: 'Nome', value: formData.name, rules: ['required', 'string', 'minLength:2', 'maxLength:50'] },
  { field: 'Idade', value: formData.age, rules: ['required', 'number', 'positive', 'max:120'] },
  { field: 'Email', value: formData.email, rules: ['required', 'email'] }
])

if (!resultado.isValid) {
  console.log('Erros:', resultado.errors)
}
```

### 3. Tratamento de Erros

```typescript
try {
  validateData(dados, validateReceita)
} catch (error) {
  // error.message contém todos os erros: "Dados inválidos: Nome é obrigatório, Email deve ter formato válido"
  const erros = error.message.replace('Dados inválidos: ', '').split(', ')
  
  // Mostrar erros na UI
  erros.forEach(erro => toast.error(erro))
}
```

## Exemplos de Validação

### Receita
```typescript
const receita = {
  nome: "Bolo de Chocolate",           // ✅ string, 2-100 chars
  categoria: "Sobremesas",             // ✅ string, max 50 chars
  ingredientes: ["farinha", "açúcar"], // ✅ array não vazio
  modo_preparo: "Misture e asse...",   // ✅ string, 10-2000 chars
  tempo_preparo: 60,                   // ✅ número positivo, max 1440
  porcoes: 8,                          // ✅ número positivo, max 50
  dificuldade: "medio"                 // ✅ enum: facil|medio|dificil
}
```

### Medicamento
```typescript
const medicamento = {
  nome: "Paracetamol",                 // ✅ string, 2-100 chars
  dosagem: "500mg",                    // ✅ string, max 50 chars
  frequencia: "8 em 8 horas",         // ✅ string, max 100 chars
  horarios: ["08:00", "16:00"],       // ✅ array não vazio, formato HH:MM
  data_inicio: "2024-01-15",          // ✅ data válida
  observacoes: "Tomar com água"        // ✅ string, max 500 chars (opcional)
}
```

### Despesa
```typescript
const despesa = {
  description: "Supermercado",         // ✅ string, 2-200 chars
  amount: 150.75,                      // ✅ número positivo
  date: "2024-01-15",                  // ✅ data válida
  category_id: "uuid-valido",          // ✅ UUID válido
  notes: "Compras da semana"           // ✅ string, max 500 chars (opcional)
}
```

## Implementação nos Hooks

Todos os hooks da aplicação foram atualizados para incluir validação:

### Hooks Atualizados
- ✅ `use-receitas.ts` - Receitas e lista de compras
- ✅ `use-saude.ts` - Medicamentos e registros de humor
- ✅ `use-financas.ts` - Despesas e pagamentos
- ✅ `use-concursos.ts` - Concursos e questões
- ✅ `use-estudos.ts` - Sessões de estudo
- ✅ `use-sono.ts` - Registros de sono
- ✅ `use-lazer.ts` - Atividades de lazer
- ✅ `use-compromissos.ts` - Compromissos
- ✅ `use-dashboard.ts` - Dados do dashboard

### Padrão de Implementação

Cada função que envia dados para o Supabase segue este padrão:

1. **Verificar autenticação** - `if (!user) return { error: ... }`
2. **Sanitizar dados** - Usar funções `sanitize*`
3. **Validar dados** - Usar `validateData()` ou validador específico
4. **Inserir no Supabase** - Operação normal
5. **Tratar erros** - Capturar e retornar erros de validação

## Benefícios

### Para Desenvolvedores
- **Consistência** - Todas as validações seguem o mesmo padrão
- **Reutilização** - Funções podem ser usadas em qualquer lugar
- **Flexibilidade** - Sistema de regras permite validações personalizadas
- **Manutenibilidade** - Validações centralizadas e documentadas

### Para Usuários
- **Feedback claro** - Mensagens de erro específicas e úteis
- **Prevenção de erros** - Dados inválidos são rejeitados antes do envio
- **Melhor experiência** - Interface mais robusta e confiável

### Para a Aplicação
- **Integridade de dados** - Banco de dados sempre consistente
- **Segurança** - Proteção contra dados maliciosos
- **Performance** - Menos operações de banco com falha
- **Confiabilidade** - Sistema mais estável e previsível

## Testes

Para executar os exemplos de validação:

```typescript
import { executarTodosExemplos, exemploTratamentoErros } from "@/utils/validations.test"

// Executar todos os exemplos
executarTodosExemplos()

// Testar tratamento de erros
exemploTratamentoErros()
```

## Extensão

Para adicionar novas validações:

1. **Adicionar regra na classe DataValidator**
2. **Criar função de validação específica** (se necessário)
3. **Aplicar nos hooks relevantes**
4. **Adicionar exemplos nos testes**
5. **Documentar aqui**

## Conclusão

O sistema de validação fornece uma base sólida para garantir a qualidade dos dados na aplicação StayFocus. Ele é flexível, extensível e fácil de usar, proporcionando uma melhor experiência tanto para desenvolvedores quanto para usuários finais.
