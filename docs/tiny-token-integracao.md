# Integração com Tiny ERP usando Token (API v2)

## Visão Geral

Este documento descreve como configurar e utilizar a integração com o Tiny ERP através do método de autenticação por Token (API v2).

## Configuração do Token

O token de acesso pode ser configurado de duas maneiras:

1. **Variável de Ambiente:**
   
   Configure a variável de ambiente `TINY_API_TOKEN` com o valor do seu token:
   
   ```
   TINY_API_TOKEN=8f45883a76440801fab9969236bad8a843393d693ab7ead62a2eced20859ca3a
   ```

2. **Configuração Direta:**
   
   Altere o valor do token no arquivo `src/lib/integrations/tiny/tinyConfig.ts`:
   
   ```typescript
   export const tinyConfig: TinyApiConfig = {
     // ...outras configurações
     token: process.env.TINY_API_TOKEN || 'seu-token-aqui',
     // ...outras configurações
   };
   ```

## Como Obter um Token

Para obter um token de acesso à API do Tiny ERP:

1. Acesse o painel administrativo do Tiny ERP
2. Navegue até Configurações > Integrações > API
3. Clique em "Gerar Token"
4. Copie o token gerado e configure conforme as instruções acima

## Formato das Chamadas API

As chamadas à API do Tiny ERP usando o método Token seguem o formato:

```
GET https://api.tiny.com.br/api2/ENDPOINT.php?token={TOKEN}&formato=json
```

Exemplo:
```
GET https://api.tiny.com.br/api2/produto.list.php?token=8f45883a76440801fab9969236bad8a843393d693ab7ead62a2eced20859ca3a&formato=json
```

## Tratamento de Erros

Em caso de erro na autenticação, verifique:

1. Se o token está correto e não expirou
2. Se o IP de onde está sendo feita a requisição está autorizado na plataforma Tiny
3. Se a conta possui permissões para acessar a API

## Exemplos de Uso

### Listar Produtos

```javascript
async function listarProdutos() {
  const res = await axios.get('https://api.tiny.com.br/api2/produto.list.php', {
    params: { token: tinyConfig.token, formato: 'json' }
  });
  return res.data.retorno.produtos;
}
```

### Buscar Cliente por ID

```javascript
async function buscarCliente(id) {
  const res = await axios.get('https://api.tiny.com.br/api2/cliente.obter.php', {
    params: { token: tinyConfig.token, id, formato: 'json' }
  });
  return res.data.retorno.cliente;
}
```

## Segurança

O token de API fornece acesso completo à sua conta Tiny ERP. Recomendações:

1. Nunca compartilhe seu token em código público
2. Armazene-o em variáveis de ambiente, especialmente em produção
3. Considere rotacionar periodicamente o token
4. Configure restrições de IP no painel do Tiny ERP 