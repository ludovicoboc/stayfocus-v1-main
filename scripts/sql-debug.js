// Script para debug usando SQL direto
// Run with: node scripts/sql-debug.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL(query, description) {
  console.log(`\n🔍 ${description}:`);
  console.log(`📝 Query: ${query.replace(/\s+/g, ' ').trim()}`);
  
  try {
    const { data, error } = await supabase.rpc('sql', { query });
    
    if (error) {
      console.error('❌ Erro:', error);
    } else {
      console.log('✅ Resultado:');
      if (Array.isArray(data) && data.length > 0) {
        console.table(data);
      } else {
        console.log(data || 'Nenhum resultado');
      }
    }
  } catch (err) {
    console.error('❌ Exceção:', err.message);
  }
}

async function main() {
  console.log('🔧 Debug SQL do Trigger\n');
  
  // 1. Verificar se o trigger existe
  await runSQL(`
    SELECT 
      tgname as trigger_name,
      tgrelid::regclass as table_name,
      tgenabled as enabled,
      tgtype
    FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  `, 'Verificar trigger on_auth_user_created');
  
  // 2. Verificar funções
  await runSQL(`
    SELECT 
      proname as function_name,
      prosecdef as security_definer,
      prolang::regtype as language,
      provolatile
    FROM pg_proc 
    WHERE proname IN ('handle_new_user', 'create_default_user_data')
  `, 'Verificar funções do trigger');
  
  // 3. Verificar esquema das tabelas
  await runSQL(`
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name IN ('user_profiles', 'user_preferences', 'user_goals')
    ORDER BY table_name, ordinal_position
  `, 'Verificar esquema das tabelas');
  
  // 4. Verificar constraints
  await runSQL(`
    SELECT 
      conname as constraint_name,
      conrelid::regclass as table_name,
      contype as constraint_type,
      confrelid::regclass as referenced_table
    FROM pg_constraint 
    WHERE conrelid::regclass::text IN ('user_profiles', 'user_preferences', 'user_goals')
  `, 'Verificar constraints das tabelas');
  
  // 5. Verificar se auth.users existe
  await runSQL(`
    SELECT 
      table_schema,
      table_name 
    FROM information_schema.tables 
    WHERE table_name = 'users' AND table_schema = 'auth'
  `, 'Verificar tabela auth.users');
  
  console.log('\n🏁 Debug concluído');
}

main().catch(console.error);