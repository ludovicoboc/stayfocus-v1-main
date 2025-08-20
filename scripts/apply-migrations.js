// Script para aplicar migrações manualmente no novo banco
// Run with: node scripts/apply-migrations.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration(filename) {
  console.log(`📄 Aplicando migração: ${filename}`);
  
  try {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Note: This is a simplified approach - in production you'd need service role key
    console.log(`📝 Conteúdo da migração carregado (${sql.length} caracteres)`);
    console.log(`⚠️  Para aplicar esta migração, você precisa executar o SQL diretamente no Supabase Dashboard`);
    console.log(`🔗 Dashboard: ${supabaseUrl.replace('.supabase.co', '')}.supabase.co/project/your-project/sql`);
    
    return true;
  } catch (error) {
    console.error(`❌ Erro ao carregar migração ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Aplicando Migrações no Novo Banco\n');
  
  // Lista de migrações em ordem
  const migrations = [
    '20240101000000_create_alimentacao_tables.sql',
    '20240101000001_create_concursos_tables.sql',
    '20240101000002_create_estudos_tables.sql',
    '20240101000003_create_hiperfocos_tables.sql',
    '20240816_create_autoconhecimento_tables.sql',
    '20240816_create_dashboard_tables.sql',
    '20240816_create_financas_tables.sql',
    '20240816_create_lazer_tables.sql',
    '20240817_create_perfil_tables.sql',
    '20240818_create_sono_tables.sql',
    '20240819_fix_saude_tables.sql',
    '20240820_create_compromissos_table.sql',
    '20250117_add_increment_question_usage_function.sql',
    '20250817133400_create_random_competition_questions.sql',
    '20250817_add_date_to_dashboard_tables.sql'
  ];
  
  console.log(`📋 Encontradas ${migrations.length} migrações para aplicar\n`);
  
  for (const migration of migrations) {
    await applyMigration(migration);
    console.log(''); // linha em branco
  }
  
  console.log('✅ Verificação de migrações concluída');
  console.log('📋 Para aplicar as migrações, você precisa:');
  console.log('1. Ir ao Supabase Dashboard > SQL Editor');
  console.log('2. Executar cada arquivo de migração em ordem');
  console.log('3. Ou usar a CLI do Supabase com as credenciais corretas');
}

main().catch(console.error);