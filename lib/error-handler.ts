export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleSupabaseError(error: any): AppError {
  if (error?.code === "PGRST116") {
    return new AppError("Dados não encontrados", "NOT_FOUND", 404);
  }

  if (error?.code === "23505") {
    return new AppError("Dados duplicados", "DUPLICATE_DATA", 409);
  }

  if (error?.message?.includes("JWT")) {
    return new AppError("Sessão expirada", "UNAUTHORIZED", 401);
  }

  return new AppError(
    error?.message || "Erro interno do servidor",
    "INTERNAL_ERROR",
    500,
  );
}

export function logError(error: Error, context?: string) {
  console.error(`[${context || "APP"}] ${error.name}: ${error.message}`, {
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
}

// =====================================
// TRATAMENTO DE ERROS ESPECÍFICOS PARA CONCURSOS
// =====================================

/**
 * Tratamento específico de erros do Supabase para concursos
 * Conforme Etapa 3.1 do todocc.md
 */
export function handleSupabaseCompetitionError(error: any): string {
  if (error?.code === "PGRST301") {
    return "Você não tem permissão para acessar este concurso";
  }
  if (error?.code === "23505") {
    return "Este concurso já existe";
  }
  if (error?.code === "PGRST116") {
    return "Concurso não encontrado";
  }
  if (error?.code === "PGRST204") {
    return "Nenhum concurso encontrado";
  }
  if (error?.code === "23503") {
    return "Não é possível excluir este item pois ele possui dependências";
  }
  if (error?.code === "42501") {
    return "Permissão insuficiente para realizar esta operação";
  }
  if (error?.message?.includes("JWT expired")) {
    return "Sua sessão expirou. Faça login novamente";
  }
  if (error?.message?.includes("row-level security")) {
    return "Acesso negado: você não tem permissão para este recurso";
  }
  return error?.message || "Erro desconhecido";
}

/**
 * Códigos de erro específicos para concursos
 */
export const COMPETITION_ERRORS = {
  ACCESS_DENIED: "competition_access_denied",
  NOT_FOUND: "competition_not_found",
  DUPLICATE: "competition_duplicate",
  INVALID_DATA: "competition_invalid_data",
  NETWORK_ERROR: "competition_network_error",
  PERMISSION_DENIED: "competition_permission_denied",
  VALIDATION_ERROR: "competition_validation_error",
  UNKNOWN_ERROR: "competition_unknown_error",
} as const;

export type CompetitionError =
  (typeof COMPETITION_ERRORS)[keyof typeof COMPETITION_ERRORS];

/**
 * Mapeia erros do Supabase para tipos de erro de concurso
 */
export function mapCompetitionError(error: any): CompetitionError {
  if (!error) return COMPETITION_ERRORS.UNKNOWN_ERROR;

  const code = error.code?.toLowerCase() || "";
  const message = error.message?.toLowerCase() || "";

  if (
    code === "pgrst301" ||
    message.includes("permission") ||
    message.includes("unauthorized")
  ) {
    return COMPETITION_ERRORS.ACCESS_DENIED;
  }

  if (code === "pgrst116" || message.includes("not found")) {
    return COMPETITION_ERRORS.NOT_FOUND;
  }

  if (code === "23505" || message.includes("duplicate")) {
    return COMPETITION_ERRORS.DUPLICATE;
  }

  if (code === "42501" || message.includes("insufficient privilege")) {
    return COMPETITION_ERRORS.PERMISSION_DENIED;
  }

  if (message.includes("validation") || message.includes("invalid")) {
    return COMPETITION_ERRORS.VALIDATION_ERROR;
  }

  if (message.includes("network") || message.includes("connection")) {
    return COMPETITION_ERRORS.NETWORK_ERROR;
  }

  return COMPETITION_ERRORS.UNKNOWN_ERROR;
}

/**
 * Logging detalhado para operações de concurso
 * Conforme Etapa 5.2 do todocc.md
 */
export function logSupabaseError(operation: string, error: any) {
  console.error(`Erro em ${operation}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    timestamp: new Date().toISOString(),
    operation,
  });
}

/**
 * Tracking de performance para operações
 * Conforme Etapa 6.2 do todocc.md
 */
export function trackPerformance(operation: string, startTime: number) {
  const duration = Date.now() - startTime;
  console.log(`📊 ${operation} levou ${duration}ms`);

  if (duration > 2000) {
    console.warn(`⚠️ ${operation} está lento: ${duration}ms`);
  }

  // Log para métricas (pode ser enviado para serviço de monitoramento)
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "performance_metric", {
      custom_parameter: operation,
      value: duration,
    });
  }
}

/**
 * Wrapper para operações com tracking de performance
 */
export async function withPerformanceTracking<T>(
  operation: string,
  asyncFunction: () => Promise<T>,
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await asyncFunction();
    trackPerformance(operation, startTime);
    return result;
  } catch (error) {
    trackPerformance(`${operation}_ERROR`, startTime);
    throw error;
  }
}

/**
 * Validação de dados de entrada para concursos
 */
export class CompetitionValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any,
  ) {
    super(message);
    this.name = "CompetitionValidationError";
  }
}

/**
 * Tratamento unificado de erros para UI
 */
export function getErrorMessage(error: any): string {
  if (error instanceof CompetitionValidationError) {
    return `Erro de validação no campo ${error.field}: ${error.message}`;
  }

  if (error instanceof AppError) {
    return error.message;
  }

  // Tratar erros específicos do Supabase
  const competitionError = handleSupabaseCompetitionError(error);
  if (competitionError !== (error?.message || "Erro desconhecido")) {
    return competitionError;
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}

/**
 * Logger estruturado para debugging de concursos
 */
export const competitionLogger = {
  info: (message: string, data?: any) => {
    console.log(
      `🏆 [CONCURSOS] ${message}`,
      data ? { ...data, timestamp: new Date().toISOString() } : "",
    );
  },

  error: (message: string, error?: any, data?: any) => {
    console.error(`❌ [CONCURSOS] ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      code: error?.code,
      details: error?.details,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  warn: (message: string, data?: any) => {
    console.warn(
      `⚠️ [CONCURSOS] ${message}`,
      data ? { ...data, timestamp: new Date().toISOString() } : "",
    );
  },

  success: (message: string, data?: any) => {
    console.log(
      `✅ [CONCURSOS] ${message}`,
      data ? { ...data, timestamp: new Date().toISOString() } : "",
    );
  },
};
