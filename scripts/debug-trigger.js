// Script para verificar o estado do trigger no novo banco
// Run with: node scripts/debug-trigger.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggerStatus() {
  console.log('🔍 Verificando estado do trigger...\n');
  
  try {
    // Verificar se o trigger existe
    const { data: triggers, error: triggerError } = await supabase
      .from('pg_trigger')
      .select(`
        tgname,
        tgrelid::regclass as table_name,
        tgenabled,
        tgtype
      `)
      .eq('tgname', 'on_auth_user_created');
    
    if (triggerError) {
      console.error('❌ Erro ao verificar trigger:', triggerError);
      return;
    }
    
    console.log('📋 Triggers encontrados:');
    console.table(triggers || []);
    
    // Verificar se a função existe
    const { data: functions, error: functionError } = await supabase
      .from('pg_proc')
      .select(`
        proname,
        prosecdef,
        prolang::regtype as language
      `)
      .eq('proname', 'handle_new_user');
    
    if (functionError) {
      console.error('❌ Erro ao verificar função:', functionError);
      return;
    }
    
    console.log('\n📋 Funções encontradas:');
    console.table(functions || []);
    
    // Verificar função create_default_user_data
    const { data: createFunctions, error: createError } = await supabase
      .from('pg_proc')
      .select(`
        proname,
        prosecdef,
        prolang::regtype as language
      `)
      .eq('proname', 'create_default_user_data');
    
    if (createError) {
      console.error('❌ Erro ao verificar função create_default_user_data:', createError);
      return;
    }
    
    console.log('\n📋 Função create_default_user_data:');
    console.table(createFunctions || []);
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

async function testTriggerFunction() {
  console.log('\n🧪 Testando função manualmente...');
  
  try {
    // Gerar um UUID fictício para teste
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';
    
    const { data, error } = await supabase
      .rpc('create_default_user_data', {
        user_uuid: testUserId
      });
    
    if (error) {
      console.error('❌ Erro ao testar função:', error);
    } else {
      console.log('✅ Função executou sem erro');
      
      // Verificar se os dados foram criados
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', testUserId);
      
      console.log('📋 Dados criados:', profile);
      
      // Limpar dados de teste
      await supabase.from('user_profiles').delete().eq('user_id', testUserId);
      await supabase.from('user_preferences').delete().eq('user_id', testUserId);
      await supabase.from('user_goals').delete().eq('user_id', testUserId);
    }
    
  } catch (error) {
    console.error('❌ Exceção ao testar função:', error.message);
  }
}

async function main() {
  console.log('🔧 Debug do Trigger no Novo Banco\n');
  
  await checkTriggerStatus();
  await testTriggerFunction();
  
  console.log('\n🏁 Debug concluído');
}

main().catch(console.error);