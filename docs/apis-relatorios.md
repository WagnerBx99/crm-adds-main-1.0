# APIs do Módulo de Relatórios

## Estrutura das APIs

Desenvolvemos as seguintes APIs para suportar o módulo de relatórios:

### 1. APIs de Dashboards

- **GET /api/reports/dashboards** - Lista todos os dashboards disponíveis
- **POST /api/reports/dashboards** - Cria um novo dashboard
- **GET /api/reports/dashboards/{id}** - Obtém detalhes de um dashboard específico
- **PUT /api/reports/dashboards/{id}** - Atualiza um dashboard existente
- **DELETE /api/reports/dashboards/{id}** - Remove um dashboard
- **POST /api/reports/dashboards/generate** - Gera dados para um dashboard inteiro ou para widgets específicos

### 2. APIs de Relatórios Agendados

- **GET /api/reports/scheduled** - Lista todos os relatórios agendados
- **POST /api/reports/scheduled** - Cria um novo agendamento de relatório
- **GET /api/reports/scheduled/{id}** - Obtém detalhes de um relatório agendado específico
- **PUT /api/reports/scheduled/{id}** - Atualiza um relatório agendado
- **DELETE /api/reports/scheduled/{id}** - Remove um agendamento de relatório

### 3. APIs de Dados de Relatórios

- **POST /api/reports/data/{type}** - Obtém dados para um tipo específico de relatório com base na configuração
- **POST /api/reports/export** - Exporta relatórios em diferentes formatos (PDF, Excel, CSV, JSON, HTML)

## Tipos de Relatórios Suportados

Os seguintes tipos de relatórios estão disponíveis:

- **vendas** - Dados de vendas ao longo do tempo
- **estoque** - Informações sobre estoque atual e movimentações
- **clientes** - Dados sobre clientes e comportamento
- **financeiro** - Relatórios financeiros (faturamento, receitas, despesas)
- **produção** - Métricas de produção e eficiência
- **desempenho** - Indicadores de desempenho operacional
- **kanban** - Fluxo de trabalho e distribuição em quadros Kanban
- **status** - Distribuição de status de pedidos/projetos
- **leadTime** - Tempo médio por etapa do processo
- **aprovacao** - Taxas de aprovação e rejeição
- **retrabalho** - Índices de retrabalho e motivos
- **topClientes** - Ranking de maiores clientes
- **produtosMaisVendidos** - Ranking de produtos mais vendidos
- **produtividade** - Métricas de produtividade por equipe ou indivíduo
- **atrasados** - Relatórios de pedidos/entregas atrasadas

## Formatos de Visualização

Os seguintes formatos de visualização são suportados:

- **line** - Gráfico de linha (séries temporais)
- **bar** - Gráfico de barras
- **pie** - Gráfico de pizza
- **donut** - Gráfico de rosca
- **radar** - Gráfico radar
- **table** - Tabela de dados
- **gauge** - Medidor tipo velocímetro
- **card** - Cartão de valor único
- **kpi** - Indicador-chave de desempenho
- **stackedBar** - Gráfico de barras empilhadas
- **heatmap** - Mapa de calor
- **gantt** - Gráfico de Gantt para cronogramas

## Exemplos de Uso

### Obter Dados de um Relatório de Vendas

```json
// Requisição
POST /api/reports/data/vendas
{
  "config": {
    "visualization": "line",
    "dateRange": {
      "from": "2023-01-01",
      "to": "2023-06-30"
    },
    "groupBy": ["produto"],
    "metrics": ["valor_total"]
  }
}

// Resposta
{
  "labels": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
  "datasets": [
    {
      "label": "Vendas (R$)",
      "data": [3252, 4800, 3050, 5100, 4200, 6300],
      "borderColor": "rgb(53, 162, 235)",
      "backgroundColor": "rgba(53, 162, 235, 0.5)"
    }
  ],
  "summary": {
    "total": 26702,
    "average": 4450.33,
    "min": 3050,
    "max": 6300
  }
}
```

### Criar um Dashboard

```json
// Requisição
POST /api/reports/dashboards
{
  "name": "Dashboard de Vendas 2023",
  "description": "Visão consolidada das vendas do ano corrente",
  "widgets": [
    {
      "id": "widget-1",
      "reportId": "vendas-mensal",
      "position": { "x": 0, "y": 0, "w": 8, "h": 4 },
      "title": "Vendas Mensais",
      "type": "line"
    },
    {
      "id": "widget-2",
      "reportId": "top-clientes",
      "position": { "x": 8, "y": 0, "w": 4, "h": 4 },
      "title": "Top 5 Clientes",
      "type": "bar"
    }
  ]
}

// Resposta
{
  "message": "Dashboard criado com sucesso",
  "data": {
    "id": "dashboard-1686422400000",
    "name": "Dashboard de Vendas 2023",
    "description": "Visão consolidada das vendas do ano corrente",
    "widgets": [...],
    "createdBy": "user-123",
    "createdAt": "2023-06-10T14:00:00.000Z",
    "updatedAt": "2023-06-10T14:00:00.000Z",
    "isDefault": false
  }
}
```

## Implementação Técnica

Todas as APIs foram implementadas utilizando:

1. **Autenticação e Autorização** - Verificação de permissões através do middleware `SecureApi`
2. **Validação de Dados** - Verificação de parâmetros obrigatórios e formatos
3. **Gerenciamento de Erros** - Tratamento adequado de exceções com mensagens informativas
4. **Dados Simulados** - Atualmente usando dados simulados para desenvolvimento e testes
5. **Padrões RESTful** - Seguindo as melhores práticas para APIs RESTful

Na próxima fase, será necessário conectar estas APIs a um backend real com banco de dados persistente. 