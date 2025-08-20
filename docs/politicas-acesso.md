# Políticas de Acesso e Permissões

Este documento descreve as políticas de acesso e o modelo de permissões implementado no CRM Empresarial, fornecendo diretrizes para administradores e usuários sobre a segurança de acesso ao sistema.

## Princípios de Segurança

O modelo de controle de acesso do sistema é baseado nos seguintes princípios:

1. **Princípio do Menor Privilégio**: Usuários recebem apenas os direitos necessários para executar suas funções.
2. **Separação de Responsabilidades**: Tarefas críticas são divididas entre múltiplos usuários para evitar concentração de poder.
3. **Necessidade de Conhecimento**: Acesso a informações sensíveis é concedido apenas a quem precisa delas para desempenhar suas funções.
4. **Defesa em Profundidade**: Múltiplas camadas de controle são aplicadas para proteger recursos críticos.
5. **Auditabilidade**: Todas as ações são registradas para permitir rastreamento e verificação.

## Modelo de Controle de Acesso

O CRM Empresarial implementa um modelo de controle de acesso baseado em papéis (RBAC - Role-Based Access Control) com componentes adicionais de controle baseado em atributos (ABAC - Attribute-Based Access Control) para casos específicos.

### Modelo RBAC

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│    Usuário    │────►│    Papel      │────►│  Permissões   │
│               │     │  (Função)     │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
                              │
                              │
                              ▼
                      ┌───────────────┐
                      │               │
                      │    Grupo      │
                      │               │
                      └───────────────┘
```

- **Usuário**: Identidade individual com credenciais de acesso
- **Papel (Role)**: Função que define um conjunto de permissões
- **Grupo**: Coleção de usuários com papéis similares
- **Permissão**: Autorização para executar uma ação específica

### Elementos de ABAC

Em algumas situações, o acesso também é determinado por:

- **Atributos do Usuário**: Departamento, localização, nível hierárquico
- **Atributos do Recurso**: Classificação de sensibilidade, proprietário
- **Contexto**: Horário de acesso, localização de rede, dispositivo

## Papéis Padrão do Sistema

O sistema inclui os seguintes papéis predefinidos:

| Papel | Descrição | Nível de Acesso |
|-------|-----------|-----------------|
| **Administrador do Sistema** | Gerencia configurações técnicas e de segurança | Acesso total |
| **Administrador de Negócios** | Gerencia configurações funcionais e usuários | Acesso apenas às funções de negócio |
| **Gerente** | Supervisiona equipes e acessa relatórios consolidados | Acesso a dados próprios e de subordinados |
| **Usuário Avançado** | Utiliza funções avançadas e pode configurar visões | Acesso a dados conforme escopo de responsabilidade |
| **Usuário Padrão** | Utiliza funções básicas de operação | Acesso limitado a dados próprios e compartilhados |
| **Usuário Somente Leitura** | Visualiza dados sem poder modificá-los | Acesso de leitura conforme escopo |
| **Auditor** | Visualiza registros e relatórios de auditoria | Acesso somente leitura a logs e relatórios de segurança |

## Modelo de Permissões

As permissões são organizadas em categorias e podem ser atribuídas individualmente ou em conjuntos através de papéis:

### Permissões de Dados

| Permissão | Descrição | Código Interno |
|-----------|-----------|----------------|
| Visualizar | Visualizar registros | DATA_VIEW |
| Criar | Criar novos registros | DATA_CREATE |
| Editar | Modificar registros existentes | DATA_EDIT |
| Excluir | Remover registros | DATA_DELETE |
| Exportar | Exportar dados para formatos externos | DATA_EXPORT |
| Importar | Importar dados de fontes externas | DATA_IMPORT |

### Permissões de Sistema

| Permissão | Descrição | Código Interno |
|-----------|-----------|----------------|
| Configurar Sistema | Alterar configurações gerais | SYS_CONFIG |
| Gerenciar Usuários | Criar/modificar contas de usuário | USER_MANAGE |
| Gerenciar Papéis | Criar/modificar papéis e permissões | ROLE_MANAGE |
| Visualizar Logs | Acessar registros de auditoria | LOG_VIEW |
| Configurar Segurança | Modificar parâmetros de segurança | SEC_CONFIG |
| Executar Relatórios | Gerar e visualizar relatórios administrativos | REPORT_RUN |

### Permissões de Módulos Específicos

Cada módulo funcional possui seu próprio conjunto de permissões, como:

```
[MÓDULO]_VIEW - Visualizar dados do módulo
[MÓDULO]_CREATE - Criar dados no módulo
[MÓDULO]_EDIT - Editar dados no módulo
[MÓDULO]_DELETE - Excluir dados no módulo
[MÓDULO]_ADMIN - Administrar configurações do módulo
```

Por exemplo, para o módulo de Clientes:
- CUSTOMER_VIEW
- CUSTOMER_CREATE
- CUSTOMER_EDIT
- CUSTOMER_DELETE
- CUSTOMER_ADMIN

## Escopos de Acesso a Dados

Além das permissões, o acesso a dados é controlado por escopos:

| Escopo | Descrição |
|--------|-----------|
| **Próprio** | Apenas registros criados ou atribuídos ao próprio usuário |
| **Equipe** | Registros próprios e da equipe do usuário |
| **Departamento** | Registros próprios e do departamento do usuário |
| **Unidade** | Registros próprios e da unidade de negócios |
| **Global** | Todos os registros do sistema (restrito) |

## Configuração de Papéis Personalizados

### Criando um Novo Papel

1. Acesse **Configurações > Segurança > Papéis**
2. Clique em **Novo Papel**
3. Preencha as informações básicas:
   - Nome do papel
   - Descrição
   - Nível de escopo padrão
4. Selecione as permissões desejadas por categorias
5. Defina exceções e restrições específicas se necessário
6. Clique em **Salvar**

### Clonando um Papel Existente

Para criar variações de papéis existentes:

1. Acesse **Configurações > Segurança > Papéis**
2. Localize o papel base
3. Clique em **Ações > Clonar**
4. Modifique as permissões conforme necessário
5. Salve o novo papel com um nome diferente

## Hierarquia de Permissões

O sistema implementa uma hierarquia de permissões onde:

- Permissões de nível superior incluem automaticamente as de nível inferior
- Por exemplo, permissão de edição (EDIT) inclui automaticamente visualização (VIEW)
- Permissões de administração de módulo incluem todas as permissões do módulo

Hierarquia padrão: ADMIN > DELETE > EDIT > CREATE > VIEW

## Melhores Práticas

### Para Administradores

1. **Revisão Periódica**: Audite as permissões trimestralmente
   - Verifique usuários inativos
   - Revise acúmulo de permissões
   - Confirme que papéis temporários foram revogados

2. **Privilégios Mínimos**: Conceda apenas as permissões essenciais
   - Utilize papéis específicos em vez de genéricos
   - Prefira múltiplos papéis específicos a um único papel com muitas permissões

3. **Segregação de Funções**: Distribua responsabilidades críticas
   - Separe funções de aprovação e execução
   - Divide tarefas sensíveis entre diferentes papéis

4. **Documentação**: Mantenha o registro de papéis atualizado
   - Documente o propósito de cada papel
   - Registre as justificativas para permissões especiais

### Para Supervisores

1. **Delegação Apropriada**: Ao delegar acesso temporário
   - Especifique data de expiração
   - Limite ao escopo e tempo necessários
   - Documente a justificativa

2. **Monitoramento**: Mantenha supervisão das atividades
   - Revise relatórios de acesso periódicamente
   - Atenção às tentativas de acesso indevido

3. **Educação**: Oriente sua equipe sobre segurança
   - Explique o princípio do menor privilégio
   - Ensine a identificar e reportar comportamentos suspeitos

## Processo de Solicitação de Acesso

### Fluxo Normal

1. Usuário solicita acesso via sistema ou formulário
2. Supervisor imediato aprova (primeira aprovação)
3. Administrador do sistema ou proprietário do recurso revisa (segunda aprovação)
4. Acesso é provisionado e notificações são enviadas
5. O acesso é registrado nos logs de auditoria

### Acesso de Emergência

Para situações urgentes que requerem acesso imediato:

1. Solicitação marcada como "Emergência" com justificativa
2. Administrador de plantão pode conceder acesso temporário
3. Notificação é enviada para segurança e supervisores
4. Revisão pós-facto é agendada para o próximo dia útil
5. O acesso é automaticamente revogado após período pré-definido (max. 24h)

## Gerenciamento de Contas Privilegiadas

Contas com alto nível de acesso (administradores) recebem tratamento especial:

1. **Autenticação Reforçada**:
   - Autenticação de dois fatores obrigatória
   - Tempo de sessão reduzido
   - Sem acesso remoto sem VPN

2. **Monitoramento Intensificado**:
   - Alertas em tempo real para ações sensíveis
   - Gravação de sessão para atividades críticas
   - Revisão semanal de atividades

3. **Segregação de Contas**:
   - Conta administrativa separada da conta regular
   - Uso da conta privilegiada apenas quando necessário

## Conformidade e Auditoria

### Relatórios de Conformidade

Os seguintes relatórios estão disponíveis para verificação de conformidade:

1. **Matriz de Acesso** - Visão completa de quem tem acesso a quê
2. **Histórico de Alterações de Permissões** - Mudanças feitas nos direitos de acesso
3. **Tentativas de Acesso Não Autorizado** - Registros de tentativas de violação
4. **Revisão de Privilégios** - Análise de acumulação de permissões
5. **Concessão de Acessos Especiais** - Resumo de exceções de acesso concedidas

### Procedimentos de Auditoria

1. **Auditoria Interna**:
   - Verificação trimestral dos direitos de acesso
   - Conformidade com política de segregação de funções
   - Revisão de contas inativas ou com privilégios excessivos

2. **Auditoria Externa**:
   - Auditoria anual por empresa especializada
   - Testes de penetração para verificar efetividade dos controles
   - Verificação de conformidade com regulamentações

## Glossário de Termos

| Termo | Definição |
|-------|-----------|
| **RBAC** | Role-Based Access Control - Controle de acesso baseado em papéis |
| **ABAC** | Attribute-Based Access Control - Controle de acesso baseado em atributos |
| **Papel (Role)** | Conjunto de permissões agrupadas por função |
| **Permissão** | Autorização específica para executar uma ação |
| **Escopo** | Limite de abrangência do acesso a dados |
| **Segregação de funções** | Divisão de responsabilidades críticas entre pessoas |
| **Elevação de privilégio** | Aumento temporário no nível de acesso |
| **Conta privilegiada** | Conta com permissões administrativas ou de alto nível |

---

## Apêndice: Matriz de Papéis e Permissões

A tabela abaixo resume os papéis padrão e suas permissões. Para uma matriz completa e atualizada, consulte o relatório "Matriz de Acesso" disponível no sistema.

| Permissão | Admin. Sistema | Admin. Negócios | Gerente | Usuário Avançado | Usuário Padrão | Somente Leitura | Auditor |
|-----------|----------------|-----------------|---------|------------------|---------------|-----------------|---------|
| SYS_CONFIG | ✓ | ✓ | - | - | - | - | - |
| USER_MANAGE | ✓ | ✓ | - | - | - | - | - |
| ROLE_MANAGE | ✓ | - | - | - | - | - | - |
| LOG_VIEW | ✓ | ✓ | - | - | - | - | ✓ |
| SEC_CONFIG | ✓ | - | - | - | - | - | - |
| REPORT_RUN | ✓ | ✓ | ✓ | ✓ | - | - | ✓ |
| DATA_VIEW | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| DATA_CREATE | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| DATA_EDIT | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| DATA_DELETE | ✓ | ✓ | ✓ | - | - | - | - |
| DATA_EXPORT | ✓ | ✓ | ✓ | ✓ | - | - | ✓ |
| DATA_IMPORT | ✓ | ✓ | ✓ | - | - | - | - |

**Legenda**: ✓ - Possui permissão, - - Não possui permissão 