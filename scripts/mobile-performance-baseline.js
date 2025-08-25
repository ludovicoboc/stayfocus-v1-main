#!/usr/bin/env node

/**
 * Script de Baseline de Performance Mobile
 * Estabelece métricas atuais antes das otimizações
 * 
 * Uso: node scripts/mobile-performance-baseline.js
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Configurações de teste
const CONFIG = {
  // URLs para teste (ajustar conforme ambiente)
  BASE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  
  // Páginas para testar
  PAGES: [
    '/',
    '/auth',
    '/alimentacao',
    '/concursos',
    '/estudos',
    '/financas',
    '/saude',
    '/receitas'
  ],
  
  // Simulação de dispositivos móveis
  MOBILE_DEVICES: [
    {
      name: 'iPhone 12',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      viewport: { width: 390, height: 844 }
    },
    {
      name: 'Samsung Galaxy S21',
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
      viewport: { width: 360, height: 800 }
    },
    {
      name: 'iPad',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      viewport: { width: 768, height: 1024 }
    }
  ],
  
  // Simulação de conexões
  NETWORK_CONDITIONS: [
    { name: 'Fast 3G', downloadThroughput: 1.5 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 40 },
    { name: 'Slow 3G', downloadThroughput: 500 * 1024 / 8, uploadThroughput: 500 * 1024 / 8, latency: 400 },
    { name: '2G', downloadThroughput: 250 * 1024 / 8, uploadThroughput: 50 * 1024 / 8, latency: 800 }
  ]
};

// Classe para coleta de métricas
class MobilePerformanceBaseline {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      metrics: [],
      summary: {}
    };
  }

  /**
   * Executa baseline completo
   */
  async run() {
    console.log('🚀 Iniciando Baseline de Performance Mobile...\n');
    
    try {
      // 1. Análise de Bundle Size
      await this.analyzeBundleSize();
      
      // 2. Análise de Dependencies
      await this.analyzeDependencies();
      
      // 3. Análise de Hooks de Dados
      await this.analyzeDataHooks();
      
      // 4. Análise de Cache Atual
      await this.analyzeCacheStatus();
      
      // 5. Gerar relatório
      await this.generateReport();
      
      console.log('✅ Baseline concluído com sucesso!');
      console.log(`📄 Relatório salvo em: docs/baseline-performance-mobile.json`);
      
    } catch (error) {
      console.error('❌ Erro durante baseline:', error);
      process.exit(1);
    }
  }

  /**
   * Analisa tamanho do bundle
   */
  async analyzeBundleSize() {
    console.log('📦 Analisando Bundle Size...');
    
    const bundleAnalysis = {
      category: 'bundle-size',
      timestamp: Date.now(),
      data: {}
    };

    // Analisar package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Contar dependências
      const deps = Object.keys(packageJson.dependencies || {});
      const devDeps = Object.keys(packageJson.devDependencies || {});
      
      bundleAnalysis.data.dependencies = {
        production: deps.length,
        development: devDeps.length,
        total: deps.length + devDeps.length,
        heavy_libs: this.identifyHeavyLibraries(deps)
      };

      // Estimar bundle size baseado em dependências conhecidas
      bundleAnalysis.data.estimated_bundle_size = this.estimateBundleSize(deps);
      
    } catch (error) {
      bundleAnalysis.data.error = error.message;
    }

    this.results.metrics.push(bundleAnalysis);
    console.log(`   Dependencies: ${bundleAnalysis.data.dependencies?.total || 'N/A'}`);
    console.log(`   Estimated Bundle: ${bundleAnalysis.data.estimated_bundle_size?.total || 'N/A'}\n`);
  }

  /**
   * Identifica bibliotecas pesadas
   */
  identifyHeavyLibraries(deps) {
    const heavyLibs = {
      'react': '~42KB',
      'react-dom': '~130KB', 
      'next': '~200KB',
      '@supabase/supabase-js': '~100KB',
      'recharts': '~400KB',
      '@radix-ui/react-dialog': '~15KB',
      'lucide-react': '~150KB',
      'date-fns': '~70KB'
    };

    return deps.filter(dep => heavyLibs[dep]).map(dep => ({
      name: dep,
      estimated_size: heavyLibs[dep]
    }));
  }

  /**
   * Estima tamanho do bundle
   */
  estimateBundleSize(deps) {
    // Estimativas baseadas em bibliotecas comuns
    const sizes = {
      'react': 42000,
      'react-dom': 130000,
      'next': 200000,
      '@supabase/supabase-js': 100000,
      'recharts': 400000,
      '@radix-ui/react-dialog': 15000,
      'lucide-react': 150000,
      'date-fns': 70000,
      '@radix-ui/react-dropdown-menu': 15000,
      'sonner': 20000,
      'react-hook-form': 40000,
      'zod': 50000
    };

    let totalSize = 0;
    const breakdown = {};

    deps.forEach(dep => {
      const size = sizes[dep] || 10000; // 10KB default para deps desconhecidas
      totalSize += size;
      breakdown[dep] = size;
    });

    return {
      total: `${Math.round(totalSize / 1024)}KB`,
      breakdown,
      mobile_concern: totalSize > 800000 // >800KB é preocupante para mobile
    };
  }

  /**
   * Analisa dependências
   */
  async analyzeDependencies() {
    console.log('📚 Analisando Dependências...');
    
    const depsAnalysis = {
      category: 'dependencies',
      timestamp: Date.now(),
      data: {}
    };

    try {
      // Verificar se existe pnpm-lock.yaml ou package-lock.json
      const hasLockFile = fs.existsSync('pnpm-lock.yaml') || fs.existsSync('package-lock.json');
      
      depsAnalysis.data.lock_file = hasLockFile;
      depsAnalysis.data.package_manager = fs.existsSync('pnpm-lock.yaml') ? 'pnpm' : 
                                          fs.existsSync('package-lock.json') ? 'npm' : 'unknown';

      // Analisar node_modules size (se existir)
      if (fs.existsSync('node_modules')) {
        depsAnalysis.data.node_modules_size = await this.getDirectorySize('node_modules');
      }

    } catch (error) {
      depsAnalysis.data.error = error.message;
    }

    this.results.metrics.push(depsAnalysis);
    console.log(`   Package Manager: ${depsAnalysis.data.package_manager}`);
    console.log(`   Lock File: ${depsAnalysis.data.lock_file ? '✅' : '❌'}\n`);
  }

  /**
   * Analisa hooks de dados para identificar padrões
   */
  async analyzeDataHooks() {
    console.log('🔍 Analisando Hooks de Dados...');
    
    const hooksAnalysis = {
      category: 'data-hooks',
      timestamp: Date.now(),
      data: {
        hooks_found: [],
        optimization_status: {},
        cache_usage: {},
        mobile_optimizations: {}
      }
    };

    try {
      const hooksDir = path.join(process.cwd(), 'hooks');
      if (fs.existsSync(hooksDir)) {
        const hookFiles = fs.readdirSync(hooksDir).filter(file => file.endsWith('.ts'));
        
        for (const file of hookFiles) {
          const hookPath = path.join(hooksDir, file);
          const content = fs.readFileSync(hookPath, 'utf8');
          
          const analysis = this.analyzeHookContent(file, content);
          hooksAnalysis.data.hooks_found.push(analysis);
        }

        // Resumo geral
        const optimizedHooks = hooksAnalysis.data.hooks_found.filter(h => h.has_cache || h.mobile_optimized);
        const totalHooks = hooksAnalysis.data.hooks_found.length;
        
        hooksAnalysis.data.summary = {
          total_hooks: totalHooks,
          optimized_hooks: optimizedHooks.length,
          optimization_rate: Math.round((optimizedHooks.length / totalHooks) * 100)
        };
      }

    } catch (error) {
      hooksAnalysis.data.error = error.message;
    }

    this.results.metrics.push(hooksAnalysis);
    console.log(`   Hooks encontrados: ${hooksAnalysis.data.summary?.total_hooks || 0}`);
    console.log(`   Hooks otimizados: ${hooksAnalysis.data.summary?.optimized_hooks || 0}`);
    console.log(`   Taxa de otimização: ${hooksAnalysis.data.summary?.optimization_rate || 0}%\n`);
  }

  /**
   * Analisa conteúdo de um hook individual
   */
  analyzeHookContent(filename, content) {
    const analysis = {
      name: filename,
      has_cache: false,
      mobile_optimized: false,
      has_debounce: false,
      parallel_requests: 0,
      useEffect_count: 0,
      supabase_calls: 0,
      issues: []
    };

    // Verificar cache
    if (content.includes('globalRequestCache') || content.includes('RequestCacheManager')) {
      analysis.has_cache = true;
    }

    // Verificar otimizações mobile
    if (content.includes('isMobile') || content.includes('mobileTTL') || content.includes('mobile')) {
      analysis.mobile_optimized = true;
    }

    // Verificar debounce
    if (content.includes('debounce') || content.includes('useCallback')) {
      analysis.has_debounce = true;
    }

    // Contar Promise.all (requests paralelos)
    const promiseAllMatches = content.match(/Promise\.all/g);
    analysis.parallel_requests = promiseAllMatches ? promiseAllMatches.length : 0;

    // Contar useEffect
    const useEffectMatches = content.match(/useEffect/g);
    analysis.useEffect_count = useEffectMatches ? useEffectMatches.length : 0;

    // Contar chamadas Supabase
    const supabaseMatches = content.match(/supabase\./g);
    analysis.supabase_calls = supabaseMatches ? supabaseMatches.length : 0;

    // Identificar problemas
    if (analysis.parallel_requests > 2) {
      analysis.issues.push('Muitos requests paralelos sem cache');
    }
    if (analysis.supabase_calls > 5 && !analysis.has_cache) {
      analysis.issues.push('Muitas chamadas Supabase sem cache');
    }
    if (analysis.useEffect_count > 3) {
      analysis.issues.push('Muitos useEffect - possível re-renders');
    }
    if (!analysis.mobile_optimized && analysis.supabase_calls > 0) {
      analysis.issues.push('Sem otimizações específicas para mobile');
    }

    return analysis;
  }

  /**
   * Analisa status atual de cache
   */
  async analyzeCacheStatus() {
    console.log('💾 Analisando Status de Cache...');
    
    const cacheAnalysis = {
      category: 'cache-status',
      timestamp: Date.now(),
      data: {
        cache_implementations: [],
        auth_cache: false,
        request_cache: false,
        service_worker: false,
        browser_cache: false
      }
    };

    try {
      // Verificar auth cache
      if (fs.existsSync('lib/auth-cache.ts') || fs.existsSync('lib/auth-cache-manager.ts')) {
        cacheAnalysis.data.auth_cache = true;
        cacheAnalysis.data.cache_implementations.push('auth-cache');
      }

      // Verificar request cache
      if (fs.existsSync('lib/request-cache-manager.ts')) {
        cacheAnalysis.data.request_cache = true;
        cacheAnalysis.data.cache_implementations.push('request-cache');
      }

      // Verificar service worker
      if (fs.existsSync('public/sw.js')) {
        cacheAnalysis.data.service_worker = true;
        cacheAnalysis.data.cache_implementations.push('service-worker');
      }

      // Verificar middleware cache
      if (fs.existsSync('middleware.ts')) {
        const middlewareContent = fs.readFileSync('middleware.ts', 'utf8');
        if (middlewareContent.includes('cache') || middlewareContent.includes('Cache')) {
          cacheAnalysis.data.middleware_cache = true;
          cacheAnalysis.data.cache_implementations.push('middleware-cache');
        }
      }

    } catch (error) {
      cacheAnalysis.data.error = error.message;
    }

    this.results.metrics.push(cacheAnalysis);
    console.log(`   Implementações de cache: ${cacheAnalysis.data.cache_implementations.length}`);
    console.log(`   Auth cache: ${cacheAnalysis.data.auth_cache ? '✅' : '❌'}`);
    console.log(`   Request cache: ${cacheAnalysis.data.request_cache ? '✅' : '❌'}\n`);
  }

  /**
   * Gera relatório final
   */
  async generateReport() {
    console.log('📊 Gerando Relatório...');

    // Calcular scores
    this.calculatePerformanceScores();

    // Gerar recomendações
    this.generateRecommendations();

    // Salvar arquivo JSON
    const reportPath = path.join(process.cwd(), 'docs', 'baseline-performance-mobile.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Gerar relatório markdown
    await this.generateMarkdownReport();
  }

  /**
   * Calcula scores de performance
   */
  calculatePerformanceScores() {
    const hooks = this.results.metrics.find(m => m.category === 'data-hooks')?.data;
    const cache = this.results.metrics.find(m => m.category === 'cache-status')?.data;
    const bundle = this.results.metrics.find(m => m.category === 'bundle-size')?.data;

    this.results.summary = {
      overall_score: 0,
      scores: {
        hooks_optimization: hooks?.summary?.optimization_rate || 0,
        cache_implementation: (cache?.cache_implementations?.length || 0) * 25, // Max 100 para 4 tipos
        bundle_efficiency: bundle?.estimated_bundle_size?.mobile_concern ? 30 : 80
      }
    };

    // Score geral (média ponderada)
    const weights = { hooks: 0.4, cache: 0.4, bundle: 0.2 };
    this.results.summary.overall_score = Math.round(
      (this.results.summary.scores.hooks_optimization * weights.hooks) +
      (this.results.summary.scores.cache_implementation * weights.cache) +
      (this.results.summary.scores.bundle_efficiency * weights.bundle)
    );
  }

  /**
   * Gera recomendações
   */
  generateRecommendations() {
    const score = this.results.summary.overall_score;
    const recommendations = [];

    if (score < 50) {
      recommendations.push({
        priority: 'CRÍTICA',
        action: 'Implementar sistema de cache para hooks de dados',
        impact: 'Alto - Redução de 60-80% em requests'
      });
    }

    if (score < 70) {
      recommendations.push({
        priority: 'ALTA',
        action: 'Otimizar hooks para mobile com TTL diferenciado',
        impact: 'Médio - Melhoria de 30-50% em performance mobile'
      });
    }

    const bundleSize = this.results.metrics.find(m => m.category === 'bundle-size')?.data?.estimated_bundle_size;
    if (bundleSize?.mobile_concern) {
      recommendations.push({
        priority: 'ALTA',
        action: 'Implementar code splitting e lazy loading',
        impact: 'Alto - Redução significativa no tempo de carregamento inicial'
      });
    }

    this.results.summary.recommendations = recommendations;
  }

  /**
   * Gera relatório em markdown
   */
  async generateMarkdownReport() {
    const reportPath = path.join(process.cwd(), 'docs', 'baseline-performance-mobile.md');
    
    let markdown = `# 📊 Baseline de Performance Mobile\n\n`;
    markdown += `*Data: ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
    markdown += `## 📋 Resumo Executivo\n\n`;
    markdown += `**Score Geral: ${this.results.summary.overall_score}/100**\n\n`;
    
    // Scores por categoria
    markdown += `### Scores por Categoria:\n\n`;
    markdown += `| Categoria | Score | Status |\n`;
    markdown += `|-----------|-------|--------|\n`;
    markdown += `| Otimização de Hooks | ${this.results.summary.scores.hooks_optimization}% | ${this.getStatusEmoji(this.results.summary.scores.hooks_optimization)} |\n`;
    markdown += `| Implementação de Cache | ${this.results.summary.scores.cache_implementation}% | ${this.getStatusEmoji(this.results.summary.scores.cache_implementation)} |\n`;
    markdown += `| Eficiência de Bundle | ${this.results.summary.scores.bundle_efficiency}% | ${this.getStatusEmoji(this.results.summary.scores.bundle_efficiency)} |\n\n`;

    // Recomendações
    if (this.results.summary.recommendations?.length > 0) {
      markdown += `## 🎯 Recomendações Prioritárias\n\n`;
      this.results.summary.recommendations.forEach((rec, i) => {
        markdown += `### ${i + 1}. ${rec.action}\n`;
        markdown += `- **Prioridade:** ${rec.priority}\n`;
        markdown += `- **Impacto:** ${rec.impact}\n\n`;
      });
    }

    fs.writeFileSync(reportPath, markdown);
  }

  /**
   * Retorna emoji baseado no score
   */
  getStatusEmoji(score) {
    if (score >= 80) return '✅ Excelente';
    if (score >= 60) return '⚡ Bom';
    if (score >= 40) return '⚠️ Precisa Melhorar';
    return '🔥 Crítico';
  }

  /**
   * Calcula tamanho de diretório
   */
  async getDirectorySize(dirPath) {
    try {
      const stats = fs.statSync(dirPath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(dirPath);
        const sizes = await Promise.all(
          files.map(file => this.getDirectorySize(path.join(dirPath, file)))
        );
        return sizes.reduce((total, size) => total + size, 0);
      } else {
        return stats.size;
      }
    } catch {
      return 0;
    }
  }
}

// Executar baseline se chamado diretamente
if (require.main === module) {
  const baseline = new MobilePerformanceBaseline();
  baseline.run().catch(console.error);
}

module.exports = MobilePerformanceBaseline;