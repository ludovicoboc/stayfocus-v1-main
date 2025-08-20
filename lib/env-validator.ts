/**
 * Sistema de Verificação de Variáveis de Ambiente
 * Conforme Etapa 6.1 do todocc.md
 */

import { competitionLogger } from "./error-handler";

// =====================================
// TIPOS E INTERFACES
// =====================================

interface EnvVariable {
  key: string;
  required: boolean;
  type: "string" | "url" | "boolean" | "number";
  description: string;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

interface EnvValidationResult {
  isValid: boolean;
  missingRequired: string[];
  invalidValues: Array<{ key: string; value: string; error: string }>;
  warnings: Array<{ key: string; message: string }>;
  summary: {
    total: number;
    validated: number;
    missing: number;
    invalid: number;
  };
}

interface EnvConfig {
  environment: "development" | "production" | "test";
  enableLogging: boolean;
  strictMode: boolean;
  throwOnError: boolean;
}

// =====================================
// DEFINIÇÃO DE VARIÁVEIS NECESSÁRIAS
// =====================================

const ENV_VARIABLES: EnvVariable[] = [
  // Supabase - Obrigatórias
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    type: "url",
    description: "URL do projeto Supabase",
    validator: (value) =>
      value.includes(".supabase.co") || value.includes("localhost"),
    errorMessage:
      "URL do Supabase inválida. Deve conter .supabase.co ou localhost",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    type: "string",
    description: "Chave anônima do Supabase",
    validator: (value) => value.length > 100 && value.startsWith("eyJ"),
    errorMessage: "Chave anônima do Supabase inválida. Deve ser um JWT válido",
  },

  // Supabase - Opcionais
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    required: false,
    type: "string",
    description:
      "Chave de service role do Supabase (para operações administrativas)",
    validator: (value) => value.length > 100 && value.startsWith("eyJ"),
    errorMessage: "Service role key inválida",
  },

  // Next.js
  {
    key: "NODE_ENV",
    required: true,
    type: "string",
    description: "Ambiente de execução",
    defaultValue: "development",
    validator: (value) => ["development", "production", "test"].includes(value),
    errorMessage: "NODE_ENV deve ser development, production ou test",
  },
  {
    key: "NEXTAUTH_SECRET",
    required: false,
    type: "string",
    description: "Secret para NextAuth (se usado)",
    validator: (value) => value.length >= 32,
    errorMessage: "NEXTAUTH_SECRET deve ter pelo menos 32 caracteres",
  },
  {
    key: "NEXTAUTH_URL",
    required: false,
    type: "url",
    description: "URL base da aplicação para NextAuth",
  },

  // Configurações específicas da aplicação
  {
    key: "ALLOW_CRUD_TESTS",
    required: false,
    type: "boolean",
    description: "Permitir execução de testes CRUD em produção",
    defaultValue: "false",
  },
  {
    key: "ENABLE_COMPETITION_LOGS",
    required: false,
    type: "boolean",
    description: "Habilitar logs detalhados para concursos",
    defaultValue: "false",
  },
  {
    key: "CACHE_TTL_MINUTES",
    required: false,
    type: "number",
    description: "TTL do cache em minutos",
    defaultValue: "5",
  },

  // Monitoramento e Analytics (opcionais)
  {
    key: "GOOGLE_ANALYTICS_ID",
    required: false,
    type: "string",
    description: "ID do Google Analytics",
    validator: (value) => value.startsWith("G-") || value.startsWith("UA-"),
    errorMessage: "Google Analytics ID deve começar com G- ou UA-",
  },
  {
    key: "SENTRY_DSN",
    required: false,
    type: "url",
    description: "DSN do Sentry para monitoramento de erros",
  },

  // Rate Limiting
  {
    key: "RATE_LIMIT_MAX_REQUESTS",
    required: false,
    type: "number",
    description: "Máximo de requisições por minuto",
    defaultValue: "100",
  },
];

// =====================================
// VALIDADORES ESPECÍFICOS
// =====================================

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidBoolean(value: string): boolean {
  return ["true", "false", "1", "0"].includes(value.toLowerCase());
}

function isValidNumber(value: string): boolean {
  return !isNaN(Number(value)) && isFinite(Number(value));
}

function validateEnvironmentVariable(
  envVar: EnvVariable,
  value: string | undefined,
): {
  isValid: boolean;
  error?: string;
  warning?: string;
} {
  // Verificar se existe
  if (!value) {
    if (envVar.required) {
      return {
        isValid: false,
        error: `Variável obrigatória ${envVar.key} não está definida`,
      };
    }
    return { isValid: true };
  }

  // Validação por tipo
  switch (envVar.type) {
    case "url":
      if (!isValidUrl(value)) {
        return {
          isValid: false,
          error: `${envVar.key} deve ser uma URL válida`,
        };
      }
      break;

    case "boolean":
      if (!isValidBoolean(value)) {
        return {
          isValid: false,
          error: `${envVar.key} deve ser true, false, 1 ou 0`,
        };
      }
      break;

    case "number":
      if (!isValidNumber(value)) {
        return {
          isValid: false,
          error: `${envVar.key} deve ser um número válido`,
        };
      }
      break;
  }

  // Validação customizada
  if (envVar.validator && !envVar.validator(value)) {
    return {
      isValid: false,
      error:
        envVar.errorMessage || `${envVar.key} falhou na validação customizada`,
    };
  }

  return { isValid: true };
}

// =====================================
// CLASSE PRINCIPAL DE VALIDAÇÃO
// =====================================

class EnvironmentValidator {
  private config: EnvConfig;

  constructor(config: Partial<EnvConfig> = {}) {
    this.config = {
      environment: (process.env.NODE_ENV as any) || "development",
      enableLogging: true,
      strictMode: false,
      throwOnError: false,
      ...config,
    };
  }

  /**
   * Valida todas as variáveis de ambiente
   */
  validate(): EnvValidationResult {
    const result: EnvValidationResult = {
      isValid: true,
      missingRequired: [],
      invalidValues: [],
      warnings: [],
      summary: {
        total: ENV_VARIABLES.length,
        validated: 0,
        missing: 0,
        invalid: 0,
      },
    };

    // Só executar validação no servidor (Node.js)
    if (typeof window !== "undefined" || typeof process === "undefined") {
      // Estamos no cliente, retornar resultado vazio
      return {
        ...result,
        summary: {
          ...result.summary,
          validated: ENV_VARIABLES.length,
        },
      };
    }

    if (this.config.enableLogging) {
      competitionLogger.info(
        "🔍 Iniciando validação de variáveis de ambiente",
        {
          environment: this.config.environment,
          totalVariables: ENV_VARIABLES.length,
        },
      );
    }

    for (const envVar of ENV_VARIABLES) {
      const value = process.env[envVar.key];
      const validation = validateEnvironmentVariable(envVar, value);

      if (!validation.isValid) {
        result.isValid = false;

        if (!value && envVar.required) {
          result.missingRequired.push(envVar.key);
          result.summary.missing++;
        } else if (value) {
          result.invalidValues.push({
            key: envVar.key,
            value: this.maskSensitiveValue(envVar.key, value),
            error: validation.error || "Valor inválido",
          });
          result.summary.invalid++;
        }

        if (this.config.enableLogging) {
          competitionLogger.error(`❌ ${envVar.key}`, validation.error);
        }
      } else {
        result.summary.validated++;

        if (validation.warning) {
          result.warnings.push({
            key: envVar.key,
            message: validation.warning,
          });

          if (this.config.enableLogging) {
            competitionLogger.warn(`⚠️ ${envVar.key}`, validation.warning);
          }
        }

        if (this.config.enableLogging && value) {
          competitionLogger.info(`✅ ${envVar.key}`, {
            value: this.maskSensitiveValue(envVar.key, value),
            type: envVar.type,
          });
        }
      }
    }

    // Verificações específicas por ambiente
    this.addEnvironmentSpecificValidations(result);

    if (this.config.enableLogging) {
      this.logValidationSummary(result);
    }

    if (this.config.throwOnError && !result.isValid) {
      throw new Error(
        `Validação de ambiente falhou: ${result.missingRequired.length} variáveis obrigatórias faltando, ${result.invalidValues.length} valores inválidos`,
      );
    }

    return result;
  }

  /**
   * Máscara valores sensíveis para logs
   */
  private maskSensitiveValue(key: string, value: string): string {
    const sensitiveKeys = ["KEY", "SECRET", "PASSWORD", "TOKEN"];
    const isSensitive = sensitiveKeys.some((sensitive) =>
      key.includes(sensitive),
    );

    if (isSensitive && value.length > 8) {
      return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }

    return value;
  }

  /**
   * Validações específicas por ambiente
   */
  private addEnvironmentSpecificValidations(result: EnvValidationResult): void {
    const env = this.config.environment;

    if (env === "production") {
      // Em produção, algumas variáveis são mais críticas
      const productionRequiredVars = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ];

      for (const key of productionRequiredVars) {
        if (!process.env[key]) {
          result.warnings.push({
            key,
            message: `Variável crítica para produção não está definida`,
          });
        }
      }

      // Verificar se testes estão desabilitados em produção
      if (process.env.ALLOW_CRUD_TESTS === "true") {
        result.warnings.push({
          key: "ALLOW_CRUD_TESTS",
          message:
            "Testes CRUD estão habilitados em produção - considere desabilitar",
        });
      }
    }

    if (env === "development") {
      // Em desenvolvimento, sugerir variáveis úteis
      const developmentSuggestions = [
        "ENABLE_COMPETITION_LOGS",
        "ALLOW_CRUD_TESTS",
      ];

      for (const key of developmentSuggestions) {
        if (!process.env[key]) {
          result.warnings.push({
            key,
            message: `Variável útil para desenvolvimento não está definida`,
          });
        }
      }
    }
  }

  /**
   * Log do resumo da validação
   */
  private logValidationSummary(result: EnvValidationResult): void {
    const { summary } = result;

    competitionLogger.info("📊 Resumo da validação de ambiente", {
      total: summary.total,
      validated: summary.validated,
      missing: summary.missing,
      invalid: summary.invalid,
      warnings: result.warnings.length,
      isValid: result.isValid,
    });

    if (result.isValid) {
      competitionLogger.success(
        "✅ Todas as variáveis obrigatórias estão válidas",
      );
    } else {
      competitionLogger.error("❌ Validação de ambiente falhou", {
        missingRequired: result.missingRequired,
        invalidValues: result.invalidValues.map((iv) => ({
          key: iv.key,
          error: iv.error,
        })),
      });
    }
  }

  /**
   * Gera arquivo .env.example baseado nas variáveis definidas
   */
  generateEnvExample(): string {
    let content = "# Arquivo .env.example gerado automaticamente\n";
    content += "# Copie para .env.local e preencha os valores\n\n";

    const groupedVars = this.groupVariablesByCategory();

    for (const [category, vars] of Object.entries(groupedVars)) {
      content += `# ${category}\n`;

      for (const envVar of vars) {
        content += `# ${envVar.description}\n`;

        if (envVar.required) {
          content += `${envVar.key}=\n`;
        } else {
          const defaultValue = envVar.defaultValue || "";
          content += `# ${envVar.key}=${defaultValue}\n`;
        }

        content += "\n";
      }
    }

    return content;
  }

  /**
   * Agrupa variáveis por categoria
   */
  private groupVariablesByCategory(): Record<string, EnvVariable[]> {
    const groups: Record<string, EnvVariable[]> = {
      Supabase: [],
      "Next.js": [],
      Aplicação: [],
      Monitoramento: [],
      Outros: [],
    };

    for (const envVar of ENV_VARIABLES) {
      if (envVar.key.includes("SUPABASE")) {
        groups["Supabase"].push(envVar);
      } else if (envVar.key.includes("NEXT") || envVar.key === "NODE_ENV") {
        groups["Next.js"].push(envVar);
      } else if (
        envVar.key.includes("ANALYTICS") ||
        envVar.key.includes("SENTRY")
      ) {
        groups["Monitoramento"].push(envVar);
      } else if (
        envVar.key.includes("COMPETITION") ||
        envVar.key.includes("CACHE") ||
        envVar.key.includes("CRUD")
      ) {
        groups["Aplicação"].push(envVar);
      } else {
        groups["Outros"].push(envVar);
      }
    }

    // Remover grupos vazios
    return Object.fromEntries(
      Object.entries(groups).filter(([_, vars]) => vars.length > 0),
    );
  }

  /**
   * Obtém valor de variável com fallback seguro
   */
  static getEnvVar(
    key: string,
    defaultValue?: string,
    required: boolean = false,
  ): string {
    // Verificar se estamos no servidor
    if (typeof process === "undefined" || typeof window !== "undefined") {
      if (required) {
        console.warn(
          `Tentativa de acessar variável de ambiente ${key} no cliente`,
        );
      }
      return defaultValue || "";
    }

    const value = process.env[key];

    if (!value) {
      if (required) {
        throw new Error(
          `Variável de ambiente obrigatória ${key} não está definida`,
        );
      }
      return defaultValue || "";
    }

    return value;
  }

  /**
   * Obtém valor booleano de variável de ambiente
   */
  static getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
    // Verificar se estamos no servidor
    if (typeof process === "undefined" || typeof window !== "undefined") {
      return defaultValue;
    }

    const value = process.env[key];
    if (!value) return defaultValue;

    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }

  /**
   * Obtém valor numérico de variável de ambiente
   */
  static getEnvNumber(key: string, defaultValue: number = 0): number {
    // Verificar se estamos no servidor
    if (typeof process === "undefined" || typeof window !== "undefined") {
      return defaultValue;
    }

    const value = process.env[key];
    if (!value) return defaultValue;

    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}

// =====================================
// INSTÂNCIA GLOBAL E UTILITÁRIOS
// =====================================

// Instância global do validador (só no servidor)
export const envValidator =
  typeof window === "undefined" ? new EnvironmentValidator() : null;

// Executar validação na inicialização (apenas no servidor e não em teste)
if (
  typeof window === "undefined" &&
  typeof process !== "undefined" &&
  process.env.NODE_ENV !== "test"
) {
  try {
    // Só validar se estivermos em ambiente Node.js (servidor)
    if (process.env.NODE_ENV && envValidator) {
      const result = envValidator.validate();

      if (!result.isValid && process.env.NODE_ENV === "production") {
        console.error(
          "🚨 ERRO CRÍTICO: Configuração de ambiente inválida em produção!",
        );
        console.error(
          "Variáveis obrigatórias faltando:",
          result.missingRequired,
        );
        console.error("Valores inválidos:", result.invalidValues);

        // Em produção, pode ser necessário interromper a aplicação
        if (result.missingRequired.length > 0) {
          process.exit(1);
        }
      }
    }
  } catch (error) {
    console.error("Erro durante validação de ambiente:", error);
    if (
      typeof process !== "undefined" &&
      process.env.NODE_ENV === "production"
    ) {
      process.exit(1);
    }
  }
}

// Utilitários exportados
export {
  EnvironmentValidator,
  ENV_VARIABLES,
  validateEnvironmentVariable,
  isValidUrl,
  isValidBoolean,
  isValidNumber,
};

export type { EnvVariable, EnvValidationResult, EnvConfig };
