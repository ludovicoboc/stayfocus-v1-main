"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, BarChart3, Clock, Shield, Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePerformanceMonitor } from '@/lib/performance-monitor';

interface PerformanceAlert {
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  metric: string;
  value: number;
  threshold: number;
  module?: string;
  timestamp: number;
  message: string;
}

export function PerformanceAlerts() {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const { getAlerts, getMetrics } = usePerformanceMonitor();

  useEffect(() => {
    const checkAlerts = () => {
      const recentAlerts = getAlerts(5);
      setAlerts(recentAlerts);
      
      // Auto-show se há alertas críticos
      const criticalAlerts = recentAlerts.filter(alert => 
        alert.type === 'CRITICAL' && !dismissed.has(alert.timestamp)
      );
      
      if (criticalAlerts.length > 0) {
        setShowAlerts(true);
      }
    };

    // Verificar alertas periodicamente
    const interval = setInterval(checkAlerts, 10000); // 10 segundos
    checkAlerts(); // Verificação inicial

    return () => clearInterval(interval);
  }, [dismissed, getAlerts]);

  const dismissAlert = (timestamp: number) => {
    setDismissed(prev => new Set(prev.add(timestamp)));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'WARNING': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <BarChart3 className="w-4 h-4 text-blue-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'CRITICAL': return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'WARNING': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const visibleAlerts = alerts.filter(alert => !dismissed.has(alert.timestamp));

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Botão flutuante de performance */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowAlerts(!showAlerts)}
          className="h-12 w-12 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600"
          size="sm"
        >
          <BarChart3 className="w-5 h-5 text-white" />
          {visibleAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {visibleAlerts.length}
            </span>
          )}
        </Button>
      </div>

      {/* Painel de alertas */}
      {showAlerts && (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-h-96 overflow-y-auto">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Alertas de Performance
                </h3>
                <Button
                  onClick={() => setShowAlerts(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {visibleAlerts.map((alert) => (
                  <div
                    key={alert.timestamp}
                    className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                            {alert.type} - {alert.metric}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {alert.message}
                          </p>
                          {alert.module && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Módulo: {alert.module}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(alert.timestamp).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => dismissAlert(alert.timestamp)}
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumo de performance */}
              <div className="mt-4 pt-3 border-t border-slate-600">
                <PerformanceSummary />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function PerformanceSummary() {
  const { getMetrics } = usePerformanceMonitor();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [getMetrics]);

  if (!metrics) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-slate-300">Métricas Atuais</h4>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-blue-400" />
          <span className="text-slate-300">Load: {metrics.loadTime.toFixed(0)}ms</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Shield className="w-3 h-3 text-green-400" />
          <span className="text-slate-300">Auth: {metrics.authChecks}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Database className="w-3 h-3 text-purple-400" />
          <span className="text-slate-300">Cache: {metrics.cacheHitRate.toFixed(1)}%</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <BarChart3 className="w-3 h-3 text-orange-400" />
          <span className="text-slate-300">Score: {metrics.overallScore}/100</span>
        </div>
      </div>

      {/* Web Vitals */}
      {(metrics.firstContentfulPaint || metrics.largestContentfulPaint) && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <h5 className="text-xs font-medium text-slate-400 mb-1">Web Vitals</h5>
          <div className="space-y-1 text-xs">
            {metrics.firstContentfulPaint && (
              <div className="flex justify-between">
                <span className="text-slate-400">FCP:</span>
                <span className={`${metrics.firstContentfulPaint < 1800 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {(metrics.firstContentfulPaint / 1000).toFixed(2)}s
                </span>
              </div>
            )}
            {metrics.largestContentfulPaint && (
              <div className="flex justify-between">
                <span className="text-slate-400">LCP:</span>
                <span className={`${metrics.largestContentfulPaint < 2500 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {(metrics.largestContentfulPaint / 1000).toFixed(2)}s
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Export default para lazy loading
export default PerformanceAlerts;