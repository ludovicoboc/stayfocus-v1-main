"use client";

import React, { 
  Suspense, 
  useState, 
  useEffect, 
  useRef, 
  useCallback,
  memo,
  ComponentType,
  LazyExoticComponent
} from 'react';
import { useIsMobile } from '@/components/ui/use-mobile';

// Tipos
interface LazyLoadOptions {
  /**
   * Margem do viewport para começar o carregamento antes do elemento ficar visível
   * Mobile: valores maiores para compensar scroll mais rápido
   */
  rootMargin?: string;
  /**
   * Threshold para trigger do loading
   * Mobile: valores menores para carregar mais cedo
   */
  threshold?: number;
  /**
   * Timeout mínimo antes de carregar (evita loads desnecessários em scroll rápido)
   * Mobile: timeout maior para economizar recursos
   */
  loadTimeout?: number;
  /**
   * Se deve desmontar o componente quando sai da view (para economizar memória mobile)
   */
  unloadOnExit?: boolean;
  /**
   * Loading placeholder personalizado
   */
  placeholder?: React.ComponentType;
  /**
   * Error boundary personalizado
   */
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface LazyComponentState {
  isVisible: boolean;
  isLoaded: boolean;
  hasError: boolean;
  error?: Error;
}

// Hook otimizado para detecção de visibilidade mobile
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: LazyLoadOptions = {}
) {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Configurações otimizadas para mobile
  const observerOptions = {
    rootMargin: options.rootMargin || (isMobile ? '200px' : '100px'),
    threshold: options.threshold || (isMobile ? 0.1 : 0.25),
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Criar observer otimizado
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Timeout para evitar loads em scroll rápido
          const timeout = options.loadTimeout || (isMobile ? 150 : 50);
          setTimeout(() => {
            setIsVisible(true);
          }, timeout);
        } else if (options.unloadOnExit && isMobile) {
          // Descarregar em mobile quando sair da view
          setIsVisible(false);
        }
      },
      observerOptions
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [elementRef, options.loadTimeout, options.unloadOnExit, isMobile]);

  return isVisible;
}

// Loading skeletons otimizados para mobile
const MobileOptimizedSkeleton = memo(function MobileOptimizedSkeleton({ 
  type = 'card' 
}: { 
  type?: 'card' | 'list' | 'chart' | 'form' 
}) {
  const baseClasses = "animate-pulse bg-slate-700 rounded";
  
  switch (type) {
    case 'card':
      return (
        <div className="bg-slate-800 border-slate-700 rounded-lg p-4 space-y-3">
          <div className={`${baseClasses} h-4 w-3/4`}></div>
          <div className={`${baseClasses} h-8 w-1/2`}></div>
          <div className={`${baseClasses} h-3 w-full`}></div>
        </div>
      );
    case 'list':
      return (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-3 flex items-center space-x-3">
              <div className={`${baseClasses} w-10 h-10 rounded-full`}></div>
              <div className="flex-1 space-y-2">
                <div className={`${baseClasses} h-4 w-3/4`}></div>
                <div className={`${baseClasses} h-3 w-1/2`}></div>
              </div>
            </div>
          ))}
        </div>
      );
    case 'chart':
      return (
        <div className="bg-slate-800 border-slate-700 rounded-lg p-4">
          <div className={`${baseClasses} h-4 w-1/3 mb-4`}></div>
          <div className={`${baseClasses} h-48 w-full`}></div>
        </div>
      );
    case 'form':
      return (
        <div className="bg-slate-800 border-slate-700 rounded-lg p-4 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className={`${baseClasses} h-3 w-1/4`}></div>
              <div className={`${baseClasses} h-10 w-full`}></div>
            </div>
          ))}
        </div>
      );
    default:
      return <div className={`${baseClasses} h-32 w-full`}></div>;
  }
});

// Error boundary simples para componentes lazy
const LazyErrorBoundary = memo(function LazyErrorBoundary({ 
  children,
  fallback
}: {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const retry = useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (hasError) {
      console.error('LazyComponent Error:', error);
    }
  }, [hasError, error]);

  if (hasError && error) {
    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent error={error} retry={retry} />;
    }
    
    return (
      <div className="bg-slate-800 border-slate-700 rounded-lg p-4 text-center">
        <p className="text-red-400 mb-2">Erro ao carregar componente</p>
        <button 
          onClick={retry}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
});

// HOC principal para lazy loading mobile-optimized
export function withMobileLazyLoading<P extends object>(
  lazyComponent: LazyExoticComponent<ComponentType<P>>,
  options: LazyLoadOptions = {}
) {
  const LazyWrapper = memo(function LazyWrapper(props: P) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isVisible = useIntersectionObserver(containerRef, options);
    const [state, setState] = useState<LazyComponentState>({
      isVisible: false,
      isLoaded: false,
      hasError: false
    });

    // Atualizar estado quando visibilidade muda
    useEffect(() => {
      if (isVisible && !state.isLoaded) {
        setState(prev => ({
          ...prev,
          isVisible: true,
          isLoaded: true
        }));
      }
    }, [isVisible, state.isLoaded]);

    // Placeholder padrão ou customizado
    const PlaceholderComponent = options.placeholder || (() => (
      <MobileOptimizedSkeleton type="card" />
    ));

    return (
      <div ref={containerRef} className="min-h-[100px]">
        <LazyErrorBoundary fallback={options.errorBoundary}>
          {state.isLoaded ? (
            <Suspense fallback={<PlaceholderComponent />}>
              {React.createElement(lazyComponent, props as any)}
            </Suspense>
          ) : (
            <PlaceholderComponent />
          )}
        </LazyErrorBoundary>
      </div>
    );
  });

  LazyWrapper.displayName = `withMobileLazyLoading(Component)`;
  
  return LazyWrapper;
}

// Utility para criar lazy components otimizados
export function createMobileLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = React.lazy(importFn);
  return withMobileLazyLoading(LazyComponent, options);
}

// Hook para preload de componentes em idle time
export function useComponentPreloader() {
  const isMobile = useIsMobile();
  
  const preloadComponent = useCallback((
    importFn: () => Promise<any>,
    priority: 'high' | 'low' = 'low'
  ) => {
    if (isMobile && priority === 'low') {
      // Em mobile, aguardar idle time para preloads de baixa prioridade
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          importFn().catch(console.error);
        });
      } else {
        // Fallback para browsers sem requestIdleCallback
        setTimeout(() => {
          importFn().catch(console.error);
        }, 2000);
      }
    } else {
      // Preload imediato para alta prioridade ou desktop
      importFn().catch(console.error);
    }
  }, [isMobile]);

  return { preloadComponent };
}

// Export de skeleton components para uso direto
export { MobileOptimizedSkeleton };

// Default export do sistema completo
const lazyLoadingDefault = {
  withMobileLazyLoading,
  createMobileLazyComponent,
  useIntersectionObserver,
  useComponentPreloader,
  MobileOptimizedSkeleton,
  LazyErrorBoundary
};

export default lazyLoadingDefault;