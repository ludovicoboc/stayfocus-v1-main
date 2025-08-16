/**
 * Sistema de validação de dados para a aplicação StayFocus
 * Funções reutilizáveis para validar dados antes de enviar para o Supabase
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ValidationRule {
  field: string
  value: any
  rules: string[]
  customMessage?: string
}

/**
 * Classe principal para validação de dados
 */
export class DataValidator {
  private errors: string[] = []

  constructor() {
    this.errors = []
  }

  /**
   * Valida múltiplos campos usando regras
   */
  validateFields(rules: ValidationRule[]): ValidationResult {
    this.errors = []

    for (const rule of rules) {
      this.validateField(rule.field, rule.value, rule.rules, rule.customMessage)
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    }
  }

  /**
   * Valida um campo individual
   */
  private validateField(fieldName: string, value: any, rules: string[], customMessage?: string): void {
    for (const rule of rules) {
      const parts = rule.split(':')
      const ruleName = parts[0]
      const ruleValue = parts[1]

      let isValid = true
      let errorMessage = customMessage || ''

      switch (ruleName) {
        case 'required':
          isValid = this.isRequired(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} é obrigatório`
          }
          break

        case 'string':
          isValid = this.isString(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser um texto`
          }
          break

        case 'number':
          isValid = this.isNumber(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser um número`
          }
          break

        case 'positive':
          isValid = this.isPositive(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser um número positivo`
          }
          break

        case 'email':
          isValid = this.isEmail(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ter um formato de email válido`
          }
          break

        case 'date':
          isValid = this.isValidDate(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ter um formato de data válido`
          }
          break

        case 'time':
          isValid = this.isValidTime(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ter um formato de horário válido (HH:MM)`
          }
          break

        case 'url':
          isValid = this.isUrl(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser uma URL válida`
          }
          break

        case 'minLength':
          isValid = this.hasMinLength(value, parseInt(ruleValue))
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ter pelo menos ${ruleValue} caracteres`
          }
          break

        case 'maxLength':
          isValid = this.hasMaxLength(value, parseInt(ruleValue))
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ter no máximo ${ruleValue} caracteres`
          }
          break

        case 'min':
          isValid = this.hasMinValue(value, parseFloat(ruleValue))
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser pelo menos ${ruleValue}`
          }
          break

        case 'max':
          isValid = this.hasMaxValue(value, parseFloat(ruleValue))
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser no máximo ${ruleValue}`
          }
          break

        case 'array':
          isValid = this.isArray(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser uma lista`
          }
          break

        case 'arrayNotEmpty':
          isValid = this.isArrayNotEmpty(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve conter pelo menos um item`
          }
          break

        case 'boolean':
          isValid = this.isBoolean(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser verdadeiro ou falso`
          }
          break

        case 'enum':
          const enumValues = ruleValue.split(',')
          isValid = this.isInEnum(value, enumValues)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser um dos valores: ${enumValues.join(', ')}`
          }
          break

        case 'uuid':
          isValid = this.isUuid(value)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser um ID válido`
          }
          break

        case 'range':
          const [minRange, maxRange] = ruleValue.split('-').map(Number)
          isValid = this.isInRange(value, minRange, maxRange)
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve estar entre ${minRange} e ${maxRange}`
          }
          break
      }

      if (!isValid) {
        this.errors.push(errorMessage)
        break // Para de validar este campo se uma regra falhou
      }
    }
  }

  // Métodos de validação individuais
  private isRequired(value: any): boolean {
    if (value === null || value === undefined) return false
    if (typeof value === 'string' && value.trim() === '') return false
    if (Array.isArray(value) && value.length === 0) return false
    return true
  }

  private isString(value: any): boolean {
    return typeof value === 'string'
  }

  private isNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value)
  }

  private isPositive(value: any): boolean {
    return this.isNumber(value) && value > 0
  }

  private isEmail(value: any): boolean {
    if (!this.isString(value)) return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  private isValidDate(value: any): boolean {
    if (!this.isString(value)) return false
    
    // Se a string estiver vazia, considerar válida (campo opcional)
    if (value.trim() === '') return true
    
    // Aceita formatos ISO (YYYY-MM-DD) e DD/MM/YYYY
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
    const brDateRegex = /^\d{2}\/\d{2}\/\d{4}$/
    
    if (isoDateRegex.test(value)) {
      const date = new Date(value)
      return !isNaN(date.getTime())
    }
    
    if (brDateRegex.test(value)) {
      const [day, month, year] = value.split('/')
      const date = new Date(`${year}-${month}-${day}`)
      return !isNaN(date.getTime())
    }
    
    return false
  }

  private isValidTime(value: any): boolean {
    if (!this.isString(value)) return false
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(value)
  }

  private isUrl(value: any): boolean {
    if (!this.isString(value)) return false
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  private hasMinLength(value: any, minLength: number): boolean {
    if (!this.isString(value)) return false
    return value.length >= minLength
  }

  private hasMaxLength(value: any, maxLength: number): boolean {
    if (!this.isString(value)) return false
    return value.length <= maxLength
  }

  private hasMinValue(value: any, minValue: number): boolean {
    if (!this.isNumber(value)) return false
    return value >= minValue
  }

  private hasMaxValue(value: any, maxValue: number): boolean {
    if (!this.isNumber(value)) return false
    return value <= maxValue
  }

  private isArray(value: any): boolean {
    return Array.isArray(value)
  }

  private isArrayNotEmpty(value: any): boolean {
    return this.isArray(value) && value.length > 0
  }

  private isBoolean(value: any): boolean {
    return typeof value === 'boolean'
  }

  private isInEnum(value: any, enumValues: string[]): boolean {
    return enumValues.includes(value)
  }

  private isUuid(value: any): boolean {
    if (!this.isString(value)) return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
  }

  private isInRange(value: any, min: number, max: number): boolean {
    if (!this.isNumber(value)) return false
    return value >= min && value <= max
  }
}

/**
 * Funções de validação específicas para tipos de dados da aplicação
 */

// Validação para receitas
export function validateReceita(receita: any): ValidationResult {
  const validator = new DataValidator()
  
  return validator.validateFields([
    { field: 'Nome', value: receita.nome, rules: ['required', 'string', 'minLength:2', 'maxLength:100'] },
    { field: 'Categoria', value: receita.categoria, rules: ['required', 'string', 'maxLength:50'] },
    { field: 'Ingredientes', value: receita.ingredientes, rules: ['required', 'array', 'arrayNotEmpty'] },
    { field: 'Modo de preparo', value: receita.modo_preparo, rules: ['required', 'string', 'minLength:10', 'maxLength:2000'] },
    { field: 'Tempo de preparo', value: receita.tempo_preparo, rules: ['number', 'positive', 'max:1440'] }, // máximo 24h
    { field: 'Porções', value: receita.porcoes, rules: ['number', 'positive', 'max:50'] },
    { field: 'Dificuldade', value: receita.dificuldade, rules: ['enum:facil,medio,dificil'] }
  ])
}

// Validação para medicamentos
export function validateMedicamento(medicamento: any): ValidationResult {
  const validator = new DataValidator()
  
  return validator.validateFields([
    { field: 'Nome', value: medicamento.nome, rules: ['required', 'string', 'minLength:2', 'maxLength:100'] },
    { field: 'Dosagem', value: medicamento.dosagem, rules: ['required', 'string', 'maxLength:50'] },
    { field: 'Frequência', value: medicamento.frequencia, rules: ['required', 'string', 'maxLength:100'] },
    { field: 'Horários', value: medicamento.horarios, rules: ['required', 'array', 'arrayNotEmpty'] },
    { field: 'Data de início', value: medicamento.data_inicio, rules: ['required', 'date'] },
    { field: 'Data de fim', value: medicamento.data_fim, rules: ['date'] },
    { field: 'Observações', value: medicamento.observacoes, rules: ['string', 'maxLength:500'] }
  ])
}

// Validação para registros de humor
export function validateRegistroHumor(registro: any): ValidationResult {
  const validator = new DataValidator()
  
  return validator.validateFields([
    { field: 'Data', value: registro.data, rules: ['required', 'date'] },
    { field: 'Nível de humor', value: registro.nivel_humor, rules: ['required', 'number', 'range:1-10'] },
    { field: 'Fatores', value: registro.fatores, rules: ['array'] },
    { field: 'Observações', value: registro.observacoes, rules: ['string', 'maxLength:500'] }
  ])
}

// Validação para despesas
export function validateDespesa(despesa: any): ValidationResult {
  const validator = new DataValidator()
  
  return validator.validateFields([
    { field: 'Descrição', value: despesa.description, rules: ['required', 'string', 'minLength:2', 'maxLength:200'] },
    { field: 'Valor', value: despesa.amount, rules: ['required', 'number', 'positive'] },
    { field: 'Data', value: despesa.date, rules: ['required', 'date'] },
    { field: 'Categoria ID', value: despesa.category_id, rules: ['required', 'uuid'] },
    { field: 'Observações', value: despesa.notes, rules: ['string', 'maxLength:500'] }
  ])
}

// Validação para concursos
export function validateConcurso(concurso: any): ValidationResult {
  const validator = new DataValidator()
  
  const rules = [
    { field: 'Título', value: concurso.title, rules: ['required', 'string', 'minLength:2', 'maxLength:200'] },
    { field: 'Organizador', value: concurso.organizer, rules: ['required', 'string', 'minLength:2', 'maxLength:100'] },
    { field: 'Status', value: concurso.status, rules: ['enum:planejado,inscrito,estudando,realizado,aguardando_resultado'] }
  ]

  // Validar datas apenas se fornecidas (campos opcionais)
  if (concurso.registration_date) {
    rules.push({ field: 'Data de inscrição', value: concurso.registration_date, rules: ['date'] })
  }
  
  if (concurso.exam_date) {
    rules.push({ field: 'Data da prova', value: concurso.exam_date, rules: ['date'] })
  }

  // Validar URL apenas se fornecida (campo opcional)
  if (concurso.edital_link && concurso.edital_link.trim() !== '') {
    rules.push({ field: 'Link do edital', value: concurso.edital_link, rules: ['url'] })
  }
  
  return validator.validateFields(rules)
}

// Validação para sessões de estudo
export function validateSessaoEstudo(sessao: any): ValidationResult {
  const validator = new DataValidator()
  
  return validator.validateFields([
    { field: 'Tópico', value: sessao.topic, rules: ['required', 'string', 'minLength:2', 'maxLength:200'] },
    { field: 'Duração em minutos', value: sessao.duration_minutes, rules: ['required', 'number', 'positive', 'max:1440'] }, // máximo 24h
    { field: 'Ciclos Pomodoro', value: sessao.pomodoro_cycles, rules: ['number', 'min:0', 'max:100'] },
    { field: 'Notas', value: sessao.notes, rules: ['string', 'maxLength:1000'] },
    { field: 'Concurso ID', value: sessao.competition_id, rules: ['uuid'] }
  ])
}

// Validação para registro de sono
export function validateRegistroSono(registro: any): ValidationResult {
  const validator = new DataValidator()
  
  return validator.validateFields([
    { field: 'Data', value: registro.date, rules: ['required', 'date'] },
    { field: 'Horário de dormir', value: registro.bedtime, rules: ['required', 'time'] },
    { field: 'Horário de acordar', value: registro.wake_time, rules: ['required', 'time'] },
    { field: 'Qualidade do sono', value: registro.sleep_quality, rules: ['required', 'number', 'range:1-5'] },
    { field: 'Observações', value: registro.notes, rules: ['string', 'maxLength:500'] }
  ])
}

// Validação para atividades de lazer
export function validateAtividadeLazer(atividade: any): ValidationResult {
  const validator = new DataValidator()
  
  return validator.validateFields([
    { field: 'Nome', value: atividade.nome, rules: ['required', 'string', 'minLength:2', 'maxLength:100'] },
    { field: 'Categoria', value: atividade.categoria, rules: ['required', 'string', 'maxLength:50'] },
    { field: 'Duração em minutos', value: atividade.duracao_minutos, rules: ['required', 'number', 'positive', 'max:1440'] },
    { field: 'Data de realização', value: atividade.data_realizacao, rules: ['required', 'date'] },
    { field: 'Avaliação', value: atividade.avaliacao, rules: ['number', 'range:1-5'] },
    { field: 'Observações', value: atividade.observacoes, rules: ['string', 'maxLength:500'] }
  ])
}

// Validação para questões de concurso
export function validateQuestao(questao: any): ValidationResult {
  const validator = new DataValidator()
  
  return validator.validateFields([
    { field: 'Texto da questão', value: questao.question_text, rules: ['required', 'string', 'minLength:10', 'maxLength:2000'] },
    { field: 'Opções', value: questao.options, rules: ['required', 'array', 'arrayNotEmpty'] },
    { field: 'Resposta correta', value: questao.correct_answer, rules: ['required', 'string', 'minLength:1'] },
    { field: 'Explicação', value: questao.explanation, rules: ['string', 'maxLength:1000'] },
    { field: 'Dificuldade', value: questao.difficulty, rules: ['enum:facil,medio,dificil'] },
    { field: 'Concurso ID', value: questao.competition_id, rules: ['required', 'uuid'] },
    { field: 'Disciplina ID', value: questao.subject_id, rules: ['required', 'uuid'] }
  ])
}

// Validação para lista de compras
export function validateItemListaCompras(item: any): ValidationResult {
  const validator = new DataValidator()
  
  return validator.validateFields([
    { field: 'Nome', value: item.nome, rules: ['required', 'string', 'minLength:1', 'maxLength:100'] },
    { field: 'Categoria', value: item.categoria, rules: ['required', 'string', 'maxLength:50'] },
    { field: 'Quantidade', value: item.quantidade, rules: ['string', 'maxLength:50'] }
  ])
}

/**
 * Função utilitária para validar dados de forma simples
 */
export function validateData(data: any, validationFunction: (data: any) => ValidationResult): void {
  const result = validationFunction(data)
  
  if (!result.isValid) {
    throw new Error(`Dados inválidos: ${result.errors.join(', ')}`)
  }
}

/**
 * Função para sanitizar strings (remover espaços extras, etc.)
 */
export function sanitizeString(value: any): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ')
}

/**
 * Função para sanitizar arrays (remover valores vazios)
 */
export function sanitizeArray(value: any): any[] {
  if (!Array.isArray(value)) return []
  return value.filter(item => item !== null && item !== undefined && item !== '')
}

/**
 * Função para sanitizar números
 */
export function sanitizeNumber(value: any): number | null {
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

/**
 * Função para sanitizar datas
 */
export function sanitizeDate(value: any): string | null {
  if (!value) return null
  
  // Se já está no formato ISO
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.split('T')[0] // Remove a parte do tempo se houver
  }
  
  // Se está no formato brasileiro DD/MM/YYYY
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  
  // Tentar converter Date para string ISO
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }
  
  return null
}

export default DataValidator
