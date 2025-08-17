#!/usr/bin/env node

/**
 * Script de validação do setup inicial
 * Executa verificações básicas de conectividade antes dos testes
 */

import { chromium } from '@playwright/test';
import { defaultTestConfig } from '../config/test-config';

async function validateSetup() {
  console.log('🔍 Iniciando validação do setup...\n');
  
  let browser;
  let allChecksPass = true;
  
  try {
    // 1. Validar variáveis de ambiente
    console.log('1️⃣ Validando variáveis de ambiente...');
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`❌ Variável de ambiente ausente: ${envVar}`);
        allChecksPass = false;
      } else {
        console.log(`✅ ${envVar} configurada`);
      }
    }
    
    // 2. Testar conectividade com Supabase
    console.log('\n2️⃣ Testando conectividade com Supabase...');
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey!}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Supabase API acessível');
      } else {
        console.error(`❌ Supabase API retornou status: ${response.status}`);
        allChecksPass = false;
      }
    } catch (error) {
      console.error('❌ Erro ao conectar com Supabase:', error);
      allChecksPass = false;
    }
    
    // 3. Testar inicialização do browser
    console.log('\n3️⃣ Testando inicialização do browser...');
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      console.log('✅ Browser inicializado com sucesso');
      
      // 4. Testar conectividade com a aplicação
      console.log('\n4️⃣ Testando conectividade com a aplicação...');
      try {
        const response = await page.goto(defaultTestConfig.baseUrl, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        if (response && response.ok()) {
          console.log(`✅ Aplicação acessível em ${defaultTestConfig.baseUrl}`);
          
          // Verificar se é uma página Next.js
          const title = await page.title();
          console.log(`📄 Título da página: "${title}"`);
          
        } else {
          console.error(`❌ Aplicação não acessível. Status: ${response?.status()}`);
          allChecksPass = false;
        }
      } catch (error) {
        console.error('❌ Erro ao acessar aplicação:', error);
        allChecksPass = false;
      }
      
    } catch (error) {
      console.error('❌ Erro ao inicializar browser:', error);
      allChecksPass = false;
    }
    
    // 5. Validar configuração de testes
    console.log('\n5️⃣ Validando configuração de testes...');
    
    if (defaultTestConfig.routes.length === 0) {
      console.error('❌ Nenhuma rota configurada para teste');
      allChecksPass = false;
    } else {
      console.log(`✅ ${defaultTestConfig.routes.length} rotas configuradas para teste:`);
      defaultTestConfig.routes.forEach(route => {
        console.log(`   - ${route.path} (${route.name})`);
      });
    }
    
    if (defaultTestConfig.timeout <= 0) {
      console.error('❌ Timeout inválido configurado');
      allChecksPass = false;
    } else {
      console.log(`✅ Timeout configurado: ${defaultTestConfig.timeout}ms`);
    }
    
    // 6. Verificar credenciais de teste
    console.log('\n6️⃣ Verificando credenciais de teste...');
    if (defaultTestConfig.credentials.email === 'test@example.com') {
      console.warn('⚠️  Usando credenciais padrão - configure credenciais reais em .env.test.local');
    } else {
      console.log(`✅ Credenciais personalizadas configuradas para: ${defaultTestConfig.credentials.email}`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante validação:', error);
    allChecksPass = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Resultado final
  console.log('\n' + '='.repeat(50));
  if (allChecksPass) {
    console.log('🎉 SETUP VALIDADO COM SUCESSO!');
    console.log('✅ Todos os componentes estão funcionando corretamente');
    console.log('🚀 Você pode executar os testes de conectividade');
    process.exit(0);
  } else {
    console.log('❌ SETUP INCOMPLETO');
    console.log('🔧 Corrija os problemas identificados antes de executar os testes');
    process.exit(1);
  }
}

// Executar validação se chamado diretamente
if (require.main === module) {
  validateSetup().catch(error => {
    console.error('💥 Erro fatal durante validação:', error);
    process.exit(1);
  });
}

export { validateSetup };