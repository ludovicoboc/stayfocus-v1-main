"use client";

import { useEffect } from 'react';

/**
 * Critical CSS Inliner para Mobile
 * Extrai e inline CSS crítico para above-the-fold content
 */

// CSS crítico para mobile (above-the-fold)
const CRITICAL_CSS_MOBILE = `
  /* Reset básico mobile-first */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  html {
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
    scroll-behavior: smooth;
  }
  
  body {
    margin: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.5;
    background-color: #0f172a;
    color: #f8fafc;
    overflow-x: hidden;
  }
  
  /* Layout crítico mobile */
  .mobile-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  /* Header mobile crítico */
  .mobile-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background-color: #1e293b;
    border-bottom: 1px solid #334155;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  /* Navigation mobile crítico */
  .mobile-nav {
    background-color: #1e293b;
    border-top: 1px solid #334155;
    padding: 0.5rem;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 40;
  }
  
  /* Loading states críticos */
  .skeleton {
    background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* Botões críticos mobile */
  .btn-primary {
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  
  .btn-primary:hover, .btn-primary:focus {
    background-color: #2563eb;
  }
  
  /* Cards críticos */
  .card {
    background-color: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  /* Grid responsivo crítico */
  .grid-mobile {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding: 1rem;
  }
  
  @media (min-width: 640px) {
    .grid-mobile {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .grid-mobile {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  /* PWA safe areas */
  .safe-area-inset {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  /* Focus visible para mobile */
  .focus-visible:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  /* Touch improvements */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// Hook para injetar CSS crítico
export function useCriticalCSS() {
  useEffect(() => {
    // Verificar se já foi injetado
    if (document.getElementById('critical-css-mobile')) return;
    
    // Criar e injetar CSS crítico
    const style = document.createElement('style');
    style.id = 'critical-css-mobile';
    style.textContent = CRITICAL_CSS_MOBILE;
    
    // Inserir antes de outros stylesheets para prioridade
    const firstLink = document.head.querySelector('link[rel="stylesheet"]');
    if (firstLink) {
      document.head.insertBefore(style, firstLink);
    } else {
      document.head.appendChild(style);
    }
    
    // CSS crítico mobile injetado
  }, []);
}

// Componente para preload de recursos críticos
export function CriticalResourcesPreloader() {
  useEffect(() => {
    // Preload de fonts críticas
    const fontUrls = [
      '/fonts/geist.woff2',
      '/fonts/geist-mono.woff2'
    ];
    
    fontUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
    
    // Preload de imagens críticas
    const criticalImages = [
      '/icon-192x192.png',
      '/stayfocus_logo.png'
    ];
    
    criticalImages.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'image';
      document.head.appendChild(link);
    });
    
    // Prefetch de rotas importantes
    const importantRoutes = [
      '/alimentacao',
      '/estudos', 
      '/financas',
      '/saude'
    ];
    
    // Delay para não impactar carregamento inicial
    setTimeout(() => {
      importantRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }, 2000);
    
    // Recursos críticos precarregados
  }, []);
  
  return null;
}

// Utility para detectar tipo de conexão e ajustar assets
export function useConnectionOptimization() {
  useEffect(() => {
    // @ts-ignore - navigator.connection é experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const { effectiveType, saveData } = connection;
      
      // Ajustar qualidade de imagens baseado na conexão
      const imageQuality = (() => {
        if (saveData) return 'low';
        if (effectiveType === '4g') return 'high';
        if (effectiveType === '3g') return 'medium';
        return 'low';
      })();
      
      // Definir data attribute para CSS condicional
      document.documentElement.setAttribute('data-connection', effectiveType || 'unknown');
      document.documentElement.setAttribute('data-image-quality', imageQuality);
      document.documentElement.setAttribute('data-save-data', saveData ? 'true' : 'false');
      
      // Conexão detectada e configurada
    }
  }, []);
}

// Utility para lazy loading de CSS não crítico
export function useNonCriticalCSS() {
  useEffect(() => {
    // Cargar CSS não crítico após load inicial
    const loadCSS = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
      };
      document.head.appendChild(link);
    };
    
    // Delay para não impactar crítico
    setTimeout(() => {
      // CSS de componentes específicos
      const nonCriticalCSS = [
        '/css/charts.css',
        '/css/animations.css',
        '/css/utilities.css'
      ];
      
      nonCriticalCSS.forEach(loadCSS);
    }, 1000);
  }, []);
}

// CSS para diferentes qualidades de conexão
const CONNECTION_AWARE_CSS = `
  /* CSS adaptativo baseado na conexão */
  [data-connection="slow-2g"] .high-quality-image,
  [data-connection="2g"] .high-quality-image,
  [data-save-data="true"] .high-quality-image {
    display: none;
  }
  
  [data-connection="slow-2g"] .animation,
  [data-connection="2g"] .animation,
  [data-save-data="true"] .animation {
    animation: none !important;
    transition: none !important;
  }
  
  [data-connection="4g"] .enhanced-effects {
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  /* Otimizações para data saver */
  [data-save-data="true"] * {
    background-image: none !important;
  }
  
  [data-save-data="true"] .optional-content {
    display: none;
  }
`;

// Hook principal que combina todas as otimizações
export function useMobileOptimizations() {
  useCriticalCSS();
  useConnectionOptimization();
  useNonCriticalCSS();
  
  useEffect(() => {
    // Injetar CSS adaptativo
    const style = document.createElement('style');
    style.textContent = CONNECTION_AWARE_CSS;
    document.head.appendChild(style);
    
    // Otimizações de viewport para PWA
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no'
      );
    }
    
    // Theme color dinâmico
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      // Usar cor baseada no tema do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeColorMeta.setAttribute('content', prefersDark ? '#0f172a' : '#f8fafc');
    }
    
    // Todas as otimizações mobile aplicadas
  }, []);
}

// Export de componente principal
export default function MobileAssetOptimizer() {
  useMobileOptimizations();
  
  return (
    <>
      <CriticalResourcesPreloader />
      {/* Componente invisível que aplica otimizações */}
    </>
  );
}