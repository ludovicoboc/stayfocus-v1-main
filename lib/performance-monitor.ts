/**
 * Sistema de monitoramento de performance para StayFocus
 * Baseado nos problemas identificados na auditoria mobile
 */

interface PerformanceMetrics {
  // Métricas de carregamento
  loadTime: number;
  authChecks: number;
  apiCalls: number;
  cacheHitRate: number;
  errorRate: number;
  
  // Métricas específicas por módulo
  moduleLoadTimes: Record<string, number>;
  authVerifications: Record<string, number>;
  
  // Web Vitals
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

interface AlertThresholds {
  maxLoadTime: number;      // 1.5s conforme meta da auditoria
  maxAuthChecks: number;    // 3 verificações por navegação
  minCacheHitRate: number;  // 70% conforme meta
  maxErrorRate: number;     // 5% conforme meta
}

interface PerformanceAlert {
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  metric: string;
  value: number;
  threshold: number;
  module?: string;
  timestamp: number;
  message: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    authChecks: 0,
    apiCalls: 0,
    cacheHitRate: 0,
    errorRate: 0,
    moduleLoadTimes: {},
    authVerifications: {}
  };

  private alerts: PerformanceAlert[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private startTimes: Map<string, number> = new Map();

  private thresholds: AlertThresholds = {
    maxLoadTime: 1500,      // 1.5 segundos
    maxAuthChecks: 3,       // 3 verificações por navegação
    minCacheHitRate: 70,    // 70% de cache hits
    maxErrorRate: 5         // 5% de taxa de erro
  };

  constructor() {
    this.initializeWebVitals();
    this.setupPerformanceObservers();
  }

  /**
   * Inicializa monitoramento de Web Vitals
   */
  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return;

    try {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;

          }
        }
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;

      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;

        }
      }).observe({ entryTypes: ['first-input'] });

    } catch (error) {
      console.warn('⚠️ [PERF-MONITOR] Erro ao inicializar Web Vitals:', error);
    }
  }

  /**
   * Configura observadores de performance
   */
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // Monitorar navegação
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navigationEntry = entry as PerformanceNavigationTiming;
          const loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
          this.trackLoadTime('navigation', loadTime);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navigationObserver);

      // Monitorar recursos
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.name.includes('/api/')) {
            this.trackApiCall(resourceEntry.name, resourceEntry.duration);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);

    } catch (error) {
      console.warn('⚠️ [PERF-MONITOR] Erro ao configurar observadores:', error);
    }
  }

  /**
   * Inicia medição de tempo para uma operação
   */
  startMeasurement(key: string): void {
    this.startTimes.set(key, Date.now());

  }

  /**
   * Finaliza medição de tempo para uma operação
   */
  endMeasurement(key: string, module?: string): number {
    const startTime = this.startTimes.get(key);
    if (!startTime) {
      console.warn(`⚠️ [PERF-MONITOR] Medição não iniciada para: ${key}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(key);

    if (module) {
      this.trackModuleLoadTime(module, duration);
    }

    this.checkThresholds(key, duration, module);
    return duration;
  }

  /**
   * Rastreia tempo de carregamento
   */
  trackLoadTime(module: string, time: number): void {
    this.metrics.loadTime = (this.metrics.loadTime + time) / 2; // Média móvel
    this.metrics.moduleLoadTimes[module] = time;

    this.checkThresholds('loadTime', time, module);
  }

  /**
   * Rastreia tempo de carregamento de módulo específico
   */
  trackModuleLoadTime(module: string, time: number): void {
    this.metrics.moduleLoadTimes[module] = time;

    // Alerta específico para módulo Concursos (crítico na auditoria)
    if (module === 'Concursos' && time > 1500) {
      this.addAlert('CRITICAL', 'moduleLoadTime', time, 1500, module, 
        `Módulo Concursos excedeu meta de 1.5s: ${(time/1000).toFixed(2)}s`);
    }
  }

  /**
   * Rastreia verificações de autenticação
   */
  trackAuthCheck(module: string): void {
    this.metrics.authChecks++;
    this.metrics.authVerifications[module] = (this.metrics.authVerifications[module] || 0) + 1;

    // Alerta para múltiplas verificações (problema da auditoria)
    if (this.metrics.authVerifications[module] > this.thresholds.maxAuthChecks) {
      this.addAlert('WARNING', 'authChecks', this.metrics.authVerifications[module], 
        this.thresholds.maxAuthChecks, module,
        `Excesso de verificações de auth em ${module}: ${this.metrics.authVerifications[module]}`);
    }
  }

  /**
   * Rastreia chamadas de API
   */
  trackApiCall(endpoint: string, duration: number): void {
    this.metrics.apiCalls++;

    // Alerta para APIs lentas
    if (duration > 2000) {
      this.addAlert('WARNING', 'apiCall', duration, 2000, endpoint,
        `API call lenta: ${endpoint} levou ${(duration/1000).toFixed(2)}s`);
    }
  }

  /**
   * Atualiza taxa de cache hits
   */
  updateCacheHitRate(hits: number, total: number): void {
    this.metrics.cacheHitRate = total > 0 ? (hits / total) * 100 : 0;

    if (this.metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      this.addAlert('WARNING', 'cacheHitRate', this.metrics.cacheHitRate, 
        this.thresholds.minCacheHitRate, undefined,
        `Taxa de cache abaixo da meta: ${this.metrics.cacheHitRate.toFixed(1)}%`);
    }
  }

  /**
   * Rastreia erro
   */
  trackError(error: string, module?: string): void {
    const totalRequests = this.metrics.apiCalls + this.metrics.authChecks;
    this.metrics.errorRate = totalRequests > 0 ? (1 / totalRequests) * 100 : 0;
    
    console.error(`❌ [PERF-MONITOR] Erro${module ? ` em ${module}` : ''}: ${error}`);
    
    if (this.metrics.errorRate > this.thresholds.maxErrorRate) {
      this.addAlert('CRITICAL', 'errorRate', this.metrics.errorRate, 
        this.thresholds.maxErrorRate, module,
        `Taxa de erro crítica: ${this.metrics.errorRate.toFixed(1)}%`);
    }
  }

  /**
   * Verifica thresholds e gera alertas
   */
  private checkThresholds(metric: string, value: number, module?: string): void {
    switch (metric) {
      case 'loadTime':
        if (value > this.thresholds.maxLoadTime) {
          this.addAlert('WARNING', metric, value, this.thresholds.maxLoadTime, module,
            `Tempo de carregamento alto${module ? ` em ${module}` : ''}: ${(value/1000).toFixed(2)}s`);
        }
        break;
    }
  }

  /**
   * Adiciona alerta
   */
  private addAlert(
    type: PerformanceAlert['type'], 
    metric: string, 
    value: number, 
    threshold: number, 
    module: string | undefined, 
    message: string
  ): void {
    const alert: PerformanceAlert = {
      type,
      metric,
      value,
      threshold,
      module,
      timestamp: Date.now(),
      message
    };

    this.alerts.push(alert);
    
    // Manter apenas os últimos 50 alertas
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    console.warn(`🚨 [PERF-MONITOR] ${type}: ${message}`);
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): PerformanceMetrics & {
    webVitalsScore: number;
    overallScore: number;
  } {
    const webVitalsScore = this.calculateWebVitalsScore();
    const overallScore = this.calculateOverallScore();

    return {
      ...this.metrics,
      webVitalsScore,
      overallScore
    };
  }

  /**
   * Calcula score de Web Vitals
   */
  private calculateWebVitalsScore(): number {
    let score = 100;
    
    // FCP - Good: < 1.8s, Needs improvement: 1.8s-3s, Poor: > 3s
    if (this.metrics.firstContentfulPaint) {
      if (this.metrics.firstContentfulPaint > 3000) score -= 30;
      else if (this.metrics.firstContentfulPaint > 1800) score -= 15;
    }

    // LCP - Good: < 2.5s, Needs improvement: 2.5s-4s, Poor: > 4s
    if (this.metrics.largestContentfulPaint) {
      if (this.metrics.largestContentfulPaint > 4000) score -= 30;
      else if (this.metrics.largestContentfulPaint > 2500) score -= 15;
    }

    // FID - Good: < 100ms, Needs improvement: 100ms-300ms, Poor: > 300ms
    if (this.metrics.firstInputDelay) {
      if (this.metrics.firstInputDelay > 300) score -= 20;
      else if (this.metrics.firstInputDelay > 100) score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Calcula score geral baseado nas metas da auditoria
   */
  private calculateOverallScore(): number {
    let score = 100;

    // Penalizar baseado nas metas da auditoria
    if (this.metrics.loadTime > 1500) score -= 20;
    if (this.metrics.authChecks > 3) score -= 25;
    if (this.metrics.cacheHitRate < 70) score -= 15;
    if (this.metrics.errorRate > 5) score -= 30;

    // Verificar módulo Concursos especificamente
    if (this.metrics.moduleLoadTimes['Concursos'] > 1500) score -= 10;

    return Math.max(0, score);
  }

  /**
   * Obtém alertas recentes
   */
  getRecentAlerts(limit: number = 10): PerformanceAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Gera relatório de performance
   */
  generateReport(): {
    summary: string;
    metrics: PerformanceMetrics;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const alerts = this.getRecentAlerts();
    
    const recommendations: string[] = [];
    
    // Recomendações baseadas na auditoria
    if (metrics.authChecks > 8) {
      recommendations.push('🔐 Implementar cache mais agressivo para autenticação');
    }
    
    if (metrics.moduleLoadTimes['Concursos'] > 3000) {
      recommendations.push('🎯 Otimizar carregamento crítico do módulo Concursos');
    }
    
    if (metrics.cacheHitRate < 70) {
      recommendations.push('📈 Melhorar estratégia de cache - meta 70%+');
    }
    
    if (metrics.apiCalls > 8) {
      recommendations.push('🌐 Reduzir requisições redundantes de API');
    }

    const summary = `Performance Score: ${metrics.overallScore}/100 | ` +
                   `Load Time: ${metrics.loadTime.toFixed(0)}ms | ` +
                   `Auth Checks: ${metrics.authChecks} | ` +
                   `Cache Hit: ${metrics.cacheHitRate.toFixed(1)}%`;

    return {
      summary,
      metrics,
      alerts,
      recommendations
    };
  }

  /**
   * Reseta métricas
   */
  reset(): void {
    this.metrics = {
      loadTime: 0,
      authChecks: 0,
      apiCalls: 0,
      cacheHitRate: 0,
      errorRate: 0,
      moduleLoadTimes: {},
      authVerifications: {}
    };
    this.alerts = [];
    this.startTimes.clear();

  }

  /**
   * Cleanup de recursos
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.reset();

  }
}

// Instância singleton
export const performanceMonitor = new PerformanceMonitor();

// Hook para usar o monitor em componentes React
export function usePerformanceMonitor() {
  return {
    startMeasurement: (key: string) => performanceMonitor.startMeasurement(key),
    endMeasurement: (key: string, module?: string) => performanceMonitor.endMeasurement(key, module),
    trackAuthCheck: (module: string) => performanceMonitor.trackAuthCheck(module),
    trackError: (error: string, module?: string) => performanceMonitor.trackError(error, module),
    getMetrics: () => performanceMonitor.getMetrics(),
    getReport: () => performanceMonitor.generateReport(),
    getAlerts: (limit?: number) => performanceMonitor.getRecentAlerts(limit)
  };
}

export default performanceMonitor;