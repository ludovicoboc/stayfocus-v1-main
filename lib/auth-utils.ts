import { supabase } from "./supabase";
import { authCache, type AuthCacheEntry } from "./auth-cache";
import type { User } from "@supabase/supabase-js";

/**
 * Executa a validação real de autenticação (sem cache)
 */
async function performAuthValidation(retryCount = 0): Promise<AuthCacheEntry> {
  const MAX_RETRIES = 2;

  try {
    console.log(`🔐 [AUTH-UTILS] Validando autenticação (tentativa ${retryCount + 1})`);

    // Primeiro, verificar se temos uma sessão válida
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ [AUTH-UTILS] Erro ao obter sessão:", sessionError);

      // Se for erro de JWT e ainda temos tentativas, tentar renovar
      if (sessionError.message?.includes("JWT") && retryCount < MAX_RETRIES) {
        console.log("🔄 [AUTH-UTILS] Tentando renovar sessão...");
        try {
          await supabase.auth.refreshSession();
          await new Promise((resolve) => setTimeout(resolve, 500));
          return await performAuthValidation(retryCount + 1);
        } catch (refreshError) {
          console.error("❌ [AUTH-UTILS] Erro ao renovar sessão:", refreshError);
        }
      }

      const result = { user: null, session: null, timestamp: Date.now(), expiresAt: Date.now(), isValid: false };
      authCache.setCachedAuth(null, null);
      return result;
    }

    if (!session?.user) {
      console.log("ℹ️ [AUTH-UTILS] Nenhuma sessão ativa encontrada");
      const result = { user: null, session: null, timestamp: Date.now(), expiresAt: Date.now(), isValid: false };
      authCache.setCachedAuth(null, null);
      return result;
    }

    // Verificar se a sessão não expirou
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at <= now) {
      console.warn("⚠️ [AUTH-UTILS] Sessão expirada");

      if (retryCount < MAX_RETRIES) {
        console.log("🔄 [AUTH-UTILS] Tentando renovar sessão expirada...");
        try {
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();
          if (refreshError) throw refreshError;

          if (refreshData.session?.user) {
            console.log("✅ [AUTH-UTILS] Sessão renovada com sucesso");
            const result = { 
              user: refreshData.session.user, 
              session: refreshData.session, 
              timestamp: Date.now(), 
              expiresAt: Date.now() + (5 * 60 * 1000), 
              isValid: true 
            };
            authCache.setCachedAuth(refreshData.session.user, refreshData.session);
            return result;
          }
        } catch (refreshError) {
          console.error("❌ [AUTH-UTILS] Erro ao renovar sessão expirada:", refreshError);
        }
      }

      const result = { user: null, session: null, timestamp: Date.now(), expiresAt: Date.now(), isValid: false };
      authCache.setCachedAuth(null, null);
      return result;
    }

    // Para sessões válidas, usar apenas os dados da sessão (evita chamada adicional getUser)
    console.log("✅ [AUTH-UTILS] Sessão validada com sucesso:", {
      userId: session.user.id?.substring(0, 8) + "...",
      email: session.user.email
    });

    const result = { 
      user: session.user, 
      session, 
      timestamp: Date.now(), 
      expiresAt: Date.now() + (5 * 60 * 1000), 
      isValid: true 
    };
    authCache.setCachedAuth(session.user, session);
    return result;

  } catch (error) {
    console.error("❌ [AUTH-UTILS] Erro inesperado na validação de autenticação:", error);

    // Em caso de erro de rede, tentar novamente
    if (
      retryCount < MAX_RETRIES &&
      (error as any)?.message?.includes("network")
    ) {
      console.log("🔄 [AUTH-UTILS] Erro de rede detectado, tentando novamente...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await performAuthValidation(retryCount + 1);
    }

    const result = { user: null, session: null, timestamp: Date.now(), expiresAt: Date.now(), isValid: false };
    authCache.setCachedAuth(null, null);
    return result;
  }
}

/**
 * Valida se o usuário está autenticado com cache e prevenção de múltiplas chamadas
 * @param forceRefresh Força nova validação ignorando cache
 * @returns Promise<{ user: User | null, error: string | null }>
 */
export async function validateAuthState(forceRefresh = false): Promise<{
  user: User | null;
  error: string | null;
}> {
  // Se não for refresh forçado, tentar usar cache
  if (!forceRefresh) {
    const cached = authCache.getCachedAuth();
    if (cached) {
      return {
        user: cached.user,
        error: cached.isValid ? null : "Usuário não autenticado"
      };
    }

    // Se há uma verificação pendente, aguardar ela
    if (authCache.hasPendingCheck()) {
      console.log("⏳ [AUTH-UTILS] Aguardando verificação pendente...");
      try {
        const pendingResult = await authCache.getPendingCheck();
        if (pendingResult) {
          return {
            user: pendingResult.user,
            error: pendingResult.isValid ? null : "Usuário não autenticado"
          };
        }
      } catch (error) {
        console.error("❌ [AUTH-UTILS] Erro na verificação pendente:", error);
        authCache.clearPendingCheck();
      }
    }
  }

  // Criar nova verificação
  console.log("🆕 [AUTH-UTILS] Iniciando nova validação de autenticação");
  const validationPromise = performAuthValidation();
  authCache.setPendingCheck(validationPromise);

  try {
    const result = await validationPromise;
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
  } finally {
    authCache.clearPendingCheck();
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

  console.log(
    `🔒 Executando operação autenticada (tentativa ${retryCount + 1})`,
  );

  const { user, error } = await validateAuthState(retryCount > 0);

  if (error || !user) {
    console.error("❌ Falha na autenticação para operação:", error);
    return {
      data: null,
      error: error || "Usuário não autenticado",
    };
  }

  try {
    console.log("✅ Usuário autenticado, executando operação...");
    const data = await operation(user);
    console.log("✅ Operação concluída com sucesso");
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
      console.log("🔄 Erro de autenticação na operação, tentando novamente...");
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
  console.log(`🔐 Requerendo autenticação (tentativa ${retryCount + 1})`);

  const { user, error } = await validateAuthState(retryCount > 0);

  if (error || !user) {
    const errorMessage =
      error || "Autenticação necessária para acessar este recurso";
    console.error("❌ Autenticação requerida falhou:", errorMessage);
    throw new Error(errorMessage);
  }

  console.log("✅ Autenticação requerida bem-sucedida:", { userId: user.id });
  return user;
}

/**
 * Verifica se a sessão do usuário ainda é válida usando cache quando possível
 * @param forceRefresh Força nova verificação ignorando cache
 * @returns Promise<boolean>
 */
export async function isSessionValid(forceRefresh = false): Promise<boolean> {
  // Tentar usar cache primeiro
  if (!forceRefresh) {
    const cached = authCache.getCachedAuth();
    if (cached) {
      const isValid = cached.isValid && authCache.isSessionStillValid(cached.session);
      console.log("🔍 [AUTH-UTILS] Validade da sessão (cache):", { isValid });
      return isValid;
    }
  }

  // Se não há cache, usar validateAuthState que já implementa cache
  const { user, error } = await validateAuthState(forceRefresh);
  const isValid = !!user && !error;
  
  console.log("🔍 [AUTH-UTILS] Validade da sessão (nova verificação):", { isValid });
  return isValid;
}

/**
 * Faz logout do usuário e limpa o cache
 * @returns Promise<{ error: string | null }>
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    console.log("👋 [AUTH-UTILS] Fazendo logout...");
    
    const { error } = await supabase.auth.signOut();

    // Limpar cache independentemente do resultado
    authCache.clearCache();

    if (error) {
      console.error("❌ [AUTH-UTILS] Erro ao fazer logout:", error);
      return { error: error.message };
    }

    console.log("✅ [AUTH-UTILS] Logout realizado com sucesso");
    return { error: null };
  } catch (error) {
    console.error("❌ [AUTH-UTILS] Erro inesperado no logout:", error);
    // Limpar cache mesmo em caso de erro
    authCache.clearCache();
    return {
      error: error instanceof Error ? error.message : "Erro no logout",
    };
  }
}

/**
 * Hook para escutar mudanças no estado de autenticação
 * @param callback Função chamada quando o estado muda
 * @returns Função para cancelar a escuta
 */
export function onAuthStateChange(
  callback: (user: User | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    console.log(`🔄 [AUTH-UTILS] Auth state change: ${event}`, {
      hasUser: !!session?.user,
      userId: session?.user?.id?.substring(0, 8) + "..." || "none"
    });

    // Atualizar cache com novo estado
    if (event === 'SIGNED_OUT' || !session) {
      authCache.clearCache();
    } else if (session?.user) {
      authCache.setCachedAuth(session.user, session);
    }

    callback(session?.user || null);
  });

  return () => subscription.unsubscribe();
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
