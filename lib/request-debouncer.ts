/**
 * Sistema de debouncing centralizado para requisições de API
 * Evita múltiplas chamadas simultâneas e melhora a performance
 */

interface DebounceConfig {
  delay: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): Promise<ReturnType<T>>;
  cancel(): void;
  flush(): Promise<ReturnType<T> | undefined>;
  pending(): boolean;
}

interface PendingCall {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  args: any[];
  timestamp: number;
}

/**
 * Debouncer avançado com suporte a múltiplas chamadas pendentes
 */
export class RequestDebouncer {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private pendingCalls: Map<string, PendingCall[]> = new Map();
  private lastResults: Map<string, any> = new Map();
  
  /**
   * Cria função debounced para requisições de API
   */
  debounce<T extends (...args: any[]) => Promise<any>>(
    key: string,
    fn: T,
    config: DebounceConfig
  ): DebouncedFunction<T> {
    const { delay, maxWait, leading = false, trailing = true } = config;

    const debouncedFn = (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        const now = Date.now();
        
        // Adicionar à lista de chamadas pendentes
        if (!this.pendingCalls.has(key)) {
          this.pendingCalls.set(key, []);
        }
        
        const pendingList = this.pendingCalls.get(key)!;
        pendingList.push({ resolve, reject, args, timestamp: now });

        // Verificar se deve executar imediatamente (leading edge)
        if (leading && pendingList.length === 1) {
          this.executeFunction(key, fn, args, resolve, reject);
          return;
        }

        // Limpar timer anterior se existir
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Verificar maxWait
        if (maxWait && pendingList.length > 0) {
          const oldestCall = pendingList[0];
          if (now - oldestCall.timestamp >= maxWait) {

            this.flushPendingCalls(key, fn);
            return;
          }
        }

        // Configurar novo timer
        const timer = setTimeout(() => {
          if (trailing) {
            this.flushPendingCalls(key, fn);
          } else {
            this.rejectPendingCalls(key, new Error("Trailing execution disabled"));
          }
        }, delay);

        this.timers.set(key, timer);
      });
    };

    // Método para cancelar
    debouncedFn.cancel = () => {
      this.cancel(key);
    };

    // Método para executar imediatamente
    debouncedFn.flush = async (): Promise<ReturnType<T> | undefined> => {
      return this.flush(key, fn);
    };

    // Método para verificar se há chamadas pendentes
    debouncedFn.pending = (): boolean => {
      return this.pending(key);
    };

    return debouncedFn as DebouncedFunction<T>;
  }

  /**
   * Executa a função e gerencia o resultado
   */
  private async executeFunction<T>(
    key: string,
    fn: (...args: any[]) => Promise<T>,
    args: any[],
    resolve: (value: T) => void,
    reject: (error: any) => void
  ): Promise<void> {
    try {

      const result = await fn(...args);
      this.lastResults.set(key, result);
      resolve(result);
    } catch (error) {
      console.error(`❌ [DEBOUNCER] Erro na execução de ${key}:`, error);
      reject(error);
    }
  }

  /**
   * Executa todas as chamadas pendentes agrupadas
   */
  private async flushPendingCalls<T>(
    key: string,
    fn: (...args: any[]) => Promise<T>
  ): Promise<void> {
    const pendingList = this.pendingCalls.get(key);
    if (!pendingList || pendingList.length === 0) return;

    // Usar argumentos da chamada mais recente
    const latestCall = pendingList[pendingList.length - 1];
    
    try {
      const result = await fn(...latestCall.args);
      this.lastResults.set(key, result);
      
      // Resolver todas as promises pendentes com o mesmo resultado
      pendingList.forEach(call => {
        try {
          call.resolve(result);
        } catch (error) {
          console.error(`❌ [DEBOUNCER] Erro ao resolver chamada para ${key}:`, error);
        }
      });
      
    } catch (error) {
      console.error(`❌ [DEBOUNCER] Erro na execução agrupada de ${key}:`, error);
      
      // Rejeitar todas as promises pendentes
      pendingList.forEach(call => {
        try {
          call.reject(error);
        } catch (rejError) {
          console.error(`❌ [DEBOUNCER] Erro ao rejeitar chamada para ${key}:`, rejError);
        }
      });
    } finally {
      // Limpar estado
      this.pendingCalls.delete(key);
      this.timers.delete(key);
    }
  }

  /**
   * Rejeita todas as chamadas pendentes
   */
  private rejectPendingCalls(key: string, error: Error): void {
    const pendingList = this.pendingCalls.get(key);
    if (!pendingList) return;

    pendingList.forEach(call => {
      try {
        call.reject(error);
      } catch (rejError) {
        console.error(`❌ [DEBOUNCER] Erro ao rejeitar chamada para ${key}:`, rejError);
      }
    });

    this.pendingCalls.delete(key);
    this.timers.delete(key);
  }

  /**
   * Cancela debounce para uma chave específica
   */
  cancel(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }

    this.rejectPendingCalls(key, new Error("Debounce cancelled"));
  }

  /**
   * Executa imediatamente chamadas pendentes
   */
  async flush<T>(key: string, fn: (...args: any[]) => Promise<T>): Promise<T | undefined> {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }

    const pendingList = this.pendingCalls.get(key);
    if (!pendingList || pendingList.length === 0) {
      return this.lastResults.get(key);
    }

    await this.flushPendingCalls(key, fn);
    return this.lastResults.get(key);
  }

  /**
   * Verifica se há chamadas pendentes
   */
  pending(key: string): boolean {
    const pendingList = this.pendingCalls.get(key);
    return !!(pendingList && pendingList.length > 0);
  }

  /**
   * Limpa todos os debouncers
   */
  cancelAll(): void {
    this.timers.forEach((timer, key) => {
      clearTimeout(timer);
      this.rejectPendingCalls(key, new Error("All debouncers cancelled"));
    });
    
    this.timers.clear();
    this.pendingCalls.clear();
    this.lastResults.clear();
  }

  /**
   * Obtém estatísticas do debouncer
   */
  getStats(): {
    activeTimers: number;
    pendingCalls: number;
    cachedResults: number;
    details: Array<{
      key: string;
      pendingCount: number;
      hasTimer: boolean;
      hasResult: boolean;
    }>;
  } {
    const details: Array<{
      key: string;
      pendingCount: number;
      hasTimer: boolean;
      hasResult: boolean;
    }> = [];

    const allKeys = new Set([
      ...this.timers.keys(),
      ...this.pendingCalls.keys(),
      ...this.lastResults.keys()
    ]);

    allKeys.forEach(key => {
      const pendingList = this.pendingCalls.get(key);
      details.push({
        key,
        pendingCount: pendingList?.length || 0,
        hasTimer: this.timers.has(key),
        hasResult: this.lastResults.has(key)
      });
    });

    return {
      activeTimers: this.timers.size,
      pendingCalls: Array.from(this.pendingCalls.values()).reduce((sum, list) => sum + list.length, 0),
      cachedResults: this.lastResults.size,
      details
    };
  }
}

/**
 * Configurações pré-definidas para diferentes tipos de operações
 */
export const DEBOUNCE_CONFIGS = {
  // Verificações de autenticação - agressivo para evitar múltiplas chamadas
  AUTH_CHECK: {
    delay: 300,
    maxWait: 1000,
    leading: false,
    trailing: true
  },
  
  // Chamadas de API gerais - balanceado
  API_CALL: {
    delay: 500,
    maxWait: 2000,
    leading: false,
    trailing: true
  },
  
  // Interações do usuário - responsivo
  USER_INTERACTION: {
    delay: 100,
    maxWait: 300,
    leading: true,
    trailing: false
  },
  
  // Busca de dados pesados - conservador
  HEAVY_SEARCH: {
    delay: 800,
    maxWait: 3000,
    leading: false,
    trailing: true
  }
} as const;

// Instância singleton
export const requestDebouncer = new RequestDebouncer();

/**
 * Helper function para criar debouncers rápidos
 */
export function createDebouncedFunction<T extends (...args: any[]) => Promise<any>>(
  key: string,
  fn: T,
  configType: keyof typeof DEBOUNCE_CONFIGS = 'API_CALL'
): DebouncedFunction<T> {
  return requestDebouncer.debounce(key, fn, DEBOUNCE_CONFIGS[configType]);
}

/**
 * Helper para verificações de autenticação debounced
 */
export function createDebouncedAuthCheck<T extends (...args: any[]) => Promise<any>>(
  key: string,
  fn: T
): DebouncedFunction<T> {
  return requestDebouncer.debounce(key, fn, DEBOUNCE_CONFIGS.AUTH_CHECK);
}

// Tipos exportados
export type { DebounceConfig, DebouncedFunction };