# Escopo Consolidado Final - CRM ADDS

> **Hierarquia de Prioridade:** Reunião (imperativo) > Briefing > Proposta Técnica

---

## Informações da Reunião com o Cliente (IMPERATIVO)

O cliente ressaltou os seguintes pontos críticos:

| # | Ponto da Reunião | Status Atual | Ação Necessária |
|---|------------------|--------------|-----------------|
| 1 | **Pipeline** | A implementar | Criar pipeline de processamento de dados |
| 2 | **API com Tiny já está pronta** | ✅ Funcional | Manter funcionando |
| 3 | **Exceto dados financeiros** | ❌ Faltando | Implementar integração financeira |
| 4 | **Sistema de encomendas de arte** | Parcial | Fluxo de aprovação/revisão de artes |
| 5 | **Frontend 95% ajustado** | ✅ Quase pronto | Apenas correções pontuais |
| 6 | **Card não movimenta corretamente (drag)** | ❌ Bug crítico | Corrigir drag-and-drop |
| 7 | **Sistema gera link público** | ✅ Existe | Manter/melhorar segurança |

---

## O que o Cliente Valoriza (Análise do Briefing)

Baseado no briefing, o cliente valoriza:

1. **Arquitetura sólida de banco de dados** - Quer estrutura bem definida e documentada
2. **Segurança e integridade dos dados** - Preocupação com proteção das informações
3. **Escalabilidade** - Sistema preparado para crescer
4. **Integração confiável com ERP Tiny** - Dependência crítica do negócio

### Preocupações Implícitas do Cliente:

- **Manutenibilidade** - Quer poder dar continuidade ao sistema no futuro
- **Confiabilidade** - Sistema não pode perder dados ou falhar em operações críticas
- **Performance** - Sistema deve ser rápido e responsivo

---

## Escopo Consolidado: O que Fazer na Aplicação

### 🔴 PRIORIDADE CRÍTICA (Da Reunião)

| # | Tarefa | Descrição | Complexidade |
|---|--------|-----------|--------------|
| **1** | **Corrigir Drag-and-Drop dos Cards** | Bug crítico - cards não movimentam corretamente quando arrastados com o mouse | Média |
| **2** | **Implementar Integração Financeira com Tiny** | API Tiny funciona, mas falta integração de dados financeiros | Alta |
| **3** | **Implementar Pipeline de Processamento** | Sistema de processamento de dados com consistência e logs | Alta |
| **4** | **Sistema de Aprovação de Arte** | Fluxo onde usuário recebe arte finalizada e aprova ou pede revisões | Média |

### 🟡 PRIORIDADE ALTA (Do Briefing + Proposta)

| # | Tarefa | Descrição | Complexidade |
|---|--------|-----------|--------------|
| **5** | **Estruturação do Banco de Dados** | Definir e implementar arquitetura de BD relacional | Alta |
| **6** | **Logs de Auditoria** | Registrar todas as alterações para rastreabilidade | Média |
| **7** | **Segurança dos Links Públicos** | Garantir que links públicos sejam seguros e com validade | Média |

### 🟢 PRIORIDADE MÉDIA (Melhorias Inferidas)

| # | Tarefa | Descrição | Complexidade |
|---|--------|-----------|--------------|
| **8** | **Documentação do Banco de Dados** | Diagrama ER e documentação da estrutura | Baixa |
| **9** | **Documentação da API** | Swagger/OpenAPI para endpoints | Baixa |
| **10** | **Tratamento de Falhas de Sincronização** | Resiliência quando API Tiny falha | Média |

---

## O que NÃO Fazer (Escopo Negativo)

Baseado na reunião ("frontend 95% ajustado"):

- ❌ **NÃO alterar a interface visual** - Já está aprovada
- ❌ **NÃO refatorar componentes funcionais** - Se funciona, não mexer
- ❌ **NÃO adicionar novas features de frontend** - Foco é backend e correções

---

## Análise Técnica: Estado Atual vs Necessário

| Componente | Estado Atual | Estado Necessário |
|------------|--------------|-------------------|
| **Frontend React** | 95% pronto | Corrigir drag-and-drop |
| **API Tiny (geral)** | ✅ Funcionando | Manter |
| **API Tiny (financeiro)** | ❌ Não implementado | Implementar |
| **Banco de Dados** | localStorage/estado local | PostgreSQL/MySQL estruturado |
| **Backend Node.js** | ❌ Não existe | Criar do zero |
| **Pipeline** | ❌ Não existe | Implementar |
| **Logs de Auditoria** | ❌ Não existe | Implementar |
| **Links Públicos** | ✅ Existe | Melhorar segurança |
| **Aprovação de Arte** | Parcial | Completar fluxo |

---

## Plano de Execução Sugerido

### Fase 1: Fundação (10 dias)
1. Estruturar banco de dados (PostgreSQL/MySQL)
2. Criar backend Node.js básico
3. Implementar integração financeira com Tiny

### Fase 2: Correções Críticas (7 dias)
4. **Corrigir drag-and-drop dos cards** (BUG CRÍTICO)
5. Completar fluxo de aprovação de arte
6. Ajustar links públicos (segurança)

### Fase 3: Pipeline e Auditoria (5 dias)
7. Implementar pipeline de processamento
8. Implementar logs de auditoria
9. Tratamento de falhas de sincronização

### Fase 4: Testes e Entrega (8 dias)
10. Testes de integração
11. Testes de segurança
12. Documentação
13. Ajustes finais

---

## Resumo Executivo

### O que o cliente QUER (em ordem de importância):

1. **Cards funcionando** - Drag-and-drop é crítico para o workflow
2. **Dados financeiros do Tiny** - Integração incompleta
3. **Pipeline confiável** - Consistência dos dados
4. **Aprovação de arte funcionando** - Core do negócio
5. **Banco de dados estruturado** - Base sólida para o futuro

### O que o cliente NÃO quer:

- Mudanças na interface
- Novas funcionalidades de frontend
- Complexidade desnecessária

### Riscos Identificados:

1. **Prazo apertado** - 30 dias para criar backend + BD + integrações
2. **Dependência do Tiny** - API externa pode ter limitações
3. **Migração de dados** - Se houver dados em localStorage, precisam ser migrados

---

## Próximos Passos

1. ✅ Escopo consolidado
2. ⏳ Analisar código existente do drag-and-drop
3. ⏳ Analisar integração atual com Tiny
4. ⏳ Definir estrutura do banco de dados
5. ⏳ Iniciar implementação
