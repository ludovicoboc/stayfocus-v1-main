/**
 * Script de Auditoria da Página Home
 * 
 * Testa funcionalidades específicas da página inicial:
 * - Dashboard principal
 * - Cards de navegação
 * - Widgets de informações
 * - Links de acesso rápido
 */

import { BaseAudit, AuditConfig } from './base-audit';

export class HomeAudit extends BaseAudit {
  constructor(config: AuditConfig) {
    super(config, 'Home');
  }

  protected getPageUrl(): string {
    return this.config.baseUrl;
  }

  protected async runPageSpecificTests(): Promise<void> {
    await this.testDashboardLayout();
    await this.testNavigationCards();
    await this.testQuickAccessLinks();
    await this.testWidgets();
  }

  /**
   * Testa layout do dashboard principal
   */
  private async testDashboardLayout(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🏠 Testando layout do dashboard...');

      await this.navigate(this.getPageUrl());

      const dashboardElements = await this.evaluate(() => {
        return {
          hasHeader: !!document.querySelector('header, [role="banner"]'),
          hasMain: !!document.querySelector('main, [role="main"]'),
          hasNavigation: !!document.querySelector('nav, [role="navigation"]'),
          hasCards: document.querySelectorAll('[class*="card"]').length > 0,
          hasGrid: !!document.querySelector('[class*="grid"]'),
          title: document.querySelector('h1, h2')?.textContent
        };
      });

      let issues = [];
      if (!dashboardElements.hasHeader) issues.push('Header não encontrado');
      if (!dashboardElements.hasMain) issues.push('Main content não encontrado');
      if (!dashboardElements.hasNavigation) issues.push('Navegação não encontrada');
      if (!dashboardElements.hasCards) issues.push('Cards não encontrados');

      if (issues.length === 0) {
        this.addResult('DASHBOARD_LAYOUT', 'PASS', 'Layout do dashboard carregado corretamente', Date.now() - startTime);
      } else {
        this.addResult('DASHBOARD_LAYOUT', 'WARNING', `Problemas no layout: ${issues.join(', ')}`, Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('dashboard_layout');
      }

    } catch (error) {
      this.addResult('DASHBOARD_LAYOUT', 'FAIL', `Erro ao testar dashboard: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa cards de navegação
   */
  private async testNavigationCards(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🗂️ Testando cards de navegação...');

      const navigationCards = await this.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('[class*="card"], a[href]'));
        
        const cardData = cards.map((card, index) => {
          const element = card as HTMLElement;
          const link = card as HTMLAnchorElement;
          
          return {
            index,
            hasText: !!element.textContent?.trim(),
            hasHref: !!link.href,
            href: link.href,
            text: element.textContent?.trim(),
            isClickable: element.style.cursor === 'pointer' || element.tagName === 'A' || element.tagName === 'BUTTON'
          };
        });

        return {
          totalCards: cards.length,
          validCards: cardData.filter(card => card.hasText && (card.hasHref || card.isClickable)),
          cardData
        };
      });

      if (navigationCards.totalCards > 0) {
        const validCardsCount = navigationCards.validCards.length;
        const validPercentage = (validCardsCount / navigationCards.totalCards) * 100;

        if (validPercentage >= 80) {
          this.addResult('NAVIGATION_CARDS', 'PASS', `${validCardsCount}/${navigationCards.totalCards} cards funcionais`, Date.now() - startTime);
        } else {
          this.addResult('NAVIGATION_CARDS', 'WARNING', `Apenas ${validCardsCount}/${navigationCards.totalCards} cards funcionais`, Date.now() - startTime);
        }
      } else {
        this.addResult('NAVIGATION_CARDS', 'WARNING', 'Nenhum card de navegação encontrado', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('navigation_cards');
      }

    } catch (error) {
      this.addResult('NAVIGATION_CARDS', 'FAIL', `Erro ao testar cards: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa links de acesso rápido
   */
  private async testQuickAccessLinks(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🔗 Testando links de acesso rápido...');

      const quickLinks = await this.evaluate(() => {
        const expectedPages = [
          '/alimentacao',
          '/concursos', 
          '/estudos',
          '/financas',
          '/receitas',
          '/perfil'
        ];

        const allLinks = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
        const foundLinks = expectedPages.filter(page => 
          allLinks.some(link => link.href.includes(page))
        );

        return {
          expectedCount: expectedPages.length,
          foundCount: foundLinks.length,
          foundLinks,
          allLinksCount: allLinks.length
        };
      });

      const coverage = (quickLinks.foundCount / quickLinks.expectedCount) * 100;

      if (coverage >= 70) {
        this.addResult('QUICK_ACCESS_LINKS', 'PASS', `${quickLinks.foundCount}/${quickLinks.expectedCount} links principais encontrados`, Date.now() - startTime);
      } else {
        this.addResult('QUICK_ACCESS_LINKS', 'WARNING', `Apenas ${quickLinks.foundCount}/${quickLinks.expectedCount} links principais encontrados`, Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('QUICK_ACCESS_LINKS', 'FAIL', `Erro ao testar links: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa widgets informativos
   */
  private async testWidgets(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📊 Testando widgets...');

      const widgets = await this.evaluate(() => {
        const potentialWidgets = document.querySelectorAll(
          '[class*="widget"], [class*="summary"], [class*="stats"], [class*="info"]'
        );

        const widgetData = Array.from(potentialWidgets).map((widget, index) => {
          const element = widget as HTMLElement;
          return {
            index,
            hasContent: !!element.textContent?.trim(),
            hasNumbers: /\d+/.test(element.textContent || ''),
            hasTitle: !!element.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"]'),
            className: element.className
          };
        });

        return {
          totalWidgets: potentialWidgets.length,
          functionalWidgets: widgetData.filter(w => w.hasContent && (w.hasNumbers || w.hasTitle)),
          widgetData
        };
      });

      if (widgets.totalWidgets > 0) {
        const functionalPercentage = (widgets.functionalWidgets.length / widgets.totalWidgets) * 100;

        if (functionalPercentage >= 80) {
          this.addResult('WIDGETS', 'PASS', `${widgets.functionalWidgets.length}/${widgets.totalWidgets} widgets funcionais`, Date.now() - startTime);
        } else {
          this.addResult('WIDGETS', 'WARNING', `Apenas ${widgets.functionalWidgets.length}/${widgets.totalWidgets} widgets funcionais`, Date.now() - startTime);
        }
      } else {
        this.addResult('WIDGETS', 'WARNING', 'Nenhum widget informativo encontrado', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('widgets');
      }

    } catch (error) {
      this.addResult('WIDGETS', 'FAIL', `Erro ao testar widgets: ${error}`, Date.now() - startTime);
    }
  }
}