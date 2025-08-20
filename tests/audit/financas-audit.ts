/**
 * Script de Auditoria da Página de Finanças
 * 
 * Testa funcionalidades específicas da página de finanças:
 * - Dashboard financeiro
 * - Controle de receitas e despesas
 * - Relatórios e gráficos
 * - Metas financeiras
 */

import { BaseAudit, AuditConfig } from './base-audit';

export class FinancasAudit extends BaseAudit {
  constructor(config: AuditConfig) {
    super(config, 'Finanças');
  }

  protected getPageUrl(): string {
    return `${this.config.baseUrl}/financas`;
  }

  protected async runPageSpecificTests(): Promise<void> {
    await this.testFinancialDashboard();
    await this.testIncomeExpenseManagement();
    await this.testFinancialReports();
    await this.testFinancialGoals();
    await this.testTransactionCategories();
  }

  /**
   * Testa dashboard financeiro
   */
  private async testFinancialDashboard(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('💰 Testando dashboard financeiro...');

      const dashboardElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasSummaryCards: document.querySelectorAll('[class*="card"], [class*="summary"]').length > 0,
          hasBalanceDisplay: textContent.includes('saldo') || textContent.includes('balance'),
          hasIncomeDisplay: textContent.includes('receita') || textContent.includes('income'),
          hasExpenseDisplay: textContent.includes('despesa') || textContent.includes('expense'),
          hasCharts: !!document.querySelector('canvas, svg, [class*="chart"]'),
          hasMoneyValues: /R\$\s*\d+/.test(textContent) || /\$\s*\d+/.test(textContent),
          addTransactionButton: !!document.querySelector('button:has-text("Adicionar"), button:has-text("Nova")')
        };
      });

      let dashboardFeatures = [];
      if (dashboardElements.hasSummaryCards) dashboardFeatures.push('cards resumo');
      if (dashboardElements.hasBalanceDisplay) dashboardFeatures.push('saldo');
      if (dashboardElements.hasIncomeDisplay) dashboardFeatures.push('receitas');
      if (dashboardElements.hasExpenseDisplay) dashboardFeatures.push('despesas');
      if (dashboardElements.hasCharts) dashboardFeatures.push('gráficos');
      if (dashboardElements.hasMoneyValues) dashboardFeatures.push('valores monetários');

      if (dashboardFeatures.length >= 4) {
        this.addResult('FINANCIAL_DASHBOARD', 'PASS', `Dashboard completo: ${dashboardFeatures.join(', ')}`, Date.now() - startTime);
      } else if (dashboardFeatures.length >= 2) {
        this.addResult('FINANCIAL_DASHBOARD', 'WARNING', `Dashboard básico: ${dashboardFeatures.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('FINANCIAL_DASHBOARD', 'WARNING', 'Dashboard financeiro não detectado', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('financial_dashboard');
      }

    } catch (error) {
      this.addResult('FINANCIAL_DASHBOARD', 'FAIL', `Erro ao testar dashboard: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa gestão de receitas e despesas
   */
  private async testIncomeExpenseManagement(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('💸 Testando gestão de receitas e despesas...');

      const managementElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          addButton: !!document.querySelector('button:has-text("Adicionar"), button:has-text("Nova")'),
          hasTransactionList: document.querySelectorAll('[class*="transaction"], [class*="item"]').length > 0,
          hasDateInputs: document.querySelectorAll('input[type="date"]').length > 0,
          hasAmountInputs: document.querySelectorAll('input[type="number"], input[placeholder*="valor"]').length > 0,
          hasCategories: document.querySelectorAll('select, [class*="category"]').length > 0,
          hasDescriptionField: !!document.querySelector('textarea, input[placeholder*="descrição"]'),
          hasIncomeExpenseToggle: textContent.includes('receita') && textContent.includes('despesa')
        };
      });

      if (managementElements.addButton) {
        try {
          await this.click('button:has-text("Adicionar"), button:has-text("Nova")');
          await this.waitForTimeout(2000);

          const formElements = await this.evaluate(() => {
            return {
              hasForm: !!document.querySelector('form'),
              hasAmountInput: !!document.querySelector('input[type="number"]'),
              hasDateInput: !!document.querySelector('input[type="date"]'),
              hasCategory: !!document.querySelector('select, input[list]'),
              hasDescription: !!document.querySelector('textarea, input[type="text"]'),
              hasSubmitButton: !!document.querySelector('button[type="submit"]')
            };
          });

          let formFeatures = [];
          if (formElements.hasAmountInput) formFeatures.push('valor');
          if (formElements.hasDateInput) formFeatures.push('data');
          if (formElements.hasCategory) formFeatures.push('categoria');
          if (formElements.hasDescription) formFeatures.push('descrição');

          if (formFeatures.length >= 3) {
            this.addResult('INCOME_EXPENSE_MANAGEMENT', 'PASS', `Gestão implementada: ${formFeatures.join(', ')}`, Date.now() - startTime);
          } else {
            this.addResult('INCOME_EXPENSE_MANAGEMENT', 'WARNING', 'Formulário de transação incompleto', Date.now() - startTime);
          }

          await this.navigate(this.getPageUrl());

        } catch (formError) {
          this.addResult('INCOME_EXPENSE_MANAGEMENT', 'WARNING', 'Formulário não acessível', Date.now() - startTime);
        }
      } else {
        this.addResult('INCOME_EXPENSE_MANAGEMENT', 'WARNING', 'Funcionalidade de adição não encontrada', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('INCOME_EXPENSE_MANAGEMENT', 'FAIL', `Erro ao testar gestão: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa relatórios financeiros
   */
  private async testFinancialReports(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📊 Testando relatórios financeiros...');

      const reportsElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasReports: textContent.includes('relatório') || textContent.includes('report'),
          hasCharts: !!document.querySelector('canvas, svg, [class*="chart"]'),
          hasPeriodFilter: document.querySelectorAll('input[type="date"], select[name*="period"]').length > 0,
          hasExportButton: !!document.querySelector('button:has-text("Exportar"), button:has-text("Download")'),
          hasStatistics: textContent.includes('estatística') || textContent.includes('total'),
          hasCategoryBreakdown: textContent.includes('categoria') && textContent.includes('por categoria'),
          hasMonthlyView: textContent.includes('mensal') || textContent.includes('monthly')
        };
      });

      let reportFeatures = [];
      if (reportsElements.hasReports) reportFeatures.push('relatórios');
      if (reportsElements.hasCharts) reportFeatures.push('gráficos');
      if (reportsElements.hasPeriodFilter) reportFeatures.push('filtros de período');
      if (reportsElements.hasExportButton) reportFeatures.push('exportação');
      if (reportsElements.hasStatistics) reportFeatures.push('estatísticas');
      if (reportsElements.hasCategoryBreakdown) reportFeatures.push('breakdown por categoria');

      if (reportFeatures.length >= 3) {
        this.addResult('FINANCIAL_REPORTS', 'PASS', `Relatórios implementados: ${reportFeatures.join(', ')}`, Date.now() - startTime);
      } else if (reportFeatures.length >= 1) {
        this.addResult('FINANCIAL_REPORTS', 'WARNING', `Relatórios básicos: ${reportFeatures.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('FINANCIAL_REPORTS', 'WARNING', 'Relatórios financeiros não encontrados', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('FINANCIAL_REPORTS', 'FAIL', `Erro ao testar relatórios: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa metas financeiras
   */
  private async testFinancialGoals(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🎯 Testando metas financeiras...');

      const goalsElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasGoals: textContent.includes('meta') || textContent.includes('objetivo'),
          hasSavingsGoal: textContent.includes('poupança') || textContent.includes('economia'),
          hasBudgetLimits: textContent.includes('orçamento') || textContent.includes('limite'),
          hasProgressBars: document.querySelectorAll('[class*="progress"], progress').length > 0,
          hasPercentages: /\d+%/.test(textContent),
          hasGoalSettings: !!document.querySelector('button:has-text("Meta"), button:has-text("Definir")')
        };
      });

      let goalFeatures = [];
      if (goalsElements.hasGoals) goalFeatures.push('metas definidas');
      if (goalsElements.hasSavingsGoal) goalFeatures.push('metas de poupança');
      if (goalsElements.hasBudgetLimits) goalFeatures.push('limites orçamentários');
      if (goalsElements.hasProgressBars) goalFeatures.push('barras de progresso');
      if (goalsElements.hasPercentages) goalFeatures.push('percentuais de progresso');

      if (goalFeatures.length >= 3) {
        this.addResult('FINANCIAL_GOALS', 'PASS', `Metas implementadas: ${goalFeatures.join(', ')}`, Date.now() - startTime);
      } else if (goalFeatures.length >= 1) {
        this.addResult('FINANCIAL_GOALS', 'WARNING', `Metas básicas: ${goalFeatures.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('FINANCIAL_GOALS', 'WARNING', 'Sistema de metas não encontrado', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('FINANCIAL_GOALS', 'FAIL', `Erro ao testar metas: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa categorias de transações
   */
  private async testTransactionCategories(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🏷️ Testando categorias de transações...');

      const categoriesElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasCategories: textContent.includes('categoria') || textContent.includes('category'),
          categorySelects: document.querySelectorAll('select, datalist').length,
          predefinedCategories: textContent.includes('alimentação') || 
                              textContent.includes('transporte') ||
                              textContent.includes('saúde'),
          customCategories: !!document.querySelector('button:has-text("Nova categoria"), input:has-text("Personalizada")'),
          categoryFilters: document.querySelectorAll('input[type="checkbox"], button[class*="filter"]').length,
          colorCoding: !!document.querySelector('[style*="color"], [class*="color"]')
        };
      });

      let categoryFeatures = [];
      if (categoriesElements.hasCategories) categoryFeatures.push('categorização');
      if (categoriesElements.categorySelects > 0) categoryFeatures.push('seletores de categoria');
      if (categoriesElements.predefinedCategories) categoryFeatures.push('categorias predefinidas');
      if (categoriesElements.customCategories) categoryFeatures.push('categorias personalizadas');
      if (categoriesElements.categoryFilters > 0) categoryFeatures.push('filtros por categoria');
      if (categoriesElements.colorCoding) categoryFeatures.push('códigos de cor');

      if (categoryFeatures.length >= 3) {
        this.addResult('TRANSACTION_CATEGORIES', 'PASS', `Categorias implementadas: ${categoryFeatures.join(', ')}`, Date.now() - startTime);
      } else if (categoryFeatures.length >= 1) {
        this.addResult('TRANSACTION_CATEGORIES', 'WARNING', `Categorias básicas: ${categoryFeatures.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('TRANSACTION_CATEGORIES', 'WARNING', 'Sistema de categorias não encontrado', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('transaction_categories');
      }

    } catch (error) {
      this.addResult('TRANSACTION_CATEGORIES', 'FAIL', `Erro ao testar categorias: ${error}`, Date.now() - startTime);
    }
  }
}