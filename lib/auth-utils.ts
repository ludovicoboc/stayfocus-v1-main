import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

/**
 * Valida se o usuário está autenticado com retry automático
 * @param retryCount Número de tentativas já realizadas
 * @returns Promise<{ user: User | null, error: string | null }>
 */
export async function validateAuthState(retryCount = 0): Promise<{
  user: User | null;
  error: string | null;
}> {
  const MAX_RETRIES = 2;

  try {
    console.log(`🔐 Validando autenticação (tentativa ${retryCount + 1})`);

    // Primeiro, verificar se temos uma sessão válida
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ Erro ao obter sessão:", sessionError);

      // Se for erro de JWT e ainda temos tentativas, tentar renovar
      if (sessionError.message?.includes("JWT") && retryCount < MAX_RETRIES) {
        console.log("🔄 Tentando renovar sessão...");
        try {
          await supabase.auth.refreshSession();
          await new Promise((resolve) => setTimeout(resolve, 500)); // Aguardar 500ms
          return await validateAuthState(retryCount + 1);
        } catch (refreshError) {
          console.error("❌ Erro ao renovar sessão:", refreshError);
        }
      }

      return { user: null, error: sessionError.message };
    }

    if (!session?.user) {
      console.log("ℹ️ Nenhuma sessão ativa encontrada");
      return { user: null, error: "Usuário não autenticado" };
    }

    // Verificar se a sessão não expirou
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at <= now) {
      console.warn("⚠️ Sessão expirada");

      if (retryCount < MAX_RETRIES) {
        console.log("🔄 Tentando renovar sessão expirada...");
        try {
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();
          if (refreshError) throw refreshError;

          if (refreshData.session?.user) {
            console.log("✅ Sessão renovada com sucesso");
            return { user: refreshData.session.user, error: null };
          }
        } catch (refreshError) {
          console.error("❌ Erro ao renovar sessão expirada:", refreshError);
        }
      }

      return { user: null, error: "Sessão expirada" };
    }

    // Fazer uma chamada de teste para verificar se o token ainda é válido
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ Erro ao validar usuário:", userError);

      // Se for erro de autenticação e ainda temos tentativas
      if (
        (userError.message?.includes("JWT") ||
          userError.message?.includes("invalid")) &&
        retryCount < MAX_RETRIES
      ) {
        console.log("🔄 Token inválido, tentando renovar...");
        try {
          await supabase.auth.refreshSession();
          await new Promise((resolve) => setTimeout(resolve, 500));
          return await validateAuthState(retryCount + 1);
        } catch (refreshError) {
          console.error("❌ Erro ao renovar token inválido:", refreshError);
        }
      }

      return { user: null, error: userError.message };
    }

    if (!user) {
      console.log("ℹ️ Usuário não encontrado na validação");
      return { user: null, error: "Usuário não autenticado" };
    }

    console.log("✅ Autenticação validada com sucesso:", {
      userId: user.id,
      email: user.email,
    });
    return { user, error: null };
  } catch (error) {
    console.error("❌ Erro inesperado na validação de autenticação:", error);

    // Em caso de erro de rede, tentar novamente
    if (
      retryCount < MAX_RETRIES &&
      (error as any)?.message?.includes("network")
    ) {
      console.log("🔄 Erro de rede detectado, tentando novamente...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await validateAuthState(retryCount + 1);
    }

    return {
      user: null,
      error: error instanceof Error ? error.message : "Erro desconhecido",
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

  console.log(
    `🔒 Executando operação autenticada (tentativa ${retryCount + 1})`,
  );

  const { user, error } = await validateAuthState(retryCount);

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

  const { user, error } = await validateAuthState(retryCount);

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
 * Verifica se a sessão do usuário ainda é válida com retry
 * @param retryCount Número de tentativas já realizadas
 * @returns Promise<boolean>
 */
export async function isSessionValid(retryCount = 0): Promise<boolean> {
  const MAX_RETRIES = 1;

  try {
    console.log(
      `🔍 Verificando validade da sessão (tentativa ${retryCount + 1})`,
    );

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ Erro ao verificar sessão:", error);

      // Tentar uma vez mais em caso de erro
      if (retryCount < MAX_RETRIES) {
        console.log("🔄 Tentando verificar sessão novamente...");
        await new Promise((resolve) => setTimeout(resolve, 500));
        return await isSessionValid(retryCount + 1);
      }

      return false;
    }

    if (!session) {
      console.log("ℹ️ Nenhuma sessão encontrada");
      return false;
    }

    // Verificar se o token não expirou
    const now = Math.floor(Date.now() / 1000);
    const isValid = session.expires_at ? session.expires_at > now : true;

    console.log("🔍 Resultado da verificação de sessão:", {
      isValid,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : "nunca",
      timeLeft: session.expires_at
        ? Math.max(0, session.expires_at - now)
        : "indefinido",
    });

    return isValid;
  } catch (error) {
    console.error("❌ Erro inesperado ao verificar sessão:", error);
    return false;
  }
}

/**
 * Faz logout do usuário
 * @returns Promise<{ error: string | null }>
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao fazer logout:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error("Erro inesperado no logout:", error);
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
