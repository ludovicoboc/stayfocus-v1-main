const fs = require('fs');
const path = require('path');

// Diretórios para processar
const directories = [
  'lib',
  'components', 
  'hooks',
  'utils'
];

// Função para processar um arquivo
function processFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remover console.log statements (manter console.error e console.warn)
    const originalContent = content;
    
    // Pattern para capturar console.log statements
    content = content.replace(/^\s*console\.log\([^;]*\);?\s*$/gm, '');
    content = content.replace(/console\.log\([^)]*\);?/g, '');
    
    // Remover linhas vazias excessivas
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Processado: ${filePath}`);
      modified = true;
    }
    
    return modified;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Função para processar diretório recursivamente
function processDirectory(dirPath) {
  let totalModified = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        totalModified += processDirectory(fullPath);
      } else if (stat.isFile()) {
        if (processFile(fullPath)) {
          totalModified++;
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao processar diretório ${dirPath}:`, error.message);
  }
  
  return totalModified;
}

// Executar processamento
console.log('🧹 Removendo console.log statements...\n');

let totalFiles = 0;

for (const dir of directories) {
  const dirPath = path.join(process.cwd(), dir);
  
  if (fs.existsSync(dirPath)) {
    console.log(`📁 Processando: ${dir}/`);
    const modified = processDirectory(dirPath);
    totalFiles += modified;
    console.log(`   ${modified} arquivos modificados\n`);
  } else {
    console.log(`⚠️  Diretório não encontrado: ${dir}/\n`);
  }
}

console.log(`🎉 Processamento concluído! ${totalFiles} arquivos modificados.`);
console.log('💡 Console.error e console.warn foram preservados para debugging.');