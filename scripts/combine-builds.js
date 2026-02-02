/**
 * Script para combinar os builds do Hub e Comissões em uma única pasta dist
 * 
 * Estrutura final:
 * dist/
 * ├── index.html (Hub)
 * ├── assets/ (Hub)
 * └── comissoes/
 *     ├── index.html (Comissões)
 *     └── assets/ (Comissões)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const HUB_DIST = path.join(ROOT_DIR, 'hub', 'dist');
const COMISSOES_DIST = path.join(ROOT_DIR, 'relatorios', 'comissoes', 'dist');

// Função para copiar diretório recursivamente
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Função para limpar diretório
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

console.log('🚀 Combinando builds...\n');

// 1. Limpa pasta dist
console.log('📁 Limpando pasta dist...');
cleanDir(DIST_DIR);

// 2. Copia Hub para dist/
console.log('📦 Copiando Hub para dist/...');
if (fs.existsSync(HUB_DIST)) {
  copyDir(HUB_DIST, DIST_DIR);
  console.log('   ✅ Hub copiado');
} else {
  console.log('   ❌ Hub dist não encontrado!');
  process.exit(1);
}

// 3. Copia Comissões para dist/comissoes/
console.log('📦 Copiando Comissões para dist/comissoes/...');
const COMISSOES_DEST = path.join(DIST_DIR, 'comissoes');
if (fs.existsSync(COMISSOES_DIST)) {
  copyDir(COMISSOES_DIST, COMISSOES_DEST);
  console.log('   ✅ Comissões copiado');
} else {
  console.log('   ❌ Comissões dist não encontrado!');
  process.exit(1);
}

console.log('\n✨ Build combinado com sucesso!');
console.log(`📂 Output: ${DIST_DIR}`);
console.log('\nEstrutura:');
console.log('  dist/');
console.log('  ├── index.html (Hub)');
console.log('  ├── assets/');
console.log('  └── comissoes/');
console.log('      ├── index.html');
console.log('      └── assets/');
