#!/usr/bin/env node

/**
 * Build Script para Otimização Mobile
 * Otimiza assets, gera reports e configura PWA
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando build otimizado para mobile...\n');

// Configurações
const BUILD_CONFIG = {
  // Análise de bundle
  analyzeBundleSize: process.env.ANALYZE === 'true',
  
  // Otimização de imagens
  optimizeImages: process.env.NODE_ENV === 'production',
  
  // Geração de reports
  generateReports: true,
  
  // PWA optimizations
  optimizePWA: true
};

// Função para executar comandos
function runCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} concluído\n`);
  } catch (error) {
    console.error(`❌ Erro em ${description}:`, error.message);
    process.exit(1);
  }
}

// Função para verificar dependências
function checkDependencies() {
  console.log('🔍 Verificando dependências...');
  
  const requiredDeps = [
    'next',
    '@supabase/supabase-js',
    'react',
    'react-dom'
  ];
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const installedDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  const missingDeps = requiredDeps.filter(dep => !installedDeps[dep]);
  
  if (missingDeps.length > 0) {
    console.error('❌ Dependências faltando:', missingDeps.join(', '));
    process.exit(1);
  }
  
  console.log('✅ Todas as dependências estão instaladas\n');
}

// Função para otimizar imagens
function optimizeImages() {
  if (!BUILD_CONFIG.optimizeImages) {
    console.log('⏭️  Pulando otimização de imagens (desenvolvimento)\n');
    return;
  }
  
  console.log('🖼️  Otimizando imagens para mobile...');
  
  const publicDir = path.join(process.cwd(), 'public');
  const imagesDir = path.join(publicDir, 'images');
  
  if (fs.existsSync(imagesDir)) {
    // Script de otimização de imagens (placeholder)
    console.log('   📁 Processando diretório public/images/');
    
    // Aqui você pode adicionar otimização real com sharp, imagemin, etc.
    // Por ora, apenas logging
    const imageFiles = fs.readdirSync(imagesDir, { recursive: true })
      .filter(file => /\.(jpg|jpeg|png|webp|svg)$/i.test(file));
    
    console.log(`   📊 ${imageFiles.length} imagens encontradas`);
    console.log('   ✅ Otimização de imagens simulada (adicione sharp/imagemin para real)');
  }
  
  console.log('✅ Otimização de imagens concluída\n');
}

// Função para gerar PWA assets
function generatePWAAssets() {
  if (!BUILD_CONFIG.optimizePWA) {
    console.log('⏭️  Pulando otimização PWA\n');
    return;
  }
  
  console.log('📱 Gerando assets PWA...');
  
  // Verificar se existem os ícones necessários
  const requiredIcons = [
    'icon-192x192.png',
    'icon-512x512.png',
    'favicon.ico'
  ];
  
  const publicDir = path.join(process.cwd(), 'public');
  const missingIcons = requiredIcons.filter(icon => 
    !fs.existsSync(path.join(publicDir, icon))
  );
  
  if (missingIcons.length > 0) {
    console.warn('⚠️  Ícones PWA faltando:', missingIcons.join(', '));
  } else {
    console.log('✅ Todos os ícones PWA estão presentes');
  }
  
  // Verificar manifest
  const manifestExists = fs.existsSync(path.join(process.cwd(), 'app', 'manifest.ts'));
  if (manifestExists) {
    console.log('✅ Manifest PWA configurado');
  } else {
    console.warn('⚠️  Manifest PWA não encontrado');
  }
  
  // Verificar service worker
  const swExists = fs.existsSync(path.join(publicDir, 'sw.js'));
  if (swExists) {
    console.log('✅ Service Worker configurado');
  } else {
    console.warn('⚠️  Service Worker não encontrado');
  }
  
  console.log('✅ Verificação PWA concluída\n');
}

// Função para gerar relatórios
function generateReports() {
  if (!BUILD_CONFIG.generateReports) {
    console.log('⏭️  Pulando geração de relatórios\n');
    return;
  }
  
  console.log('📊 Gerando relatórios de build...');
  
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Relatório de dependências
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const depsReport = {
    timestamp: new Date().toISOString(),
    dependencies: Object.keys(packageJson.dependencies || {}),
    devDependencies: Object.keys(packageJson.devDependencies || {}),
    total: Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }).length
  };
  
  fs.writeFileSync(
    path.join(reportsDir, 'dependencies-report.json'),
    JSON.stringify(depsReport, null, 2)
  );
  
  // Relatório de build config
  const buildReport = {
    timestamp: new Date().toISOString(),
    config: BUILD_CONFIG,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    optimization: {
      bundleAnalysis: BUILD_CONFIG.analyzeBundleSize,
      imageOptimization: BUILD_CONFIG.optimizeImages,
      pwaOptimization: BUILD_CONFIG.optimizePWA
    }
  };
  
  fs.writeFileSync(
    path.join(reportsDir, 'build-report.json'),
    JSON.stringify(buildReport, null, 2)
  );
  
  console.log('✅ Relatórios salvos em ./reports/\n');
}

// Função para executar análise de bundle
function analyzeBundleSize() {
  if (!BUILD_CONFIG.analyzeBundleSize) {
    console.log('⏭️  Pulando análise de bundle (use ANALYZE=true)\n');
    return;
  }
  
  console.log('📊 Analisando tamanho do bundle...');
  
  // O webpack-bundle-analyzer será executado via next.config.mjs
  console.log('   🔍 Análise será gerada durante o build');
  console.log('   📄 Relatório disponível em: bundle-analysis.html');
  console.log('✅ Configuração de análise ativada\n');
}

// Função principal
async function main() {
  console.log('🎯 StayFocus Mobile Build Optimizer\n');
  
  try {
    // 1. Verificar dependências
    checkDependencies();
    
    // 2. Otimizar imagens
    optimizeImages();
    
    // 3. Configurar PWA
    generatePWAAssets();
    
    // 4. Configurar análise de bundle
    analyzeBundleSize();
    
    // 5. Limpar builds anteriores
    runCommand('rm -rf .next', 'Limpando builds anteriores');
    
    // 6. Executar build Next.js
    const buildCommand = BUILD_CONFIG.analyzeBundleSize 
      ? 'ANALYZE=true npm run build'
      : 'npm run build';
    
    runCommand(buildCommand, 'Executando build Next.js otimizado');
    
    // 7. Gerar relatórios finais
    generateReports();
    
    // 8. Verificações finais
    console.log('🔍 Verificações finais...');
    
    const buildDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(buildDir)) {
      console.log('✅ Build gerado com sucesso');
      
      // Verificar se service worker foi copiado
      const swInBuild = path.join(buildDir, 'static', 'sw.js');
      if (fs.existsSync(swInBuild)) {
        console.log('✅ Service Worker incluído no build');
      }
    }
    
    console.log('\n🎉 Build otimizado para mobile concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Testar a aplicação: npm start');
    console.log('   2. Verificar PWA: Lighthouse audit');
    console.log('   3. Validar performance mobile');
    
    if (BUILD_CONFIG.analyzeBundleSize) {
      console.log('   4. Revisar bundle-analysis.html');
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante o build:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  main,
  BUILD_CONFIG
};