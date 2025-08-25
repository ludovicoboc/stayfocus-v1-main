import { supabase } from "./supabase";
import { optimizedAuthCache, type CachedAuthState } from "./auth-cache";
import { createDebouncedAuthCheck } from "./request-debouncer";
import type { User } from "@supabase/supabase-js";

// Instâncias debounced para diferentes operações
const debouncedValidateAuth = createDebouncedAuthCheck(
  'validateAuthState',
  performAuthValidation
);

const debouncedSessionCheck = createDebouncedAuthCheck(
  'sessionValidation', 
  performSessionValidation
);

/**
 * Executa a validação real de autenticação com otimizações avançadas
 */
async function performAuthValidation(retryCount = 0): Promise<CachedAuthState> {
  const MAX_RETRIES = 2;

  try {
    // Usar cache otimizado como primeira verificação
    return await optimizedAuthCache.validateWithOptimizations(
      'auth_validation',
      async () => {
        // Verificar sessão no Supabase
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ [AUTH-UTILS] Erro ao obter sessão:", sessionError);

          // Se for erro de JWT e ainda temos tentativas, tentar renovar
          if (sessionError.message?.includes("JWT") && retryCount < MAX_RETRIES) {
            try {
              await supabase.auth.refreshSession();
              await new Promise((resolve) => setTimeout(resolve, 500));
              return await performAuthValidation(retryCount + 1);
            } catch (refreshError) {
              console.error("❌ [AUTH-UTILS] Erro ao renovar sessão:", refreshError);
            }
          }

          return {
            user: null,
            session: null,
            timestamp: Date.now(),
            expiry: Date.now(),
            isValid: false,
            source: 'fresh' as const
          };
        }

        if (!session?.user) {
          return {
            user: null,
            session: null,
            timestamp: Date.now(),
            expiry: Date.now(),
            isValid: false,
            source: 'fresh' as const
          };
        }

        // Verificar se a sessão não expirou
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at <= now) {
          console.warn("⚠️ [AUTH-UTILS] Sessão expirada");

          if (retryCount < MAX_RETRIES) {
            try {
              const { data: refreshData, error: refreshError } =
                await supabase.auth.refreshSession();
              if (refreshError) throw refreshError;

              if (refreshData.session?.user) {
                return {
                  user: refreshData.session.user,
                  session: refreshData.session,
                  timestamp: Date.now(),
                  expiry: Date.now() + (5 * 60 * 1000),
                  isValid: true,
                  source: 'fresh' as const
                };
              }
            } catch (refreshError) {
              console.error("❌ [AUTH-UTILS] Erro ao renovar sessão expirada:", refreshError);
            }
          }

          return {
            user: null,
            session: null,
            timestamp: Date.now(),
            expiry: Date.now(),
            isValid: false,
            source: 'fresh' as const
          };
        }

        // Sessão válida
        const result = {
          user: session.user,
          session,
          timestamp: Date.now(),
          expiry: Date.now() + (5 * 60 * 1000),
          isValid: true,
          source: 'fresh' as const
        };

        // Atualizar cache
        optimizedAuthCache.setCachedAuth(session.user, session, 'fresh');
        return result;
      },
      { forceRefresh: retryCount > 0 }
    );

  } catch (error) {
    console.error("❌ [AUTH-UTILS] Erro inesperado na validação:", error);

    // Em caso de erro de rede, tentar novamente
    if (
      retryCount < MAX_RETRIES &&
      (error as any)?.message?.includes("network")
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await performAuthValidation(retryCount + 1);
    }

    return {
      user: null,
      session: null,
      timestamp: Date.now(),
      expiry: Date.now(),
      isValid: false,
      source: 'fresh' as const
    };
  }
}

/**
 * Validação específica de sessão (mais leve)
 */
async function performSessionValidation(): Promise<boolean> {
  try {
    return await optimizedAuthCache.validateWithOptimizations(
      'session_validation',
      async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        return !error && !!session?.user && optimizedAuthCache.isSessionStillValid(session);
      },
      { bypassRateLimit: false }
    ) as any;
  } catch (error) {
    console.error("❌ [AUTH-UTILS] Erro na validação de sessão:", error);
    return false;
  }
}

/**
 * Valida se o usuário está autenticado com cache otimizado e debouncing
 */
export async function validateAuthState(forceRefresh = false): Promise<{
  user: User | null;
  error: string | null;
}> {
  try {
    const result = await debouncedValidateAuth(forceRefresh ? 1 : 0);
    
    return {
      user: result.user,
      error: result.isValid ? null : "Usuário não autenticado"
    };
  } catch (error) {
    console.error("❌ [AUTH-UTILS] Erro na validação:", error);
    return {
      user: null,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

/**
 * Garante que o usuário está autenticado antes de executar uma operação
 * @param operation Função a ser executada se o usuário estiver autenticado
 * @param retryCount Número de tentativas de autenticação
 * @returns Promise com o resultado da operação ou erro de autenticação
 */
export async function withAuth<T>(
  operation: (user: User) => Promise<T>,
  retryCount = 0,
): Promise<{ data: T | null; error: string | null }> {
  const MAX_RETRIES = 2;
  const { user, error } = await validateAuthState(retryCount > 0);

  if (error || !user) {
    console.error("❌ Falha na autenticação para operação:", error);
    return {
      data: null,
      error: error || "Usuário não autenticado",
    };
  }

  try {
    const data = await operation(user);
    return { data, error: null };
  } catch (operationError: any) {
    console.error("❌ Erro na operação autenticada:", operationError);

    // Se for erro de autenticação e ainda temos tentativas, tentar novamente
    if (
      (operationError?.message?.includes("JWT") ||
        operationError?.message?.includes("auth") ||
        operationError?.message?.includes("unauthorized")) &&
      retryCount < MAX_RETRIES
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await withAuth(operation, retryCount + 1);
    }

    return {
      data: null,
      error:
        operationError instanceof Error
          ? operationError.message
          : "Erro na operação",
    };
  }
}

/**
 * Verifica se o usuário tem acesso a um recurso específico
 * @param userId ID do usuário atual
 * @param resourceUserId ID do usuário proprietário do recurso
 * @returns boolean
 */
export function hasResourceAccess(
  userId: string,
  resourceUserId: string,
): boolean {
  return userId === resourceUserId;
}

/**
 * Obtém o usuário atual ou lança erro se não autenticado
 * @param retryCount Número de tentativas de autenticação
 * @returns Promise<User>
 * @throws Error se não autenticado
 */
export async function requireAuth(retryCount = 0): Promise<User> {
  const { user, error } = await validateAuthState(retryCount > 0);

  if (error || !user) {
    const errorMessage =
      error || "Autenticação necessária para acessar este recurso";
    console.error("❌ Autenticação requerida falhou:", errorMessage);
    throw new Error(errorMessage);
  }
  return user;
}

/**
 * Verifica se a sessão do usuário ainda é válida usando cache otimizado
 */
export async function isSessionValid(forceRefresh = false): Promise<boolean> {
  if (!forceRefresh) {
    // Tentar usar cache primeiro
    const cached = optimizedAuthCache.getCachedAuth();
    if (cached) {
      const isValid = cached.isValid && optimizedAuthCache.isSessionStillValid(cached.session);
      return isValid;
    }
  }

  // Se não há cache válido, usar validação debounced
  try {
    const isValid = await debouncedSessionCheck();
    return isValid;
  } catch (error) {
    console.error("❌ [AUTH-UTILS] Erro na verificação de sessão:", error);
    return false;
  }
}

/**
 * Faz logout do usuário e limpa todos os caches
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();

    // Limpar cache otimizado independentemente do resultado
    optimizedAuthCache.clearCache();
    
    // Cancelar validações debounced pendentes
    if (debouncedValidateAuth.cancel) {
      debouncedValidateAuth.cancel();
    }
    if (debouncedSessionCheck.cancel) {
      debouncedSessionCheck.cancel();
    }

    if (error) {
      console.error("❌ [AUTH-UTILS] Erro ao fazer logout:", error);
      return { error: error.message };
    }
    return { error: null };
  } catch (error) {
    console.error("❌ [AUTH-UTILS] Erro inesperado no logout:", error);
    // Limpar cache mesmo em caso de erro
    optimizedAuthCache.clearCache();
    return {
      error: error instanceof Error ? error.message : "Erro no logout",
    };
  }
}

/**
 * Hook otimizado para escutar mudanças no estado de autenticação
 */
export function onAuthStateChange(
  callback: (user: User | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    // Atualizar cache otimizado com novo estado
    if (event === 'SIGNED_OUT' || !session) {
      optimizedAuthCache.clearCache();
      // Cancelar validações pendentes
      if (debouncedValidateAuth.cancel) {
        debouncedValidateAuth.cancel();
      }
      if (debouncedSessionCheck.cancel) {
        debouncedSessionCheck.cancel();
      }
    } else if (session?.user) {
      optimizedAuthCache.setCachedAuth(session.user, session, 'fresh');
    }

    callback(session?.user || null);
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Verifica se o usuário está autenticado de forma síncrona
 * Nota: Esta função pode não refletir o estado mais atual
 * @returns User | null
 */
export function getCurrentUser(): User | null {
  // Esta função é limitada pois getSession() é assíncrona
  // Retorna null por segurança - use validateAuthState() para verificação adequada
  return null;
}

/**
 * Tipos de erro de autenticação para tratamento específico
 */
export const AUTH_ERRORS = {
  USER_NOT_FOUND: "user_not_found",
  INVALID_CREDENTIALS: "invalid_credentials",
  SESSION_EXPIRED: "session_expired",
  INSUFFICIENT_PERMISSIONS: "insufficient_permissions",
  NETWORK_ERROR: "network_error",
  UNKNOWN_ERROR: "unknown_error",
} as const;

export type AuthError = (typeof AUTH_ERRORS)[keyof typeof AUTH_ERRORS];

/**
 * Mapeia erros do Supabase para tipos conhecidos
 * @param error Erro do Supabase
 * @returns AuthError
 */
export function mapAuthError(error: any): AuthError {
  if (!error) return AUTH_ERRORS.UNKNOWN_ERROR;

  const message = error.message?.toLowerCase() || "";

  if (message.includes("user not found")) {
    return AUTH_ERRORS.USER_NOT_FOUND;
  }

  if (message.includes("invalid") && message.includes("credentials")) {
    return AUTH_ERRORS.INVALID_CREDENTIALS;
  }

  if (message.includes("session") && message.includes("expired")) {
    return AUTH_ERRORS.SESSION_EXPIRED;
  }

  if (message.includes("permission") || message.includes("unauthorized")) {
    return AUTH_ERRORS.INSUFFICIENT_PERMISSIONS;
  }

  if (message.includes("network") || message.includes("connection")) {
    return AUTH_ERRORS.NETWORK_ERROR;
  }

  return AUTH_ERRORS.UNKNOWN_ERROR;
}
