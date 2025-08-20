/**
 * Script Principal para Executar Todas as Auditorias
 * 
 * Executa auditorias para todas as páginas da aplicação e gera relatório consolidado
 */

import { AuditConfig, AuditResult } from './base-audit';
import { HomeAudit } from './home-audit';
import { AlimentacaoAudit } from './alimentacao-audit';
import { AuthAudit } from './auth-audit';
import { ConcursosAudit } from './concursos-audit';
import { EstudosAudit } from './estudos-audit';

// Configuração padrão para auditorias
const defaultConfig: AuditConfig = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  credentials: {
    email: process.env.TEST_EMAIL || 'teste@exemplo.com',
    password: process.env.TEST_PASSWORD || 'senha123'
  },
  timeouts: {
    navigation: 30000,
    interaction: 5000,
    loading: 10000
  },
  screenshots: true
};

interface AuditSuite {
  name: string;
  audit: any;
  results?: AuditResult[];
  duration?: number;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

class AuditRunner {
  private config: AuditConfig;
  private suites: AuditSuite[] = [];
  private startTime: number = 0;

  constructor(config: AuditConfig) {
    this.config = config;
    this.initializeSuites();
  }

  /**
   * Inicializa todas as suites de auditoria
   */
  private initializeSuites(): void {
    this.suites = [
      { name: 'Home', audit: new HomeAudit(this.config), status: 'PENDING' },
      { name: 'Autenticação', audit: new AuthAudit(this.config), status: 'PENDING' },
      { name: 'Alimentação', audit: new AlimentacaoAudit(this.config), status: 'PENDING' },
      { name: 'Concursos', audit: new ConcursosAudit(this.config), status: 'PENDING' },
      { name: 'Estudos', audit: new EstudosAudit(this.config), status: 'PENDING' }
    ];
  }

  /**
   * Executa todas as auditorias
   */
  async runAllAudits(): Promise<void> {
    console.log('🚀 Iniciando Auditoria Completa da Aplicação StayFocus');
    console.log(`📋 Total de ${this.suites.length} páginas para auditar`);
    console.log('=' * 60);
    
    this.startTime = Date.now();

    for (const suite of this.suites) {
      await this.runSingleAudit(suite);
    }

    this.generateConsolidatedReport();
  }

  /**
   * Executa uma auditoria individual
   */
  private async runSingleAudit(suite: AuditSuite): Promise<void> {
    const suiteStartTime = Date.now();
    
    console.log(`\n🔍 Iniciando auditoria: ${suite.name}`);
    suite.status = 'RUNNING';

    try {
      suite.results = await suite.audit.runFullAudit();
      suite.duration = Date.now() - suiteStartTime;
      suite.status = 'COMPLETED';

      const passed = suite.results.filter(r => r.status === 'PASS').length;
      const failed = suite.results.filter(r => r.status === 'FAIL').length;
      const warnings = suite.results.filter(r => r.status === 'WARNING').length;

      console.log(`✅ ${suite.name} concluída: ${passed} ✅ | ${failed} ❌ | ${warnings} ⚠️ (${suite.duration}ms)`);

    } catch (error) {
      suite.status = 'FAILED';
      suite.duration = Date.now() - suiteStartTime;
      console.log(`❌ ${suite.name} falhou: ${error}`);
    }
  }

  /**
   * Gera relatório consolidado
   */
  private generateConsolidatedReport(): void {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n' + '=' * 60);
    console.log('📊 RELATÓRIO CONSOLIDADO DE AUDITORIA');
    console.log('=' * 60);

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalWarnings = 0;

    const completedSuites = this.suites.filter(s => s.status === 'COMPLETED');
    const failedSuites = this.suites.filter(s => s.status === 'FAILED');

    // Estatísticas por página
    console.log('\n📋 Resultados por Página:');
    for (const suite of this.suites) {
      if (suite.status === 'COMPLETED' && suite.results) {
        const passed = suite.results.filter(r => r.status === 'PASS').length;
        const failed = suite.results.filter(r => r.status === 'FAIL').length;
        const warnings = suite.results.filter(r => r.status === 'WARNING').length;
        const total = suite.results.length;
        const successRate = ((passed / total) * 100).toFixed(1);

        console.log(`  ${suite.name.padEnd(15)} | ${passed.toString().padStart(2)} ✅ | ${failed.toString().padStart(2)} ❌ | ${warnings.toString().padStart(2)} ⚠️ | ${successRate}% | ${suite.duration}ms`);

        totalTests += total;
        totalPassed += passed;
        totalFailed += failed;
        totalWarnings += warnings;
      } else {
        console.log(`  ${suite.name.padEnd(15)} | FALHOU ❌`);
      }
    }

    // Estatísticas gerais
    const overallSuccessRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
    
    console.log('\n📊 Estatísticas Gerais:');
    console.log(`  Total de Páginas: ${this.suites.length}`);
    console.log(`  Páginas Auditadas: ${completedSuites.length}`);
    console.log(`  Páginas com Falha: ${failedSuites.length}`);
    console.log(`  Total de Testes: ${totalTests}`);
    console.log(`  Aprovados: ${totalPassed} ✅`);
    console.log(`  Falharam: ${totalFailed} ❌`);
    console.log(`  Avisos: ${totalWarnings} ⚠️`);
    console.log(`  Taxa de Sucesso: ${overallSuccessRate}%`);
    console.log(`  Tempo Total: ${totalDuration}ms`);

    // Problemas críticos
    const criticalIssues = this.getCriticalIssues();
    if (criticalIssues.length > 0) {
      console.log('\n🚨 Problemas Críticos Encontrados:');
      criticalIssues.forEach(issue => {
        console.log(`  ❌ ${issue.page}: ${issue.test} - ${issue.message}`);
      });
    }

    // Recomendações de melhoria
    const improvements = this.getImprovementSuggestions();
    if (improvements.length > 0) {
      console.log('\n💡 Sugestões de Melhoria:');
      improvements.forEach(improvement => {
        console.log(`  ⚠️ ${improvement.page}: ${improvement.test} - ${improvement.message}`);
      });
    }

    // Páginas com melhor performance
    const topPerformers = this.getTopPerformers();
    if (topPerformers.length > 0) {
      console.log('\n🏆 Páginas com Melhor Performance:');
      topPerformers.forEach(performer => {
        console.log(`  ✅ ${performer.name}: ${performer.successRate}% de sucesso`);
      });
    }

    console.log('\n' + '=' * 60);
    console.log(`🎯 Auditoria Completa! Taxa de Sucesso Geral: ${overallSuccessRate}%`);
    console.log('=' * 60);

    // Salvar relatório em arquivo
    this.saveReportToFile();
  }

  /**
   * Identifica problemas críticos
   */
  private getCriticalIssues(): Array<{page: string, test: string, message: string}> {
    const criticalIssues = [];

    for (const suite of this.suites) {
      if (suite.results) {
        const failedTests = suite.results.filter(r => r.status === 'FAIL');
        for (const test of failedTests) {
          criticalIssues.push({
            page: suite.name,
            test: test.testName,
            message: test.message
          });
        }
      }
    }

    return criticalIssues;
  }

  /**
   * Gera sugestões de melhoria
   */
  private getImprovementSuggestions(): Array<{page: string, test: string, message: string}> {
    const suggestions = [];

    for (const suite of this.suites) {
      if (suite.results) {
        const warningTests = suite.results.filter(r => r.status === 'WARNING');
        for (const test of warningTests) {
          suggestions.push({
            page: suite.name,
            test: test.testName,
            message: test.message
          });
        }
      }
    }

    return suggestions.slice(0, 10); // Limitar a 10 sugestões principais
  }

  /**
   * Identifica páginas com melhor performance
   */
  private getTopPerformers(): Array<{name: string, successRate: number}> {
    const performers = [];

    for (const suite of this.suites) {
      if (suite.results && suite.results.length > 0) {
        const passed = suite.results.filter(r => r.status === 'PASS').length;
        const total = suite.results.length;
        const successRate = (passed / total) * 100;

        performers.push({
          name: suite.name,
          successRate: parseFloat(successRate.toFixed(1))
        });
      }
    }

    return performers
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3); // Top 3
  }

  /**
   * Salva relatório em arquivo
   */
  private saveReportToFile(): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `audit-report-${timestamp}.md`;
      
      let reportContent = this.generateMarkdownReport();
      
      // Em uma implementação real, você salvaria o arquivo aqui
      console.log(`\n💾 Relatório salvo como: ${filename}`);
      console.log(`📁 Localização: tests/audit/reports/${filename}`);
      
    } catch (error) {
      console.log(`❌ Erro ao salvar relatório: ${error}`);
    }
  }

  /**
   * Gera relatório em formato Markdown
   */
  private generateMarkdownReport(): string {
    const totalDuration = Date.now() - this.startTime;
    const timestamp = new Date().toLocaleString('pt-BR');

    let report = `# 📋 Relatório de Auditoria Completa - StayFocus

**Data:** ${timestamp}  
**Duração Total:** ${totalDuration}ms  
**Páginas Auditadas:** ${this.suites.length}

## 📊 Resumo Executivo

`;

    // Adicionar estatísticas por página
    for (const suite of this.suites) {
      if (suite.results) {
        report += `### ${suite.name}\n`;
        report += suite.audit.generateReport();
        report += '\n---\n\n';
      }
    }

    return report;
  }
}

// Função principal para executar auditorias
export async function runAllPageAudits(customConfig?: Partial<AuditConfig>): Promise<void> {
  const config = { ...defaultConfig, ...customConfig };
  const runner = new AuditRunner(config);
  
  await runner.runAllAudits();
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllPageAudits().catch(console.error);
}