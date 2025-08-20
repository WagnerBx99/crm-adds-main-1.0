# Configuração do Token de Acesso Tiny ERP

Este documento explica como configurar e usar o token de acesso para a integração com a API do Tiny ERP.

## Configuração Rápida

1. Configure a variável de ambiente `TINY_API_TOKEN` com o token fornecido:
   ```
   TINY_API_TOKEN=8f45883a76440801fab9969236bad8a843393d693ab7ead62a2eced20859ca3a
   ```

2. Alternativamente, modifique diretamente no arquivo `src/lib/integrations/tiny/tinyConfig.ts`:
   ```typescript
   token: process.env.TINY_API_TOKEN || 'seu-token-aqui'
   ```

3. Certifique-se de que a opção `useOAuth` esteja definida como `false` no mesmo arquivo:
   ```typescript
   useOAuth: false
   ```

## Testando a Integração

1. Acesse o dashboard Tiny em `http://localhost:8080/tiny`
2. Verifique se o status exibe "Conectado ao Tiny ERP - Usando Token de Acesso (API v2)"
3. Clique em "Sincronizar Dados" para testar a conexão
4. Os dados de clientes, pedidos e produtos deverão ser exibidos no dashboard

## Formato das Chamadas API

As chamadas à API do Tiny usando o método Token seguem o formato:

```
GET https://api.tiny.com.br/api2/ENDPOINT.php?token={TOKEN}&formato=json
```

Exemplos:
- `produto.list.php`: Lista produtos
- `cliente.obter.php`: Obtém detalhes de um cliente
- `pedido.pesquisa.php`: Pesquisa pedidos

## Solução de Problemas

Se encontrar erros de conexão:

1. Verifique se o token está correto
2. Confira se a API do Tiny está operacional
3. Verifique os logs para detalhes do erro
4. Em alguns casos, pode ser necessário habilitar o IP da sua aplicação na plataforma Tiny

## Segurança

- Mantenha seu token seguro, preferencialmente em variáveis de ambiente
- Não compartilhe o token em repositórios públicos
- Configure restrições de IP na plataforma Tiny quando possível 