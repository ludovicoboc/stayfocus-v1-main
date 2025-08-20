/**
 * Script de Auditoria da Página de Autenticação
 * 
 * Testa funcionalidades específicas da autenticação:
 * - Formulário de login
 * - Formulário de registro
 * - Recuperação de senha
 * - Validações e segurança
 */

import { BaseAudit, AuditConfig } from './base-audit';

export class AuthAudit extends BaseAudit {
  constructor(config: AuditConfig) {
    super(config, 'Autenticação');
  }

  protected getPageUrl(): string {
    return `${this.config.baseUrl}/auth`;
  }

  protected async runPageSpecificTests(): Promise<void> {
    await this.testLoginForm();
    await this.testRegistrationForm();
    await this.testPasswordRecovery();
    await this.testFormValidations();
    await this.testSecurityFeatures();
    await this.testSocialLogin();
  }

  /**
   * Testa formulário de login
   */
  private async testLoginForm(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🔐 Testando formulário de login...');

      await this.navigate(this.getPageUrl());

      const loginElements = await this.evaluate(() => {
        return {
          emailInput: !!document.querySelector('input[type="email"], input[name="email"]'),
          passwordInput: !!document.querySelector('input[type="password"], input[name="password"]'),
          submitButton: !!document.querySelector('button[type="submit"], input[type="submit"]'),
          hasLabels: document.querySelectorAll('label').length >= 2,
          hasPlaceholders: document.querySelectorAll('input[placeholder]').length >= 2,
          rememberMeCheckbox: !!document.querySelector('input[type="checkbox"]'),
          formElement: !!document.querySelector('form')
        };
      });

      let issues = [];
      if (!loginElements.emailInput) issues.push('Campo de email não encontrado');
      if (!loginElements.passwordInput) issues.push('Campo de senha não encontrado');
      if (!loginElements.submitButton) issues.push('Botão de envio não encontrado');
      if (!loginElements.formElement) issues.push('Elemento form não encontrado');

      if (issues.length === 0) {
        let features = ['formulário completo'];
        if (loginElements.hasLabels) features.push('labels');
        if (loginElements.hasPlaceholders) features.push('placeholders');
        if (loginElements.rememberMeCheckbox) features.push('lembrar-me');

        this.addResult('LOGIN_FORM', 'PASS', `Login implementado com: ${features.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('LOGIN_FORM', 'FAIL', `Problemas no formulário: ${issues.join(', ')}`, Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('login_form');
      }

    } catch (error) {
      this.addResult('LOGIN_FORM', 'FAIL', `Erro ao testar login: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa formulário de registro
   */
  private async testRegistrationForm(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('📝 Testando formulário de registro...');

      const registrationElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasRegistrationOption: textContent.includes('cadastr') || textContent.includes('registr') || 
                                textContent.includes('criar conta') || textContent.includes('sign up'),
          registrationButton: !!document.querySelector('button:has-text("Cadastrar"), button:has-text("Registrar"), a:has-text("Cadastrar")'),
          nameInput: !!document.querySelector('input[name="name"], input[name="nome"], input[placeholder*="nome"]'),
          confirmPasswordInput: !!document.querySelector('input[name*="confirm"], input[placeholder*="confirm"]'),
          termsCheckbox: !!document.querySelector('input[type="checkbox"]')
        };
      });

      // Tentar clicar no link/botão de registro se existir
      if (registrationElements.registrationButton || registrationElements.hasRegistrationOption) {
        try {
          await this.click('button:has-text("Cadastrar"), button:has-text("Registrar"), a:has-text("Cadastrar"), a:has-text("Criar")');
          await this.waitForTimeout(2000);

          const registrationFormElements = await this.evaluate(() => {
            return {
              emailInput: !!document.querySelector('input[type="email"], input[name="email"]'),
              passwordInput: !!document.querySelector('input[type="password"], input[name="password"]'),
              nameInput: !!document.querySelector('input[name="name"], input[name="nome"]'),
              confirmPasswordInput: !!document.querySelector('input[name*="confirm"]'),
              submitButton: !!document.querySelector('button[type="submit"]')
            };
          });

          let features = [];
          if (registrationFormElements.emailInput) features.push('email');
          if (registrationFormElements.passwordInput) features.push('senha');
          if (registrationFormElements.nameInput) features.push('nome');
          if (registrationFormElements.confirmPasswordInput) features.push('confirmação de senha');

          if (features.length >= 3) {
            this.addResult('REGISTRATION_FORM', 'PASS', `Registro implementado com: ${features.join(', ')}`, Date.now() - startTime);
          } else {
            this.addResult('REGISTRATION_FORM', 'WARNING', `Registro básico encontrado: ${features.join(', ')}`, Date.now() - startTime);
          }

        } catch (clickError) {
          this.addResult('REGISTRATION_FORM', 'WARNING', 'Link de registro encontrado mas não acessível', Date.now() - startTime);
        }
      } else {
        this.addResult('REGISTRATION_FORM', 'WARNING', 'Opção de registro não encontrada', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('registration_form');
      }

    } catch (error) {
      this.addResult('REGISTRATION_FORM', 'FAIL', `Erro ao testar registro: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa recuperação de senha
   */
  private async testPasswordRecovery(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🔑 Testando recuperação de senha...');

      const recoveryElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasForgotPassword: textContent.includes('esqueci') || textContent.includes('forgot') || 
                           textContent.includes('recuperar') || textContent.includes('reset'),
          forgotPasswordLink: !!document.querySelector('a:has-text("Esqueci"), a:has-text("Forgot"), button:has-text("Esqueci")'),
          recoveryForm: !!document.querySelector('form[class*="recovery"], form[class*="forgot"]')
        };
      });

      if (recoveryElements.hasForgotPassword || recoveryElements.forgotPasswordLink) {
        try {
          await this.click('a:has-text("Esqueci"), a:has-text("Forgot"), button:has-text("Esqueci")');
          await this.waitForTimeout(2000);

          const recoveryFormElements = await this.evaluate(() => {
            return {
              emailInput: !!document.querySelector('input[type="email"]'),
              submitButton: !!document.querySelector('button[type="submit"]'),
              instructions: !!document.querySelector('p, div').textContent?.includes('email')
            };
          });

          if (recoveryFormElements.emailInput && recoveryFormElements.submitButton) {
            this.addResult('PASSWORD_RECOVERY', 'PASS', 'Sistema de recuperação de senha implementado', Date.now() - startTime);
          } else {
            this.addResult('PASSWORD_RECOVERY', 'WARNING', 'Recuperação básica encontrada', Date.now() - startTime);
          }

        } catch (clickError) {
          this.addResult('PASSWORD_RECOVERY', 'WARNING', 'Link de recuperação encontrado mas não funcional', Date.now() - startTime);
        }
      } else {
        this.addResult('PASSWORD_RECOVERY', 'WARNING', 'Sistema de recuperação não encontrado', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('PASSWORD_RECOVERY', 'FAIL', `Erro ao testar recuperação: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa validações do formulário
   */
  private async testFormValidations(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('✅ Testando validações...');

      await this.navigate(this.getPageUrl());

      // Testar validação com campos vazios
      const validationTest = await this.evaluate(() => {
        const form = document.querySelector('form');
        const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
        const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
        const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;

        if (!form || !emailInput || !passwordInput || !submitButton) {
          return { hasValidation: false, reason: 'Elementos não encontrados' };
        }

        // Limpar campos e tentar submeter
        emailInput.value = '';
        passwordInput.value = '';

        // Verificar se os campos têm atributos de validação
        const hasRequiredAttrs = emailInput.hasAttribute('required') || passwordInput.hasAttribute('required');
        const hasValidationAttrs = emailInput.hasAttribute('pattern') || passwordInput.hasAttribute('minlength');

        return {
          hasValidation: true,
          hasRequiredAttrs,
          hasValidationAttrs,
          hasClientValidation: emailInput.validity !== undefined
        };
      });

      if (validationTest.hasValidation) {
        let validationFeatures = [];
        if (validationTest.hasRequiredAttrs) validationFeatures.push('campos obrigatórios');
        if (validationTest.hasValidationAttrs) validationFeatures.push('validação de formato');
        if (validationTest.hasClientValidation) validationFeatures.push('validação client-side');

        if (validationFeatures.length > 0) {
          this.addResult('FORM_VALIDATIONS', 'PASS', `Validações implementadas: ${validationFeatures.join(', ')}`, Date.now() - startTime);
        } else {
          this.addResult('FORM_VALIDATIONS', 'WARNING', 'Validações básicas ou ausentes', Date.now() - startTime);
        }
      } else {
        this.addResult('FORM_VALIDATIONS', 'FAIL', validationTest.reason, Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('FORM_VALIDATIONS', 'FAIL', `Erro ao testar validações: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa recursos de segurança
   */
  private async testSecurityFeatures(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🛡️ Testando recursos de segurança...');

      const securityFeatures = await this.evaluate(() => {
        const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
        const form = document.querySelector('form') as HTMLFormElement;

        return {
          hasPasswordToggle: !!document.querySelector('[class*="toggle"], [class*="show"], button[type="button"]'),
          hasSecureProtocol: window.location.protocol === 'https:',
          hasAutocompleteOff: passwordInput?.getAttribute('autocomplete') === 'off' || 
                             passwordInput?.getAttribute('autocomplete') === 'new-password',
          hasCSRFProtection: !!document.querySelector('input[name*="csrf"], input[name*="token"]'),
          formMethod: form?.getAttribute('method')?.toUpperCase()
        };
      });

      let securityFeatures_list = [];
      if (securityFeatures.hasSecureProtocol) securityFeatures_list.push('HTTPS');
      if (securityFeatures.hasPasswordToggle) securityFeatures_list.push('toggle de senha');
      if (securityFeatures.hasAutocompleteOff) securityFeatures_list.push('autocomplete seguro');
      if (securityFeatures.hasCSRFProtection) securityFeatures_list.push('proteção CSRF');
      if (securityFeatures.formMethod === 'POST') securityFeatures_list.push('método POST');

      if (securityFeatures_list.length >= 3) {
        this.addResult('SECURITY_FEATURES', 'PASS', `Recursos implementados: ${securityFeatures_list.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('SECURITY_FEATURES', 'WARNING', `Recursos limitados: ${securityFeatures_list.join(', ')}`, Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('SECURITY_FEATURES', 'FAIL', `Erro ao testar segurança: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Testa login social
   */
  private async testSocialLogin(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🌐 Testando login social...');

      const socialElements = await this.evaluate(() => {
        const textContent = document.body.textContent?.toLowerCase() || '';
        
        return {
          hasGoogleLogin: textContent.includes('google') || !!document.querySelector('[class*="google"]'),
          hasFacebookLogin: textContent.includes('facebook') || !!document.querySelector('[class*="facebook"]'),
          hasGithubLogin: textContent.includes('github') || !!document.querySelector('[class*="github"]'),
          socialButtons: document.querySelectorAll('button[class*="social"], a[class*="social"]').length,
          oauthButtons: document.querySelectorAll('button:has-text("Google"), button:has-text("Facebook")').length
        };
      });

      let socialProviders = [];
      if (socialElements.hasGoogleLogin) socialProviders.push('Google');
      if (socialElements.hasFacebookLogin) socialProviders.push('Facebook');
      if (socialElements.hasGithubLogin) socialProviders.push('GitHub');

      if (socialProviders.length > 0 || socialElements.socialButtons > 0) {
        this.addResult('SOCIAL_LOGIN', 'PASS', `Login social disponível: ${socialProviders.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('SOCIAL_LOGIN', 'WARNING', 'Login social não implementado', Date.now() - startTime);
      }

      if (this.config.screenshots) {
        await this.takeScreenshot('social_login');
      }

    } catch (error) {
      this.addResult('SOCIAL_LOGIN', 'FAIL', `Erro ao testar login social: ${error}`, Date.now() - startTime);
    }
  }
}