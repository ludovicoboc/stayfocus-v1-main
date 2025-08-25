"use client";

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/components/ui/use-mobile';

// Mapeamento de rotas para componentes que devem ser precarregados
const ROUTE_PRELOAD_MAP: Record<string, () => Promise<any>[]> = {
  '/': () => [
    // Dashboard principal - precarregar componentes críticos
    import('@/components/dashboard-modules'),
    import('@/components/temporizador-foco-dashboard'),
  ],
  '/alimentacao': () => [
    import('@/components/registro-refeicoes'),
    import('@/components/monitoramento-humor'),
  ],
  '/financas': () => [
    import('@/components/rastreador-gastos'),
    import('@/components/ui/chart'),
    import('recharts'),
  ],
  '/saude': () => [
    import('@/components/registro-medicamentos'),
  ],
  '/estudos': () => [
    import('@/components/registro-estudos'),
  ],
  '/concursos': () => [
    import('@/components/registro-estudos'),
  ],
  '/receitas': () => [
    import('@/components/ui/chart'),
  ]
};

// Componentes que sempre devem ser precarregados em mobile (críticos)
const CRITICAL_MOBILE_COMPONENTS = [
  () => import('@/components/app-sidebar'),
  () => import('@/components/user-account-dropdown'),
];

// Componentes que podem ser precarregados em idle time
const IDLE_PRELOAD_COMPONENTS = [
  () => import('@/components/performance-alerts'),
  () => import('@/components/ui/chart'),
];

interface PreloadOptions {
  /**
   * Se deve precarregar componentes críticos automaticamente
   */
  preloadCritical?: boolean;
  /**
   * Se deve precarregar baseado na rota atual
   */
  preloadByRoute?: boolean;
  /**
   * Se deve usar idle time para preloads secundários
   */
  useIdleTime?: boolean;
  /**
   * Delay antes de iniciar preloads (ms)
   */
  preloadDelay?: number;
}

export function useComponentPreloader(options: PreloadOptions = {}) {
  const {
    preloadCritical = true,
    preloadByRoute = true,
    useIdleTime = true,
    preloadDelay = 1000
  } = options;

  const pathname = usePathname();
  const isMobile = useIsMobile();
  const preloadedRef = useRef(new Set<string>());
  const router = useRouter();

  // Função para precarregar um componente
  const preloadComponent = useCallback(
    (importFn: () => Promise<any>, key: string, priority: 'critical' | 'normal' | 'idle' = 'normal') => {
      if (preloadedRef.current.has(key)) return;

      preloadedRef.current.add(key);

      const executePreload = () => {
        importFn()
          .then(() => {

          })
          .catch((error) => {
            console.warn(`⚠️ [PRELOAD] Erro ao carregar: ${key}`, error);
            // Remove da lista para tentar novamente depois
            preloadedRef.current.delete(key);
          });
      };

      switch (priority) {
        case 'critical':
          // Carregamento imediato
          executePreload();
          break;
        case 'normal':
          // Carregamento após delay
          setTimeout(executePreload, preloadDelay);
          break;
        case 'idle':
          // Carregamento em idle time
          if (isMobile && 'requestIdleCallback' in window) {
            window.requestIdleCallback(executePreload, { timeout: 5000 });
          } else {
            // Fallback para browsers sem requestIdleCallback
            setTimeout(executePreload, preloadDelay * 2);
          }
          break;
      }
    },
    [preloadDelay, isMobile]
  );

  // Precarregar componentes críticos
  const preloadCriticalComponents = useCallback(() => {
    if (!preloadCritical) return;

    CRITICAL_MOBILE_COMPONENTS.forEach((importFn, index) => {
      preloadComponent(importFn, `critical-${index}`, 'critical');
    });
  }, [preloadComponent, preloadCritical]);

  // Precarregar componentes da rota atual
  const preloadRouteComponents = useCallback(() => {
    if (!preloadByRoute) return;

    const routePreloads = ROUTE_PRELOAD_MAP[pathname];
    if (!routePreloads) return;

    const imports = routePreloads();
    imports.forEach((importFn, index) => {
      preloadComponent(() => importFn, `route-${pathname}-${index}`, 'normal');
    });
  }, [pathname, preloadComponent, preloadByRoute]);

  // Precarregar componentes em idle time
  const preloadIdleComponents = useCallback(() => {
    if (!useIdleTime) return;

    IDLE_PRELOAD_COMPONENTS.forEach((importFn, index) => {
      preloadComponent(importFn, `idle-${index}`, 'idle');
    });
  }, [preloadComponent, useIdleTime]);

  // Preload inteligente baseado em hover/focus (para desktop)
  const preloadOnInteraction = useCallback(
    (routePath: string) => {
      if (isMobile) return; // Não usar em mobile para economizar recursos

      const routePreloads = ROUTE_PRELOAD_MAP[routePath];
      if (!routePreloads) return;

      const imports = routePreloads();
      imports.forEach((importFn, index) => {
        preloadComponent(() => importFn, `interaction-${routePath}-${index}`, 'normal');
      });
    },
    [isMobile, preloadComponent]
  );

  // Preload baseado em prefetch de Next.js
  const prefetchRoute = useCallback(
    (routePath: string) => {
      router.prefetch(routePath);
      
      // Também precarregar componentes da rota
      setTimeout(() => {
        preloadOnInteraction(routePath);
      }, 500);
    },
    [router, preloadOnInteraction]
  );

  // Efeito principal - executar preloads
  useEffect(() => {
    // Delay inicial para não impactar carregamento inicial
    const timer = setTimeout(() => {
      preloadCriticalComponents();
      preloadRouteComponents();
      preloadIdleComponents();
    }, preloadDelay);

    return () => clearTimeout(timer);
  }, [pathname, preloadCriticalComponents, preloadRouteComponents, preloadIdleComponents, preloadDelay]);

  // Cleanup em unmount
  useEffect(() => {
    return () => {
      preloadedRef.current.clear();
    };
  }, []);

  // Status de preload
  const getPreloadStatus = useCallback(() => {
    return {
      preloadedCount: preloadedRef.current.size,
      preloadedComponents: Array.from(preloadedRef.current),
      isMobile,
      currentRoute: pathname
    };
  }, [isMobile, pathname]);

  return {
    preloadComponent,
    preloadOnInteraction,
    prefetchRoute,
    getPreloadStatus,
    // Utility functions
    preloadCriticalComponents,
    preloadRouteComponents,
    preloadIdleComponents
  };
}

// Hook mais simples para uso básico
export function useRoutePreloader() {
  const { prefetchRoute, preloadOnInteraction } = useComponentPreloader({
    preloadCritical: true,
    preloadByRoute: true,
    useIdleTime: true
  });

  return {
    prefetchRoute,
    preloadOnInteraction
  };
}

// Export das configurações para uso externo
export {
  ROUTE_PRELOAD_MAP,
  CRITICAL_MOBILE_COMPONENTS,
  IDLE_PRELOAD_COMPONENTS
};