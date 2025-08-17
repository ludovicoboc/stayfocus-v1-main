/**
 * Exemplos de teste para demonstrar o funcionamento das validações
 * Este arquivo serve como documentação e exemplo de uso
 */

import { 
  validateReceita, 
  validateMedicamento, 
  validateRegistroHumor, 
  validateDespesa,
  validateConcurso,
  validateSessaoEstudo,
  validateRegistroSono,
  validateAtividadeLazer,
  validateQuestao,
  validateItemListaCompras,
  validateData,
  DataValidator 
} from './validations'

// Exemplo de uso do DataValidator
export function exemploValidacaoPersonalizada() {
  const validator = new DataValidator()
  
  const resultado = validator.validateFields([
    { field: 'Nome', value: 'João Silva', rules: ['required', 'string', 'minLength:2', 'maxLength:100'] },
    { field: 'Email', value: 'joao@email.com', rules: ['required', 'email'] },
    { field: 'Idade', value: 25, rules: ['required', 'number', 'positive', 'max:120'] },
    { field: 'Data nascimento', value: '1998-05-15', rules: ['required', 'date'] },
  ])
  
  console.log('Validação personalizada:', resultado)
  return resultado
}

// Exemplo de validação de receita
export function exemploValidacaoReceita() {
  const receitaValida = {
    nome: 'Bolo de Chocolate',
    categoria: 'Sobremesas',
    ingredientes: ['farinha', 'açúcar', 'chocolate', 'ovos'],
    modo_preparo: 'Misture todos os ingredientes e asse por 40 minutos a 180°C.',
    tempo_preparo: 60,
    porcoes: 8,
    dificuldade: 'medio' as const,
    favorita: false
  }
  
  const receitaInvalida = {
    nome: '', // Inválido: vazio
    categoria: 'Sobremesas',
    ingredientes: [], // Inválido: array vazio
    modo_preparo: 'Muito curto', // Inválido: muito curto
    tempo_preparo: -10, // Inválido: negativo
    porcoes: 0, // Inválido: zero
    dificuldade: 'impossivel' as any, // Inválido: não está no enum
    favorita: false
  }
  
  console.log('Receita válida:', validateReceita(receitaValida))
  console.log('Receita inválida:', validateReceita(receitaInvalida))
}

// Exemplo de validação de medicamento
export function exemploValidacaoMedicamento() {
  const medicamentoValido = {
    nome: 'Paracetamol',
    dosagem: '500mg',
    frequencia: '8 em 8 horas',
    horarios: ['08:00', '16:00', '00:00'],
    data_inicio: '2024-01-15',
    observacoes: 'Tomar com água'
  }
  
  const medicamentoInvalido = {
    nome: '', // Inválido: vazio
    dosagem: '', // Inválido: vazio
    frequencia: '', // Inválido: vazio
    horarios: ['25:00', '30:99'], // Inválido: formato de horário incorreto
    data_inicio: '15/01/2024', // Válido: formato brasileiro será convertido
    observacoes: 'Observação muito longa que excede o limite de caracteres permitido para este campo de observações do medicamento que não deveria ser tão longa assim mas estou escrevendo para testar o limite de caracteres que foi definido como 500 caracteres máximo e esta string definitivamente excede esse limite então deveria ser considerada inválida pela validação.'
  }
  
  console.log('Medicamento válido:', validateMedicamento(medicamentoValido))
  console.log('Medicamento inválido:', validateMedicamento(medicamentoInvalido))
}

// Exemplo de validação de registro de humor
export function exemploValidacaoRegistroHumor() {
  const registroValido = {
    data: '2024-01-15',
    nivel_humor: 7,
    fatores: ['trabalho', 'exercicio'],
    observacoes: 'Dia produtivo'
  }
  
  const registroInvalido = {
    data: '', // Inválido: vazio
    nivel_humor: 15, // Inválido: fora do range 1-10
    fatores: ['trabalho'],
    observacoes: 'Observação válida'
  }
  
  console.log('Registro válido:', validateRegistroHumor(registroValido))
  console.log('Registro inválido:', validateRegistroHumor(registroInvalido))
}

// Exemplo de validação de despesa
export function exemploValidacaoDespesa() {
  const despesaValida = {
    description: 'Supermercado',
    amount: 150.75,
    date: '2024-01-15',
    category_id: '123e4567-e89b-12d3-a456-426614174000',
    notes: 'Compras da semana'
  }
  
  const despesaInvalida = {
    description: 'A', // Inválido: muito curto
    amount: -50, // Inválido: negativo
    date: '15/13/2024', // Inválido: mês inválido
    category_id: 'invalid-uuid', // Inválido: UUID inválido
    notes: 'Nota válida'
  }
  
  console.log('Despesa válida:', validateDespesa(despesaValida))
  console.log('Despesa inválida:', validateDespesa(despesaInvalida))
}

// Exemplo de validação de concurso
export function exemploValidacaoConcurso() {
  const concursoValido = {
    title: 'Concurso Público Municipal',
    organizer: 'Prefeitura Municipal',
    registration_date: '2024-02-01',
    exam_date: '2024-03-15',
    edital_link: 'https://exemplo.com/edital.pdf',
    status: 'ativo' as const
  }
  
  const concursoInvalido = {
    title: 'A', // Inválido: muito curto
    organizer: '', // Inválido: vazio
    registration_date: '2024-02-01',
    exam_date: '2024-03-15',
    edital_link: 'link-invalido', // Inválido: não é URL
    status: 'inexistente' as any // Inválido: não está no enum
  }
  
  console.log('Concurso válido:', validateConcurso(concursoValido))
  console.log('Concurso inválido:', validateConcurso(concursoInvalido))
}

// Exemplo de validação de sessão de estudo
export function exemploValidacaoSessaoEstudo() {
  const sessaoValida = {
    topic: 'Matemática - Álgebra Linear',
    duration_minutes: 90,
    pomodoro_cycles: 3,
    notes: 'Estudei matrizes e determinantes',
    competition_id: '123e4567-e89b-12d3-a456-426614174000'
  }
  
  const sessaoInvalida = {
    topic: 'A', // Inválido: muito curto
    duration_minutes: 2000, // Inválido: mais de 24h
    pomodoro_cycles: -1, // Inválido: negativo
    notes: 'Nota válida',
    competition_id: 'invalid-uuid' // Inválido: UUID inválido
  }
  
  console.log('Sessão válida:', validateSessaoEstudo(sessaoValida))
  console.log('Sessão inválida:', validateSessaoEstudo(sessaoInvalida))
}

// Exemplo de validação de registro de sono
export function exemploValidacaoRegistroSono() {
  const registroValido = {
    date: '2024-01-15',
    bedtime: '23:30',
    wake_time: '07:00',
    sleep_quality: 4,
    notes: 'Dormi bem'
  }
  
  const registroInvalido = {
    date: '', // Inválido: vazio
    bedtime: '25:00', // Inválido: hora inválida
    wake_time: '7:00', // Válido: será aceito
    sleep_quality: 6, // Inválido: fora do range 1-5
    notes: 'Nota válida'
  }
  
  console.log('Registro sono válido:', validateRegistroSono(registroValido))
  console.log('Registro sono inválido:', validateRegistroSono(registroInvalido))
}

// Exemplo de validação de atividade de lazer
export function exemploValidacaoAtividadeLazer() {
  const atividadeValida = {
    nome: 'Caminhada no parque',
    categoria: 'Exercício',
    duracao_minutos: 45,
    data_realizacao: '2024-01-15',
    avaliacao: 5,
    observacoes: 'Muito relaxante'
  }
  
  const atividadeInvalida = {
    nome: '', // Inválido: vazio
    categoria: '', // Inválido: vazio
    duracao_minutos: 0, // Inválido: zero
    data_realizacao: 'data-invalida', // Inválido: formato inválido
    avaliacao: 6, // Inválido: fora do range 1-5
    observacoes: 'Observação válida'
  }
  
  console.log('Atividade válida:', validateAtividadeLazer(atividadeValida))
  console.log('Atividade inválida:', validateAtividadeLazer(atividadeInvalida))
}

// Exemplo de validação de questão
export function exemploValidacaoQuestao() {
  const questaoValida = {
    question_text: 'Qual é a capital do Brasil?',
    options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'],
    correct_answer: 'Brasília',
    explanation: 'Brasília é a capital federal do Brasil desde 1960.',
    difficulty: 'facil' as const,
    competition_id: '123e4567-e89b-12d3-a456-426614174000',
    subject_id: '123e4567-e89b-12d3-a456-426614174001'
  }
  
  const questaoInvalida = {
    question_text: 'Muito curta?', // Inválido: muito curta
    options: [], // Inválido: array vazio
    correct_answer: '', // Inválido: vazio
    explanation: 'Explicação válida',
    difficulty: 'impossivel' as any, // Inválido: não está no enum
    competition_id: 'invalid-uuid', // Inválido: UUID inválido
    subject_id: '123e4567-e89b-12d3-a456-426614174001'
  }
  
  console.log('Questão válida:', validateQuestao(questaoValida))
  console.log('Questão inválida:', validateQuestao(questaoInvalida))
}

// Exemplo de validação de item de lista de compras
export function exemploValidacaoItemListaCompras() {
  const itemValido = {
    nome: 'Leite integral',
    categoria: 'Laticínios',
    quantidade: '1 litro'
  }
  
  const itemInvalido = {
    nome: '', // Inválido: vazio
    categoria: '', // Inválido: vazio
    quantidade: 'Quantidade muito longa que excede o limite de caracteres'
  }
  
  console.log('Item válido:', validateItemListaCompras(itemValido))
  console.log('Item inválido:', validateItemListaCompras(itemInvalido))
}

// Função para executar todos os exemplos
export function executarTodosExemplos() {
  console.log('=== EXECUTANDO EXEMPLOS DE VALIDAÇÃO ===\n')
  
  console.log('1. Validação Personalizada:')
  exemploValidacaoPersonalizada()
  
  console.log('\n2. Validação de Receita:')
  exemploValidacaoReceita()
  
  console.log('\n3. Validação de Medicamento:')
  exemploValidacaoMedicamento()
  
  console.log('\n4. Validação de Registro de Humor:')
  exemploValidacaoRegistroHumor()
  
  console.log('\n5. Validação de Despesa:')
  exemploValidacaoDespesa()
  
  console.log('\n6. Validação de Concurso:')
  exemploValidacaoConcurso()
  
  console.log('\n7. Validação de Sessão de Estudo:')
  exemploValidacaoSessaoEstudo()
  
  console.log('\n8. Validação de Registro de Sono:')
  exemploValidacaoRegistroSono()
  
  console.log('\n9. Validação de Atividade de Lazer:')
  exemploValidacaoAtividadeLazer()
  
  console.log('\n10. Validação de Questão:')
  exemploValidacaoQuestao()
  
  console.log('\n11. Validação de Item de Lista de Compras:')
  exemploValidacaoItemListaCompras()
  
  console.log('\n=== EXEMPLOS CONCLUÍDOS ===')
}

// Função para demonstrar como capturar e tratar erros de validação
export function exemploTratamentoErros() {
  try {
    const dadosInvalidos = {
      nome: '', // Erro: campo obrigatório vazio
      categoria: 'Teste',
      ingredientes: [], // Erro: array vazio
      modo_preparo: 'Curto', // Erro: muito curto
      tempo_preparo: undefined,
      porcoes: undefined,
      dificuldade: 'impossivel',
      favorita: false
    }
    
    // Esta linha deve lançar um erro devido aos dados inválidos
    validateData(dadosInvalidos, validateReceita)
    console.log('Erro: Validação deveria ter falhado!')
    
  } catch (error) {
    console.log('✅ Erro capturado corretamente:', (error as Error).message)
    
    // Exemplo de como tratar o erro na UI
    const errosFormatados = (error as Error).message.replace('Dados inválidos: ', '').split(', ')
    console.log('📝 Erros individuais:')
    errosFormatados.forEach((erro, index) => {
      console.log(`   ${index + 1}. ${erro}`)
    })
    
    // Aqui você poderia mostrar os erros na interface do usuário
    // Por exemplo, destacar os campos com erro ou mostrar mensagens de toast
  }
}

// Executar os exemplos automaticamente quando o arquivo for executado
if (typeof window === 'undefined') {
  console.log('🚀 Iniciando testes do sistema de validação...\n')
  executarTodosExemplos()
  console.log('\n📋 Testando tratamento de erros...')
  exemploTratamentoErros()
  console.log('\n✅ Todos os testes foram executados com sucesso!')
}

export default {
  exemploValidacaoPersonalizada,
  exemploValidacaoReceita,
  exemploValidacaoMedicamento,
  exemploValidacaoRegistroHumor,
  exemploValidacaoDespesa,
  exemploValidacaoConcurso,
  exemploValidacaoSessaoEstudo,
  exemploValidacaoRegistroSono,
  exemploValidacaoAtividadeLazer,
  exemploValidacaoQuestao,
  exemploValidacaoItemListaCompras,
  executarTodosExemplos,
  exemploTratamentoErros
}
