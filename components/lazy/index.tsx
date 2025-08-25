"use client";

import React, { lazy } from 'react';
import { createMobileLazyComponent, MobileOptimizedSkeleton } from '@/lib/lazy-loading';

// Lazy loading para componentes pesados que usam Recharts

// Rastreador de Gastos (usa PieChart)
const LazyRastreadorGastos = createMobileLazyComponent(
  () => import('@/components/rastreador-gastos'),
  {
    rootMargin: '100px',
    threshold: 0.1,
    loadTimeout: 200,
    placeholder: () => <MobileOptimizedSkeleton type="chart" />,
    errorBoundary: ({ error, retry }) => (
      <div className="bg-slate-800 border-slate-700 rounded-lg p-4 text-center">
        <p className="text-red-400 mb-2">Erro ao carregar gráfico de gastos</p>
        <button 
          onClick={retry}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          Tentar novamente
        </button>
      </div>
    )
  }
);

// Performance Alerts (componente complexo)
const LazyPerformanceAlerts = createMobileLazyComponent(
  () => import('@/components/performance-alerts'),
  {
    rootMargin: '50px',
    threshold: 0.1,
    loadTimeout: 100,
    placeholder: () => (
      <div className="bg-slate-800 border-slate-700 rounded-lg p-3">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded mb-2"></div>
          <div className="h-6 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }
);

// Registro de Medicamentos (formulário complexo)
const LazyRegistroMedicamentos = createMobileLazyComponent(
  () => import('@/components/registro-medicamentos'),
  {
    rootMargin: '150px',
    threshold: 0.1,
    loadTimeout: 150,
    placeholder: () => <MobileOptimizedSkeleton type="form" />
  }
);

// Registro de Estudos (lista complexa)
const LazyRegistroEstudos = createMobileLazyComponent(
  () => import('@/components/registro-estudos'),
  {
    rootMargin: '100px', 
    threshold: 0.1,
    loadTimeout: 100,
    placeholder: () => <MobileOptimizedSkeleton type="list" />
  }
);

// Registro de Refeições
const LazyRegistroRefeicoes = createMobileLazyComponent(
  () => import('@/components/registro-refeicoes'),
  {
    rootMargin: '100px',
    threshold: 0.1,
    loadTimeout: 100,
    placeholder: () => <MobileOptimizedSkeleton type="form" />
  }
);

// Monitoramento de Humor
const LazyMonitoramentoHumor = createMobileLazyComponent(
  () => import('@/components/monitoramento-humor'),
  {
    rootMargin: '100px',
    threshold: 0.1,
    loadTimeout: 100,
    placeholder: () => <MobileOptimizedSkeleton type="card" />
  }
);

// User Account Dropdown (componente complexo)
const LazyUserAccountDropdown = createMobileLazyComponent(
  () => import('@/components/user-account-dropdown'),
  {
    rootMargin: '0px',
    threshold: 0.5,
    loadTimeout: 50, // Carregar rápido pois é interativo
    placeholder: () => (
      <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse"></div>
    )
  }
);

// Temporizador Foco Dashboard (componente já otimizado, mas pode ser lazy)
const LazyTemporizadorFocoDashboard = createMobileLazyComponent(
  () => import('@/components/temporizador-foco-dashboard'),
  {
    rootMargin: '150px',
    threshold: 0.1,
    loadTimeout: 100,
    placeholder: () => <MobileOptimizedSkeleton type="card" />
  }
);

// Dashboard Modules (já otimizado, mas pode ser lazy em seções específicas)
const LazyDashboardModules = createMobileLazyComponent(
  () => import('@/components/dashboard-modules'),
  {
    rootMargin: '200px', // Carregar cedo pois é importante
    threshold: 0.1,
    loadTimeout: 50,
    placeholder: () => (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(8)].map((_, i) => (
          <MobileOptimizedSkeleton key={i} type="card" />
        ))}
      </div>
    )
  }
);

// Chart components específicos (para usar dentro de outros componentes)
const LazyChartContainer = lazy(() => import('@/components/ui/chart').then(module => ({
  default: module.ChartContainer
})));

const LazyPieChart = lazy(() => import('recharts').then(module => ({
  default: module.PieChart
})));

const LazyLineChart = lazy(() => import('recharts').then(module => ({
  default: module.LineChart
})));

const LazyBarChart = lazy(() => import('recharts').then(module => ({
  default: module.BarChart
})));

// App Sidebar (componente complexo de navegação)
const LazyAppSidebar = createMobileLazyComponent(
  () => import('@/components/app-sidebar'),
  {
    rootMargin: '0px',
    threshold: 1.0, // Carregar apenas quando totalmente visível
    loadTimeout: 50,
    placeholder: () => (
      <div className="w-64 bg-slate-800 border-r border-slate-700 animate-pulse">
        <div className="p-4">
          <div className="h-8 bg-slate-700 rounded mb-4"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-700 rounded mb-2"></div>
          ))}
        </div>
      </div>
    )
  }
);

// Exports nomeados para facilitar importação
export {
  LazyRastreadorGastos,
  LazyPerformanceAlerts,
  LazyRegistroMedicamentos,
  LazyRegistroEstudos,
  LazyRegistroRefeicoes,
  LazyMonitoramentoHumor,
  LazyUserAccountDropdown,
  LazyTemporizadorFocoDashboard,
  LazyDashboardModules,
  LazyChartContainer,
  LazyPieChart,
  LazyLineChart,
  LazyBarChart,
  LazyAppSidebar
};

// Export default com todos os componentes
const indexDefault = {
  RastreadorGastos: LazyRastreadorGastos,
  PerformanceAlerts: LazyPerformanceAlerts,
  RegistroMedicamentos: LazyRegistroMedicamentos,
  RegistroEstudos: LazyRegistroEstudos,
  RegistroRefeicoes: LazyRegistroRefeicoes,
  MonitoramentoHumor: LazyMonitoramentoHumor,
  UserAccountDropdown: LazyUserAccountDropdown,
  TemporizadorFocoDashboard: LazyTemporizadorFocoDashboard,
  DashboardModules: LazyDashboardModules,
  ChartContainer: LazyChartContainer,
  PieChart: LazyPieChart,
  LineChart: LazyLineChart,
  BarChart: LazyBarChart,
  AppSidebar: LazyAppSidebar
};

export default indexDefault;