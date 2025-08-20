#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * Este script realiza uma auditoria de segurança básica no sistema,
 * verificando dependências, códigos e configurações.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { exit } = require('process');

// Cores para saída no console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

console.log(`${colors.bright}${colors.blue}=== Auditoria de Segurança ====${colors.reset}\n`);

// Função para executar comandos e capturar saída
function runCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    if (options.ignoreError) {
      return error.stdout || '';
    }
    
    console.error(`${colors.red}Erro ao executar comando:${colors.reset} ${command}`);
    console.error(error.stdout || error.message);
    
    if (options.exitOnError) {
      exit(1);
    }
    
    return '';
  }
}

// 1. Verificar vulnerabilidades em dependências
console.log(`${colors.bright}1. Verificando vulnerabilidades em dependências...${colors.reset}`);

const npmAudit = runCommand('npm audit --json', { ignoreError: true });

try {
  const auditResults = JSON.parse(npmAudit);
  const vulnerabilitiesCount = Object.values(auditResults.vulnerabilities || {}).length;
  
  if (vulnerabilitiesCount === 0) {
    console.log(`${colors.green}✓ Nenhuma vulnerabilidade encontrada em dependências.${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Encontradas ${vulnerabilitiesCount} vulnerabilidades em dependências.${colors.reset}`);
    
    // Mostrar vulnerabilidades de alta e crítica severidade
    Object.entries(auditResults.vulnerabilities || {}).forEach(([name, details]) => {
      if (['high', 'critical'].includes(details.severity)) {
        console.log(`  ${colors.red}${details.severity.toUpperCase()}:${colors.reset} ${name} (${details.via[0]})`);
      }
    });
    
    console.log(`\nExecute ${colors.bright}npm audit fix${colors.reset} para corrigir automaticamente quando possível.`);
  }
} catch (error) {
  console.error(`${colors.red}Erro ao analisar resultado do npm audit: ${error.message}${colors.reset}`);
}

// 2. Verificar padrões de código potencialmente inseguros
console.log(`\n${colors.bright}2. Verificando padrões de código inseguros...${colors.reset}`);

const insecurePatterns = [
  { pattern: 'eval\\(', description: 'Uso de eval() (pode levar a injeção de código)' },
  { pattern: 'document\\.write\\(', description: 'Uso de document.write() (pode ser inseguro)' },
  { pattern: '\\.innerHTML\\s*=', description: 'Atribuição direta a innerHTML (risco de XSS)' },
  { pattern: 'new\\s+Function\\(', description: 'Uso de new Function() (similar a eval)' },
  { pattern: 'Object\\.assign\\({}, ', description: 'Merge de objetos sem sanitização' },
  { pattern: 'localStorage\\.setItem\\([^,]+,\\s*[^)]+\\)', description: 'Armazenamento em localStorage sem criptografia' },
  { pattern: '\\$\\([^)]+\\)\\.html\\(', description: 'Manipulação insegura de HTML com jQuery' }
];

const srcDir = path.join(__dirname, '..', 'src');
const sourceFiles = runCommand(`find ${srcDir} -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js"`, { shell: true }).trim().split('\n');

let insecureCodeFound = false;

for (const pattern of insecurePatterns) {
  const grepCommand = `grep -E "${pattern.pattern}" --include="*.ts" --include="*.tsx" --include="*.js" -r src`;
  const results = runCommand(grepCommand, { ignoreError: true }).trim();
  
  if (results) {
    insecureCodeFound = true;
    const lines = results.split('\n').filter(line => line);
    console.log(`${colors.yellow}⚠ Possível código inseguro: ${pattern.description}${colors.reset}`);
    
    // Mostrar até 3 exemplos
    lines.slice(0, 3).forEach(line => {
      console.log(`  ${line.trim()}`);
    });
    
    if (lines.length > 3) {
      console.log(`  ...e mais ${lines.length - 3} ocorrências.`);
    }
  }
}

if (!insecureCodeFound) {
  console.log(`${colors.green}✓ Nenhum padrão de código inseguro detectado.${colors.reset}`);
}

// 3. Verificar configurações de segurança
console.log(`\n${colors.bright}3. Verificando configurações de segurança...${colors.reset}`);

const securityChecks = [
  { 
    name: 'Content-Security-Policy', 
    check: () => {
      // Verificar index.html por CSP
      const indexPath = path.join(__dirname, '..', 'index.html');
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf8');
        return content.includes('content-security-policy') || content.includes('Content-Security-Policy');
      }
      return false;
    }
  },
  { 
    name: 'HTTPS Redirect', 
    check: () => {
      // Verificar redirecionamento para HTTPS
      const serverFiles = [
        path.join(__dirname, '..', 'server.js'),
        path.join(__dirname, '..', 'src', 'server', 'index.js')
      ];
      
      for (const file of serverFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('req.secure') || content.includes('x-forwarded-proto')) {
            return true;
          }
        }
      }
      return false;
    }
  },
  { 
    name: 'Cookies Seguros', 
    check: () => {
      // Verificar configuração de cookies
      const srcFiles = runCommand('grep -r "cookie" --include="*.ts" --include="*.tsx" --include="*.js" src', { ignoreError: true });
      return srcFiles.includes('secure: true') && srcFiles.includes('httpOnly: true');
    }
  }
];

let securityIssuesFound = false;

for (const check of securityChecks) {
  const result = check.check();
  if (result) {
    console.log(`${colors.green}✓ ${check.name}: Configurado corretamente${colors.reset}`);
  } else {
    securityIssuesFound = true;
    console.log(`${colors.yellow}⚠ ${check.name}: Não encontrado ou configurado incorretamente${colors.reset}`);
  }
}

if (!securityIssuesFound) {
  console.log(`${colors.green}✓ Todas as configurações de segurança verificadas estão corretas.${colors.reset}`);
}

// 4. Sugestões de melhorias de segurança
console.log(`\n${colors.bright}4. Sugestões de melhorias de segurança:${colors.reset}`);

console.log(`
${colors.yellow}■ Implementar Content-Security-Policy para prevenir XSS${colors.reset}
  Adicione cabeçalhos CSP para restringir fontes de conteúdo.

${colors.yellow}■ Utilizar HTTPS em todos os ambientes${colors.reset}
  Garanta que toda comunicação seja criptografada, mesmo em desenvolvimento.

${colors.yellow}■ Implementar autenticação 2FA${colors.reset}
  Adicione uma camada extra de segurança com autenticação de dois fatores.

${colors.yellow}■ Verificar saída de logs${colors.reset}
  Certifique-se de que dados sensíveis não sejam expostos em logs.

${colors.yellow}■ Sanitizar todas as entradas de usuário${colors.reset}
  Implemente sanitização de dados em todas as entradas para prevenir injeções.

${colors.yellow}■ Implementar rotação de tokens${colors.reset}
  Configure renovação periódica de tokens para mitigar ataques.
`);

// 5. Resumo da auditoria
console.log(`\n${colors.bright}${colors.blue}=== Resumo da Auditoria ====${colors.reset}`);

console.log(`
${colors.bright}Status:${colors.reset} ${vulnerabilitiesCount > 0 || insecureCodeFound || securityIssuesFound ? `${colors.yellow}⚠ Atenção necessária${colors.reset}` : `${colors.green}✓ Parece bom${colors.reset}`}

${colors.bright}Próximos passos recomendados:${colors.reset}
1. Resolva as vulnerabilidades de dependências identificadas
2. Revise os padrões de código potencialmente inseguros
3. Implemente as configurações de segurança faltantes
4. Documente todas as medidas de segurança implementadas
5. Agende auditoria de segurança regular (trimestral)
`);

console.log(`\n${colors.bright}${colors.blue}Auditoria concluída em ${new Date().toLocaleString('pt-BR')}${colors.reset}`); 