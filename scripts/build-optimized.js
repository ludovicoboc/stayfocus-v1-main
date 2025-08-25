#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando build otimizado...');

try {
  // 1. Limpar cache do Next.js
  console.log('📁 Limpando cache do Next.js...');
  try {
    execSync('rm -rf .next', { stdio: 'inherit' });
  } catch (err) {
    // Ignorar erro se a pasta não existir
  }

  // 2. Limpar node_modules específicos que causam problemas
  console.log('🗑️ Limpando dependências problemáticas...');
  const problematicPaths = [
    'node_modules/@supabase/auth-helpers-nextjs',
    'node_modules/.cache',
    'node_modules/.pnpm/registry.npmjs.org/@supabase+auth-helpers-nextjs'
  ];

  for (const problematicPath of problematicPaths) {
    try {
      execSync(`rm -rf ${problematicPath}`, { stdio: 'inherit' });
    } catch (err) {
      // Ignorar se não existir
    }
  }

  // 3. Reinstalar dependências
  console.log('📦 Reinstalando dependências...');
  execSync('pnpm install --frozen-lockfile', { stdio: 'inherit' });

  // 4. Verificar se critters está disponível
  console.log('🔍 Verificando dependências críticas...');
  try {
    require.resolve('critters');
    console.log('✅ Critters disponível');
  } catch (err) {
    console.log('⚠️ Instalando critters...');
    execSync('pnpm add -D critters@latest', { stdio: 'inherit' });
  }

  // 5. Build otimizado
  console.log('🏗️ Executando build...');
  execSync('pnpm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });

  console.log('✅ Build concluído com sucesso!');
} catch (error) {
  console.error('❌ Erro no build:', error.message);
  process.exit(1);
}