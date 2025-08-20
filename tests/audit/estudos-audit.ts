/**
 * Script de Auditoria da Página de Estudos
 * 
 * Testa funcionalidades específicas da página de estudos:
 * - Simulados e questões
 * - Cronograma de estudos
 * - Material de apoio
 * - Estatísticas de performance
 */

import { BaseAudit, AuditConfig } from './base-audit';

export class EstudosAudit extends BaseAudit {
  constructor(config: AuditConfig) {
    super(config, 'Estudos');
  }

  protected getPageUrl(): string {
    return `${this.config.baseUrl}/estudos`;
  }

  protected async runPageSpecificTests(): Promise<void> {
    await this.testSimuladoAccess();
    await this.testSimuladoPersonalizado();
    await this.testStudySchedule();
    await this.testPerformanceStats();
    await this.testStudyMaterials();
  }

  /**
   * Testa acesso aos simulados
   */
  private async testSimuladoAccess(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📝 Testando acesso aos simulados...');

      const simuladoElements = await this.evaluate(() => {
        return {
          simuladoButton: !!document.querySelector('button:has-text("Simulado"), a[href*="simulado"]'),
          simuladoPersonalizadoButton: !!document.querySelector('button:has-text("Personalizado"), a[href*="personalizado"]'),
          questionsCount: document.querySelectorAll('[class*="question"], [class*="questao"]').length,
          startButtons: document.querySelectorAll('button:has-text("Iniciar"), button:has-text("Começar")').length,
          hasTimer: !!document.querySelector('[class*="timer"], [class*="tempo"]')
        };
      });

      let features = [];
      if (simuladoElements.simuladoButton) features.push('simulado padrão');
      if (simuladoElements.simuladoPersonalizadoButton) features.push('simulado personalizado');
      if (simuladoElements.startButtons > 0) features.push('botões de início');

      if (features.length >= 2) {
        this.addResult('SIMULADO_ACCESS', 'PASS', `Acesso aos simulados implementado: ${features.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('SIMULADO_ACCESS', 'WARNING', 'Acesso limitado aos simulados', Date.now() - startTime);
      }

      // Testar navegação para página de simulado
      if (simuladoElements.simuladoButton) {
        try {
          await this.click('button:has-text("Simulado"), a[href*="simulado"]');
          await this.waitForTimeout(2000);

          const simuladoPageElements = await this.evaluate(() => {
            return {
              hasQuestions: document.querySelectorAll('[class*="question"]').length > 0,
              hasOptions: document.querySelectorAll('input[type="radio"], input[type="checkbox"]').length > 0,
              hasNavigation: !!document.querySelector('[class*="nav"], button:has-text("Próxima")'),
              hasSubmit: !!document.querySelector('button[type="submit"], button:has-text("Finalizar")')
            };
          });

          if (simuladoPageElements.hasQuestions && simuladoPageElements.hasOptions) {
            this.addResult('SIMULADO_FUNCTIONALITY', 'PASS', 'Funcionalidade de simulado implementada', Date.now() - startTime);
          } else {
            this.addResult('SIMULADO_FUNCTIONALITY', 'WARNING', 'Simulado com funcionalidade limitada', Date.now() - startTime);
          }

          // Voltar para página principal
          await this.navigate(this.getPageUrl());

        } catch (navError) {
          this.addResult('SIMULADO_FUNCTIONALITY', 'WARNING', 'Erro ao navegar para simulado', Date.now() - startTime);
        }
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('simulado_access');
      }

    } catch (error) {
      this.addResult('SIMULADO_ACCESS', 'FAIL', `Erro ao testar simulados: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa simulado personalizado
   */
  private async testSimuladoPersonalizado(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('⚙️ Testando simulado personalizado...');

      const personalizedElements = await this.evaluate(() => {
        return {
          hasPersonalizedOption: !!document.querySelector('a[href*="personalizado"], button:has-text("Personalizado")'),
          hasSubjectSelection: document.querySelectorAll('input[type="checkbox"], select').length > 0,
          hasQuestionCount: !!document.querySelector('input[type="number"], input[placeholder*="questões"]'),
          hasTimeSettings: !!document.querySelector('input[type="time"], input[placeholder*="tempo"]')
        };
      });

      if (personalizedElements.hasPersonalizedOption) {
        try {
          await this.click('a[href*="personalizado"], button:has-text("Personalizado")');
          await this.waitForTimeout(2000);

          const customizationElements = await this.evaluate(() => {
            return {
              hasSubjects: document.querySelectorAll('input[type="checkbox"]').length > 0,
              hasQuestionInput: !!document.querySelector('input[type="number"]'),
              hasTimeInput: !!document.querySelector('input[type="time"], input[type="number"]'),
              hasStartButton: !!document.querySelector('button:has-text("Iniciar"), button:has-text("Gerar")')
            };
          });

          let customFeatures = [];
          if (customizationElements.hasSubjects) customFeatures.push('seleção de disciplinas');
          if (customizationElements.hasQuestionInput) customFeatures.push('número de questões');
          if (customizationElements.hasTimeInput) customFeatures.push('tempo limite');

          if (customFeatures.length >= 2) {
            this.addResult('SIMULADO_PERSONALIZADO', 'PASS', `Personalização implementada: ${customFeatures.join(', ')}`, Date.now() - startTime);
          } else {
            this.addResult('SIMULADO_PERSONALIZADO', 'WARNING', 'Personalização limitada', Date.now() - startTime);
          }

          await this.navigate(this.getPageUrl());

        } catch (navError) {
          this.addResult('SIMULADO_PERSONALIZADO', 'WARNING', 'Opção personalizada não acessível', Date.now() - startTime);
        }
      } else {
        this.addResult('SIMULADO_PERSONALIZADO', 'WARNING', 'Simulado personalizado não encontrado', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('SIMULADO_PERSONALIZADO', 'FAIL', `Erro ao testar personalização: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa cronograma de estudos
   */
  private async testStudySchedule(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📅 Testando cronograma de estudos...');

      const scheduleElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasSchedule: textContent.includes('cronograma') || textContent.includes('agenda'),
          hasCalendar: !!document.querySelector('[class*="calendar"], [class*="calendario"]'),
          hasPlanning: textContent.includes('planejamento') || textContent.includes('plano'),
          hasDates: document.querySelectorAll('input[type="date"]').length > 0,
          hasSubjects: textContent.includes('disciplina') || textContent.includes('matéria'),
          scheduleButton: !!document.querySelector('button:has-text("Cronograma"), a:has-text("Agenda")')
        };
      });

      let scheduleFeatures = [];
      if (scheduleElements.hasSchedule) scheduleFeatures.push('cronograma');
      if (scheduleElements.hasCalendar) scheduleFeatures.push('calendário');
      if (scheduleElements.hasPlanning) scheduleFeatures.push('planejamento');
      if (scheduleElements.hasDates) scheduleFeatures.push('seleção de datas');
      if (scheduleElements.hasSubjects) scheduleFeatures.push('disciplinas');

      if (scheduleFeatures.length >= 3) {
        this.addResult('STUDY_SCHEDULE', 'PASS', `Cronograma implementado: ${scheduleFeatures.join(', ')}`, Date.now() - startTime);
      } else if (scheduleFeatures.length >= 1) {
        this.addResult('STUDY_SCHEDULE', 'WARNING', `Cronograma básico: ${scheduleFeatures.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('STUDY_SCHEDULE', 'WARNING', 'Cronograma de estudos não encontrado', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('STUDY_SCHEDULE', 'FAIL', `Erro ao testar cronograma: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa estatísticas de performance
   */
  private async testPerformanceStats(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📊 Testando estatísticas de performance...');

      const statsElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasStats: textContent.includes('estatística') || textContent.includes('desempenho'),
          hasPercentages: /\d+%/.test(textContent),
          hasCharts: !!document.querySelector('canvas, svg, [class*="chart"]'),
          hasScores: textContent.includes('pontuação') || textContent.includes('nota'),
          hasProgress: !!document.querySelector('[class*="progress"], progress'),
          hasHistory: textContent.includes('histórico') || textContent.includes('history'),
          progressBars: document.querySelectorAll('[class*="progress"], progress').length
        };
      });

      let statsFeatures = [];
      if (statsElements.hasStats) statsFeatures.push('estatísticas');
      if (statsElements.hasPercentages) statsFeatures.push('percentuais');
      if (statsElements.hasCharts) statsFeatures.push('gráficos');
      if (statsElements.hasScores) statsFeatures.push('pontuações');
      if (statsElements.hasProgress) statsFeatures.push('progresso');
      if (statsElements.hasHistory) statsFeatures.push('histórico');

      if (statsFeatures.length >= 4) {
        this.addResult('PERFORMANCE_STATS', 'PASS', `Estatísticas completas: ${statsFeatures.join(', ')}`, Date.now() - startTime);
      } else if (statsFeatures.length >= 2) {
        this.addResult('PERFORMANCE_STATS', 'WARNING', `Estatísticas básicas: ${statsFeatures.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('PERFORMANCE_STATS', 'WARNING', 'Estatísticas limitadas ou ausentes', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('performance_stats');
      }

    } catch (error) {
      this.addResult('PERFORMANCE_STATS', 'FAIL', `Erro ao testar estatísticas: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa materiais de estudo
   */
  private async testStudyMaterials(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📚 Testando materiais de estudo...');

      const materialsElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasMaterials: textContent.includes('material') || textContent.includes('conteúdo'),
          hasDownloads: textContent.includes('download') || textContent.includes('baixar'),
          hasPDFs: textContent.includes('pdf') || !!document.querySelector('a[href$=".pdf"]'),
          hasLinks: document.querySelectorAll('a[href^="http"]').length > 0,
          hasVideoLinks: textContent.includes('vídeo') || textContent.includes('video'),
          materialsSection: !!document.querySelector('[class*="material"], [class*="conteudo"]'),
          resourcesCount: document.querySelectorAll('a[href], button').length
        };
      });

      let materialsFeatures = [];
      if (materialsElements.hasMaterials) materialsFeatures.push('materiais');
      if (materialsElements.hasDownloads) materialsFeatures.push('downloads');
      if (materialsElements.hasPDFs) materialsFeatures.push('PDFs');
      if (materialsElements.hasLinks) materialsFeatures.push('links externos');
      if (materialsElements.hasVideoLinks) materialsFeatures.push('vídeos');

      if (materialsFeatures.length >= 3) {
        this.addResult('STUDY_MATERIALS', 'PASS', `Materiais disponíveis: ${materialsFeatures.join(', ')}`, Date.now() - startTime);
      } else if (materialsFeatures.length >= 1) {
        this.addResult('STUDY_MATERIALS', 'WARNING', `Materiais limitados: ${materialsFeatures.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('STUDY_MATERIALS', 'WARNING', 'Materiais de estudo não encontrados', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('STUDY_MATERIALS', 'FAIL', `Erro ao testar materiais: ${error}`, Date.now() - startTime);
    }
  }
}