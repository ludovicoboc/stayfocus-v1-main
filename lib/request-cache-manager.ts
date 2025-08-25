interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
  key: string;
  source: 'cache' | 'network' | 'stale';
  requestCount: number;
}

interface RequestOptions {
  ttl?: number;
  mobileTTL?: number;
  staleWhileRevalidate?: boolean;
  timeout?: number;
  retries?: number;
  forceRefresh?: boolean;
  cacheKey?: string;
}

interface PendingRequest<T = any> {
  promise: Promise<T>;
  timestamp: number;
  requestId: string;
  timeoutId?: NodeJS.Timeout;
}

interface RequestMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  backgroundRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastReset: number;
}

// Utility para detectar mobile
const isMobile = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
};

// Utility para detectar conexão lenta
const isSlowConnection = () => {
  if (typeof navigator === 'undefined' || !navigator || !('connection' in navigator)) return false;
  const connection = (navigator as any).connection;
  return connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
};

/**
 * Sistema avançado de cache para requests com:
 * - Cache TTL configurável por tipo de dado
 * - Request deduplication 
 * - Stale-while-revalidate para mobile
 * - Background refresh inteligente
 * - Timeout e retry logic
 * - Métricas de performance
 */
class RequestCacheManager {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, PendingRequest>();
  private backgroundQueue = new Set<string>();
  private metrics: RequestMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    backgroundRequests: 0,
    averageResponseTime: 0,
    errorRate: 0,
    lastReset: Date.now()
  };

  constructor() {
    // Limpeza periódica do cache
    setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000); // 5 minutos
    
    // Limpeza de requests órfãos
    setInterval(() => this.cleanupOrphanedRequests(), 30 * 1000); // 30 segundos
  }

  /**
   * Método principal para obter dados com cache inteligente
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    const config = this.getMobileOptimizedConfig(options);
    const cacheKey = options.cacheKey || key;

    try {
      // 1. Verificar cache local primeiro
      const cached = this.getCachedData<T>(cacheKey, config.ttl!);
      
      if (cached && !options.forceRefresh) {
        this.metrics.cacheHits++;
        
        // Para mobile: stale-while-revalidate mais agressivo
        if (config.staleWhileRevalidate && this.shouldBackgroundRefresh(cached)) {
          this.scheduleBackgroundRefresh(cacheKey, fetcher, config);
        }
        
        this.updateMetrics(startTime);

        return cached.data;
      }

      // 2. Verificar deduplicação de requests
      if (this.pendingRequests.has(cacheKey)) {

        const pending = this.pendingRequests.get(cacheKey)!;
        const result = await pending.promise;
        this.updateMetrics(startTime);
        return result;
      }

      // 3. Executar request com otimizações
      this.metrics.networkRequests++;
      const result = await this.executeRequest(cacheKey, fetcher, config);
      
      // 4. Cachear resultado
      this.setCachedData(cacheKey, result, config.ttl!);
      
      this.updateMetrics(startTime);
      return result;

    } catch (error) {
      this.metrics.errorRate = (this.metrics.errorRate + 1) / this.metrics.totalRequests;
      
      // Fallback para cache stale se disponível
      const staleCache = this.getStaleCache<T>(cacheKey);
      if (staleCache) {

        return staleCache.data;
      }
      
      throw error;
    }
  }

  /**
   * Configurações otimizadas para mobile
   */
  private getMobileOptimizedConfig(options: RequestOptions) {
    const mobile = isMobile();
    const slowConnection = isSlowConnection();
    
    return {
      ttl: mobile ? (options.mobileTTL || 10 * 60 * 1000) : (options.ttl || 5 * 60 * 1000), // 10min mobile, 5min desktop
      staleWhileRevalidate: mobile ? true : (options.staleWhileRevalidate ?? false),
      timeout: mobile ? 8000 : (options.timeout || 5000), // 8s mobile, 5s desktop
      retries: slowConnection ? 3 : (options.retries || 2),
      ...options
    };
  }

  /**
   * Executa request com timeout e retry
   */
  private async executeRequest<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: Required<Pick<RequestOptions, 'timeout' | 'retries'>> & RequestOptions
  ): Promise<T> {
    // Criar promise com timeout
    const requestPromise = this.createTimeoutPromise(fetcher(), config.timeout);
    
    // Registrar como pending
    const pendingRequest: PendingRequest<T> = {
      promise: requestPromise,
      timestamp: Date.now(),
      requestId: `${key}-${Date.now()}`
    };
    
    this.pendingRequests.set(key, pendingRequest as PendingRequest);

    try {
      let lastError: Error | null = null;
      
      // Retry logic
      for (let attempt = 0; attempt <= config.retries!; attempt++) {
        try {
          const result = await requestPromise;

          return result;
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < config.retries!) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff

            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      throw lastError || new Error('Request failed after retries');
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Cria promise com timeout
   */
  private createTimeoutPromise<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
      })
    ]);
  }

  /**
   * Obtém dados do cache se válidos
   */
  private getCachedData<T>(key: string, ttl: number): CacheEntry<T> | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiry) {
      return null; // Cache expirado
    }

    return { ...cached, source: 'cache' };
  }

  /**
   * Obtém cache stale para fallback
   */
  private getStaleCache<T>(key: string): CacheEntry<T> | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Aceitar cache até 30 minutos após expiração para fallback
    const staleLimit = cached.expiry + (30 * 60 * 1000);
    const now = Date.now();
    
    if (now <= staleLimit) {
      return { ...cached, source: 'stale' };
    }

    return null;
  }

  /**
   * Define dados no cache
   */
  private setCachedData<T>(key: string, data: T, ttl: number): void {
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiry: now + ttl,
      key,
      source: 'network',
      requestCount: (this.cache.get(key)?.requestCount || 0) + 1
    };

    this.cache.set(key, entry);

  }

  /**
   * Verifica se deve fazer background refresh
   */
  private shouldBackgroundRefresh(cached: CacheEntry): boolean {
    const age = Date.now() - cached.timestamp;
    const halfLife = (cached.expiry - cached.timestamp) / 2;
    
    // Refresh em background quando cache passa da metade da vida útil
    return age > halfLife;
  }

  /**
   * Agenda background refresh
   */
  private scheduleBackgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: RequestOptions
  ): void {
    if (this.backgroundQueue.has(key)) return;
    
    this.backgroundQueue.add(key);
    this.metrics.backgroundRequests++;

    // Executar em próximo tick para não bloquear
    setTimeout(async () => {
      try {

        const result = await fetcher();
        this.setCachedData(key, result, config.ttl || 5 * 60 * 1000);
      } catch (error) {
        console.warn("⚠️ [REQUEST-CACHE] Background refresh falhou", { 
          key, 
          error: error instanceof Error ? error.message : 'unknown' 
        });
      } finally {
        this.backgroundQueue.delete(key);
      }
    }, 100);
  }

  /**
   * Limpeza periódica de cache expirado
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      // Remover entries expirados há mais de 30 minutos
      if (now > entry.expiry + (30 * 60 * 1000)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {

    }
  }

  /**
   * Limpeza de requests órfãos
   */
  private cleanupOrphanedRequests(): void {
    const now = Date.now();
    const timeout = 30 * 1000; // 30 segundos
    let cleanedCount = 0;

    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > timeout) {
        this.pendingRequests.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {

    }
  }

  /**
   * Atualiza métricas de performance
   */
  private updateMetrics(startTime: number): void {
    const duration = Date.now() - startTime;
    const currentAvg = this.metrics.averageResponseTime;
    const totalRequests = this.metrics.totalRequests;
    
    // Média móvel simples
    this.metrics.averageResponseTime = ((currentAvg * (totalRequests - 1)) + duration) / totalRequests;
  }

  /**
   * Invalida cache por padrão de key
   */
  invalidate(keyPattern: string | RegExp): number {
    let invalidatedCount = 0;
    
    for (const [key] of this.cache.entries()) {
      const shouldInvalidate = typeof keyPattern === 'string' 
        ? key.includes(keyPattern)
        : keyPattern.test(key);
        
      if (shouldInvalidate) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    return invalidatedCount;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.pendingRequests.clear();
    this.backgroundQueue.clear();

  }

  /**
   * Obtém métricas de performance
   */
  getMetrics(): RequestMetrics & { 
    cacheSize: number; 
    hitRate: number; 
    pendingRequests: number;
    backgroundQueue: number;
  } {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      pendingRequests: this.pendingRequests.size,
      backgroundQueue: this.backgroundQueue.size
    };
  }

  /**
   * Reset das métricas
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
      backgroundRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastReset: Date.now()
    };

  }

  /**
   * Debug info
   */
  getDebugInfo() {
    return {
      cacheEntries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Math.round((Date.now() - entry.timestamp) / 1000),
        ttl: Math.round((entry.expiry - Date.now()) / 1000),
        requestCount: entry.requestCount,
        source: entry.source
      })),
      pendingRequests: Array.from(this.pendingRequests.keys()),
      backgroundQueue: Array.from(this.backgroundQueue),
      metrics: this.getMetrics()
    };
  }
}

// Singleton global
export const globalRequestCache = new RequestCacheManager();

// Utility functions for direct use
export function createRequestCache(): RequestCacheManager {
  return new RequestCacheManager();
}

// Export class for type checking
export { RequestCacheManager };