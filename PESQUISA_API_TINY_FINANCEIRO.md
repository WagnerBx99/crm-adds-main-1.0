# Pesquisa API Tiny ERP - Dados Financeiros

## Descobertas

### API V2 (Atual)
A API V2 do Tiny/Olist possui os seguintes endpoints financeiros:

1. **Contas a Pagar** - `contas.pagar.pesquisa.php`
2. **Contas a Receber** - `contas.receber.pesquisa.php`
3. **Notas Fiscais** - `notas.fiscais.pesquisa.php` (já implementado)
4. **Pedidos** - `pedidos.pesquisa.php` (já implementado)

### Endpoints Financeiros a Implementar

#### 1. Contas a Pagar
- `contas.pagar.pesquisa.php` - Listar contas a pagar
- `conta.pagar.obter.php` - Obter detalhes de uma conta

#### 2. Contas a Receber
- `contas.receber.pesquisa.php` - Listar contas a receber
- `conta.receber.obter.php` - Obter detalhes de uma conta

### Parâmetros Comuns
- `token` - Token de autenticação
- `formato` - Formato da resposta (json)
- `dataInicial` - Data inicial do período
- `dataFinal` - Data final do período
- `situacao` - Status da conta (pago, pendente, etc.)
- `pagina` - Número da página para paginação

### Campos Retornados (Contas a Pagar/Receber)
- `id` - ID da conta
- `numero_documento` - Número do documento
- `data_vencimento` - Data de vencimento
- `data_emissao` - Data de emissão
- `data_pagamento` - Data do pagamento (se pago)
- `valor` - Valor original
- `valor_pago` - Valor pago
- `saldo` - Saldo devedor
- `situacao` - Situação (aberto, pago, cancelado)
- `cliente` / `fornecedor` - Dados do cliente/fornecedor
- `categoria` - Categoria financeira
- `observacoes` - Observações

## Status da Implementação Atual

O sistema já possui:
- ✅ Clientes
- ✅ Pedidos
- ✅ Notas Fiscais
- ❌ Contas a Pagar (a implementar)
- ❌ Contas a Receber (a implementar)
- ❌ Fluxo de Caixa (a implementar)
