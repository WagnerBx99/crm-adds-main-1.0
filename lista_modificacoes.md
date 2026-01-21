# Lista de Modificações - CRM ADDS

## Modificações Solicitadas Diretamente

Estas são as modificações explicitamente mencionadas na proposta técnica:

### 1. Backend e Banco de Dados

| # | Modificação | Descrição | Fase |
|---|-------------|-----------|------|
| 1.1 | **Estruturação do Banco de Dados** | Criar/otimizar estrutura para suportar dados financeiros, tarefas, cards e histórico de alterações | 1 |
| 1.2 | **Integração Financeira com ERP Tiny** | Implementar integração completa de dados financeiros com a API do Tiny ERP | 1 |
| 1.3 | **Backend API** | Desenvolver endpoints internos para atualização e consulta de dados | 1 |
| 1.4 | **Sincronização com ERP Tiny** | Garantir que ações do frontend sincronizem corretamente com o Tiny | 1 |

### 2. Frontend

| # | Modificação | Descrição | Fase |
|---|-------------|-----------|------|
| 2.1 | **Correção do Drag-and-Drop** | Corrigir a movimentação de cards no frontend (funcionalidade crítica mencionada) | 2 |
| 2.2 | **Fluxo de Aprovação de Encomendas de Arte** | Corrigir/melhorar o workflow de aprovação/revisão de encomendas | 2 |

### 3. Pipeline e Auditoria

| # | Modificação | Descrição | Fase |
|---|-------------|-----------|------|
| 3.1 | **Pipeline de Processamento** | Implementar gerenciamento de fluxo de dados internos para consistência e escalabilidade | 3 |
| 3.2 | **Logs de Auditoria** | Implementar sistema de logs e auditoria das alterações | 3 |
| 3.3 | **Monitoramento de Dados** | Sistema de monitoramento para acompanhamento das operações | 3 |

### 4. Segurança e Links Públicos

| # | Modificação | Descrição | Fase |
|---|-------------|-----------|------|
| 4.1 | **Módulo de Links Públicos** | Geração de links controlados, seguros e com validade definida | 2-3 |
| 4.2 | **Controle de Permissões** | Implementar controle de permissões para links públicos | 3-4 |

---

## Modificações Inferidas

Estas são modificações que podemos deduzir como necessárias com base no contexto da proposta e na análise do código existente:

### Backend/Infraestrutura

| # | Modificação Inferida | Justificativa |
|---|---------------------|---------------|
| I.1 | **Implementação de Backend Node.js** | A proposta menciona Node.js nas tecnologias, mas o projeto atual parece ser apenas frontend. Será necessário criar um backend real. |
| I.2 | **Configuração de Banco de Dados (PostgreSQL/MySQL)** | Mencionado como "a definir" - atualmente o sistema parece usar localStorage ou estado local. |
| I.3 | **Autenticação JWT** | Mencionada nos protocolos - pode ser necessário implementar ou melhorar o sistema de autenticação. |
| I.4 | **Criptografia de Dados Sensíveis** | Mencionada na segurança - implementar criptografia para informações sensíveis. |
| I.5 | **Validação de Dados** | Implementar validação robusta no backend para garantir integridade. |

### Frontend

| # | Modificação Inferida | Justificativa |
|---|---------------------|---------------|
| I.6 | **Refatoração da Integração Tiny** | O código atual tem múltiplos arquivos de correção relacionados ao Tiny (CORRECOES-API-TINY.md, etc.), indicando problemas existentes. |
| I.7 | **Correção de Bugs no Kanban** | Existem vários arquivos de correção (CORRECAO_DRAG_DROP_FINAL.md, RESUMO_CORRECOES_KANBAN.md), sugerindo instabilidade. |
| I.8 | **Melhoria no Fluxo de Aprovação** | Arquivos como CORRECAO_FLUXO_APROVACAO.md indicam problemas conhecidos nesta área. |
| I.9 | **Tratamento de Erros Undefined** | CORRECOES_ERRO_UNDEFINED.md sugere problemas de null/undefined não tratados. |

### Integração e Sincronização

| # | Modificação Inferida | Justificativa |
|---|---------------------|---------------|
| I.10 | **Melhoria na Sincronização de Clientes** | Arquivo MELHORIAS_SINCRONIZACAO_CLIENTES.md indica necessidade de melhorias. |
| I.11 | **Auditabilidade da Integração Tiny** | Proposta menciona "integração auditável" - logs específicos para operações do Tiny. |

### Testes e Qualidade

| # | Modificação Inferida | Justificativa |
|---|---------------------|---------------|
| I.12 | **Testes de Integração** | Fase 4 do cronograma menciona explicitamente testes de integração. |
| I.13 | **Testes de Segurança** | Também mencionado na fase 4 - validar vulnerabilidades. |

---

## Resumo por Prioridade

### Alta Prioridade (Crítico)
1. Estruturação do banco de dados
2. Correção do drag-and-drop de cards
3. Correção do fluxo de aprovação de arte
4. Integração financeira com Tiny ERP

### Média Prioridade (Importante)
5. Pipeline de processamento
6. Logs de auditoria
7. Módulo de links públicos seguros
8. Autenticação JWT

### Baixa Prioridade (Melhorias)
9. Monitoramento de dados
10. Testes automatizados
11. Documentação

---

## Solicitações Adicionais do Briefing (Não Contempladas na Proposta)

O briefing original do cliente menciona itens que a proposta não detalhou completamente:

### Documentação Técnica
| # | Solicitação | Justificativa |
|---|-------------|---------------|
| B.1 | **Diagrama ER do banco de dados** | Cliente quer "design de banco de dados" - precisa visualizar a estrutura |
| B.2 | **Documentação da API (Swagger/OpenAPI)** | Boas práticas de backend incluem documentação clara |
| B.3 | **Documentação de integração Tiny** | Para manutenção futura da integração |

### Melhorias na Integração ERP Tiny
| # | Solicitação | Justificativa |
|---|-------------|---------------|
| B.4 | **Análise de gaps na integração atual** | Briefing pede "aprimorar" a integração, não só manter |
| B.5 | **Tratamento de falhas de sincronização** | Garantir integridade mesmo quando API Tiny falha |
| B.6 | **Fila de processamento para operações Tiny** | Escalabilidade mencionada no briefing |

### Segurança e Escalabilidade
| # | Solicitação | Justificativa |
|---|-------------|---------------|
| B.7 | **Backup automatizado** | Segurança e integridade dos dados |
| B.8 | **Índices otimizados no banco** | Otimização mencionada no briefing |
| B.9 | **Cache de consultas frequentes** | Performance e escalabilidade |
| B.10 | **Paginação de resultados** | Escalabilidade para grandes volumes |

---

## Observações Importantes

1. **O projeto atual parece ser apenas frontend** - A proposta menciona backend Node.js, o que sugere que será necessário criar toda a infraestrutura de backend.

2. **Existem muitos arquivos de correção** - O repositório contém diversos arquivos .md documentando correções anteriores, indicando que o sistema passou por várias iterações de bug fixes.

3. **A interface não deve ser alterada** - A proposta menciona explicitamente "correção de pontos críticos do frontend sem alterar a interface já aprovada".

4. **Prazo apertado** - 30 dias para implementar backend, banco de dados, integrações e correções é um prazo desafiador.

5. **Gap entre briefing e proposta** - O briefing foca em "aprimorar" a integração e "propor melhorias", enquanto a proposta foca em "manter" e "corrigir". O cliente pode esperar mais proatividade em sugestões de melhorias.
