// Script para testar se o problema é o trigger
// Run with: node scripts/test-without-trigger.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectInsert() {
  console.log('🧪 Testando inserção direta na auth.users...\n');
  
  const testUserId = crypto.randomUUID();
  const testEmail = `test+${Date.now()}@example.com`;
  
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🆔 ID: ${testUserId}`);
  
  try {
    // Tentar inserir diretamente usando SQL no Supabase Dashboard
    console.log('\n📋 SQL para executar no Dashboard:');
    console.log(`
-- Execute este SQL no Supabase Dashboard > SQL Editor:
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '${testUserId}',
  'authenticated',
  'authenticated',
  '${testEmail}',
  crypt('senha123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}'
);

-- Verificar se o trigger executou:
SELECT * FROM user_profiles WHERE user_id = '${testUserId}';
SELECT * FROM user_preferences WHERE user_id = '${testUserId}';
SELECT * FROM user_goals WHERE user_id = '${testUserId}';
    `);
    
    console.log('\n⚠️  Execute o SQL acima no Dashboard e me informe o resultado.');
    console.log('📍 Se o trigger funcionar, as 3 tabelas devem ter dados.');
    console.log('📍 Se houver erro, veremos qual é exatamente.');
    
    // Verificar se o usuário fictício já existe nas tabelas
    console.log('\n🔍 Verificando dados existentes...');
    
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(5);
    
    const { data: goals } = await supabase
      .from('user_goals')
      .select('*')
      .limit(5);
    
    console.log(`📊 Profiles existentes: ${profiles?.length || 0}`);
    console.log(`📊 Preferences existentes: ${preferences?.length || 0}`);
    console.log(`📊 Goals existentes: ${goals?.length || 0}`);
    
    if (profiles?.length) {
      console.log('📋 Amostras de profiles:');
      console.table(profiles);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function testSignUpError() {
  console.log('\n🧪 Tentando signup novamente para capturar erro...');
  
  const testEmail = `test+${Date.now()}@example.com`;
  
  try {
    const result = await supabase.auth.signUp({
      email: testEmail,
      password: 'senha123'
    });
    
    console.log('✅ Signup funcionou!', result);
    
  } catch (error) {
    console.error('❌ Erro detalhado no signup:');
    console.error(JSON.stringify(error, null, 2));
  }
}

async function main() {
  console.log('🔧 Teste de Diagnóstico do Trigger\n');
  
  await testDirectInsert();
  await testSignUpError();
  
  console.log('\n🏁 Teste concluído');
}

main().catch(console.error);