/**
 * Script de Auditoria da Página de Receitas
 * 
 * Testa funcionalidades específicas da página de receitas:
 * - Lista de receitas
 * - Adição de receitas
 * - Edição de receitas
 * - Lista de compras
 */

import { BaseAudit, AuditConfig } from './base-audit';

export class ReceitasAudit extends BaseAudit {
  constructor(config: AuditConfig) {
    super(config, 'Receitas');
  }

  protected getPageUrl(): string {
    return `${this.config.baseUrl}/receitas`;
  }

  protected async runPageSpecificTests(): Promise<void> {
    await this.testRecipesList();
    await this.testAddRecipe();
    await this.testRecipeDetails();
    await this.testShoppingList();
    await this.testRecipeSearch();
  }

  /**
   * Testa lista de receitas
   */
  private async testRecipesList(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🍳 Testando lista de receitas...');

      const recipeElements = await this.evaluate(() => {
        return {
          recipeCards: document.querySelectorAll('[class*="recipe"], [class*="receita"]').length,
          addButton: !!document.querySelector('button:has-text("Adicionar"), a[href*="adicionar"]'),
          hasGrid: !!document.querySelector('[class*="grid"]'),
          hasEmptyState: !!document.querySelector('[class*="empty"], [class*="vazio"]'),
          recipeImages: document.querySelectorAll('img').length,
          recipeTitles: document.querySelectorAll('h2, h3, [class*="title"]').length
        };
      });

      if (recipeElements.recipeCards > 0 || recipeElements.hasEmptyState) {
        let features = ['lista de receitas'];
        if (recipeElements.addButton) features.push('botão adicionar');
        if (recipeElements.hasGrid) features.push('layout em grid');
        if (recipeElements.recipeImages > 0) features.push('imagens');

        this.addResult('RECIPES_LIST', 'PASS', `Lista implementada com: ${features.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('RECIPES_LIST', 'WARNING', 'Lista de receitas não detectada', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('recipes_list');
      }

    } catch (error) {
      this.addResult('RECIPES_LIST', 'FAIL', `Erro ao testar lista: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa adição de receitas
   */
  private async testAddRecipe(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('➕ Testando adição de receitas...');

      const addRecipeElements = await this.evaluate(() => {
        return {
          addButton: !!document.querySelector('button:has-text("Adicionar"), a[href*="adicionar"]'),
          hasForm: !!document.querySelector('form'),
          titleInput: !!document.querySelector('input[name*="title"], input[name*="titulo"]'),
          ingredientsInput: !!document.querySelector('textarea[name*="ingredient"], input[name*="ingredient"]'),
          instructionsInput: !!document.querySelector('textarea[name*="instruction"], textarea[name*="preparo"]'),
          imageUpload: !!document.querySelector('input[type="file"]')
        };
      });

      if (addRecipeElements.addButton) {
        try {
          await this.click('button:has-text("Adicionar"), a[href*="adicionar"]');
          await this.waitForTimeout(2000);

          const formElements = await this.evaluate(() => {
            return {
              hasForm: !!document.querySelector('form'),
              titleInput: !!document.querySelector('input[type="text"], input[name*="title"]'),
              textareas: document.querySelectorAll('textarea').length,
              submitButton: !!document.querySelector('button[type="submit"]'),
              imageUpload: !!document.querySelector('input[type="file"]')
            };
          });

          let formFeatures = [];
          if (formElements.hasForm) formFeatures.push('formulário');
          if (formElements.titleInput) formFeatures.push('título');
          if (formElements.textareas > 0) formFeatures.push('campos de texto');
          if (formElements.imageUpload) formFeatures.push('upload de imagem');

          if (formFeatures.length >= 3) {
            this.addResult('ADD_RECIPE', 'PASS', `Adição implementada com: ${formFeatures.join(', ')}`, Date.now() - startTime);
          } else {
            this.addResult('ADD_RECIPE', 'WARNING', 'Formulário de adição incompleto', Date.now() - startTime);
          }

          await this.navigate(this.getPageUrl());

        } catch (navError) {
          this.addResult('ADD_RECIPE', 'WARNING', 'Botão adicionar não funcional', Date.now() - startTime);
        }
      } else {
        this.addResult('ADD_RECIPE', 'WARNING', 'Funcionalidade de adição não encontrada', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('ADD_RECIPE', 'FAIL', `Erro ao testar adição: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa detalhes da receita
   */
  private async testRecipeDetails(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📄 Testando detalhes de receitas...');

      const detailsElements = await this.evaluate(() => {
        const recipeCards = document.querySelectorAll('[class*="recipe"], [class*="receita"], a[href*="/receitas/"]');
        
        return {
          hasRecipeLinks: recipeCards.length > 0,
          clickableCards: Array.from(recipeCards).some(card => 
            card.tagName === 'A' || card.style.cursor === 'pointer'
          ),
          recipeCount: recipeCards.length
        };
      });

      if (detailsElements.hasRecipeLinks && detailsElements.clickableCards) {
        try {
          await this.click('a[href*="/receitas/"], [class*="recipe"]:first-child');
          await this.waitForTimeout(2000);

          const detailPageElements = await this.evaluate(() => {
            const textContent = document.body.textContent?.toLowerCase() || '';
            
            return {
              hasTitle: !!document.querySelector('h1, h2'),
              hasIngredients: textContent.includes('ingredient') || textContent.includes('ingredient'),
              hasInstructions: textContent.includes('preparo') || textContent.includes('modo'),
              hasImage: document.querySelectorAll('img').length > 0,
              hasEditButton: !!document.querySelector('button:has-text("Editar"), a[href*="editar"]'),
              hasBackButton: !!document.querySelector('button:has-text("Voltar"), a:has-text("Voltar")')
            };
          });

          let detailFeatures = [];
          if (detailPageElements.hasTitle) detailFeatures.push('título');
          if (detailPageElements.hasIngredients) detailFeatures.push('ingredientes');
          if (detailPageElements.hasInstructions) detailFeatures.push('instruções');
          if (detailPageElements.hasImage) detailFeatures.push('imagem');
          if (detailPageElements.hasEditButton) detailFeatures.push('edição');

          if (detailFeatures.length >= 3) {
            this.addResult('RECIPE_DETAILS', 'PASS', `Detalhes completos: ${detailFeatures.join(', ')}`, Date.now() - startTime);
          } else {
            this.addResult('RECIPE_DETAILS', 'WARNING', `Detalhes básicos: ${detailFeatures.join(', ')}`, Date.now() - startTime);
          }

          await this.navigate(this.getPageUrl());

        } catch (navError) {
          this.addResult('RECIPE_DETAILS', 'WARNING', 'Navegação para detalhes falhou', Date.now() - startTime);
        }
      } else {
        this.addResult('RECIPE_DETAILS', 'WARNING', 'Links para detalhes não encontrados', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('RECIPE_DETAILS', 'FAIL', `Erro ao testar detalhes: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa lista de compras
   */
  private async testShoppingList(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🛒 Testando lista de compras...');

      const shoppingElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasShoppingList: textContent.includes('lista de compras') || textContent.includes('compras'),
          shoppingButton: !!document.querySelector('button:has-text("Compras"), a[href*="compras"]'),
          hasIngredientsList: !!document.querySelector('[class*="ingredient"], [class*="ingrediente"]')
        };
      });

      if (shoppingElements.hasShoppingList || shoppingElements.shoppingButton) {
        try {
          await this.navigate(`${this.config.baseUrl}/receitas/lista-compras`);
          await this.waitForTimeout(2000);

          const shoppingPageElements = await this.evaluate(() => {
            return {
              hasTitle: !!document.querySelector('h1, h2'),
              hasItems: document.querySelectorAll('li, [class*="item"]').length > 0,
              hasCheckboxes: document.querySelectorAll('input[type="checkbox"]').length > 0,
              hasEmptyState: !!document.querySelector('[class*="empty"], [class*="vazio"]'),
              hasAddButton: !!document.querySelector('button:has-text("Adicionar")')
            };
          });

          let shoppingFeatures = [];
          if (shoppingPageElements.hasTitle) shoppingFeatures.push('título');
          if (shoppingPageElements.hasItems) shoppingFeatures.push('itens');
          if (shoppingPageElements.hasCheckboxes) shoppingFeatures.push('checkboxes');
          if (shoppingPageElements.hasAddButton) shoppingFeatures.push('adicionar itens');

          if (shoppingFeatures.length >= 2 || shoppingPageElements.hasEmptyState) {
            this.addResult('SHOPPING_LIST', 'PASS', `Lista de compras implementada: ${shoppingFeatures.join(', ')}`, Date.now() - startTime);
          } else {
            this.addResult('SHOPPING_LIST', 'WARNING', 'Lista de compras básica', Date.now() - startTime);
          }

          await this.navigate(this.getPageUrl());

        } catch (navError) {
          this.addResult('SHOPPING_LIST', 'WARNING', 'Acesso à lista de compras falhou', Date.now() - startTime);
        }
      } else {
        this.addResult('SHOPPING_LIST', 'WARNING', 'Lista de compras não encontrada', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('shopping_list');
      }

    } catch (error) {
      this.addResult('SHOPPING_LIST', 'FAIL', `Erro ao testar lista de compras: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa busca de receitas
   */
  private async testRecipeSearch(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🔍 Testando busca de receitas...');

      const searchElements = await this.evaluate(() => {
        return {
          searchInput: !!document.querySelector('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"]'),
          filterButtons: document.querySelectorAll('button[class*="filter"], select').length,
          categoryFilters: document.querySelectorAll('input[type="checkbox"], input[type="radio"]').length,
          sortOptions: !!document.querySelector('select[name*="sort"], button:has-text("Ordenar")')
        };
      });

      let searchFeatures = [];
      if (searchElements.searchInput) searchFeatures.push('campo de busca');
      if (searchElements.filterButtons > 0) searchFeatures.push('filtros');
      if (searchElements.categoryFilters > 0) searchFeatures.push('categorias');
      if (searchElements.sortOptions) searchFeatures.push('ordenação');

      if (searchFeatures.length >= 2) {
        this.addResult('RECIPE_SEARCH', 'PASS', `Busca implementada com: ${searchFeatures.join(', ')}`, Date.now() - startTime);
      } else if (searchFeatures.length >= 1) {
        this.addResult('RECIPE_SEARCH', 'WARNING', `Busca básica: ${searchFeatures.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('RECIPE_SEARCH', 'WARNING', 'Funcionalidade de busca não encontrada', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('RECIPE_SEARCH', 'FAIL', `Erro ao testar busca: ${error}`, Date.now() - startTime);
    }
  }
}