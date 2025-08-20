# 🔍 Guia de Diagnóstico - API do Tiny

## 🎯 Objetivo
Identificar e resolver o problema de conectividade com a API do Tiny ERP.

## 🧪 Testes Disponíveis

### 1. **🔌 Testar Conectividade** (Botão Roxo)
- **Função:** `testTinyApiConnection()`
- **O que faz:** Testa conexão básica com a API
- **Resultado esperado:** Status OK com contatos encontrados

### 2. **🔍 Debug URLs** (Botão Laranja)
- **Função:** `debugTinyApiUrls()`
- **O que faz:** Testa 3 URLs diferentes:
  - Proxy (`/api/tiny/...`)
  - Direta (`https://api.tiny.com.br/api2/...`)
  - Configurada (baseada no ambiente)
- **Resultado esperado:** Pelo menos uma URL deve funcionar

### 3. **🧪 Testar Busca** (Botão Verde)
- **Função:** `searchTinyContactByCriteria()`
- **O que faz:** Busca contato específico
- **Dados de teste:**
  - Email: contato.cabral@gmail.com
  - CPF: 07048665955
  - Nome: Júnior Cesar Alves Cabral

## 📋 Passos para Diagnóstico

### Passo 1: Verificar Configuração
1. Abra o console do navegador (F12)
2. Clique no botão **🔌 Testar Conectividade**
3. Observe os logs:
   ```
   🧪 [TinyAPI] Testando conectividade...
   🔧 [TinyAPI] URL Base: /api/tiny/
   🔑 [TinyAPI] Token: 8f45883a76...
   ```

### Passo 2: Testar URLs
1. Clique no botão **🔍 Debug URLs**
2. Observe qual URL funciona:
   - ✅ **Proxy:** Configuração correta
   - ✅ **Direta:** Problema no proxy, mas API funciona
   - ❌ **Todas:** Problema de token ou rede

### Passo 3: Analisar Erros
Possíveis erros e soluções:

#### ❌ **CORS Error**
```
Access to XMLHttpRequest at 'https://api.tiny.com.br' from origin 'http://localhost' has been blocked by CORS policy
```
**Solução:** Usar proxy (já configurado)

#### ❌ **404 Not Found**
```
HTTP 404: Not Found
```
**Solução:** Verificar URL da API

#### ❌ **401 Unauthorized**
```
HTTP 401: Unauthorized
```
**Solução:** Verificar token da API

#### ❌ **Network Error**
```
Network Error
```
**Solução:** Verificar conexão com internet

## 🔧 Configurações Atuais

### Token da API
```
8f45883a76440801fab9969236bad8a843393d693ab7ead62a2eced20859ca3a
```

### URLs Testadas
1. **Proxy:** `/api/tiny/contatos.pesquisa.php`
2. **Direta:** `https://api.tiny.com.br/api2/contatos.pesquisa.php`
3. **Configurada:** Baseada em `TINY_API_BASE_URL`

### Proxy Configurado (vite.config.ts)
```typescript
'/api/tiny': {
  target: 'https://api.tiny.com.br/api2',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/tiny/, ''),
  secure: true
}
```

## 📊 Interpretando Resultados

### ✅ **Sucesso Total**
- Todas as URLs funcionam
- API está acessível
- Token válido
- **Próximo passo:** Verificar dados de busca

### ⚠️ **Sucesso Parcial**
- Apenas algumas URLs funcionam
- Problema de configuração
- **Próximo passo:** Ajustar configuração

### ❌ **Falha Total**
- Nenhuma URL funciona
- Possíveis causas:
  - Token inválido
  - API fora do ar
  - Problema de rede
  - **Próximo passo:** Verificar token e rede

## 🚀 Próximos Passos

### Se a API Funcionar:
1. Verificar se os dados de teste existem no Tiny
2. Ajustar critérios de busca
3. Implementar cache para performance

### Se a API Não Funcionar:
1. Verificar token no painel do Tiny
2. Testar API diretamente (Postman/Insomnia)
3. Contatar suporte do Tiny se necessário

## 📞 Suporte

### Tiny ERP
- **Site:** https://tiny.com.br
- **Documentação:** https://tiny.com.br/api
- **Suporte:** Painel administrativo do Tiny

### Logs Importantes
Sempre verificar no console:
- 🔧 Configuração da URL e token
- 📡 Status das requisições HTTP
- 📄 Dados das respostas da API
- ❌ Detalhes dos erros

---

**Última atualização:** $(date)
**Status:** Aguardando teste 