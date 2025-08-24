import type { User, Session } from "@supabase/supabase-js";

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

class AuthCacheManager {
  private cache: AuthCacheEntry | null = null;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SESSION_BUFFER = 30 * 1000; // 30 seconds buffer before session expires
  private pendingCheck: PendingAuthCheck | null = null;
  private readonly PENDING_TIMEOUT = 10 * 1000; // 10 seconds

  /**
   * Gets cached auth state if valid, otherwise returns null
   */
  getCachedAuth(): AuthCacheEntry | null {
    if (!this.cache) return null;

    const now = Date.now();
    
    // Check if cache TTL expired
    if (now > this.cache.expiresAt) {
      console.log("🗑️ [AUTH-CACHE] Cache TTL expired, clearing");
      this.cache = null;
      return null;
    }

    // Check if session is about to expire
    if (this.cache.session?.expires_at) {
      const sessionExpiresAt = this.cache.session.expires_at * 1000;
      const bufferTime = sessionExpiresAt - this.SESSION_BUFFER;
      
      if (now > bufferTime) {
        console.log("🗑️ [AUTH-CACHE] Session about to expire, clearing cache");
        this.cache = null;
        return null;
      }
    }

    console.log("✅ [AUTH-CACHE] Using cached auth state", {
      userId: this.cache.user?.id?.substring(0, 8) + "...",
      age: Math.round((now - this.cache.timestamp) / 1000) + "s",
      ttl: Math.round((this.cache.expiresAt - now) / 1000) + "s"
    });

    return this.cache;
  }

  /**
   * Sets auth data in cache
   */
  setCachedAuth(user: User | null, session: Session | null): void {
    const now = Date.now();
    
    this.cache = {
      user,
      session,
      timestamp: now,
      expiresAt: now + this.TTL,
      isValid: !!user && !!session
    };

    console.log("💾 [AUTH-CACHE] Cached auth state", {
      hasUser: !!user,
      hasSession: !!session,
      userId: user?.id?.substring(0, 8) + "..." || "none",
      ttl: Math.round(this.TTL / 1000) + "s"
    });
  }

  /**
   * Clears the auth cache
   */
  clearCache(): void {
    console.log("🗑️ [AUTH-CACHE] Clearing cache");
    this.cache = null;
    this.clearPendingCheck();
  }

  /**
   * Checks if there's a pending auth check
   */
  hasPendingCheck(): boolean {
    if (!this.pendingCheck) return false;

    // Clear expired pending checks
    const now = Date.now();
    if (now - this.pendingCheck.timestamp > this.PENDING_TIMEOUT) {
      console.log("⏰ [AUTH-CACHE] Pending check timeout, clearing");
      this.clearPendingCheck();
      return false;
    }

    return true;
  }

  /**
   * Sets a pending auth check
   */
  setPendingCheck(promise: Promise<AuthCacheEntry>): void {
    console.log("⏳ [AUTH-CACHE] Setting pending auth check");
    this.pendingCheck = {
      promise,
      timestamp: Date.now()
    };
  }

  /**
   * Gets the pending auth check promise
   */
  getPendingCheck(): Promise<AuthCacheEntry> | null {
    return this.pendingCheck?.promise || null;
  }

  /**
   * Clears the pending auth check
   */
  clearPendingCheck(): void {
    if (this.pendingCheck) {
      console.log("🧹 [AUTH-CACHE] Clearing pending check");
      this.pendingCheck = null;
    }
  }

  /**
   * Gets cache statistics for debugging
   */
  getStats(): {
    hasCache: boolean;
    cacheAge?: number;
    timeToExpiry?: number;
    hasPending: boolean;
    pendingAge?: number;
  } {
    const now = Date.now();
    const stats: any = {
      hasCache: !!this.cache,
      hasPending: this.hasPendingCheck()
    };

    if (this.cache) {
      stats.cacheAge = Math.round((now - this.cache.timestamp) / 1000);
      stats.timeToExpiry = Math.round((this.cache.expiresAt - now) / 1000);
    }

    if (this.pendingCheck) {
      stats.pendingAge = Math.round((now - this.pendingCheck.timestamp) / 1000);
    }

    return stats;
  }

  /**
   * Validates cached session against current time
   */
  isSessionStillValid(session: Session | null): boolean {
    if (!session?.expires_at) return !!session;
    
    const now = Math.floor(Date.now() / 1000);
    const sessionExpiresAt = session.expires_at;
    const bufferSeconds = Math.floor(this.SESSION_BUFFER / 1000);
    
    return sessionExpiresAt > (now + bufferSeconds);
  }
}

// Export singleton instance
export const authCache = new AuthCacheManager();

// Export types for use elsewhere
export type { AuthCacheEntry };