import type { User, Session } from "@supabase/supabase-js";
import { optimizedAuthCache, type CachedAuthState } from "./auth-cache-manager";

// Manter compatibilidade com a interface antiga
interface AuthCacheEntry {
  user: User | null;
  session: Session | null;
  timestamp: number;
  expiresAt: number;
  isValid: boolean;
}

interface PendingAuthCheck {
  promise: Promise<AuthCacheEntry>;
  timestamp: number;
}

/**
 * Wrapper de compatibilidade para o sistema antigo
 * Redireciona para o novo AuthCacheManager otimizado
 */
class AuthCacheManager {
  private readonly TTL = 5 * 60 * 1000; // 5 minutes - mantido para compatibilidade
  private readonly SESSION_BUFFER = 30 * 1000; // 30 seconds - mantido para compatibilidade
  private readonly PENDING_TIMEOUT = 10 * 1000; // 10 seconds - mantido para compatibilidade

  /**
   * Gets cached auth state if valid, otherwise returns null
   * Redireciona para o sistema otimizado
   */
  getCachedAuth(): AuthCacheEntry | null {
    const optimizedResult = optimizedAuthCache.getCachedAuth();
    if (!optimizedResult) return null;
    
    // Converter para interface de compatibilidade
    return {
      user: optimizedResult.user,
      session: optimizedResult.session,
      timestamp: optimizedResult.timestamp,
      expiresAt: optimizedResult.expiry,
      isValid: optimizedResult.isValid
    };
  }

  /**
   * Sets auth data in cache
   * Redireciona para o sistema otimizado
   */
  setCachedAuth(user: User | null, session: Session | null): void {
    optimizedAuthCache.setCachedAuth(user, session, 'fresh');
  }

  /**
   * Clears the auth cache
   * Redireciona para o sistema otimizado
   */
  clearCache(): void {
    optimizedAuthCache.clearCache();
  }

  /**
   * Métodos de compatibilidade - redirecionam para o sistema otimizado
   */
  hasPendingCheck(): boolean {
    // O novo sistema gerencia internamente as requisições pendentes
    return false;
  }

  setPendingCheck(promise: Promise<AuthCacheEntry>): void {
    // Não usado no novo sistema - gerenciamento interno

  }

  getPendingCheck(): Promise<AuthCacheEntry> | null {
    // Não usado no novo sistema - gerenciamento interno
    return null;
  }

  clearPendingCheck(): void {
    // Não usado no novo sistema - gerenciamento interno

  }

  /**
   * Gets cache statistics for debugging
   * Redireciona para o sistema otimizado
   */
  getStats() {
    const optimizedStats = optimizedAuthCache.getDebugInfo();
    
    // Converter para interface de compatibilidade
    return {
      cacheAge: optimizedStats.cacheAge,
      timeToExpiry: optimizedStats.timeToExpiry,
      pendingAge: optimizedStats.pendingAge,
      // Incluir todas as informações do sistema otimizado
      ...optimizedStats
    };
  }

  /**
   * Validates cached session against current time
   * Redireciona para o sistema otimizado
   */
  isSessionStillValid(session: Session | null): boolean {
    return optimizedAuthCache.isSessionStillValid(session);
  }
}

// Export singleton instance (compatibilidade)
export const authCache = new AuthCacheManager();

// Export para acesso direto ao sistema otimizado
export { optimizedAuthCache };

// Export types for use elsewhere
export type { AuthCacheEntry, CachedAuthState };