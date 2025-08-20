// Test script to verify Supabase authentication
// Run with: node scripts/test-auth.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function testUserCreation() {
  console.log('\n🧪 Testing user creation...');
  
  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  try {
    // Attempt to create user
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      console.error('❌ User creation failed:', error.message);
      console.error('Error details:', error);
      return false;
    }
    
    console.log('✅ User creation successful');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Needs confirmation:', !data.session);
    
    // Clean up - try to delete the test user
    if (data.user?.id) {
      console.log('🧹 Cleaning up test user...');
      // Note: Deleting users requires admin privileges, so this might fail
      // In production, you'd use the admin client
    }
    
    return true;
  } catch (err) {
    console.error('❌ User creation error:', err.message);
    return false;
  }
}

async function checkTables() {
  console.log('\n📋 Checking required tables...');
  
  const tables = ['user_profiles', 'user_preferences', 'user_goals'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table ${table} check failed:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists and is accessible`);
      }
    } catch (err) {
      console.error(`❌ Error checking table ${table}:`, err.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting Supabase Auth Test\n');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed without valid connection');
    return;
  }
  
  await checkTables();
  await testUserCreation();
  
  console.log('\n🏁 Test completed');
}

main().catch(console.error);