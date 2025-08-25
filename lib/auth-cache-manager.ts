import type { User, Session } from "@supabase/supabase-js";

interface AuthCacheConfig {
  ttl: number; // Time to live em milliseconds
  maxRetries: number;
  debounceTime: number;
  sessionBuffer: number;
  pendingTimeout: number;
}

interface CachedAuthState {
  user: User | null;
  session: Session | null;
  timestamp: number;
  expiry: number;
  isValid: boolean;
  source: 'cache' | 'fresh' | 'fallback';
}

interface PendingRequest {
  promise: Promise<CachedAuthState>;
  timestamp: number;
  requestId: string;
}

interface DebounceRequest<T = CachedAuthState> {
  requestId: string;
  resolver: (value: T) => void;
  rejecter: (reason: any) => void;
  timestamp: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Sistema de cache avançado para autenticação com:
 * - Cache TTL configurável
 * - Debouncing de requisições
 * - Rate limiting
 * - Prevenção de múltiplas chamadas simultâneas
 * - Métricas de performance
 */
export class AuthCacheManager {
  private cache: CachedAuthState | null = null;
  private config: AuthCacheConfig;
  private pendingRequest: PendingRequest | null = null;
  private debounceMap: Map<string, DebounceRequest<any>[]> = new Map();
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  
  // Métricas
  private metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    debounceSkips: 0,
    rateLimitBlocks: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    lastReset: Date.now()
  };

  constructor(config?: Partial<AuthCacheConfig>) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      debounceTime: 300, // 300ms
      sessionBuffer: 30 * 1000, // 30 seconds
      pendingTimeout: 10 * 1000, // 10 seconds
      ...config
    };
  }

  /**
   * Obtém estado de autenticação do cache se válido
   */
  getCachedAuth(): CachedAuthState | null {
    if (!this.cache) {
      this.metrics.cacheMisses++;
      return null;
    }

    const now = Date.now();
    
    // Verificar TTL do cache
    if (now > this.cache.expiry) {

      this.cache = null;
      this.metrics.cacheMisses++;
      return null;
    }

    // Verificar se a sessão está prestes a expirar
    if (this.cache.session?.expires_at) {
      const sessionExpiresAt = this.cache.session.expires_at * 1000;
      const bufferTime = sessionExpiresAt - this.config.sessionBuffer;
      
      if (now > bufferTime) {

        this.cache = null;
        this.metrics.cacheMisses++;
        return null;
      }
    }

    this.metrics.cacheHits++;

    return { ...this.cache };
  }

  /**
   * Define dados de autenticação no cache
   */
  setCachedAuth(user: User | null, session: Session | null, source: 'cache' | 'fresh' | 'fallback' = 'fresh'): void {
    const now = Date.now();
    
    this.cache = {
      user,
      session,
      timestamp: now,
      expiry: now + this.config.ttl,
      isValid: !!user && !!session,
      source
    };

  }

  /**
   * Limpa o cache de autenticação
   */
  clearCache(): void {

    this.cache = null;
    this.clearPendingRequest();
    this.clearAllDebounceRequests();
  }

  /**
   * Executa validação com debouncing e rate limiting
   */
  async validateWithOptimizations<T>(
    key: string,
    validationFn: () => Promise<T>,
    options?: {
      forceRefresh?: boolean;
      bypassRateLimit?: boolean;
    }
  ): Promise<T> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // 1. Verificar rate limiting
      if (!options?.bypassRateLimit && this.isRateLimited(key)) {
        this.metrics.rateLimitBlocks++;
        throw new Error(`Rate limit excedido para ${key}`);
      }

      // 2. Se não for refresh forçado, tentar cache
      if (!options?.forceRefresh) {
        const cached = this.getCachedAuth();
        if (cached && cached.isValid) {
          this.updateResponseTime(startTime);
          return cached as any;
        }
      }

      // 3. Verificar se há requisição pendente
      if (this.hasPendingRequest()) {

        try {
          const result = await this.getPendingRequest();
          this.updateResponseTime(startTime);
          return result as any;
        } catch (error) {
          console.warn("⚠️ [AUTH-CACHE-MANAGER] Erro na requisição pendente:", error);
          this.clearPendingRequest();
        }
      }

      // 4. Executar com debouncing
      const result = await this.executeWithDebounce(key, validationFn);
      this.updateRateLimit(key);
      this.updateResponseTime(startTime);
      
      return result;

    } catch (error) {
      this.updateResponseTime(startTime);
      throw error;
    }
  }

  /**
   * Executa função com debouncing
   */
  private async executeWithDebounce<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = `${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Adicionar à lista de debounce
      if (!this.debounceMap.has(key)) {
        this.debounceMap.set(key, []);
      }
      
      const debounceRequests = this.debounceMap.get(key)!;
      debounceRequests.push({
        requestId,
        resolver: resolve,
        rejecter: reject,
        timestamp: Date.now()
      });

      // Se é a primeira requisição, agendar execução
      if (debounceRequests.length === 1) {
        setTimeout(() => {
          this.executeDebouncedRequest(key, fn);
        }, this.config.debounceTime);
      } else {
        this.metrics.debounceSkips++;

      }
    });
  }

  /**
   * Executa requisição debounced agrupada
   */
  private async executeDebouncedRequest<T>(key: string, fn: () => Promise<T>): Promise<void> {
    const requests = this.debounceMap.get(key) || [];
    if (requests.length === 0) return;

    try {
      // Criar promise principal se não existir
      if (!this.pendingRequest) {
        const mainPromise = fn() as Promise<CachedAuthState>;
        this.setPendingRequest(mainPromise);
      }

      const result = await this.getPendingRequest();
      
      // Resolver todas as promises agrupadas
      requests.forEach(req => {
        try {
          req.resolver(result as any);
        } catch (error) {
          console.error(`❌ [AUTH-CACHE-MANAGER] Erro ao resolver ${req.requestId}:`, error);
        }
      });

    } catch (error) {
      console.error(`❌ [AUTH-CACHE-MANAGER] Erro na execução agrupada:`, error);
      
      // Rejeitar todas as promises agrupadas
      requests.forEach(req => {
        try {
          req.rejecter(error);
        } catch (rejError) {
          console.error(`❌ [AUTH-CACHE-MANAGER] Erro ao rejeitar ${req.requestId}:`, rejError);
        }
      });

    } finally {
      // Limpar requisições processadas
      this.debounceMap.delete(key);
      this.clearPendingRequest();
    }
  }

  /**
   * Verifica rate limiting
   */
  private isRateLimited(key: string): boolean {
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minuto
    const maxRequests = 10; // máximo 10 requisições por minuto por chave

    const entry = this.rateLimits.get(key);
    if (!entry) return false;

    // Reset da janela se passou o tempo
    if (now - entry.windowStart > windowSize) {
      this.rateLimits.delete(key);
      return false;
    }

    return entry.count >= maxRequests;
  }

  /**
   * Atualiza contador de rate limit
   */
  private updateRateLimit(key: string): void {
    const now = Date.now();
    const windowSize = 60 * 1000;

    const entry = this.rateLimits.get(key);
    if (!entry || now - entry.windowStart > windowSize) {
      this.rateLimits.set(key, {
        count: 1,
        windowStart: now
      });
    } else {
      entry.count++;
    }
  }

  /**
   * Verifica se há requisição pendente válida
   */
  private hasPendingRequest(): boolean {
    if (!this.pendingRequest) return false;

    const now = Date.now();
    if (now - this.pendingRequest.timestamp > this.config.pendingTimeout) {

      this.clearPendingRequest();
      return false;
    }

    return true;
  }

  /**
   * Define requisição pendente
   */
  private setPendingRequest(promise: Promise<CachedAuthState>): void {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.pendingRequest = {
      promise,
      timestamp: Date.now(),
      requestId
    };
  }

  /**
   * Obtém promise da requisição pendente
   */
  private async getPendingRequest(): Promise<CachedAuthState> {
    if (!this.pendingRequest) {
      throw new Error("Nenhuma requisição pendente");
    }
    
    return await this.pendingRequest.promise;
  }

  /**
   * Limpa requisição pendente
   */
  private clearPendingRequest(): void {
    if (this.pendingRequest) {

      this.pendingRequest = null;
    }
  }

  /**
   * Limpa todas as requisições de debounce
   */
  private clearAllDebounceRequests(): void {
    this.debounceMap.forEach((requests, key) => {
      requests.forEach(req => {
        try {
          req.rejecter(new Error("Cache limpo"));
        } catch (error) {
          // Ignorar erros de rejeição
        }
      });
    });
    this.debounceMap.clear();
  }

  /**
   * Atualiza tempo médio de resposta
   */
  private updateResponseTime(startTime: number): void {
    const duration = Date.now() - startTime;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + duration) / 2;
  }

  /**
   * Calcula taxa de cache hits
   */
  private getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? Math.round((this.metrics.cacheHits / total) * 100) : 0;
  }

  /**
   * Verifica se a sessão ainda é válida
   */
  isSessionStillValid(session: Session | null): boolean {
    if (!session?.expires_at) return !!session;
    
    const now = Math.floor(Date.now() / 1000);
    const bufferSeconds = Math.floor(this.config.sessionBuffer / 1000);
    
    return session.expires_at > (now + bufferSeconds);
  }

  /**
   * Obtém métricas de performance
   */
  getMetrics(): typeof this.metrics & { cacheHitRate: number; uptime: number } {
    return {
      ...this.metrics,
      cacheHitRate: this.getCacheHitRate(),
      uptime: Date.now() - this.metrics.lastReset
    };
  }

  /**
   * Reseta métricas
   */
  resetMetrics(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      debounceSkips: 0,
      rateLimitBlocks: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Obtém estatísticas para debugging
   */
  getDebugInfo(): {
    hasCache: boolean;
    cacheAge?: number;
    timeToExpiry?: number;
    hasPending: boolean;
    pendingAge?: number;
    debounceQueues: number;
    rateLimitEntries: number;
    metrics: any;
  } {
    const now = Date.now();
    
    const info: any = {
      hasCache: !!this.cache,
      hasPending: this.hasPendingRequest(),
      debounceQueues: this.debounceMap.size,
      rateLimitEntries: this.rateLimits.size,
      metrics: this.getMetrics()
    };

    if (this.cache) {
      info.cacheAge = Math.round((now - this.cache.timestamp) / 1000);
      info.timeToExpiry = Math.round((this.cache.expiry - now) / 1000);
    }

    if (this.pendingRequest) {
      info.pendingAge = Math.round((now - this.pendingRequest.timestamp) / 1000);
    }

    return info;
  }

  /**
   * Força limpeza de recursos
   */
  cleanup(): void {

    this.clearCache();
    this.rateLimits.clear();
    this.resetMetrics();
  }
}

// Instância singleton otimizada
export const optimizedAuthCache = new AuthCacheManager({
  ttl: 5 * 60 * 1000, // 5 minutos
  debounceTime: 300,  // 300ms
  sessionBuffer: 30 * 1000, // 30 segundos
  pendingTimeout: 10 * 1000, // 10 segundos
  maxRetries: 3
});

// Tipos exportados
export type { AuthCacheConfig, CachedAuthState };