# Design de Implementação PWA - StayFocus Alimentação

## 1. Visão Geral

### Contexto do Projeto
O projeto StayFocus-Alimentação é uma aplicação web full-stack baseada em Next.js 15 focada em organização pessoal, especificamente para alimentação, estudos, finanças e bem-estar. Atualmente possui um **score PWA de 75/100** e necessita implementar melhorias críticas para atingir padrões enterprise de performance.

### Problemas Identificados
- **Service Worker ausente**: Não há cache offline nem estratégias de sincronização
- **Bundle size não otimizado**: Arquivo de rota com 467KB e timeout de build >30s
- **Lazy loading limitado**: Apenas 1 de 10+ módulos utiliza lazy loading efetivamente
- **Otimizações Next.js parciais**: Falta configuração de bundle analyzer e experimental features

### Objetivos do Design
- Implementar service worker completo com estratégias de cache
- Reduzir bundle size em 30%+ através de code splitting
- Expandir lazy loading para todos os módulos
- Atingir score PWA de 95/100

## 2. Arquitetura PWA

### Componentes Principais

```mermaid
graph TB
    subgraph "PWA Core"
        SW[Service Worker]
        CM[Cache Manager]
        BM[Bundle Manager]
        PM[Performance Monitor]
    end
    
    subgraph "Next.js App"
        AR[App Router]
        CC[Client Components]
        SC[Server Components]
        AP[API Routes]
    end
    
    subgraph "Storage Layer"
        CB[Cache Browser]
        IDB[IndexedDB]
        LS[Local Storage]
        SB[Supabase]
    end
    
    SW --> CB
    CM --> IDB
    PM --> LS
    AR --> CC
    CC --> SW
    SC --> AP
    AP --> SB
    
    style SW fill:#e1f5fe
    style CM fill:#f3e5f5
    style BM fill:#fff3e0
    style PM fill:#e8f5e8
```

### Service Worker Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant SW as Service Worker
    participant C as Cache
    participant N as Network
    participant A as App
    
    U->>A: Requisição
    A->>SW: Interceptar
    SW->>C: Verificar cache
    
    alt Cache Hit
        C->>SW: Dados do cache
        SW->>A: Resposta rápida
    else Cache Miss
        SW->>N: Requisição rede
        N->>SW: Resposta
        SW->>C: Armazenar
        SW->>A: Resposta
    end
    
    A->>U: Conteúdo exibido
```

## 3. Service Worker Implementation

### Core Service Worker Structure

```typescript
// Estratégias de Cache por Tipo de Recurso
interface CacheStrategy {
  name: string
  pattern: RegExp
  strategy: 'NetworkFirst' | 'CacheFirst' | 'StaleWhileRevalidate'
  maxEntries?: number
  maxAgeSeconds?: number
}

const cacheStrategies: CacheStrategy[] = [
  {
    name: 'api-cache',
    pattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
    strategy: 'NetworkFirst',
    maxEntries: 50,
    maxAgeSeconds: 300 // 5 minutos
  },
  {
    name: 'static-cache',
    pattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    strategy: 'CacheFirst',
    maxEntries: 100,
    maxAgeSeconds: 86400 // 24 horas
  },
  {
    name: 'pages-cache',
    pattern: /^https:\/\/stayfocus\.app\//,
    strategy: 'StaleWhileRevalidate',
    maxEntries: 30,
    maxAgeSeconds: 3600 // 1 hora
  }
]
```

### Cache Management System

```mermaid
graph LR
    subgraph "Cache Layers"
        L1[Memory Cache]
        L2[Service Worker Cache]
        L3[IndexedDB Cache]
        L4[Network]
    end
    
    subgraph "Cache Types"
        ST[Static Assets]
        API[API Responses]
        PG[Pages/Routes]
        USR[User Data]
    end
    
    L1 --> L2
    L2 --> L3
    L3 --> L4
    
    ST --> L2
    API --> L3
    PG --> L2
    USR --> L3
    
    style L1 fill:#ffebee
    style L2 fill:#e3f2fd
    style L3 fill:#f1f8e9
    style L4 fill:#fff3e0
```

### Offline Data Sync Strategy

```typescript
// Sistema de Sincronização Offline
interface OfflineOperation {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  table: string
  data: any
  timestamp: number
  retryCount: number
}

interface SyncQueue {
  operations: OfflineOperation[]
  maxRetries: number
  retryInterval: number
  isOnline: boolean
}
```

## 4. Bundle Optimization Strategy

### Code Splitting Configuration

```typescript
// Configuração de Code Splitting por Módulo
const moduleConfigs = {
  concursos: {
    priority: 'high',
    preload: true,
    chunkName: 'concursos',
    maxSize: 200 // KB
  },
  alimentacao: {
    priority: 'high', 
    preload: true,
    chunkName: 'alimentacao',
    maxSize: 150
  },
  financas: {
    priority: 'medium',
    preload: false,
    chunkName: 'financas', 
    maxSize: 100
  },
  estudos: {
    priority: 'medium',
    preload: false,
    chunkName: 'estudos',
    maxSize: 120
  }
}
```

### Bundle Analysis Architecture

```mermaid
graph TD
    subgraph "Build Process"
        BP[Build Process]
        BA[Bundle Analyzer]
        WO[Webpack Optimization]
    end
    
    subgraph "Analysis Output"
        BS[Bundle Size Report]
        DR[Dependency Report]
        PR[Performance Report]
    end
    
    subgraph "Optimization Actions"
        CS[Code Splitting]
        TS[Tree Shaking]
        DC[Dynamic Chunks]
    end
    
    BP --> BA
    BA --> BS
    BA --> DR
    BA --> PR
    
    BS --> CS
    DR --> TS
    PR --> DC
    
    style BP fill:#e1f5fe
    style BA fill:#fff3e0
    style BS fill:#f3e5f5
```

### Webpack Optimization Configuration

```typescript
// Configurações Avançadas de Webpack
const webpackOptimizations = {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
        reuseExistingChunk: true
      },
      ui: {
        test: /[\\/]components[\\/]ui[\\/]/,
        name: 'ui-components',
        priority: 20,
        minChunks: 2
      },
      modules: {
        test: /[\\/](alimentacao|concursos|financas)[\\/]/,
        name: (module) => {
          const path = module.context;
          const match = path.match(/[\\/](alimentacao|concursos|financas)[\\/]/);
          return match ? `module-${match[1]}` : 'modules';
        },
        priority: 15,
        minChunks: 1
      }
    }
  },
  minimize: true,
  minimizer: ['TerserPlugin', 'CssMinimizerPlugin'],
  runtimeChunk: {
    name: 'runtime'
  }
}
```

## 5. Lazy Loading Expansion

### Universal Lazy Loading System

```mermaid
graph LR
    subgraph "Lazy Loading Flow"
        RT[Route Trigger]
        LL[Lazy Loader]
        PL[Preloader]
        CC[Component Cache]
        ER[Error Recovery]
    end
    
    subgraph "Loading States"
        SK[Skeleton]
        SP[Spinner]
        FB[Fallback]
    end
    
    RT --> LL
    LL --> PL
    PL --> CC
    LL --> SK
    CC --> SP
    ER --> FB
    
    style LL fill:#e8f5e8
    style PL fill:#fff3e0
    style CC fill:#f3e5f5
```

### Dynamic Import Strategy

```typescript
// Sistema de Importação Dinâmica por Prioridade
interface LazyModuleConfig {
  component: () => Promise<any>
  loading: React.ComponentType
  error: React.ComponentType<{error: Error}>
  priority: 'critical' | 'high' | 'medium' | 'low'
  preload: boolean
  prefetch: boolean
}

const lazyModules: Record<string, LazyModuleConfig> = {
  Concursos: {
    component: () => import('@/app/concursos/page'),
    loading: ConcursosSkeleton,
    error: ErrorBoundary,
    priority: 'critical',
    preload: true,
    prefetch: true
  },
  Alimentacao: {
    component: () => import('@/app/alimentacao/page'),
    loading: AlimentacaoSkeleton, 
    error: ErrorBoundary,
    priority: 'high',
    preload: true,
    prefetch: false
  },
  Financas: {
    component: () => import('@/app/financas/page'),
    loading: FinancasSkeleton,
    error: ErrorBoundary,
    priority: 'medium',
    preload: false,
    prefetch: true
  }
}
```

### Preloading Strategy

```typescript
// Sistema de Preload Contextual
interface PreloadContext {
  currentRoute: string
  userHistory: string[]
  timeOfDay: 'morning' | 'afternoon' | 'evening'
  deviceType: 'mobile' | 'desktop'
}

interface PreloadRule {
  condition: (context: PreloadContext) => boolean
  modules: string[]
  priority: number
}

const preloadRules: PreloadRule[] = [
  {
    condition: (ctx) => ctx.currentRoute === '/' && ctx.timeOfDay === 'morning',
    modules: ['Alimentacao', 'Receitas'],
    priority: 1
  },
  {
    condition: (ctx) => ctx.userHistory.includes('/concursos'),
    modules: ['Estudos', 'Simulados'],
    priority: 2
  },
  {
    condition: (ctx) => ctx.deviceType === 'mobile',
    modules: ['Hiperfocos', 'Temporizador'],
    priority: 3
  }
]
```

## 6. Performance Monitoring Integration

### Metrics Collection Architecture

```mermaid
graph TB
    subgraph "Performance Metrics"
        CWV[Core Web Vitals]
        BM[Bundle Metrics]
        CM[Cache Metrics]
        UM[User Metrics]
    end
    
    subgraph "Collection Points"
        FCP[First Contentful Paint]
        LCP[Largest Contentful Paint]
        FID[First Input Delay]
        CLS[Cumulative Layout Shift]
    end
    
    subgraph "Analysis & Alerts"
        TH[Thresholds]
        AL[Alerts]
        RP[Reports]
    end
    
    CWV --> FCP
    CWV --> LCP
    CWV --> FID
    CWV --> CLS
    
    BM --> TH
    CM --> AL
    UM --> RP
    
    style CWV fill:#e1f5fe
    style BM fill:#fff3e0
    style TH fill:#f3e5f5
```

### Performance Budget Definition

```typescript
// Orçamentos de Performance por Módulo
interface PerformanceBudget {
  module: string
  maxBundleSize: number // KB
  maxLoadTime: number // ms
  maxMemoryUsage: number // MB
  minCacheHitRate: number // %
}

const performanceBudgets: PerformanceBudget[] = [
  {
    module: 'dashboard',
    maxBundleSize: 150,
    maxLoadTime: 1000,
    maxMemoryUsage: 50,
    minCacheHitRate: 85
  },
  {
    module: 'concursos',
    maxBundleSize: 200,
    maxLoadTime: 1500,
    maxMemoryUsage: 80,
    minCacheHitRate: 80
  },
  {
    module: 'alimentacao',
    maxBundleSize: 120,
    maxLoadTime: 1200,
    maxMemoryUsage: 60,
    minCacheHitRate: 85
  }
]
```

### Alert System Configuration

```typescript
// Sistema de Alertas de Performance
interface PerformanceAlert {
  metric: string
  threshold: number
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  action: string[]
}

const alertConfigurations: PerformanceAlert[] = [
  {
    metric: 'bundle_size',
    threshold: 200, // KB
    severity: 'CRITICAL',
    action: ['analyze_bundle', 'code_split', 'tree_shake']
  },
  {
    metric: 'cache_hit_rate',
    threshold: 70, // %
    severity: 'WARNING', 
    action: ['review_cache_strategy', 'adjust_ttl']
  },
  {
    metric: 'first_load_time',
    threshold: 3000, // ms
    severity: 'CRITICAL',
    action: ['enable_preload', 'optimize_critical_path']
  }
]
```

## 7. Implementation Roadmap

### Fase 1: Service Worker Foundation (Semana 1)

```mermaid
gantt
    title Implementação Service Worker
    dateFormat  DD-MM
    section Service Worker
    Instalar Workbox           :done, sw1, 01-01, 1d
    Configurar Cache Basic     :active, sw2, 02-01, 2d
    Implementar Strategies     :sw3, 04-01, 2d
    Testes Offline            :sw4, 06-01, 1d
    
    section Integration
    Layout Registration       :sw5, 03-01, 1d
    Update Notifications      :sw6, 05-01, 1d
    Background Sync          :sw7, 07-01, 1d
```

### Fase 2: Bundle Optimization (Semana 2)

```mermaid
gantt
    title Otimização de Bundle
    dateFormat  DD-MM
    section Analysis
    Bundle Analyzer Setup     :bo1, 08-01, 1d
    Size Analysis            :bo2, 09-01, 1d
    
    section Optimization
    Code Splitting Config     :bo3, 10-01, 2d
    Webpack Optimization     :bo4, 12-01, 2d
    Image Optimization       :bo5, 14-01, 1d
```

### Fase 3: Lazy Loading Expansion (Semana 3)

```mermaid
gantt
    title Expansão Lazy Loading
    dateFormat  DD-MM
    section Implementation
    Module Conversion        :ll1, 15-01, 3d
    Preload Strategy        :ll2, 18-01, 2d
    Error Boundaries        :ll3, 20-01, 1d
    
    section Testing
    Performance Testing     :ll4, 21-01, 1d
```

### Fase 4: Performance Monitoring (Semana 4)

```mermaid
gantt
    title Monitoramento de Performance
    dateFormat  DD-MM
    section Monitoring
    Budget Configuration     :pm1, 22-01, 1d
    Alert System            :pm2, 23-01, 2d
    Dashboard Integration   :pm3, 25-01, 2d
    
    section Validation
    E2E Testing            :pm4, 27-01, 1d
    PWA Audit             :pm5, 28-01, 1d
```

## 8. Configuration Files

### Next.js Configuration Enhancement

```typescript
// next.config.mjs - Configuração Completa PWA
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: cacheStrategies
})

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    domains: ['supabase.co']
  },
  
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog', 
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'recharts'
    ],
    turbo: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js']
    }
  },
  
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = webpackOptimizations.splitChunks
    }
    return config
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      }
    ]
  }
}

export default withBundleAnalyzer(withPWA(nextConfig))
```

### Workbox Configuration

```javascript
// workbox-config.js
module.exports = {
  globDirectory: '.next/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,gif,svg,webp,woff,woff2}'
  ],
  swDest: 'public/sw.js',
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 300
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 86400
        }
      }
    }
  ]
}
```

## 9. Testing Strategy

### PWA Testing Framework

```typescript
// Estrutura de Testes PWA
interface PWATestSuite {
  serviceWorker: ServiceWorkerTests
  caching: CacheTests
  offline: OfflineTests
  performance: PerformanceTests
}

interface ServiceWorkerTests {
  registration: () => Promise<boolean>
  cacheStrategies: () => Promise<boolean>
  updateMechanism: () => Promise<boolean>
  backgroundSync: () => Promise<boolean>
}

interface PerformanceTests {
  bundleSize: () => Promise<BundleReport>
  loadTimes: () => Promise<LoadTimeReport>
  cacheHitRate: () => Promise<CacheReport>
  webVitals: () => Promise<WebVitalsReport>
}
```

### E2E Testing Scenarios

```mermaid
graph TD
    subgraph "PWA Test Scenarios"
        OT[Offline Tests]
        CT[Cache Tests]
        PT[Performance Tests]
        IT[Installation Tests]
    end
    
    subgraph "Test Cases"
        TC1[Offline Navigation]
        TC2[Cache Hit Validation]
        TC3[Bundle Size Check]
        TC4[PWA Install Flow]
    end
    
    subgraph "Validation Metrics"
        VM1[Load Time < 1.5s]
        VM2[Cache Hit > 80%]
        VM3[Bundle < 200KB]
        VM4[PWA Score > 95]
    end
    
    OT --> TC1
    CT --> TC2
    PT --> TC3
    IT --> TC4
    
    TC1 --> VM1
    TC2 --> VM2
    TC3 --> VM3
    TC4 --> VM4
    
    style OT fill:#e1f5fe
    style CT fill:#fff3e0
    style PT fill:#f3e5f5
    style IT fill:#e8f5e8
```

### Performance Validation Criteria

```typescript
// Critérios de Validação de Performance
interface ValidationCriteria {
  pwaSCore: number // > 95
  firstLoad: number // < 1500ms
  lcp: number // < 2500ms
  fid: number // < 100ms
  cls: number // < 0.1
  cacheHitRate: number // > 80%
  bundleSize: number // < 200KB per route
}

const targetMetrics: ValidationCriteria = {
  pwaScore: 95,
  firstLoad: 1500,
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  cacheHitRate: 80,
  bundleSize: 200
}
```

## 10. Risk Management

### Implementation Risks

```mermaid
graph LR
    subgraph "Technical Risks"
        R1[Service Worker Conflicts]
        R2[Bundle Breaking Changes]
        R3[Cache Invalidation Issues]
        R4[Performance Regression]
    end
    
    subgraph "Mitigation Strategies"
        M1[Versioned Cache Keys]
        M2[Gradual Rollout]
        M3[Cache Cleanup Automation]
        M4[Performance Budgets]
    end
    
    subgraph "Monitoring"
        MON1[Real-time Alerts]
        MON2[Performance Dashboard]
        MON3[Error Tracking]
        MON4[User Feedback]
    end
    
    R1 --> M1
    R2 --> M2
    R3 --> M3
    R4 --> M4
    
    M1 --> MON1
    M2 --> MON2
    M3 --> MON3
    M4 --> MON4
    
    style R1 fill:#ffebee
    style R2 fill:#ffebee
    style M1 fill:#e8f5e8
    style M2 fill:#e8f5e8
```

### Rollback Strategy

```typescript
// Estratégia de Rollback
interface RollbackPlan {
  phase: string
  triggers: string[]
  actions: string[]
  fallback: string
}

const rollbackPlans: RollbackPlan[] = [
  {
    phase: 'Service Worker',
    triggers: ['cache_conflicts', 'offline_failures'],
    actions: ['disable_sw', 'clear_cache', 'revert_registration'],
    fallback: 'network_only_mode'
  },
  {
    phase: 'Bundle Optimization',
    triggers: ['build_failures', 'runtime_errors'],
    actions: ['revert_webpack_config', 'disable_code_splitting'],
    fallback: 'monolithic_bundle'
  }
]
```

## 11. Success Metrics

### Key Performance Indicators

| Métrica | Atual | Meta | Criticidade |
|---------|--------|------|-------------|
| PWA Score | 75/100 | 95/100 | Crítica |
| First Load | ~3s | <1.5s | Crítica |
| LCP | ~4s | <2.5s | Alta |
| Bundle Size | 467KB | <200KB | Alta |
| Cache Hit Rate | ~50% | >80% | Média |
| Offline Functionality | 0% | 100% | Crítica |

### Business Impact Targets

```mermaid
graph TD
    subgraph "Performance Improvements"
        PI1[40% Load Time Reduction]
        PI2[60% Offline Experience]
        PI3[25% Bounce Rate Reduction]
        PI4[30% Web Vitals Improvement]
    end
    
    subgraph "User Experience"
        UX1[App-like Experience]
        UX2[Instant Loading]
        UX3[Offline Access]
        UX4[Background Sync]
    end
    
    subgraph "Technical Excellence"
        TE1[95+ PWA Score]
        TE2[Performance Budgets]
        TE3[Automated Monitoring]
        TE4[Zero Downtime Updates]
    end
    
    PI1 --> UX1
    PI2 --> UX3
    PI3 --> UX2
    PI4 --> UX4
    
    UX1 --> TE1
    UX2 --> TE2
    UX3 --> TE3
    UX4 --> TE4
    
    style PI1 fill:#e8f5e8
    style UX1 fill:#e1f5fe
    style TE1 fill:#fff3e0
```