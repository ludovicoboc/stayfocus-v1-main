import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

/**
 * Valida se o usuário está autenticado
 * @returns Promise<{ user: User | null, error: string | null }>
 */
export async function validateAuthState(): Promise<{
  user: User | null;
  error: string | null;
}> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Erro ao validar autenticação:", error);
      return { user: null, error: error.message };
    }

    if (!user) {
      return { user: null, error: "Usuário não autenticado" };
    }

    return { user, error: null };
  } catch (error) {
    console.error("Erro inesperado na validação de autenticação:", error);
    return {
      user: null,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Garante que o usuário está autenticado antes de executar uma operação
 * @param operation Função a ser executada se o usuário estiver autenticado
 * @returns Promise com o resultado da operação ou erro de autenticação
 */
export async function withAuth<T>(
  operation: (user: User) => Promise<T>,
): Promise<{ data: T | null; error: string | null }> {
  const { user, error } = await validateAuthState();

  if (error || !user) {
    return {
      data: null,
      error: error || "Usuário não autenticado",
    };
  }

  try {
    const data = await operation(user);
    return { data, error: null };
  } catch (operationError) {
    console.error("Erro na operação autenticada:", operationError);
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
 * @returns Promise<User>
 * @throws Error se não autenticado
 */
export async function requireAuth(): Promise<User> {
  const { user, error } = await validateAuthState();

  if (error || !user) {
    throw new Error(
      error || "Autenticação necessária para acessar este recurso",
    );
  }

  return user;
}

/**
 * Verifica se a sessão do usuário ainda é válida
 * @returns Promise<boolean>
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return false;
    }

    // Verificar se o token não expirou
    const now = Math.floor(Date.now() / 1000);
    return session.expires_at ? session.expires_at > now : true;
  } catch {
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
