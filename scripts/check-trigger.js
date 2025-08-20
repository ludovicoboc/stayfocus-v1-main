// Script para verificar o estado do trigger após migração
// Run with: node scripts/check-trigger.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrigger() {
  console.log('🔍 Verificando estado do trigger...\n');
  
  try {
    // Verificar se o trigger existe
    const { data: triggers, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            tgname as trigger_name,
            tgrelid::regclass as table_name,
            tgenabled as is_enabled,
            tgtype,
            proname as function_name
          FROM pg_trigger t
          JOIN pg_proc p ON t.tgfoid = p.oid
          WHERE tgname = 'on_auth_user_created';
        `
      });
    
    if (triggerError) {
      console.error('❌ Erro ao verificar trigger:', triggerError.message);
      return;
    }
    
    if (triggers && triggers.length > 0) {
      console.log('✅ Trigger encontrado:');
      console.table(triggers);
    } else {
      console.log('❌ Trigger não encontrado');
    }
    
    // Verificar se a função handle_new_user existe
    const { data: functions, error: functionError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            proname as function_name,
            prosecdef as is_security_definer,
            proacl as permissions
          FROM pg_proc 
          WHERE proname = 'handle_new_user';
        `
      });
    
    if (functionError) {
      console.error('❌ Erro ao verificar função:', functionError.message);
      return;
    }
    
    if (functions && functions.length > 0) {
      console.log('\n✅ Função handle_new_user encontrada:');
      console.table(functions);
    } else {
      console.log('\n❌ Função handle_new_user não encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

async function checkMigrationHistory() {
  console.log('\n📋 Verificando histórico de migrações...');
  
  try {
    const { data: migrations, error } = await supabase
      .from('supabase_migrations.schema_migrations')
      .select('*')
      .order('version', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao verificar migrações:', error.message);
      return;
    }
    
    if (migrations && migrations.length > 0) {
      console.log('✅ Últimas migrações aplicadas:');
      console.table(migrations);
    } else {
      console.log('❌ Nenhuma migração encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação de migrações:', error.message);
  }
}

async function main() {
  console.log('🔧 Verificando Estado do Sistema após Migração\n');
  
  await checkTrigger();
  await checkMigrationHistory();
  
  console.log('\n🏁 Verificação concluída');
}

main().catch(console.error);