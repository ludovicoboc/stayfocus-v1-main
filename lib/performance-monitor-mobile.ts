interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  inp?: number; // Interaction to Next Paint

  // Custom metrics
  authTime?: number;
  requestCount?: number;
  cacheHitRate?: number;
  errorCount?: number;
  
  // Mobile specific
  isMobile?: boolean;
  connectionType?: string;
  deviceMemory?: number;
  
  // Page metrics
  pageLoadTime?: number;
  domContentLoaded?: number;
  
  // User session
  sessionId?: string;
  userId?: string;
  timestamp?: number;
}

interface AlertConfig {
  lcp: number;
  fid: number;
  cls: number;
  cacheHitRate: number;
  errorRate: number;
}

// Configurações de alerta otimizadas para mobile
const MOBILE_ALERT_THRESHOLDS: AlertConfig = {
  lcp: 4000, // 4s para mobile (mais permissivo)
  fid: 300,  // 300ms
  cls: 0.25, // 0.25 para mobile
  cacheHitRate: 60, // 60% mínimo para mobile
  errorRate: 5 // 5% máximo
};

const DESKTOP_ALERT_THRESHOLDS: AlertConfig = {
  lcp: 2500, // 2.5s para desktop
  fid: 100,  // 100ms
  cls: 0.1,  // 0.1 para desktop
  cacheHitRate: 80, // 80% mínimo para desktop
  errorRate: 2 // 2% máximo
};

// Utility para detectar mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
};

// Utility para obter informações de conexão
const getConnectionInfo = () => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return { type: 'unknown', effectiveType: 'unknown' };
  }
  
  const connection = (navigator as any).connection;
  return {
    type: connection.type || 'unknown',
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0
  };
};

/**
 * Monitor de performance otimizado para mobile
 * Coleta métricas de Web Vitals e métricas customizadas
 */
export class MobilePerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private alerts: Array<{ type: string; value: number; threshold: number; timestamp: number }> = [];
  private sessionId: string;
  private startTime: number;
  private observer?: PerformanceObserver;
  private metricsBuffer: PerformanceMetrics[] = [];
  private reportingInterval?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.metrics.sessionId = this.sessionId;
    this.metrics.timestamp = this.startTime;
    this.metrics.isMobile = isMobile();
    
    this.initializeMonitoring();
    this.setupPeriodicReporting();
  }

  /**
   * Inicializa monitoramento de Web Vitals
   */
  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // 1. Core Web Vitals via Performance Observer
    this.setupWebVitalsMonitoring();
    
    // 2. Network Information
    this.collectNetworkInfo();
    
    // 3. Device Information
    this.collectDeviceInfo();
    
    // 4. Navigation Timing
    this.collectNavigationTiming();

  }

  /**
   * Configura monitoramento de Web Vitals
   */
  private setupWebVitalsMonitoring() {
    if (!window.PerformanceObserver) return;

    // LCP - Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lcp = entries[entries.length - 1];
      this.metrics.lcp = lcp.startTime;
      this.checkAlert('lcp', lcp.startTime);
    });

    // FID - First Input Delay
    this.observeMetric('first-input', (entries) => {
      const fid = entries[0];
      this.metrics.fid = fid.processingStart - fid.startTime;
      this.checkAlert('fid', this.metrics.fid);
    });

    // CLS - Cumulative Layout Shift
    this.observeMetric('layout-shift', (entries) => {
      const cls = entries.reduce((sum, entry) => {
        if (!entry.hadRecentInput) {
          return sum + entry.value;
        }
        return sum;
      }, 0);
      this.metrics.cls = cls;
      this.checkAlert('cls', cls);
    });

    // Navigation
    this.observeMetric('navigation', (entries) => {
      const nav = entries[0] as PerformanceNavigationTiming;
      this.metrics.fcp = nav.responseStart - nav.fetchStart;
      this.metrics.ttfb = nav.responseStart - nav.requestStart;
      this.metrics.domContentLoaded = nav.domContentLoadedEventEnd - nav.fetchStart;
      this.metrics.pageLoadTime = nav.loadEventEnd - nav.fetchStart;
    });
  }

  /**
   * Observer genérico para métricas
   */
  private observeMetric(type: string, callback: (entries: any[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`⚠️ [PERFORMANCE-MONITOR] Erro ao observar ${type}:`, error);
    }
  }

  /**
   * Coleta informações de rede
   */
  private collectNetworkInfo() {
    const connection = getConnectionInfo();
    this.metrics.connectionType = connection.effectiveType;
    
    // Para mobile: alertar sobre conexões lentas
    if (this.metrics.isMobile && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      this.addAlert('connection', 0, 1, 'Conexão lenta detectada');
    }
  }

  /**
   * Coleta informações do dispositivo
   */
  private collectDeviceInfo() {
    if (typeof navigator === 'undefined') return;
    
    // Device Memory (se disponível)
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory) {
      this.metrics.deviceMemory = deviceMemory;
      
      // Para mobile: alertar sobre memória baixa
      if (this.metrics.isMobile && deviceMemory < 2) {
        this.addAlert('memory', deviceMemory, 2, 'Memória baixa detectada');
      }
    }
  }

  /**
   * Coleta Navigation Timing
   */
  private collectNavigationTiming() {
    if (typeof window === 'undefined' || !window.performance?.getEntriesByType) return;
    
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    }
  }

  /**
   * Verifica se métrica excede limite e cria alerta
   */
  private checkAlert(metric: keyof AlertConfig, value: number) {
    const thresholds = this.metrics.isMobile ? MOBILE_ALERT_THRESHOLDS : DESKTOP_ALERT_THRESHOLDS;
    const threshold = thresholds[metric];
    
    if (value > threshold) {
      this.addAlert(metric, value, threshold);
    }
  }

  /**
   * Adiciona alerta
   */
  private addAlert(type: string, value: number, threshold: number, message?: string) {
    const alert = {
      type,
      value,
      threshold,
      timestamp: Date.now(),
      message
    };
    
    this.alerts.push(alert);
    
    console.warn(`⚠️ [PERFORMANCE-ALERT] ${type.toUpperCase()}`, {
      value: Math.round(value),
      threshold,
      message,
      isMobile: this.metrics.isMobile
    });
  }

  /**
   * Atualiza métricas customizadas
   */
  updateCustomMetrics(updates: Partial<PerformanceMetrics>) {
    Object.assign(this.metrics, updates);
    
    // Verificar alertas para métricas customizadas
    if (updates.cacheHitRate !== undefined) {
      const threshold = this.metrics.isMobile ? MOBILE_ALERT_THRESHOLDS.cacheHitRate : DESKTOP_ALERT_THRESHOLDS.cacheHitRate;
      if (updates.cacheHitRate < threshold) {
        this.addAlert('cacheHitRate', updates.cacheHitRate, threshold);
      }
    }
  }

  /**
   * Registra tempo de autenticação
   */
  recordAuthTime(authTime: number) {
    this.metrics.authTime = authTime;
    
    // Para mobile: alertar se auth demora mais de 3s
    const authThreshold = this.metrics.isMobile ? 3000 : 2000;
    if (authTime > authThreshold) {
      this.addAlert('authTime', authTime, authThreshold);
    }
  }

  /**
   * Registra erro
   */
  recordError(error: Error | string) {
    this.metrics.errorCount = (this.metrics.errorCount || 0) + 1;
    
    const errorRate = (this.metrics.errorCount / (this.metrics.requestCount || 1)) * 100;
    const threshold = this.metrics.isMobile ? MOBILE_ALERT_THRESHOLDS.errorRate : DESKTOP_ALERT_THRESHOLDS.errorRate;
    
    if (errorRate > threshold) {
      this.addAlert('errorRate', errorRate, threshold);
    }
  }

  /**
   * Registra request
   */
  recordRequest(fromCache: boolean = false) {
    this.metrics.requestCount = (this.metrics.requestCount || 0) + 1;
    
    if (fromCache) {
      const hits = Math.round((this.metrics.cacheHitRate || 0) * (this.metrics.requestCount - 1) / 100) + 1;
      this.metrics.cacheHitRate = (hits / this.metrics.requestCount) * 100;
    } else {
      const hits = Math.round((this.metrics.cacheHitRate || 0) * (this.metrics.requestCount - 1) / 100);
      this.metrics.cacheHitRate = (hits / this.metrics.requestCount) * 100;
    }
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtém alertas
   */
  getAlerts() {
    return [...this.alerts];
  }

  /**
   * Obtém score de performance
   */
  getPerformanceScore(): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F' } {
    const thresholds = this.metrics.isMobile ? MOBILE_ALERT_THRESHOLDS : DESKTOP_ALERT_THRESHOLDS;
    let score = 100;
    
    // LCP penalty
    if (this.metrics.lcp) {
      if (this.metrics.lcp > thresholds.lcp) score -= 25;
      else if (this.metrics.lcp > thresholds.lcp * 0.75) score -= 10;
    }
    
    // FID penalty
    if (this.metrics.fid) {
      if (this.metrics.fid > thresholds.fid) score -= 20;
      else if (this.metrics.fid > thresholds.fid * 0.75) score -= 8;
    }
    
    // CLS penalty
    if (this.metrics.cls) {
      if (this.metrics.cls > thresholds.cls) score -= 15;
      else if (this.metrics.cls > thresholds.cls * 0.75) score -= 6;
    }
    
    // Cache hit rate penalty
    if (this.metrics.cacheHitRate) {
      if (this.metrics.cacheHitRate < thresholds.cacheHitRate) score -= 20;
      else if (this.metrics.cacheHitRate < thresholds.cacheHitRate * 1.25) score -= 8;
    }
    
    // Error rate penalty
    const errorRate = (this.metrics.errorCount || 0) / (this.metrics.requestCount || 1) * 100;
    if (errorRate > thresholds.errorRate) score -= 20;
    
    score = Math.max(0, Math.min(100, score));
    
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';
    
    return { score, grade };
  }

  /**
   * Setup de relatórios periódicos
   */
  private setupPeriodicReporting() {
    // Para mobile: relatórios a cada 2 minutos, desktop a cada 1 minuto
    const interval = this.metrics.isMobile ? 120000 : 60000;
    
    this.reportingInterval = setInterval(() => {
      this.reportMetrics();
    }, interval);
  }

  /**
   * Envia métricas (placeholder para integração futura)
   */
  private reportMetrics() {
    const report = {
      ...this.getMetrics(),
      alerts: this.alerts.slice(-10), // Últimos 10 alertas
      score: this.getPerformanceScore(),
      sessionDuration: Date.now() - this.startTime
    };
    
    // Buffer para envio posterior
    this.metricsBuffer.push(report);
    
    // Manter apenas últimos 50 relatórios
    if (this.metricsBuffer.length > 50) {
      this.metricsBuffer = this.metricsBuffer.slice(-50);
    }

  }

  /**
   * Gera ID único para sessão
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpa recursos
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }

  }

  /**
   * Export de dados para debug
   */
  exportData() {
    return {
      metrics: this.getMetrics(),
      alerts: this.getAlerts(),
      buffer: this.metricsBuffer,
      score: this.getPerformanceScore(),
      sessionDuration: Date.now() - this.startTime
    };
  }
}

// Singleton global
let globalPerformanceMonitor: MobilePerformanceMonitor | null = null;

/**
 * Obtém instância global do monitor
 */
export function getPerformanceMonitor(): MobilePerformanceMonitor {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new MobilePerformanceMonitor();
  }
  return globalPerformanceMonitor;
}

/**
 * Obtém métricas rápidas
 */
export function getQuickMetrics() {
  return getPerformanceMonitor().getMetrics();
}

/**
 * Obtém score de performance
 */
export function getPerformanceScore() {
  return getPerformanceMonitor().getPerformanceScore();
}

// Export para React hook
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor();
  
  return {
    metrics: monitor.getMetrics(),
    alerts: monitor.getAlerts(),
    score: monitor.getPerformanceScore(),
    recordAuth: (time: number) => monitor.recordAuthTime(time),
    recordError: (error: Error | string) => monitor.recordError(error),
    recordRequest: (fromCache?: boolean) => monitor.recordRequest(fromCache),
    updateMetrics: (updates: Partial<PerformanceMetrics>) => monitor.updateCustomMetrics(updates),
    exportData: () => monitor.exportData()
  };
}