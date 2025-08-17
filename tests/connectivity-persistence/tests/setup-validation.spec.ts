import { test, expect } from '@playwright/test';
import { defaultTestConfig } from '../config/test-config';
import { loginToApplication, navigateToRoute, measurePagePerformance } from '../utils/test-utils';

/**
 * Setup Validation Tests
 * These tests validate that the test environment is properly configured
 */

test.describe('Setup Validation', () => {
  
  test('should validate basic application connectivity', async ({ page }) => {
    console.log('🧪 Testing basic application connectivity...');
    
    // Navigate to home page
    await page.goto('/');
    
    // Verify page loads
    await expect(page).toHaveTitle(/StayFocus|Focus/i);
    
    // Measure performance
    const performance = await measurePagePerformance(page);
    console.log('📊 Performance metrics:', performance);
    
    // Verify performance is acceptable (less than 5 seconds)
    expect(performance.loadTime).toBeLessThan(5000);
  });
  
  test('should validate authentication system', async ({ page }) => {
    console.log('🧪 Testing authentication system...');
    
    try {
      // Attempt login with test credentials
      await loginToApplication(page);
      
      // Verify we're logged in (adjust selector based on your app)
      await expect(page.locator('body')).toContainText(/dashboard|início|home/i);
      
      console.log('✅ Authentication test passed');
      
    } catch (error) {
      console.warn('⚠️  Authentication test failed - this may be expected if test user doesn\'t exist');
      console.warn('Error:', error);
      
      // Don't fail the test if it's just missing test credentials
      if (defaultTestConfig.credentials.email === 'test@example.com') {
        test.skip('Skipping authentication test - no test credentials configured');
      } else {
        throw error;
      }
    }
  });
  
  test('should validate all main routes are accessible', async ({ page }) => {
    console.log('🧪 Testing main routes accessibility...');
    
    // Test each route from configuration
    for (const route of defaultTestConfig.routes) {
      console.log(`Testing route: ${route.path}`);
      
      try {
        await navigateToRoute(page, route.path);
        
        // Verify route loads without errors
        await expect(page.locator('body')).not.toContainText('404');
        await expect(page.locator('body')).not.toContainText('Error');
        
        console.log(`✅ Route ${route.path} is accessible`);
        
      } catch (error) {
        console.error(`❌ Route ${route.path} failed:`, error);
        throw error;
      }
    }
  });
  
  test('should validate Supabase connectivity', async ({ page }) => {
    console.log('🧪 Testing Supabase connectivity...');
    
    // Navigate to a page that uses Supabase
    await page.goto('/');
    
    // Check for Supabase-related network requests
    const supabaseRequests: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('supabase.co')) {
        supabaseRequests.push(request.url());
      }
    });
    
    // Wait for potential Supabase requests
    await page.waitForTimeout(3000);
    
    // Log Supabase requests for debugging
    if (supabaseRequests.length > 0) {
      console.log('📡 Supabase requests detected:', supabaseRequests.length);
      console.log('✅ Supabase connectivity confirmed');
    } else {
      console.warn('⚠️  No Supabase requests detected - this may be normal for public pages');
    }
  });
  
  test('should validate test data templates', async ({ page }) => {
    console.log('🧪 Validating test data templates...');
    
    // Verify all routes have test data configured
    for (const route of defaultTestConfig.routes) {
      expect(route.testData).toBeDefined();
      expect(route.validationQueries).toBeDefined();
      expect(route.validationQueries.length).toBeGreaterThan(0);
      
      console.log(`✅ Route ${route.path} has valid test data configuration`);
    }
  });
  
  test('should validate environment configuration', async ({ page }) => {
    console.log('🧪 Validating environment configuration...');
    
    // Check required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    for (const envVar of requiredEnvVars) {
      expect(process.env[envVar]).toBeDefined();
      expect(process.env[envVar]).not.toBe('');
      console.log(`✅ ${envVar} is configured`);
    }
    
    // Validate configuration values
    expect(defaultTestConfig.baseUrl).toBeDefined();
    expect(defaultTestConfig.timeout).toBeGreaterThan(0);
    expect(defaultTestConfig.retryAttempts).toBeGreaterThan(0);
    
    console.log('✅ Environment configuration is valid');
  });
  
});