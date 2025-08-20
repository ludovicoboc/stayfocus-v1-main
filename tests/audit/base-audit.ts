/**
 * Classe Base para Auditorias das Páginas
 * 
 * Fornece funcionalidades comuns para todos os scripts de auditoria
 */

export interface AuditResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  duration: number;
  screenshot?: string;
  details?: any;
}

export interface AuditConfig {
  baseUrl: string;
  credentials: {
    email: string;
    password: string;
  };
  timeouts: {
    navigation: number;
    interaction: number;
    loading: number;
  };
  screenshots: boolean;
}

export abstract class BaseAudit {
  protected config: AuditConfig;
  protected results: AuditResult[] = [];
  protected startTime: number = 0;
  protected pageName: string;

  constructor(config: AuditConfig, pageName: string) {
    this.config = config;
    this.pageName = pageName;
  }

  /**
   * Executa auditoria completa da página
   */
  async runFullAudit(): Promise<AuditResult[]> {
    console.log(`🚀 Iniciando Auditoria da Página: ${this.pageName}`);
    this.startTime = Date.now();

    try {
      // Testes básicos comuns
      await this.testPageAccess();
      await this.testAuthentication();
      await this.testPageLoad();
      
      // Testes específicos da página (implementados nas classes filhas)
      await this.runPageSpecificTests();
      
      // Testes comuns de UI/UX
      await this.testResponsiveness();
      await this.testLoadingStates();
      await this.testErrorHandling();
      await this.testPagePerformance();
      await this.testAccessibility();

    } catch (error) {
      this.addResult('AUDIT_EXECUTION', 'FAIL', `Erro durante execução: ${error}`, 0);
    }

    const totalDuration = Date.now() - this.startTime;
    console.log(`✅ Auditoria da página ${this.pageName} concluída em ${totalDuration}ms`);

    return this.results;
  }

  /**
   * Método abstrato para testes específicos de cada página
   */
  protected abstract runPageSpecificTests(): Promise<void>;

  /**
   * Testa acesso inicial à página
   */
  protected async testPageAccess(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🌐 Testando acesso à homepage...');
      await this.navigate(this.config.baseUrl);

      const pageTitle = await this.evaluate(() => document.title);

      if (pageTitle.includes('StayFocus')) {
        this.addResult('PAGE_ACCESS', 'PASS', 'Homepage carregada com sucesso', Date.now() - startTime);
      } else {
        this.addResult('PAGE_ACCESS', 'FAIL', `Título inesperado: ${pageTitle}`, Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('homepage_access');
      }

    } catch (error) {
      this.addResult('PAGE_ACCESS', 'FAIL', `Erro ao acessar homepage: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa processo de autenticação
   */
  protected async testAuthentication(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🔐 Testando autenticação...');

      await this.navigate(`${this.config.baseUrl}/auth`);

      await this.fill('input[type="email"]', this.config.credentials.email);
      await this.fill('input[type="password"]', this.config.credentials.password);

      if (this.config.screenshots) {
        await this.takeScreenshot('auth_form_filled');
      }

      await this.click('button[type="submit"]');
      await this.waitForTimeout(3000);

      const currentUrl = await this.evaluate(() => window.location.href);

      if (currentUrl !== `${this.config.baseUrl}/auth`) {
        this.addResult('AUTHENTICATION', 'PASS', 'Login realizado com sucesso', Date.now() - startTime);
      } else {
        const errorMessage = await this.evaluate(() => {
          const errorElements = document.querySelectorAll('[class*="error"], [role="alert"]');
          return Array.from(errorElements).map(el => el.textContent).join('; ');
        });

        this.addResult('AUTHENTICATION', 'FAIL', `Login falhou: ${errorMessage}`, Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('AUTHENTICATION', 'FAIL', `Erro durante autenticação: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa carregamento básico da página
   */
  protected async testPageLoad(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`📄 Testando carregamento da página ${this.pageName}...`);

      const pageUrl = this.getPageUrl();
      await this.navigate(pageUrl);

      const pageElements = await this.evaluate(() => {
        return {
          hasContent: document.body.children.length > 0,
          hasNavigation: !!document.querySelector('nav, [role="navigation"]'),
          hasMain: !!document.querySelector('main, [role="main"]'),
          title: document.title
        };
      });

      let issues = [];
      if (!pageElements.hasContent) {
        issues.push('Página sem conteúdo');
      }
      if (!pageElements.hasNavigation) {
        issues.push('Navegação não encontrada');
      }

      if (issues.length === 0) {
        this.addResult('PAGE_LOAD', 'PASS', 'Página carregada com sucesso', Date.now() - startTime);
      } else {
        this.addResult('PAGE_LOAD', 'WARNING', `Problemas encontrados: ${issues.join(', ')}`, Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot(`${this.pageName}_loaded`);
      }

    } catch (error) {
      this.addResult('PAGE_LOAD', 'FAIL', `Erro ao carregar página: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa responsividade
   */
  protected async testResponsiveness(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📱 Testando responsividade...');

      const viewports = [
        { width: 320, height: 568, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' }
      ];

      for (const viewport of viewports) {
        await this.setViewport(viewport.width, viewport.height);
        await this.waitForTimeout(1000);

        const layoutInfo = await this.evaluate(() => {
          const body = document.body;
          const nav = document.querySelector('nav, [role="navigation"]');

          return {
            bodyVisible: !!body && getComputedStyle(body).display !== 'none',
            navVisible: !!nav && getComputedStyle(nav).display !== 'none',
            overflowIssues: document.documentElement.scrollWidth > window.innerWidth
          };
        });

        if (layoutInfo.bodyVisible && layoutInfo.navVisible && !layoutInfo.overflowIssues) {
          this.addResult(`RESPONSIVE_${viewport.name.toUpperCase()}`, 'PASS', `Layout responsivo em ${viewport.name}`, Date.now() - startTime);
        } else {
          const issues = [];
          if (!layoutInfo.bodyVisible) issues.push('body não visível');
          if (!layoutInfo.navVisible) issues.push('navegação não visível');
          if (layoutInfo.overflowIssues) issues.push('overflow horizontal');

          this.addResult(`RESPONSIVE_${viewport.name.toUpperCase()}`, 'WARNING', `Problemas em ${viewport.name}: ${issues.join(', ')}`, Date.now() - startTime);
        }

        if (this.config.screenshots) {
          await this.takeScreenshot(`${this.pageName}_responsive_${viewport.name}`);
        }
      }

    } catch (error) {
      this.addResult('RESPONSIVENESS', 'FAIL', `Erro ao testar responsividade: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa estados de carregamento
   */
  protected async testLoadingStates(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('⏳ Testando estados de carregamento...');

      const pageUrl = this.getPageUrl();
      await this.navigate(pageUrl);

      const loadingStates = await this.evaluate(() => {
        const loadingTexts = ['Carregando', 'Loading', 'carregando'];
        const loadingElements = document.querySelectorAll('*');

        let hasLoadingText = false;
        let hasSpinners = false;

        for (const element of loadingElements) {
          const text = element.textContent?.toLowerCase() || '';
          if (loadingTexts.some(loading => text.includes(loading))) {
            hasLoadingText = true;
            break;
          }
        }

        const spinners = document.querySelectorAll('[class*="spin"], [class*="loading"], [class*="loader"]');
        hasSpinners = spinners.length > 0;

        return { hasLoadingText, hasSpinners };
      });

      if (loadingStates.hasLoadingText || loadingStates.hasSpinners) {
        this.addResult('LOADING_STATES', 'PASS', 'Estados de carregamento implementados', Date.now() - startTime);
      } else {
        this.addResult('LOADING_STATES', 'WARNING', 'Estados de carregamento não detectados', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('LOADING_STATES', 'FAIL', `Erro ao testar loading: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa tratamento de erros
   */
  protected async testErrorHandling(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('⚠️ Testando tratamento de erros...');

      await this.navigate(`${this.getPageUrl()}/pagina-inexistente`);

      const errorHandling = await this.evaluate(() => {
        const body = document.body.textContent?.toLowerCase() || '';
        return {
          has404: body.includes('404') || body.includes('não encontrado') || body.includes('not found'),
          hasErrorMessage: body.includes('erro') || body.includes('error'),
          hasRedirect: window.location.href !== `${this.getPageUrl()}/pagina-inexistente`
        };
      });

      if (errorHandling.has404 || errorHandling.hasErrorMessage || errorHandling.hasRedirect) {
        this.addResult('ERROR_HANDLING', 'PASS', 'Tratamento de erros funcionando', Date.now() - startTime);
      } else {
        this.addResult('ERROR_HANDLING', 'WARNING', 'Tratamento de erros não detectado', Date.now() - startTime);
      }

      await this.navigate(this.getPageUrl());

    } catch (error) {
      this.addResult('ERROR_HANDLING', 'FAIL', `Erro ao testar tratamento de erros: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa performance da página
   */
  protected async testPagePerformance(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🚀 Testando performance...');

      const performanceMetrics = await this.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as any;

        return {
          loadTime: navigation?.loadEventEnd - navigation?.loadEventStart,
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
          resourceCount: performance.getEntriesByType('resource').length
        };
      });

      const issues = [];
      if (performanceMetrics.loadTime > 3000) {
        issues.push(`Tempo de carregamento alto: ${performanceMetrics.loadTime}ms`);
      }
      if (performanceMetrics.resourceCount > 50) {
        issues.push(`Muitos recursos: ${performanceMetrics.resourceCount}`);
      }

      if (issues.length === 0) {
        this.addResult('PERFORMANCE', 'PASS', `Performance adequada: ${performanceMetrics.loadTime}ms`, Date.now() - startTime, undefined, performanceMetrics);
      } else {
        this.addResult('PERFORMANCE', 'WARNING', issues.join('; '), Date.now() - startTime, undefined, performanceMetrics);
      }

    } catch (error) {
      this.addResult('PERFORMANCE', 'FAIL', `Erro ao medir performance: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa acessibilidade básica
   */
  protected async testAccessibility(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('♿ Testando acessibilidade...');

      const a11yIssues = await this.evaluate(() => {
        const issues = [];

        const buttons = document.querySelectorAll('button');
        buttons.forEach((button, index) => {
          if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
            issues.push(`Botão ${index} sem texto ou aria-label`);
          }
        });

        const inputs = document.querySelectorAll('input');
        inputs.forEach((input, index) => {
          const hasLabel = !!document.querySelector(`label[for="${input.id}"]`) ||
                           !!input.getAttribute('aria-label') ||
                           !!input.getAttribute('placeholder');
          if (!hasLabel) {
            issues.push(`Input ${index} sem label`);
          }
        });

        return issues;
      });

      if (a11yIssues.length === 0) {
        this.addResult('ACCESSIBILITY', 'PASS', 'Nenhum problema de acessibilidade detectado', Date.now() - startTime);
      } else {
        this.addResult('ACCESSIBILITY', 'WARNING', `Problemas encontrados: ${a11yIssues.join('; ')}`, Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('ACCESSIBILITY', 'FAIL', `Erro ao testar acessibilidade: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Retorna URL específica da página
   */
  protected abstract getPageUrl(): string;

  /**
   * Métodos auxiliares para interação com a página
   */
  protected async navigate(url: string): Promise<void> {
    console.log(`Navegando para: ${url}`);
  }

  protected async click(selector: string): Promise<void> {
    console.log(`Clicando em: ${selector}`);
  }

  protected async fill(selector: string, value: string): Promise<void> {
    console.log(`Preenchendo ${selector} com: ${value}`);
  }

  protected async evaluate(script: () => any): Promise<any> {
    console.log(`Executando script: ${script.toString()}`);
    return {};
  }

  protected async takeScreenshot(name: string): Promise<void> {
    console.log(`Screenshot: ${name}`);
  }

  protected async waitForTimeout(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async setViewport(width: number, height: number): Promise<void> {
    console.log(`Configurando viewport: ${width}x${height}`);
  }

  /**
   * Adiciona resultado ao relatório
   */
  protected addResult(testName: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, duration: number, screenshot?: string, details?: any): void {
    this.results.push({
      testName,
      status,
      message,
      duration,
      screenshot,
      details
    });

    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${testName}: ${message} (${duration}ms)`);
  }

  /**
   * Gera relatório da auditoria
   */
  generateReport(): string {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;

    const totalDuration = Date.now() - this.startTime;

    let report = `
# 📋 RELATÓRIO DE AUDITORIA - ${this.pageName.toUpperCase()}

## 📊 Resumo Executivo
- **Total de Testes**: ${totalTests}
- **✅ Aprovados**: ${passed}
- **❌ Falharam**: ${failed}
- **⚠️ Avisos**: ${warnings}
- **⏱️ Duração Total**: ${totalDuration}ms
- **Taxa de Sucesso**: ${((passed / totalTests) * 100).toFixed(1)}%

## 📋 Resultados Detalhados

`;

    for (const result of this.results) {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      report += `### ${statusIcon} ${result.testName}
- **Status**: ${result.status}
- **Mensagem**: ${result.message}
- **Duração**: ${result.duration}ms
${result.screenshot ? `- **Screenshot**: ${result.screenshot}` : ''}
${result.details ? `- **Detalhes**: \`\`\`json\n${JSON.stringify(result.details, null, 2)}\n\`\`\`` : ''}

`;
    }

    report += `
## 🎯 Recomendações

### Prioridade Alta
${this.results.filter(r => r.status === 'FAIL').map(r => `- **${r.testName}**: ${r.message}`).join('\n')}

### Melhorias Sugeridas
${this.results.filter(r => r.status === 'WARNING').map(r => `- **${r.testName}**: ${r.message}`).join('\n')}

---
*Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;

    return report;
  }
}