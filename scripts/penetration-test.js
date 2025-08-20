#!/usr/bin/env node

/**
 * Script de Teste de Penetração
 * 
 * Este script realiza testes básicos de penetração em endpoints críticos
 * da aplicação, identificando possíveis vulnerabilidades de segurança.
 * 
 * IMPORTANTE: Este script deve ser usado apenas em ambientes de desenvolvimento
 * ou staging, nunca em produção sem as devidas autorizações.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

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

// Leitura dos argumentos da linha de comando
const args = process.argv.slice(2);
const baseUrl = args[0] || 'http://localhost:8081';
const verbose = args.includes('--verbose') || args.includes('-v');
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1];

// Validar URL base
try {
  new URL(baseUrl);
} catch (error) {
  console.error(`${colors.red}URL inválida: ${baseUrl}${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.bright}${colors.blue}=== Teste de Penetração ====${colors.reset}`);
console.log(`${colors.bright}URL Base:${colors.reset} ${baseUrl}`);
console.log(`${colors.bright}Modo:${colors.reset} ${verbose ? 'Detalhado' : 'Normal'}`);
console.log(`${colors.bright}Saída:${colors.reset} ${outputFile || 'Console'}\n`);

// Relatório de resultados
const results = {
  startTime: new Date(),
  baseUrl,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  tests: []
};

// Função para registrar resultados
function logResult(test, status, details = null) {
  const result = {
    test,
    status,
    timestamp: new Date(),
    details
  };
  
  results.tests.push(result);
  results.summary.total++;
  
  if (status === 'passed') {
    results.summary.passed++;
    console.log(`${colors.green}✓ ${test}${colors.reset}`);
  } else if (status === 'warning') {
    results.summary.warnings++;
    console.log(`${colors.yellow}⚠ ${test}${colors.reset}`);
  } else {
    results.summary.failed++;
    console.log(`${colors.red}✗ ${test}${colors.reset}`);
  }
  
  if (verbose && details) {
    console.log(`  ${details}`);
  }
}

// Função para fazer requisições HTTP
async function request(method, endpoint, options = {}) {
  const url = new URL(endpoint, baseUrl).toString();
  try {
    if (verbose) {
      console.log(`${colors.blue}Requisição: ${method} ${url}${colors.reset}`);
    }
    
    const response = await axios({
      method,
      url,
      validateStatus: () => true, // Não lançar erro para status != 2xx
      ...options
    });
    
    return response;
  } catch (error) {
    if (verbose) {
      console.log(`${colors.red}Erro na requisição: ${error.message}${colors.reset}`);
    }
    return { status: 0, data: null, headers: {}, error: error.message };
  }
}

// Funções de teste
const tests = {
  // 1. Verificar se endpoints sensíveis estão protegidos
  async checkProtectedEndpoints() {
    const sensitiveEndpoints = [
      '/api/user',
      '/api/admin',
      '/api/security/logs',
      '/api/security/settings',
      '/api/data/export'
    ];
    
    for (const endpoint of sensitiveEndpoints) {
      const response = await request('GET', endpoint);
      
      if (response.status === 401 || response.status === 403) {
        logResult(`Endpoint ${endpoint} está protegido`, 'passed', 
          `Status: ${response.status}, requer autenticação/autorização`);
      } else if (response.status === 404) {
        logResult(`Endpoint ${endpoint} não encontrado`, 'warning',
          `Status: ${response.status}, endpoint pode não existir ou estar em outro caminho`);
      } else if (response.status >= 200 && response.status < 300) {
        logResult(`Endpoint ${endpoint} NÃO está protegido`, 'failed',
          `Status: ${response.status}, retornou sucesso sem autenticação`);
      } else {
        logResult(`Teste de proteção para ${endpoint} inconclusivo`, 'warning',
          `Status: ${response.status}, comportamento inesperado`);
      }
    }
  },
  
  // 2. Testar vulnerabilidades de injeção (SQL, NoSQL, etc)
  async testInjectionVulnerabilities() {
    const injectionPatterns = [
      { payload: "' OR 1=1 --", name: "SQL Injection Simples" },
      { payload: "'; DROP TABLE users; --", name: "SQL Injection Destrutivo" },
      { payload: '{"$gt":""}', name: "NoSQL Injection" },
      { payload: "<script>alert('XSS')</script>", name: "XSS Básico" }
    ];
    
    const endpoints = [
      '/api/login',
      '/api/search',
      '/api/user/profile'
    ];
    
    for (const endpoint of endpoints) {
      for (const pattern of injectionPatterns) {
        // Testar via GET (parâmetros de query)
        const getResponse = await request('GET', `${endpoint}?q=${encodeURIComponent(pattern.payload)}`);
        
        // Testar via POST (payload no corpo)
        const postResponse = await request('POST', endpoint, {
          data: { query: pattern.payload }
        });
        
        if (getResponse.status === 500 || postResponse.status === 500) {
          logResult(`Possível vulnerabilidade de injeção (${pattern.name}) em ${endpoint}`, 'failed',
            `Servidor retornou erro 500 ao tentar payload de injeção`);
        } else if (getResponse.data?.includes?.('<script>') || 
                 (typeof postResponse.data === 'string' && postResponse.data.includes('<script>'))) {
          logResult(`Possível vulnerabilidade XSS em ${endpoint}`, 'failed',
            `Payload retornado sem sanitização no response`);
        } else {
          logResult(`Teste de injeção (${pattern.name}) em ${endpoint}`, 'passed',
            `Nenhuma vulnerabilidade detectada`);
        }
      }
    }
  },
  
  // 3. Testar cabeçalhos de segurança
  async checkSecurityHeaders() {
    const response = await request('GET', '/');
    const headers = response.headers || {};
    
    const securityHeaders = {
      'strict-transport-security': 'Strict Transport Security',
      'content-security-policy': 'Content Security Policy',
      'x-content-type-options': 'X-Content-Type-Options',
      'x-frame-options': 'X-Frame-Options',
      'x-xss-protection': 'X-XSS-Protection'
    };
    
    for (const [header, name] of Object.entries(securityHeaders)) {
      if (headers[header]) {
        logResult(`Cabeçalho ${name} configurado`, 'passed', 
          `Valor: ${headers[header]}`);
      } else {
        logResult(`Cabeçalho ${name} não encontrado`, 'warning',
          `Este cabeçalho de segurança não está configurado no servidor`);
      }
    }
  },
  
  // 4. Verificar exposição de informações sensíveis
  async checkInformationExposure() {
    const response = await request('GET', '/');
    const serverHeader = response.headers?.server;
    const poweredByHeader = response.headers?.['x-powered-by'];
    
    if (serverHeader) {
      logResult(`Servidor expõe informações de versão`, 'warning',
        `Cabeçalho Server: ${serverHeader}`);
    } else {
      logResult(`Cabeçalho Server não exposto`, 'passed');
    }
    
    if (poweredByHeader) {
      logResult(`Servidor expõe tecnologia utilizada`, 'warning',
        `Cabeçalho X-Powered-By: ${poweredByHeader}`);
    } else {
      logResult(`Cabeçalho X-Powered-By não exposto`, 'passed');
    }
    
    // Verificar exposição de rotas de debug/dev
    const debugRoutes = ['/debug', '/dev', '/test', '/api/debug', '/api/test'];
    
    for (const route of debugRoutes) {
      const debugResponse = await request('GET', route);
      
      if (debugResponse.status >= 200 && debugResponse.status < 400) {
        logResult(`Possível rota de desenvolvimento exposta: ${route}`, 'failed',
          `Status: ${debugResponse.status}`);
      }
    }
  },
  
  // 5. Testar limitação de taxa (rate limiting)
  async testRateLimiting() {
    const endpoint = '/api/login';
    const requests = 20; // Número de solicitações para testar limites
    const results = [];
    
    console.log(`${colors.yellow}Executando teste de rate limiting (${requests} requisições)...${colors.reset}`);
    
    for (let i = 0; i < requests; i++) {
      const response = await request('POST', endpoint, {
        data: { username: 'test', password: 'test' }
      });
      results.push(response.status);
      
      // Pequena pausa entre requisições para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const rateLimited = results.some(status => status === 429);
    
    if (rateLimited) {
      logResult(`Limitação de taxa (rate limiting) implementada`, 'passed',
        `Recebeu status 429 depois de múltiplas requisições`);
    } else {
      logResult(`Limitação de taxa (rate limiting) não detectada`, 'warning',
        `Não recebeu status 429 após ${requests} requisições consecutivas`);
    }
  }
};

// Função principal para executar todos os testes
async function runTests() {
  console.log(`${colors.bright}Iniciando testes de penetração...${colors.reset}\n`);
  
  const testFunctions = Object.values(tests);
  
  for (let i = 0; i < testFunctions.length; i++) {
    const testName = Object.keys(tests)[i];
    console.log(`${colors.bright}Executando grupo de testes: ${testName}${colors.reset}`);
    
    try {
      await testFunctions[i]();
    } catch (error) {
      console.error(`${colors.red}Erro ao executar teste ${testName}: ${error.message}${colors.reset}`);
      if (verbose) {
        console.error(error.stack);
      }
    }
    
    console.log(''); // Linha em branco entre grupos de testes
  }
  
  // Finalizar resultados
  results.endTime = new Date();
  results.duration = results.endTime - results.startTime;
  
  // Exibir resumo
  console.log(`${colors.bright}${colors.blue}=== Resumo dos Testes ====${colors.reset}`);
  console.log(`${colors.bright}Total de testes:${colors.reset} ${results.summary.total}`);
  console.log(`${colors.bright}Sucesso:${colors.reset} ${colors.green}${results.summary.passed}${colors.reset}`);
  console.log(`${colors.bright}Falhas:${colors.reset} ${colors.red}${results.summary.failed}${colors.reset}`);
  console.log(`${colors.bright}Avisos:${colors.reset} ${colors.yellow}${results.summary.warnings}${colors.reset}`);
  console.log(`${colors.bright}Duração:${colors.reset} ${(results.duration / 1000).toFixed(2)} segundos`);
  
  // Salvar resultados em arquivo, se solicitado
  if (outputFile) {
    const outputData = JSON.stringify(results, null, 2);
    fs.writeFileSync(outputFile, outputData);
    console.log(`\n${colors.green}Resultados salvos em ${outputFile}${colors.reset}`);
  }
}

// Executar os testes
runTests().catch(error => {
  console.error(`${colors.red}Erro fatal durante os testes: ${error.message}${colors.reset}`);
  process.exit(1);
}); 