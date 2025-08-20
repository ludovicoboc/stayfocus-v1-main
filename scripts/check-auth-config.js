// Script para verificar configurações que podem causar o erro
// Run with: node scripts/check-auth-config.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExtensions() {
  console.log('🔧 Verificando extensões PostgreSQL...\n');
  
  try {
    // Tentar verificar extensões instaladas
    const { data, error } = await supabase
      .from('pg_extension')
      .select('extname');
    
    if (error) {
      console.error('❌ Erro ao verificar extensões:', error);
    } else {
      console.log('✅ Extensões instaladas:');
      data?.forEach(ext => console.log(`  - ${ext.extname}`));
      
      const hasUUID = data?.some(ext => ext.extname === 'uuid-ossp');
      const hasCrypto = data?.some(ext => ext.extname === 'pgcrypto');
      
      console.log(`\n📋 uuid-ossp: ${hasUUID ? '✅' : '❌'}`);
      console.log(`📋 pgcrypto: ${hasCrypto ? '✅' : '❌'}`);
    }
  } catch (err) {
    console.error('❌ Exceção ao verificar extensões:', err.message);
  }
}

async function checkRLSPolicies() {
  console.log('\n🔒 Verificando políticas RLS...\n');
  
  const tables = ['user_profiles', 'user_preferences', 'user_goals'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', table);
      
      if (error) {
        console.error(`❌ Erro ao verificar políticas da tabela ${table}:`, error);
      } else {
        console.log(`📋 Políticas da tabela ${table}: ${data?.length || 0}`);
        if (data?.length) {
          data.forEach(policy => {
            console.log(`  - ${policy.policyname} (${policy.cmd})`);
          });
        }
      }
    } catch (err) {
      console.error(`❌ Exceção ao verificar ${table}:`, err.message);
    }
  }
}

async function testBasicAuth() {
  console.log('\n🧪 Testando auth básico...\n');
  
  try {
    // Testar obter usuário atual (deve ser null)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Erro ao obter usuário:', error);
    } else {
      console.log('✅ Auth básico funcionando:', user ? 'usuário logado' : 'nenhum usuário');
    }
    
    // Testar obter sessão
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError);
    } else {
      console.log('✅ Sessão:', session ? 'ativa' : 'nenhuma');
    }
    
  } catch (err) {
    console.error('❌ Exceção no teste de auth:', err.message);
  }
}

async function testSignUpWithDifferentParams() {
  console.log('\n🧪 Testando signup com parâmetros mínimos...\n');
  
  const testEmail = `minimal+${Date.now()}@example.com`;
  
  try {
    // Teste 1: Signup mínimo sem confirmação
    console.log('📧 Tentativa 1: Signup mínimo');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'senha123',
      options: {
        emailRedirectTo: undefined
      }
    });
    
    if (error) {
      console.error('❌ Erro no signup mínimo:', error);
    } else {
      console.log('✅ Signup mínimo funcionou!', {
        user: data.user?.id ? 'criado' : 'não criado',
        session: data.session ? 'ativa' : 'não ativa'
      });
    }
    
  } catch (err) {
    console.error('❌ Exceção no teste de signup:', err.message);
  }
}

async function main() {
  console.log('🔍 Diagnóstico Completo do Auth\n');
  
  await checkExtensions();
  await checkRLSPolicies();
  await testBasicAuth();
  await testSignUpWithDifferentParams();
  
  console.log('\n📋 Próximos passos para investigar:');
  console.log('1. Verificar configurações do Auth no Dashboard Supabase');
  console.log('2. Verificar se confirmação de email está habilitada');
  console.log('3. Verificar logs do Supabase (se disponível)');
  console.log('4. Testar com usuário diferente');
  
  console.log('\n🏁 Diagnóstico concluído');
}

main().catch(console.error);