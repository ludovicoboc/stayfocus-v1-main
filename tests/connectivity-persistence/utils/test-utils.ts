import { Page, expect } from '@playwright/test';
import { defaultTestConfig, TestCredentials } from '../config/test-config';

/**
 * Utility functions for connectivity and persistence tests
 */

/**
 * Login to the application using provided credentials
 */
export async function loginToApplication(page: Page, credentials?: TestCredentials): Promise<void> {
  const creds = credentials || defaultTestConfig.credentials;
  
  console.log(`🔐 Logging in with email: ${creds.email}`);
  
  // Navigate to login page (adjust path based on your app structure)
  await page.goto('/auth/login');
  
  // Wait for login form to be visible
  await page.waitForSelector('form', { timeout: 10000 });
  
  // Fill in credentials
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Wait for successful login (adjust selector based on your app)
  await page.waitForURL('/', { timeout: 15000 });
  
  console.log('✅ Login successful');
}

/**
 * Logout from the application
 */
export async function logoutFromApplication(page: Page): Promise<void> {
  console.log('🚪 Logging out...');
  
  try {
    // Look for logout button or user menu (adjust selectors based on your app)
    const userMenu = page.locator('[data-testid="user-menu"]').or(page.locator('.user-dropdown'));
    
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.click('text=Logout').or(page.click('text=Sair'));
    } else {
      // Alternative logout method
      await page.goto('/auth/logout');
    }
    
    // Wait for redirect to login page
    await page.waitForURL('/auth/login', { timeout: 10000 });
    
    console.log('✅ Logout successful');
  } catch (error) {
    console.warn('⚠️  Logout may have failed:', error);
  }
}

/**
 * Navigate to a specific route and verify it loads
 */
export async function navigateToRoute(page: Page, route: string): Promise<void> {
  console.log(`🧭 Navigating to route: ${route}`);
  
  const startTime = Date.now();
  
  await page.goto(route, { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  const loadTime = Date.now() - startTime;
  console.log(`⏱️  Route loaded in ${loadTime}ms`);
  
  // Verify the page loaded successfully
  await expect(page).toHaveURL(new RegExp(route));
  
  // Wait for main content to be visible
  await page.waitForSelector('main', { timeout: 10000 });
  
  console.log('✅ Route navigation successful');
}

/**
 * Take a screenshot with timestamp for debugging
 */
export async function takeDebugScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `debug-${name}-${timestamp}.png`;
  
  await page.screenshot({
    path: `test-results/screenshots/${filename}`,
    fullPage: true
  });
  
  console.log(`📸 Debug screenshot saved: ${filename}`);
}

/**
 * Wait for element to be visible with retry logic
 */
export async function waitForElementWithRetry(
  page: Page, 
  selector: string, 
  maxRetries: number = 3
): Promise<void> {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      await page.waitForSelector(selector, { timeout: 10000 });
      return;
    } catch (error) {
      attempts++;
      console.warn(`⚠️  Attempt ${attempts}/${maxRetries} failed for selector: ${selector}`);
      
      if (attempts >= maxRetries) {
        throw new Error(`Element not found after ${maxRetries} attempts: ${selector}`);
      }
      
      // Wait before retry
      await page.waitForTimeout(2000);
    }
  }
}

/**
 * Fill form field with validation
 */
export async function fillFormField(
  page: Page, 
  selector: string, 
  value: string,
  validate: boolean = true
): Promise<void> {
  await page.fill(selector, value);
  
  if (validate) {
    const actualValue = await page.inputValue(selector);
    if (actualValue !== value) {
      throw new Error(`Form field validation failed. Expected: ${value}, Got: ${actualValue}`);
    }
  }
}

/**
 * Generate unique test identifier
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format test data with unique identifiers
 */
export function formatTestData(baseData: any, testId?: string): any {
  const id = testId || generateTestId();
  
  const formatted = { ...baseData };
  
  // Add unique identifiers to common fields
  if (formatted.nome) {
    formatted.nome = `${formatted.nome} ${id}`;
  }
  if (formatted.title) {
    formatted.title = `${formatted.title} ${id}`;
  }
  if (formatted.observacoes) {
    formatted.observacoes = `${formatted.observacoes} [${id}]`;
  }
  if (formatted.notas) {
    formatted.notas = `${formatted.notas} [${id}]`;
  }
  if (formatted.content) {
    formatted.content = `${formatted.content} [${id}]`;
  }
  
  return formatted;
}

/**
 * Measure page load performance
 */
export async function measurePagePerformance(page: Page): Promise<{
  loadTime: number;
  domContentLoaded: number;
  networkIdle: number;
}> {
  const startTime = Date.now();
  
  const [domContentLoaded] = await Promise.all([
    page.waitForLoadState('domcontentloaded').then(() => Date.now() - startTime),
  ]);
  
  const networkIdle = await page.waitForLoadState('networkidle').then(() => Date.now() - startTime);
  const loadTime = Date.now() - startTime;
  
  return {
    loadTime,
    domContentLoaded,
    networkIdle
  };
}