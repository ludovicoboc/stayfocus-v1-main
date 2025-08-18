/**
 * Sistema de Cache Otimizado para Concursos
 * Conforme Etapa 4.1 do todocc.md
 */

import { competitionLogger } from './error-handler';

// =====================================
// TIPOS E INTERFACES
// =====================================

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  totalItems: number;
  hitRatio: number;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
  enableStats: boolean;
  enableLogging: boolean;
}

type CacheKey = string;
type CacheType = 'competitions' | 'subjects' | 'topics' | 'questions' | 'simulations';

// =====================================
// CACHE MANAGER PRINCIPAL
// =====================================

class CacheManager<T = any> {
  private cache: Map<CacheKey, CacheItem<T>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    totalItems: 0,
    hitRatio: 0
  };
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 100,
      cleanupInterval: 2 * 60 * 1000, // 2 minutos
      enableStats: true,
      enableLogging: false,
      ...config
    };

    this.startCleanupTimer();
  }

  /**
   * Adiciona ou atualiza item no cache
   */
  set(key: CacheKey, data: T, ttl?: number): void {
    const now = Date.now();
    const itemTTL = ttl || this.config.defaultTTL;

    // Verificar limite de tamanho
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: itemTTL,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, cacheItem);
    this.updateStats();

    if (this.config.enableLogging) {
      competitionLogger.info(`Cache SET: ${key}`, { ttl: itemTTL });
    }
  }

  /**
   * Recupera item do cache
   */
  get(key: CacheKey): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      this.updateHitRatio();

      if (this.config.enableLogging) {
        competitionLogger.info(`Cache MISS: ${key}`);
      }

      return null;
    }

    // Verificar se expirou
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRatio();

      if (this.config.enableLogging) {
        competitionLogger.info(`Cache EXPIRED: ${key}`);
      }

      return null;
    }

    // Atualizar estatísticas de acesso
    item.accessCount++;
    item.lastAccessed = now;
    this.stats.hits++;
    this.updateHitRatio();

    if (this.config.enableLogging) {
      competitionLogger.info(`Cache HIT: ${key}`);
    }

    return item.data;
  }

  /**
   * Remove item específico do cache
   */
  delete(key: CacheKey): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();

      if (this.config.enableLogging) {
        competitionLogger.info(`Cache DELETE: ${key}`);
      }
    }
    return deleted;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();

    if (this.config.enableLogging) {
      competitionLogger.info('Cache CLEARED');
    }
  }

  /**
   * Limpa cache por padrão de chave
   */
  clearPattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    this.updateStats();

    if (this.config.enableLogging) {
      competitionLogger.info(`Cache PATTERN DELETE: ${pattern}`, { deletedCount });
    }

    return deletedCount;
  }

  /**
   * Remove itens expirados
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    this.updateStats();

    if (this.config.enableLogging && removedCount > 0) {
      competitionLogger.info(`Cache CLEANUP`, { removedItems: removedCount });
    }

    return removedCount;
  }

  /**
   * Estratégia LRU (Least Recently Used) para remoção
   */
  private evictLRU(): void {
    let oldestKey: CacheKey | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);

      if (this.config.enableLogging) {
        competitionLogger.info(`Cache LRU EVICT: ${oldestKey}`);
      }
    }
  }

  /**
   * Atualiza estatísticas do cache
   */
  private updateStats(): void {
    if (this.config.enableStats) {
      this.stats.size = this.cache.size;
      this.stats.totalItems = this.stats.hits + this.stats.misses;
      this.updateHitRatio();
    }
  }

  /**
   * Atualiza taxa de acertos
   */
  private updateHitRatio(): void {
    this.stats.hitRatio = this.stats.totalItems > 0
      ? (this.stats.hits / this.stats.totalItems) * 100
      : 0;
  }

  /**
   * Reseta estatísticas
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      totalItems: 0,
      hitRatio: 0
    };
  }

  /**
   * Inicia timer de limpeza automática
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Para timer de limpeza
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Obtém tamanho atual do cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Verifica se uma chave existe no cache
   */
  has(key: CacheKey): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    // Verificar se não expirou
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// =====================================
// CACHE ESPECÍFICO PARA CONCURSOS
// =====================================

class CompetitionCacheManager {
  private caches: Map<CacheType, CacheManager> = new Map();

  constructor() {
    // Configurações específicas para cada tipo de cache
    this.caches.set('competitions', new CacheManager({
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 50,
      enableLogging: true
    }));

    this.caches.set('subjects', new CacheManager({
      defaultTTL: 10 * 60 * 1000, // 10 minutos
      maxSize: 200,
      enableLogging: false
    }));

    this.caches.set('topics', new CacheManager({
      defaultTTL: 15 * 60 * 1000, // 15 minutos
      maxSize: 500,
      enableLogging: false
    }));

    this.caches.set('questions', new CacheManager({
      defaultTTL: 30 * 60 * 1000, // 30 minutos
      maxSize: 1000,
      enableLogging: false
    }));

    this.caches.set('simulations', new CacheManager({
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 100,
      enableLogging: false
    }));
  }

  /**
   * Gera chave de cache específica para usuário
   */
  private generateKey(type: CacheType, userId: string, identifier: string): CacheKey {
    return `${type}_${userId}_${identifier}`;
  }

  /**
   * Métodos específicos para concursos
   */
  setCompetitions(userId: string, competitions: any[]): void {
    const key = this.generateKey('competitions', userId, 'list');
    this.caches.get('competitions')!.set(key, competitions);
  }

  getCompetitions(userId: string): any[] | null {
    const key = this.generateKey('competitions', userId, 'list');
    return this.caches.get('competitions')!.get(key);
  }

  setCompetition(userId: string, competitionId: string, competition: any): void {
    const key = this.generateKey('competitions', userId, competitionId);
    this.caches.get('competitions')!.set(key, competition);
  }

  getCompetition(userId: string, competitionId: string): any | null {
    const key = this.generateKey('competitions', userId, competitionId);
    return this.caches.get('competitions')!.get(key);
  }

  /**
   * Métodos para disciplinas
   */
  setSubjects(userId: string, competitionId: string, subjects: any[]): void {
    const key = this.generateKey('subjects', userId, competitionId);
    this.caches.get('subjects')!.set(key, subjects);
  }

  getSubjects(userId: string, competitionId: string): any[] | null {
    const key = this.generateKey('subjects', userId, competitionId);
    return this.caches.get('subjects')!.get(key);
  }

  /**
   * Invalidação de cache por usuário
   */
  invalidateUserCache(userId: string): void {
    for (const [type, cache] of this.caches.entries()) {
      cache.clearPattern(`${type}_${userId}_.*`);
    }
    competitionLogger.info(`Cache invalidated for user: ${userId}`);
  }

  /**
   * Invalidação de cache por concurso
   */
  invalidateCompetitionCache(userId: string, competitionId: string): void {
    // Invalidar cache do concurso específico
    this.caches.get('competitions')!.delete(
      this.generateKey('competitions', userId, competitionId)
    );

    // Invalidar cache de disciplinas do concurso
    this.caches.get('subjects')!.delete(
      this.generateKey('subjects', userId, competitionId)
    );

    // Invalidar lista de concursos
    this.caches.get('competitions')!.delete(
      this.generateKey('competitions', userId, 'list')
    );

    competitionLogger.info(`Cache invalidated for competition: ${competitionId}`);
  }

  /**
   * Estatísticas consolidadas
   */
  getAllStats(): Record<CacheType, CacheStats> {
    const stats: Record<string, CacheStats> = {};

    for (const [type, cache] of this.caches.entries()) {
      stats[type] = cache.getStats();
    }

    return stats as Record<CacheType, CacheStats>;
  }

  /**
   * Limpeza geral
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
    competitionLogger.info('All caches cleared');
  }

  /**
   * Cleanup geral
   */
  cleanup(): void {
    for (const cache of this.caches.values()) {
      cache.cleanup();
    }
  }

  /**
   * Destruir todos os caches
   */
  destroy(): void {
    for (const cache of this.caches.values()) {
      cache.destroy();
    }
    this.caches.clear();
  }
}

// =====================================
// INSTÂNCIA GLOBAL E UTILITÁRIOS
// =====================================

// Instância global do cache manager
export const competitionCache = new CompetitionCacheManager();

// Hook para React com cache automático
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; userId?: string } = {}
) {
  const cacheKey = options.userId ? `${options.userId}_${key}` : key;
  const cache = new CacheManager<T>();

  return {
    getData: async (): Promise<T> => {
      // Tentar buscar do cache primeiro
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Se não estiver no cache, buscar e cachear
      const data = await fetcher();
      cache.set(cacheKey, data, options.ttl);
      return data;
    },

    invalidate: () => cache.delete(cacheKey),
    clearAll: () => cache.clear()
  };
}

// Utilitário para performance com cache
export async function withCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cache = new CacheManager<T>();

  const cached = cache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  cache.set(cacheKey, data, ttl);
  return data;
}

// Cleanup automático na destruição da aplicação
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    competitionCache.destroy();
  });
}

export { CacheManager, CompetitionCacheManager };
export type { CacheItem, CacheStats, CacheConfig, CacheType };
