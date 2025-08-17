import { chromium, FullConfig } from '@playwright/test';
import { defaultTestConfig } from '../config/test-config';

/**
 * Global setup for connectivity and persistence tests
 * This runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for connectivity tests...');
  
  try {
    // Validate environment variables
    await validateEnvironment();
    
    // Test basic connectivity
    await testBasicConnectivity();
    
    // Verify Supabase connection
    await verifySupabaseConnection();
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

/**
 * Validate that all required environment variables are set
 */
async function validateEnvironment() {
  console.log('🔍 Validating environment variables...');
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Warn about test credentials
  if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
    console.warn('⚠️  Test credentials not configured. Using defaults.');
  }
  
  console.log('✅ Environment validation passed');
}

/**
 * Test basic connectivity to the application
 */
async function testBasicConnectivity() {
  console.log('🌐 Testing basic application connectivity...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test if the application is accessible
    const response = await page.goto(defaultTestConfig.baseUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    if (!response || !response.ok()) {
      throw new Error(`Application not accessible. Status: ${response?.status()}`);
    }
    
    console.log('✅ Application is accessible');
    
  } catch (error) {
    throw new Error(`Failed to connect to application: ${error}`);
  } finally {
    await browser.close();
  }
}

/**
 * Verify Supabase connection using environment variables
 */
async function verifySupabaseConnection() {
  console.log('🗄️  Verifying Supabase connection...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  try {
    // Test Supabase REST API endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Supabase API not accessible. Status: ${response.status}`);
    }
    
    console.log('✅ Supabase connection verified');
    
  } catch (error) {
    throw new Error(`Failed to connect to Supabase: ${error}`);
  }
}

export default globalSetup;