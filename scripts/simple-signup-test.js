// Teste simples de criação de usuário com logs detalhados
// Run with: node scripts/simple-signup-test.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  console.log('🧪 Testando criação de usuário...\n');
  
  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  console.log(`📧 Email de teste: ${testEmail}`);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      console.error('❌ Erro detalhado:', {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error
      });
      return false;
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('📋 Dados do usuário:', {
      id: data.user?.id,
      email: data.user?.email,
      hasSession: !!data.session
    });
    
    return true;
    
  } catch (err) {
    console.error('❌ Exceção durante criação:', err);
    return false;
  }
}

async function checkTables() {
  console.log('\n📋 Verificando se as tabelas de perfil existem...');
  
  const tables = ['user_profiles', 'user_preferences', 'user_goals'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${table}: acessível`);
      }
    } catch (err) {
      console.log(`❌ Tabela ${table}: erro de acesso - ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Teste Simples de Criação de Usuário\n');
  
  await checkTables();
  await testSignup();
  
  console.log('\n🏁 Teste concluído');
}

main().catch(console.error);