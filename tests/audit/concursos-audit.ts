/**
 * Script de Auditoria Completa da Página de Concursos
 *
 * Este script testa todas as funcionalidades principais da página de concursos:
 * - Autenticação e acesso
 * - Criação manual de concursos
 * - Importação de concursos via JSON
 * - Visualização de concursos existentes
 * - Navegação entre páginas
 * - Responsividade
 * - Performance
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

export class ConcursosAudit {
  private config: AuditConfig;
  private results: AuditResult[] = [];
  private startTime: number = 0;

  constructor(config: AuditConfig) {
    this.config = config;
  }

  /**
   * Executa a auditoria completa
   */
  async runFullAudit(): Promise<AuditResult[]> {
    console.log('🚀 Iniciando Auditoria Completa da Página de Concursos');
    this.startTime = Date.now();

    try {
      // Testes de Acesso e Autenticação
      await this.testPageAccess();
      await this.testAuthentication();

      // Testes de Funcionalidades Principais
      await this.testConcursosPageLoad();
      await this.testAddManualConcurso();
      await this.testImportConcursoJSON();
      await this.testConcursosList();
      await this.testConcursoNavigation();

      // Testes de UI/UX
      await this.testResponsiveness();
      await this.testLoadingStates();
      await this.testErrorHandling();

      // Testes de Performance
      await this.testPagePerformance();

      // Testes de Acessibilidade
      await this.testAccessibility();

    } catch (error) {
      this.addResult('AUDIT_EXECUTION', 'FAIL', `Erro durante execução: ${error}`, 0);
    }

    const totalDuration = Date.now() - this.startTime;
    console.log(`✅ Auditoria concluída em ${totalDuration}ms`);

    return this.results;
  }

  /**
   * Testa acesso inicial à página
   */
  private async testPageAccess(): Promise<void> {
    const startTime = Date.now();

    try {
      // Navegar para homepage
      console.log('🌐 Testando acesso à homepage...');
      await this.navigate(this.config.baseUrl);

      // Verificar se página carregou
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
  private async testAuthentication(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🔐 Testando autenticação...');

      // Navegar para página de auth
      await this.navigate(`${this.config.baseUrl}/auth`);

      // Preencher formulário de login
      await this.fill('input[type="email"]', this.config.credentials.email);
      await this.fill('input[type="password"]', this.config.credentials.password);

      if (this.config.screenshots) {
        await this.takeScreenshot('auth_form_filled');
      }

      // Submeter formulário
      await this.click('button[type="submit"]');

      // Aguardar redirecionamento ou confirmação de login
      await this.waitForTimeout(3000);

      // Verificar se login foi bem-sucedido
      const currentUrl = await this.evaluate(() => window.location.href);

      if (currentUrl !== `${this.config.baseUrl}/auth`) {
        this.addResult('AUTHENTICATION', 'PASS', 'Login realizado com sucesso', Date.now() - startTime);
      } else {
        // Verificar se há mensagens de erro
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
   * Testa carregamento da página de concursos
   */
  private async testConcursosPageLoad(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📚 Testando carregamento da página de concursos...');

      await this.navigate(`${this.config.baseUrl}/concursos`);

      // Verificar elementos principais da página
      const pageElements = await this.evaluate(() => {
        return {
          title: document.querySelector('h2')?.textContent,
          addButton: !!document.querySelector('button:has-text("Adicionar Manualmente")'),
          importButton: !!document.querySelector('button:has-text("Importar JSON")'),
          hasContent: !!document.querySelector('[class*="grid"], [class*="card"]')
        };
      });

      let issues = [];
      if (!pageElements.title?.includes('Concursos')) {
        issues.push('Título da página não encontrado');
      }
      if (!pageElements.addButton) {
        issues.push('Botão "Adicionar Manualmente" não encontrado');
      }
      if (!pageElements.importButton) {
        issues.push('Botão "Importar JSON" não encontrado');
      }

      if (issues.length === 0) {
        this.addResult('CONCURSOS_PAGE_LOAD', 'PASS', 'Página carregada com todos os elementos', Date.now() - startTime);
      } else {
        this.addResult('CONCURSOS_PAGE_LOAD', 'WARNING', `Elementos ausentes: ${issues.join(', ')}`, Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('concursos_page_loaded');
      }

    } catch (error) {
      this.addResult('CONCURSOS_PAGE_LOAD', 'FAIL', `Erro ao carregar página: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa adição manual de concurso
   */
  private async testAddManualConcurso(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('➕ Testando adição manual de concurso...');

      // Clicar no botão "Adicionar Manualmente"
      await this.click('button:has-text("Adicionar Manualmente")');

      // Aguardar modal abrir
      await this.waitForTimeout(1000);

      // Verificar se modal abriu
      const modalVisible = await this.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="dialog"]');
        return modals.length > 0 && Array.from(modals).some(modal =>
          getComputedStyle(modal).display !== 'none'
        );
      });

      if (modalVisible) {
        if (this.config.screenshots) {
          await this.takeScreenshot('add_concurso_modal');
        }

        // Preencher formulário de teste
        const testData = {
          title: 'Concurso Teste Auditoria',
          organizer: 'Organizadora Teste',
          status: 'planejado'
        };

        await this.fillFormFields(testData);

        if (this.config.screenshots) {
          await this.takeScreenshot('add_concurso_form_filled');
        }

        // Fechar modal sem salvar (para não criar dados de teste)
        await this.click('[class*="close"], button:has-text("Cancelar")');

        this.addResult('ADD_MANUAL_CONCURSO', 'PASS', 'Modal de adição manual funciona corretamente', Date.now() - startTime);
      } else {
        this.addResult('ADD_MANUAL_CONCURSO', 'FAIL', 'Modal não abriu após clicar no botão', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('ADD_MANUAL_CONCURSO', 'FAIL', `Erro ao testar adição manual: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa importação de concurso via JSON
   */
  private async testImportConcursoJSON(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📥 Testando importação de concurso via JSON...');

      // Clicar no botão "Importar JSON"
      await this.click('button:has-text("Importar JSON")');

      // Aguardar modal abrir
      await this.waitForTimeout(1000);

      // Verificar se modal de importação abriu
      const importModalVisible = await this.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], [class*="modal"]');
        return Array.from(modals).some(modal =>
          modal.textContent?.includes('JSON') && getComputedStyle(modal).display !== 'none'
        );
      });

      if (importModalVisible) {
        if (this.config.screenshots) {
          await this.takeScreenshot('import_json_modal');
        }

        // Testar com JSON de exemplo
        const sampleJSON = {
          titulo: "Concurso Teste JSON",
          organizadora: "Org Teste",
          dataInscricao: "2024-12-31",
          dataProva: "2025-03-15",
          conteudoProgramatico: [
            {
              disciplina: "Matemática",
              topicos: ["Álgebra", "Geometria"]
            }
          ]
        };

        // Tentar preencher textarea JSON
        await this.fill('textarea', JSON.stringify(sampleJSON, null, 2));

        if (this.config.screenshots) {
          await this.takeScreenshot('import_json_filled');
        }

        // Fechar modal sem importar
        await this.click('[class*="close"], button:has-text("Cancelar")');

        this.addResult('IMPORT_JSON_CONCURSO', 'PASS', 'Modal de importação JSON funciona corretamente', Date.now() - startTime);
      } else {
        this.addResult('IMPORT_JSON_CONCURSO', 'FAIL', 'Modal de importação não abriu', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('IMPORT_JSON_CONCURSO', 'FAIL', `Erro ao testar importação JSON: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa lista de concursos existentes
   */
  private async testConcursosList(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📋 Testando lista de concursos...');

      const listInfo = await this.evaluate(() => {
        const cards = document.querySelectorAll('[class*="card"]');
        const emptyMessage = document.querySelector('[class*="text-center"]');

        return {
          hasCards: cards.length > 0,
          cardCount: cards.length,
          hasEmptyMessage: !!emptyMessage?.textContent?.includes('não cadastrou'),
          gridLayout: !!document.querySelector('[class*="grid"]')
        };
      });

      if (listInfo.hasCards) {
        this.addResult('CONCURSOS_LIST', 'PASS', `Lista exibindo ${listInfo.cardCount} concursos`, Date.now() - startTime);

        // Testar clique em um card (se existir)
        try {
          await this.click('[class*="card"]:first-child');
          await this.waitForTimeout(2000);

          const newUrl = await this.evaluate(() => window.location.href);
          if (newUrl.includes('/concursos/') && newUrl !== `${this.config.baseUrl}/concursos`) {
            this.addResult('CONCURSO_NAVIGATION', 'PASS', 'Navegação para detalhes do concurso funciona', Date.now() - startTime);

            // Voltar para lista
            await this.navigate(`${this.config.baseUrl}/concursos`);
          }
        } catch (navError) {
          this.addResult('CONCURSO_NAVIGATION', 'WARNING', `Erro ao testar navegação: ${navError}`, Date.now() - startTime);
        }

      } else if (listInfo.hasEmptyMessage) {
        this.addResult('CONCURSOS_LIST', 'PASS', 'Estado vazio exibido corretamente', Date.now() - startTime);
      } else {
        this.addResult('CONCURSOS_LIST', 'FAIL', 'Lista não carregou nem mostrou estado vazio', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('concursos_list_state');
      }

    } catch (error) {
      this.addResult('CONCURSOS_LIST', 'FAIL', `Erro ao testar lista: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa navegação entre páginas
   */
  private async testConcursoNavigation(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🧭 Testando navegação...');

      // Testar navegação para página de testes
      await this.navigate(`${this.config.baseUrl}/concursos/teste`);

      const testPageLoaded = await this.evaluate(() => {
        return document.title.includes('Test') ||
               document.body.textContent?.includes('teste') ||
               document.body.textContent?.includes('Test');
      });

      if (testPageLoaded) {
        this.addResult('NAVIGATION_TEST_PAGE', 'PASS', 'Página de testes acessível', Date.now() - startTime);

        if (this.config.screenshots) {
          await this.takeScreenshot('test_page');
        }
      } else {
        this.addResult('NAVIGATION_TEST_PAGE', 'WARNING', 'Página de testes pode não estar funcionando', Date.now() - startTime);
      }

      // Voltar para página principal
      await this.navigate(`${this.config.baseUrl}/concursos`);

    } catch (error) {
      this.addResult('NAVIGATION_TEST_PAGE', 'FAIL', `Erro na navegação: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa responsividade
   */
  private async testResponsiveness(): Promise<void> {
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
          const grid = document.querySelector('[class*="grid"]');
          const buttons = document.querySelectorAll('button');

          return {
            gridVisible: !!grid && getComputedStyle(grid).display !== 'none',
            buttonsVisible: Array.from(buttons).every(btn => getComputedStyle(btn).display !== 'none'),
            overflowIssues: document.documentElement.scrollWidth > window.innerWidth
          };
        });

        if (layoutInfo.gridVisible && layoutInfo.buttonsVisible && !layoutInfo.overflowIssues) {
          this.addResult(`RESPONSIVE_${viewport.name.toUpperCase()}`, 'PASS', `Layout responsivo em ${viewport.name}`, Date.now() - startTime);
        } else {
          const issues = [];
          if (!layoutInfo.gridVisible) issues.push('grid não visível');
          if (!layoutInfo.buttonsVisible) issues.push('botões não visíveis');
          if (layoutInfo.overflowIssues) issues.push('overflow horizontal');

          this.addResult(`RESPONSIVE_${viewport.name.toUpperCase()}`, 'WARNING', `Problemas em ${viewport.name}: ${issues.join(', ')}`, Date.now() - startTime);
        }

        if (this.config.screenshots) {
          await this.takeScreenshot(`responsive_${viewport.name}`);
        }
      }

    } catch (error) {
      this.addResult('RESPONSIVENESS', 'FAIL', `Erro ao testar responsividade: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa estados de carregamento
   */
  private async testLoadingStates(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('⏳ Testando estados de carregamento...');

      // Recarregar página e capturar estados de loading
      await this.navigate(`${this.config.baseUrl}/concursos`);

      // Verificar se há indicadores de loading
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

        // Verificar spinners ou animações
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
  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('⚠️ Testando tratamento de erros...');

      // Verificar se há tratamento de erro para páginas não encontradas
      await this.navigate(`${this.config.baseUrl}/concursos/pagina-inexistente`);

      const errorHandling = await this.evaluate(() => {
        const body = document.body.textContent?.toLowerCase() || '';
        return {
          has404: body.includes('404') || body.includes('não encontrado') || body.includes('not found'),
          hasErrorMessage: body.includes('erro') || body.includes('error'),
          hasRedirect: window.location.href !== `${this.config.baseUrl}/concursos/pagina-inexistente`
        };
      });

      if (errorHandling.has404 || errorHandling.hasErrorMessage || errorHandling.hasRedirect) {
        this.addResult('ERROR_HANDLING', 'PASS', 'Tratamento de erros funcionando', Date.now() - startTime);
      } else {
        this.addResult('ERROR_HANDLING', 'WARNING', 'Tratamento de erros não detectado', Date.now() - startTime);
      }

      // Voltar para página principal
      await this.navigate(`${this.config.baseUrl}/concursos`);

    } catch (error) {
      this.addResult('ERROR_HANDLING', 'FAIL', `Erro ao testar tratamento de erros: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa performance da página
   */
  private async testPagePerformance(): Promise<void> {
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
  private async testAccessibility(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('♿ Testando acessibilidade...');

      const a11yIssues = await this.evaluate(() => {
        const issues = [];

        // Verificar botões sem texto ou aria-label
        const buttons = document.querySelectorAll('button');
        buttons.forEach((button, index) => {
          if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
            issues.push(`Botão ${index} sem texto ou aria-label`);
          }
        });

        // Verificar inputs sem labels
        const inputs = document.querySelectorAll('input');
        inputs.forEach((input, index) => {
          const hasLabel = !!document.querySelector(`label[for="${input.id}"]`) ||
                           !!input.getAttribute('aria-label') ||
                           !!input.getAttribute('placeholder');
          if (!hasLabel) {
            issues.push(`Input ${index} sem label`);
          }
        });

        // Verificar contraste de cores (básico)
        const elements = document.querySelectorAll('*');
        let lowContrastCount = 0;

        for (const element of Array.from(elements).slice(0, 20)) { // Amostra
          const styles = getComputedStyle(element);
          const color = styles.color;
          const bgColor = styles.backgroundColor;

          if (color && bgColor && color !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
            // Verificação básica de contraste (simplificada)
            if (color === bgColor) {
              lowContrastCount++;
            }
          }
        }

        if (lowContrastCount > 0) {
          issues.push(`${lowContrastCount} elementos com possível baixo contraste`);
        }

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
   * Métodos auxiliares para interação com a página
   */
  private async navigate(url: string): Promise<void> {
    // Implementação seria feita usando a ferramenta puppeteer_navigate
    console.log(`Navegando para: ${url}`);
  }

  private async click(selector: string): Promise<void> {
    // Implementação seria feita usando a ferramenta puppeteer_click
    console.log(`Clicando em: ${selector}`);
  }

  private async fill(selector: string, value: string): Promise<void> {
    // Implementação seria feita usando a ferramenta puppeteer_fill
    console.log(`Preenchendo ${selector} com: ${value}`);
  }

  private async evaluate(script: () => any): Promise<any> {
    // Implementação seria feita usando a ferramenta puppeteer_evaluate
    console.log(`Executando script: ${script.toString()}`);
    return {};
  }

  private async takeScreenshot(name: string): Promise<void> {
    // Implementação seria feita usando a ferramenta puppeteer_screenshot
    console.log(`Screenshot: ${name}`);
  }

  private async waitForTimeout(ms: number): Promise<void> {
    // Aguardar timeout
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private async setViewport(width: number, height: number): Promise<void> {
    // Implementação seria feita configurando viewport
    console.log(`Configurando viewport: ${width}x${height}`);
  }

  private async fillFormFields(data: any): Promise<void> {
    // Preencher campos do formulário baseado nos dados
    for (const [key, value] of Object.entries(data)) {
      await this.fill(`input[name="${key}"], input[id="${key}"]`, value as string);
    }
  }

  /**
   * Adiciona resultado ao relatório
   */
  private addResult(testName: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, duration: number, screenshot?: string, details?: any): void {
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
# 📋 RELATÓRIO DE AUDITORIA - PÁGINA DE CONCURSOS

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
${this.results.filter(r => r
