/**
 * Sistema de validação de dados para a aplicação StayFocus
 * Funções reutilizáveis para validar dados antes de enviar para o Supabase
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule {
  field: string;
  value: any;
  rules: string[];
  customMessage?: string;
}

/**
 * Classe principal para validação de dados
 */
export class DataValidator {
  private errors: string[] = [];

  constructor() {
    this.errors = [];
  }

  /**
   * Valida múltiplos campos usando regras
   */
  validateFields(rules: ValidationRule[]): ValidationResult {
    this.errors = [];

    for (const rule of rules) {
      this.validateField(
        rule.field,
        rule.value,
        rule.rules,
        rule.customMessage,
      );
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  /**
   * Valida um campo individual
   */
  private validateField(
    fieldName: string,
    value: any,
    rules: string[],
    customMessage?: string,
  ): void {
    // Se o campo não é obrigatório e o valor é null/undefined, pular todas as validações
    const isRequired = rules.includes("required");
    if (!isRequired && (value === null || value === undefined)) {
      return;
    }

    for (const rule of rules) {
      const parts = rule.split(":");
      const ruleName = parts[0];
      const ruleValue = parts[1];

      let isValid = true;
      let errorMessage = customMessage || "";

      switch (ruleName) {
        case "required":
          isValid = this.isRequired(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} é obrigatório`;
          }
          break;

        case "string":
          isValid = this.isString(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser um texto`;
          }
          break;

        case "number":
          isValid = this.isNumber(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser um número`;
          }
          break;

        case "positive":
          isValid = this.isPositive(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser um número positivo`;
          }
          break;

        case "email":
          isValid = this.isEmail(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ter um formato de email válido`;
          }
          break;

        case "date":
          isValid = this.isValidDate(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ter um formato de data válido`;
          }
          break;

        case "time":
          isValid = this.isValidTime(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ter um formato de horário válido (HH:MM)`;
          }
          break;

        case "url":
          isValid = this.isUrl(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser uma URL válida`;
          }
          break;

        case "minLength":
          isValid = this.hasMinLength(value, parseInt(ruleValue));
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ter pelo menos ${ruleValue} caracteres`;
          }
          break;

        case "maxLength":
          isValid = this.hasMaxLength(value, parseInt(ruleValue));
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ter no máximo ${ruleValue} caracteres`;
          }
          break;

        case "min":
          isValid = this.hasMinValue(value, parseFloat(ruleValue));
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser pelo menos ${ruleValue}`;
          }
          break;

        case "max":
          isValid = this.hasMaxValue(value, parseFloat(ruleValue));
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser no máximo ${ruleValue}`;
          }
          break;

        case "array":
          isValid = this.isArray(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser uma lista`;
          }
          break;

        case "arrayNotEmpty":
          isValid = this.isArrayNotEmpty(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve conter pelo menos um item`;
          }
          break;

        case "boolean":
          isValid = this.isBoolean(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser verdadeiro ou falso`;
          }
          break;

        case "enum":
          const enumValues = ruleValue.split(",");
          isValid = this.isInEnum(value, enumValues);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser um dos valores: ${enumValues.join(", ")}`;
          }
          break;

        case "uuid":
          isValid = this.isUuid(value);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve ser um ID válido`;
          }
          break;

        case "range":
          const [minRange, maxRange] = ruleValue.split("-").map(Number);
          isValid = this.isInRange(value, minRange, maxRange);
          if (!isValid && !errorMessage) {
            errorMessage = `${fieldName} deve estar entre ${minRange} e ${maxRange}`;
          }
          break;
      }

      if (!isValid) {
        this.errors.push(errorMessage);
        break; // Para de validar este campo se uma regra falhou
      }
    }
  }

  // Métodos de validação individuais
  private isRequired(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }

  private isString(value: any): boolean {
    return typeof value === "string";
  }

  private isNumber(value: any): boolean {
    return typeof value === "number" && !isNaN(value);
  }

  private isPositive(value: any): boolean {
    return this.isNumber(value) && value > 0;
  }

  private isEmail(value: any): boolean {
    if (!this.isString(value)) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  private isValidDate(value: any): boolean {
    // Para campos opcionais, aceitar null, undefined
    if (value === null || value === undefined) return true;

    if (!this.isString(value)) return false;

    // Se a string estiver vazia, considerar válida (campo opcional)
    if (value.trim() === "") return true;

    // Aceita formatos ISO (YYYY-MM-DD) e DD/MM/YYYY
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const brDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    if (isoDateRegex.test(value)) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }

    if (brDateRegex.test(value)) {
      const [day, month, year] = value.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      return !isNaN(date.getTime());
    }

    return false;
  }

  private isValidTime(value: any): boolean {
    if (!this.isString(value)) return false;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(value);
  }

  private isUrl(value: any): boolean {
    if (!this.isString(value)) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private hasMinLength(value: any, minLength: number): boolean {
    if (!this.isString(value)) return false;
    return value.length >= minLength;
  }

  private hasMaxLength(value: any, maxLength: number): boolean {
    if (!this.isString(value)) return false;
    return value.length <= maxLength;
  }

  private hasMinValue(value: any, minValue: number): boolean {
    if (!this.isNumber(value)) return false;
    return value >= minValue;
  }

  private hasMaxValue(value: any, maxValue: number): boolean {
    if (!this.isNumber(value)) return false;
    return value <= maxValue;
  }

  private isArray(value: any): boolean {
    return Array.isArray(value);
  }

  private isArrayNotEmpty(value: any): boolean {
    return this.isArray(value) && value.length > 0;
  }

  private isBoolean(value: any): boolean {
    return typeof value === "boolean";
  }

  private isInEnum(value: any, enumValues: string[]): boolean {
    return enumValues.includes(value);
  }

  private isUuid(value: any): boolean {
    if (!this.isString(value)) return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private isInRange(value: any, min: number, max: number): boolean {
    if (!this.isNumber(value)) return false;
    return value >= min && value <= max;
  }
}

/**
 * Funções de validação específicas para tipos de dados da aplicação
 */

// Validação para receitas
export function validateReceita(receita: any): ValidationResult {
  const validator = new DataValidator();

  return validator.validateFields([
    {
      field: "Nome",
      value: receita.nome,
      rules: ["required", "string", "minLength:2", "maxLength:100"],
    },
    {
      field: "Categoria",
      value: receita.categoria,
      rules: ["required", "string", "maxLength:50"],
    },
    {
      field: "Ingredientes",
      value: receita.ingredientes,
      rules: ["required", "array", "arrayNotEmpty"],
    },
    {
      field: "Modo de preparo",
      value: receita.modo_preparo,
      rules: ["required", "string", "minLength:10", "maxLength:2000"],
    },
    {
      field: "Tempo de preparo",
      value: receita.tempo_preparo,
      rules: ["number", "positive", "max:1440"],
    }, // máximo 24h
    {
      field: "Porções",
      value: receita.porcoes,
      rules: ["number", "positive", "max:50"],
    },
    {
      field: "Dificuldade",
      value: receita.dificuldade,
      rules: ["enum:facil,medio,dificil"],
    },
  ]);
}

// Validação para medicamentos
export function validateMedicamento(medicamento: any): ValidationResult {
  const validator = new DataValidator();

  return validator.validateFields([
    {
      field: "Nome",
      value: medicamento.nome,
      rules: ["required", "string", "minLength:2", "maxLength:100"],
    },
    {
      field: "Dosagem",
      value: medicamento.dosagem,
      rules: ["required", "string", "maxLength:50"],
    },
    {
      field: "Frequência",
      value: medicamento.frequencia,
      rules: ["required", "string", "maxLength:100"],
    },
    {
      field: "Horários",
      value: medicamento.horarios,
      rules: ["required", "array", "arrayNotEmpty"],
    },
    {
      field: "Data de início",
      value: medicamento.data_inicio,
      rules: ["required", "date"],
    },
    { field: "Data de fim", value: medicamento.data_fim, rules: ["date"] },
    {
      field: "Observações",
      value: medicamento.observacoes,
      rules: ["string", "maxLength:500"],
    },
  ]);
}

// Validação para registros de humor
export function validateRegistroHumor(registro: any): ValidationResult {
  const validator = new DataValidator();

  return validator.validateFields([
    { field: "Data", value: registro.data, rules: ["required", "date"] },
    {
      field: "Nível de humor",
      value: registro.nivel_humor,
      rules: ["required", "number", "range:1-10"],
    },
    { field: "Fatores", value: registro.fatores, rules: ["array"] },
    {
      field: "Observações",
      value: registro.notas,
      rules: ["string", "maxLength:500"],
    },
  ]);
}

// Validação para despesas
export function validateDespesa(despesa: any): ValidationResult {
  const validator = new DataValidator();

  return validator.validateFields([
    {
      field: "Descrição",
      value: despesa.description,
      rules: ["required", "string", "minLength:2", "maxLength:200"],
    },
    {
      field: "Valor",
      value: despesa.amount,
      rules: ["required", "number", "positive"],
    },
    { field: "Data", value: despesa.date, rules: ["required", "date"] },
    {
      field: "Categoria ID",
      value: despesa.category_id,
      rules: ["required", "uuid"],
    },
    {
      field: "Observações",
      value: despesa.notes,
      rules: ["string", "maxLength:500"],
    },
  ]);
}

// Validação para concursos
export function validateConcurso(concurso: any): ValidationResult {
  const validator = new DataValidator();

  const rules = [
    {
      field: "Título",
      value: concurso.title,
      rules: ["required", "string", "minLength:2", "maxLength:200"],
    },
    {
      field: "Organizador",
      value: concurso.organizer,
      rules: ["required", "string", "minLength:2", "maxLength:100"],
    },
    {
      field: "Status",
      value: concurso.status,
      rules: [
        "enum:planejado,inscrito,estudando,realizado,aguardando_resultado",
      ],
    },
  ];

  // Validar datas apenas se fornecidas (campos opcionais)
  if (concurso.registration_date) {
    rules.push({
      field: "Data de inscrição",
      value: concurso.registration_date,
      rules: ["date"],
    });
  }

  if (concurso.exam_date) {
    rules.push({
      field: "Data da prova",
      value: concurso.exam_date,
      rules: ["date"],
    });
  }

  // Validar URL apenas se fornecida (campo opcional)
  if (concurso.edital_link && concurso.edital_link.trim() !== "") {
    // Aceitar URLs mais flexíveis com regex específica para HTTP/HTTPS
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(concurso.edital_link.trim())) {
      rules.push({
        field: "Link do edital",
        value: concurso.edital_link,
        rules: ["url"],
      });
    }
  }

  return validator.validateFields(rules);
}

// Validação para sessões de estudo
export function validateSessaoEstudo(sessao: any): ValidationResult {
  const validator = new DataValidator();

  const rules: ValidationRule[] = [
    {
      field: "Matéria",
      value: sessao.disciplina,
      rules: ["required", "string", "minLength:2", "maxLength:200"],
    },
    {
      field: "Tópico",
      value: sessao.topico,
      rules: ["string", "maxLength:200"],
    },
    {
      field: "Duração em minutos",
      value: sessao.duration_minutes,
      rules: ["required", "number", "positive", "max:1440"],
    }, // máximo 24h
    {
      field: "Ciclos Pomodoro",
      value: sessao.pomodoro_cycles,
      rules: ["number", "min:0", "max:100"],
    },
    {
      field: "Notas",
      value: sessao.notes,
      rules: ["string", "maxLength:1000"],
    },
  ];

  // Validar competition_id apenas se fornecido
  if (sessao.competition_id) {
    rules.push({
      field: "Concurso ID",
      value: sessao.competition_id,
      rules: ["uuid"],
    });
  }

  return validator.validateFields(rules);
}

// Validação para registro de sono
export function validateRegistroSono(registro: any): ValidationResult {
  const validator = new DataValidator();

  return validator.validateFields([
    { field: "Data", value: registro.date, rules: ["required", "date"] },
    {
      field: "Horário de dormir",
      value: registro.bedtime,
      rules: ["required", "time"],
    },
    {
      field: "Horário de acordar",
      value: registro.wake_time,
      rules: ["required", "time"],
    },
    {
      field: "Qualidade do sono",
      value: registro.sleep_quality,
      rules: ["required", "number", "range:1-5"],
    },
    {
      field: "Observações",
      value: registro.notes,
      rules: ["string", "maxLength:500"],
    },
  ]);
}

// Validação para atividades de lazer
export function validateAtividadeLazer(atividade: any): ValidationResult {
  const validator = new DataValidator();

  return validator.validateFields([
    {
      field: "Nome",
      value: atividade.nome,
      rules: ["required", "string", "minLength:2", "maxLength:100"],
    },
    {
      field: "Categoria",
      value: atividade.categoria,
      rules: ["required", "string", "maxLength:50"],
    },
    {
      field: "Duração em minutos",
      value: atividade.duracao_minutos,
      rules: ["required", "number", "positive", "max:1440"],
    },
    {
      field: "Data de realização",
      value: atividade.data_realizacao,
      rules: ["required", "date"],
    },
    {
      field: "Avaliação",
      value: atividade.avaliacao,
      rules: ["number", "range:1-5"],
    },
    {
      field: "Observações",
      value: atividade.observacoes,
      rules: ["string", "maxLength:500"],
    },
  ]);
}

// Validação para opções de questões
export function validateQuestionOptions(options: any): ValidationResult {
  const validator = new DataValidator();
  
  if (!Array.isArray(options)) {
    return {
      isValid: false,
      errors: ["Opções devem ser uma lista"]
    };
  }
  
  if (options.length === 0) {
    return {
      isValid: false,
      errors: ["Deve haver pelo menos uma opção"]
    };
  }
  
  const errors: string[] = [];
  let hasCorrectAnswer = false;
  let correctAnswersCount = 0;
  
  options.forEach((option, index) => {
    // Validar estrutura da opção
    if (!option || typeof option !== 'object') {
      errors.push(`Opção ${index + 1}: deve ser um objeto válido`);
      return;
    }
    
    // Validar texto da opção
    if (!option.text || typeof option.text !== 'string' || option.text.trim() === '') {
      errors.push(`Opção ${index + 1}: texto é obrigatório e deve ser uma string não vazia`);
    } else if (option.text.length > 500) {
      errors.push(`Opção ${index + 1}: texto deve ter no máximo 500 caracteres`);
    }
    
    // Validar indicador de resposta correta
    if (typeof option.isCorrect !== 'boolean') {
      errors.push(`Opção ${index + 1}: isCorrect deve ser verdadeiro ou falso`);
    } else if (option.isCorrect) {
      hasCorrectAnswer = true;
      correctAnswersCount++;
    }
  });
  
  // Validar que há exatamente uma resposta correta
  if (!hasCorrectAnswer) {
    errors.push("Deve haver pelo menos uma resposta correta");
  } else if (correctAnswersCount > 1) {
    errors.push("Deve haver apenas uma resposta correta");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validação para questões de concurso
export function validateQuestao(questao: any): ValidationResult {
  const validator = new DataValidator();

  const baseValidation = validator.validateFields([
    {
      field: "Texto da questão",
      value: questao.question_text,
      rules: ["required", "string", "minLength:10", "maxLength:2000"],
    },
    {
      field: "Opções",
      value: questao.options,
      rules: ["required", "array", "arrayNotEmpty"],
    },
    {
      field: "Resposta correta",
      value: questao.correct_answer,
      rules: ["required", "string", "minLength:1"],
    },
    {
      field: "Explicação",
      value: questao.explanation,
      rules: ["string", "maxLength:1000"],
    },
    {
      field: "Dificuldade",
      value: questao.difficulty,
      rules: ["enum:facil,medio,dificil"],
    },
    {
      field: "Concurso ID",
      value: questao.competition_id,
      rules: ["required", "uuid"],
    },
    {
      field: "Disciplina ID",
      value: questao.subject_id,
      rules: ["required", "uuid"],
    },
  ]);
  
  // Se a validação base falhou, retornar os erros
  if (!baseValidation.isValid) {
    return baseValidation;
  }
  
  // Validação específica das opções
  if (questao.options) {
    const optionsValidation = validateQuestionOptions(questao.options);
    if (!optionsValidation.isValid) {
      return {
        isValid: false,
        errors: [...baseValidation.errors, ...optionsValidation.errors]
      };
    }
  }
  
  // Validações adicionais para novos campos
  const additionalRules: ValidationRule[] = [];
  
  if (questao.question_type !== undefined) {
    additionalRules.push({
      field: "Tipo de questão",
      value: questao.question_type,
      rules: ["enum:multiple_choice,true_false,essay,short_answer"],
    });
  }
  
  if (questao.points !== undefined) {
    additionalRules.push({
      field: "Pontos",
      value: questao.points,
      rules: ["number", "positive", "max:1000"],
    });
  }
  
  if (questao.time_limit_seconds !== undefined) {
    additionalRules.push({
      field: "Tempo limite em segundos",
      value: questao.time_limit_seconds,
      rules: ["number", "positive", "max:7200"], // máximo 2 horas
    });
  }
  
  if (questao.year !== undefined) {
    additionalRules.push({
      field: "Ano",
      value: questao.year,
      rules: ["number", "min:1900", "max:2100"],
    });
  }
  
  if (questao.usage_count !== undefined) {
    additionalRules.push({
      field: "Contagem de uso",
      value: questao.usage_count,
      rules: ["number", "min:0"],
    });
  }
  
  if (additionalRules.length > 0) {
    const additionalValidation = validator.validateFields(additionalRules);
    if (!additionalValidation.isValid) {
      return {
        isValid: false,
        errors: [...baseValidation.errors, ...additionalValidation.errors]
      };
    }
  }
  
  return baseValidation;
}

// Validação para lista de compras
export function validateItemListaCompras(item: any): ValidationResult {
  const validator = new DataValidator();

  return validator.validateFields([
    {
      field: "Nome",
      value: item.nome,
      rules: ["required", "string", "minLength:1", "maxLength:100"],
    },
    {
      field: "Categoria",
      value: item.categoria,
      rules: ["required", "string", "maxLength:50"],
    },
    {
      field: "Quantidade",
      value: item.quantidade,
      rules: ["string", "maxLength:50"],
    },
  ]);
}

// Validação para resultados de simulação
export function validateSimulationResults(results: any): ValidationResult {
  const validator = new DataValidator();

  const baseValidation = validator.validateFields([
    {
      field: "Score",
      value: results.score,
      rules: ["required", "number", "min:0"],
    },
    {
      field: "Total",
      value: results.total,
      rules: ["required", "number", "positive"],
    },
    {
      field: "Answers",
      value: results.answers,
      rules: ["required"],
    },
    {
      field: "Percentage", 
      value: results.percentage,
      rules: ["number", "range:0-100"],
    },
    {
      field: "Time taken in minutes",
      value: results.time_taken_minutes,
      rules: ["number", "positive", "max:1440"], // máximo 24 horas
    },
  ]);

  // Se a validação base falhou, retornar os erros
  if (!baseValidation.isValid) {
    return baseValidation;
  }

  // Validação específica para answers (deve ser um objeto)
  if (results.answers && typeof results.answers !== 'object') {
    return {
      isValid: false,
      errors: ["Answers deve ser um objeto com as respostas"]
    };
  }

  // Validação adicional: score não pode ser maior que total
  if (results.score > results.total) {
    return {
      isValid: false,
      errors: ["Score não pode ser maior que o total de questões"]
    };
  }

  // Validação de data completed_at se fornecida
  if (results.completed_at) {
    const dateValidation = validator.validateFields([
      {
        field: "Data de conclusão",
        value: results.completed_at,
        rules: ["date"],
      },
    ]);
    
    if (!dateValidation.isValid) {
      return dateValidation;
    }
  }

  // Calcular percentage se não fornecida mas temos score e total
  if (results.percentage === undefined && results.total > 0) {
    results.percentage = Math.round((results.score / results.total) * 100);
  }

  return baseValidation;
}

/**
 * Função utilitária para validar dados de forma simples
 */
export function validateData(
  data: any,
  validationFunction: (data: any) => ValidationResult,
): void {
  const result = validationFunction(data);

  if (!result.isValid) {
    throw new Error(`Dados inválidos: ${result.errors.join(", ")}`);
  }
}

/**
 * Função para sanitizar strings (remover espaços extras, etc.)
 */
export function sanitizeString(value: any): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Função para sanitizar arrays (remover valores vazios)
 */
export function sanitizeArray(value: any): any[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item) => item !== null && item !== undefined && item !== "",
  );
}

/**
 * Função para sanitizar números
 */
export function sanitizeNumber(value: any): number | null {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Função para sanitizar datas
 */
export function sanitizeDate(value: any): string | null {
  if (!value) return null;

  // Se já está no formato ISO
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.split("T")[0]; // Remove a parte do tempo se houver
  }

  // Se está no formato brasileiro DD/MM/YYYY
  if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Tentar converter Date para string ISO
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Validates question options according to SQL constraints
 */
export function validateQuestionOptionsConstraints(
  options: any[],
  questionType: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Multiple choice must have at least 2 options
  if (questionType === "multiple_choice") {
    if (!options || options.length < 2) {
      errors.push("Questões de múltipla escolha devem ter pelo menos 2 opções");
    }

    // Must have exactly one correct answer for multiple choice
    const correctCount = options.filter(opt => opt.isCorrect).length;
    if (correctCount !== 1) {
      errors.push("Questões de múltipla escolha devem ter exatamente uma resposta correta");
    }
  }

  // True/false should have exactly 2 options
  if (questionType === "true_false") {
    if (!options || options.length !== 2) {
      errors.push("Questões verdadeiro/falso devem ter exatamente 2 opções");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates receita according to SQL constraints
 */
export function validateReceitaConstraints(receita: {
  nome: string;
  ingredientes: string[];
  modo_preparo: string;
  tempo_preparo?: number;
  porcoes?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Nome: length(trim(nome)) >= 2
  if (!receita.nome || receita.nome.trim().length < 2) {
    errors.push("Nome da receita deve ter pelo menos 2 caracteres");
  }

  // Nome: máximo 100 caracteres (SQL constraint)
  if (receita.nome && receita.nome.length > 100) {
    errors.push("Nome da receita não pode ter mais de 100 caracteres");
  }

  // Ingredientes: array_length(ingredientes, 1) > 0
  if (!receita.ingredientes || receita.ingredientes.length === 0) {
    errors.push("Receita deve ter pelo menos um ingrediente");
  }

  // Modo de preparo: length(trim(modo_preparo)) >= 10
  if (!receita.modo_preparo || receita.modo_preparo.trim().length < 10) {
    errors.push("Modo de preparo deve ter pelo menos 10 caracteres");
  }

  // Tempo preparo: 0 < tempo_preparo <= 1440
  if (receita.tempo_preparo !== undefined) {
    if (receita.tempo_preparo <= 0 || receita.tempo_preparo > 1440) {
      errors.push("Tempo de preparo deve estar entre 1 e 1440 minutos (24 horas)");
    }
  }

  // Porções: 0 < porcoes <= 50
  if (receita.porcoes !== undefined) {
    if (receita.porcoes <= 0 || receita.porcoes > 50) {
      errors.push("Número de porções deve estar entre 1 e 50");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates study session according to SQL constraints
 */
export function validateStudySessionConstraints(session: {
  subject: string;
  duration_minutes: number;
  pomodoro_cycles?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Subject: NOT NULL and reasonable length
  if (!session.subject || session.subject.trim().length === 0) {
    errors.push("Disciplina é obrigatória");
  }

  if (session.subject && session.subject.length > 200) {
    errors.push("Nome da disciplina não pode ter mais de 200 caracteres");
  }

  // Duration: 0 < duration_minutes <= 1440
  if (session.duration_minutes <= 0 || session.duration_minutes > 1440) {
    errors.push("Duração deve estar entre 1 e 1440 minutos (24 horas)");
  }

  // Pomodoro cycles: 0 <= pomodoro_cycles <= 100
  if (session.pomodoro_cycles !== undefined) {
    if (session.pomodoro_cycles < 0 || session.pomodoro_cycles > 100) {
      errors.push("Ciclos pomodoro devem estar entre 0 e 100");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default DataValidator;
