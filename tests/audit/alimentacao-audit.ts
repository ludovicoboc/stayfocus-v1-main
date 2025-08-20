/**
 * Script de Auditoria da Página de Alimentação
 * 
 * Testa funcionalidades específicas da página de alimentação:
 * - Registro de refeições
 * - Histórico alimentar
 * - Cálculos nutricionais
 * - Metas de consumo
 */

import { BaseAudit, AuditConfig } from './base-audit';

export class AlimentacaoAudit extends BaseAudit {
  constructor(config: AuditConfig) {
    super(config, 'Alimentação');
  }

  protected getPageUrl(): string {
    return `${this.config.baseUrl}/alimentacao`;
  }

  protected async runPageSpecificTests(): Promise<void> {
    await this.testMealRegistration();
    await this.testFoodHistory();
    await this.testNutritionalCalculations();
    await this.testGoalsTracking();
    await this.testMealPlannerIntegration();
  }

  /**
   * Testa registro de refeições
   */
  private async testMealRegistration(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🍽️ Testando registro de refeições...');

      const mealElements = await this.evaluate(() => {
        return {
          addMealButton: !!document.querySelector('button:has-text("Adicionar"), button[class*="add"]'),
          mealCategories: document.querySelectorAll('[class*="meal"], [class*="refeicao"]').length,
          timeInputs: document.querySelectorAll('input[type="time"], input[type="datetime-local"]').length,
          foodSearch: !!document.querySelector('input[placeholder*="alimento"], input[placeholder*="comida"]'),
          quantityInputs: document.querySelectorAll('input[type="number"], input[placeholder*="quantidade"]').length
        };
      });

      let issues = [];
      if (!mealElements.addMealButton) issues.push('Botão adicionar refeição não encontrado');
      if (mealElements.mealCategories === 0) issues.push('Categorias de refeição não encontradas');
      if (mealElements.timeInputs === 0) issues.push('Inputs de horário não encontrados');

      if (issues.length === 0) {
        this.addResult('MEAL_REGISTRATION', 'PASS', 'Sistema de registro de refeições completo', Date.now() - startTime);
      } else {
        this.addResult('MEAL_REGISTRATION', 'WARNING', `Problemas encontrados: ${issues.join(', ')}`, Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('meal_registration');
      }

    } catch (error) {
      this.addResult('MEAL_REGISTRATION', 'FAIL', `Erro ao testar registro: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa histórico alimentar
   */
  private async testFoodHistory(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📅 Testando histórico alimentar...');

      const historyElements = await this.evaluate(() => {
        return {
          historyList: document.querySelectorAll('[class*="history"], [class*="historico"]').length > 0,
          dateFilters: document.querySelectorAll('input[type="date"]').length,
          mealEntries: document.querySelectorAll('[class*="meal-entry"], [class*="refeicao-item"]').length,
          hasEmptyState: !!document.querySelector('[class*="empty"], [class*="vazio"]'),
          hasPagination: !!document.querySelector('[class*="pagination"], [class*="paginacao"]')
        };
      });

      if (historyElements.historyList || historyElements.hasEmptyState) {
        let features = [];
        if (historyElements.dateFilters > 0) features.push('filtros de data');
        if (historyElements.mealEntries > 0) features.push(`${historyElements.mealEntries} entradas`);
        if (historyElements.hasPagination) features.push('paginação');

        this.addResult('FOOD_HISTORY', 'PASS', `Histórico implementado com: ${features.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('FOOD_HISTORY', 'WARNING', 'Histórico alimentar não detectado', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('food_history');
      }

    } catch (error) {
      this.addResult('FOOD_HISTORY', 'FAIL', `Erro ao testar histórico: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa cálculos nutricionais
   */
  private async testNutritionalCalculations(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🧮 Testando cálculos nutricionais...');

      const nutritionElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasCalories: textContent.includes('caloria') || textContent.includes('kcal'),
          hasProteins: textContent.includes('proteína') || textContent.includes('protein'),
          hasCarbs: textContent.includes('carboidrato') || textContent.includes('carb'),
          hasFats: textContent.includes('gordura') || textContent.includes('lipídio'),
          hasFiber: textContent.includes('fibra') || textContent.includes('fiber'),
          nutritionDisplays: document.querySelectorAll('[class*="nutrition"], [class*="nutricao"]').length,
          progressBars: document.querySelectorAll('[class*="progress"], progress').length,
          totalsDisplay: document.querySelectorAll('[class*="total"], [class*="summary"]').length
        };
      });

      let nutritionFeatures = [];
      if (nutritionElements.hasCalories) nutritionFeatures.push('calorias');
      if (nutritionElements.hasProteins) nutritionFeatures.push('proteínas');
      if (nutritionElements.hasCarbs) nutritionFeatures.push('carboidratos');
      if (nutritionElements.hasFats) nutritionFeatures.push('gorduras');

      if (nutritionFeatures.length >= 2) {
        this.addResult('NUTRITIONAL_CALCULATIONS', 'PASS', `Cálculos implementados: ${nutritionFeatures.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('NUTRITIONAL_CALCULATIONS', 'WARNING', 'Cálculos nutricionais limitados ou não detectados', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('nutritional_calculations');
      }

    } catch (error) {
      this.addResult('NUTRITIONAL_CALCULATIONS', 'FAIL', `Erro ao testar cálculos: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa acompanhamento de metas
   */
  private async testGoalsTracking(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🎯 Testando acompanhamento de metas...');

      const goalsElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasGoals: textContent.includes('meta') || textContent.includes('objetivo'),
          hasTargets: textContent.includes('alvo') || textContent.includes('target'),
          progressBars: document.querySelectorAll('[class*="progress"], progress').length,
          percentageDisplays: document.querySelectorAll('*').length > 0 && 
                             Array.from(document.querySelectorAll('*')).some(el => 
                               /\d+%/.test(el.textContent || '')
                             ),
          goalsSettings: !!document.querySelector('button:has-text("Meta"), button:has-text("Objetivo")')
        };
      });

      let goalFeatures = [];
      if (goalsElements.hasGoals) goalFeatures.push('definição de metas');
      if (goalsElements.progressBars > 0) goalFeatures.push('barras de progresso');
      if (goalsElements.percentageDisplays) goalFeatures.push('percentuais');
      if (goalsElements.goalsSettings) goalFeatures.push('configuração de metas');

      if (goalFeatures.length >= 2) {
        this.addResult('GOALS_TRACKING', 'PASS', `Acompanhamento implementado: ${goalFeatures.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('GOALS_TRACKING', 'WARNING', 'Sistema de metas limitado ou não detectado', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('GOALS_TRACKING', 'FAIL', `Erro ao testar metas: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa integração com planejador de refeições
   */
  private async testMealPlannerIntegration(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📋 Testando integração com planejador...');

      const plannerElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasPlanner: textContent.includes('planejamento') || textContent.includes('planner'),
          hasRecipes: textContent.includes('receita') || textContent.includes('recipe'),
          plannerLinks: document.querySelectorAll('a[href*="receitas"]').length,
          mealPlanButtons: document.querySelectorAll('button:has-text("Planejar"), button:has-text("Receita")').length,
          hasCalendar: !!document.querySelector('[class*="calendar"], [class*="calendario"]')
        };
      });

      let integrationFeatures = [];
      if (plannerElements.hasPlanner) integrationFeatures.push('planejamento');
      if (plannerElements.hasRecipes) integrationFeatures.push('receitas');
      if (plannerElements.plannerLinks > 0) integrationFeatures.push('links para receitas');
      if (plannerElements.hasCalendar) integrationFeatures.push('calendário');

      if (integrationFeatures.length >= 2) {
        this.addResult('MEAL_PLANNER_INTEGRATION', 'PASS', `Integração implementada: ${integrationFeatures.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('MEAL_PLANNER_INTEGRATION', 'WARNING', 'Integração com planejador limitada', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('meal_planner_integration');
      }

    } catch (error) {
      this.addResult('MEAL_PLANNER_INTEGRATION', 'FAIL', `Erro ao testar integração: ${error}`, Date.now() - startTime);
    }
  }
}