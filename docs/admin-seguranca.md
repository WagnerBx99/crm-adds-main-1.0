# Guia de Administração de Segurança

Este guia fornece orientações detalhadas para administradores do CRM Empresarial sobre como gerenciar os aspectos de segurança do sistema, incluindo o novo módulo de notificações de segurança.

## Índice

1. [Visão Geral do Painel de Segurança](#visão-geral-do-painel-de-segurança)
2. [Configuração de Notificações de Segurança](#configuração-de-notificações-de-segurança)
3. [Monitoramento de Logs de Segurança](#monitoramento-de-logs-de-segurança)
4. [Gerenciamento de Usuários e Permissões](#gerenciamento-de-usuários-e-permissões)
5. [Configurações de Autenticação](#configurações-de-autenticação)
6. [Resposta a Incidentes](#resposta-a-incidentes)
7. [Manutenção e Atualizações](#manutenção-e-atualizações)
8. [Perguntas Frequentes](#perguntas-frequentes)

## Visão Geral do Painel de Segurança

O painel de segurança é o centro de controle para todas as funções de segurança do CRM. Para acessá-lo:

1. Faça login com uma conta de administrador
2. Navegue até **Configurações > Segurança > Painel**

O painel está organizado em várias seções:

![Painel de Segurança](./imagens/painel-seguranca.png)

| Seção | Descrição |
|-------|-----------|
| Visão Geral | Resumo de status de segurança e alertas ativos |
| Logs de Atividade | Histórico de eventos de segurança e ações de usuários |
| Notificações | Configurações do sistema de notificações de segurança |
| Usuários | Gerenciamento de contas e permissões |
| Configurações | Parâmetros de segurança do sistema |
| Relatórios | Geração de relatórios de segurança e conformidade |

## Configuração de Notificações de Segurança

### Acessando as Configurações

1. No painel de segurança, clique em **Notificações**
2. Selecione **Configurações de Notificação**

### Configurando Canais de Notificação

O sistema suporta múltiplos canais para envio de notificações:

#### Email

1. Ative ou desative notificações por email marcando a caixa **Ativar notificações por email**
2. Configure os emails de destino:
   - Clique em **Adicionar Email**
   - Digite o endereço de email do destinatário
   - Clique em **Salvar**
3. Configure os parâmetros do servidor de email:
   - Email de origem
   - Nome de exibição
   - Email de resposta (opcional)

#### Notificações In-App

1. Ative ou desative notificações no aplicativo marcando a caixa **Ativar notificações no aplicativo**
2. Configure quais usuários receberão notificações:
   - Todos os usuários
   - Apenas administradores
   - Usuários específicos ou grupos

#### SMS (Mensagens de Texto)

1. Ative ou desative notificações por SMS marcando a caixa **Ativar notificações por SMS**
2. Configure os números de telefone de destino:
   - Clique em **Adicionar Número**
   - Digite o número de telefone no formato internacional
   - Clique em **Salvar**
   
#### Webhooks (Para Integração com Outros Sistemas)

1. Ative ou desative notificações via webhook marcando a caixa **Ativar webhooks**
2. Configure os endpoints:
   - Clique em **Adicionar Webhook**
   - Informe a URL do endpoint
   - Selecione o método HTTP (GET/POST)
   - Configure cabeçalhos e autenticação
   - Clique em **Salvar**

### Configurando Eventos para Notificação

Selecione quais eventos de segurança devem gerar notificações:

1. Na seção **Eventos para Notificação**, marque os tipos de eventos desejados:
   - Tentativas de login falhas
   - Alterações de senha
   - Acesso a dados sensíveis
   - Alterações em permissões
   - Erros críticos de sistema
   - Atividades suspeitas
   - Outros eventos disponíveis

2. Para cada tipo de evento, você pode configurar:
   - Canais de notificação a serem utilizados
   - Níveis de prioridade
   - Destinatários específicos

### Configurando Níveis de Severidade

Na seção **Severidade para Notificação**, selecione quais níveis de severidade devem gerar notificações:

- **Informação**: Eventos informativos sem impacto na segurança
- **Aviso**: Eventos que merecem atenção, mas não são críticos
- **Erro**: Problemas que afetam a funcionalidade ou segurança
- **Crítico**: Eventos graves que requerem ação imediata

### Testando as Configurações

Após configurar as notificações:

1. Clique no botão **Testar Configurações**
2. Selecione o tipo de notificação a ser testada
3. Clique em **Enviar Notificação de Teste**
4. Verifique se a notificação foi recebida corretamente

### Salvando as Configurações

Após realizar todas as configurações:

1. Clique no botão **Salvar Configurações**
2. As novas configurações serão aplicadas imediatamente

## Monitoramento de Logs de Segurança

### Acessando os Logs

1. No painel de segurança, clique em **Logs de Atividade**
2. Utilize os filtros disponíveis para refinar a visualização:
   - Intervalo de datas
   - Tipo de evento
   - Severidade
   - Usuário
   - Endereço IP

![Visualizador de Logs](./imagens/logs-seguranca.png)

### Interpretando os Logs

Cada entrada de log contém as seguintes informações:

- **ID**: Identificador único do evento
- **Timestamp**: Data e hora em que o evento ocorreu
- **Tipo de Evento**: Categoria do evento (login, acesso a dados, etc.)
- **Severidade**: Nível de importância do evento
- **Usuário**: Usuário que realizou a ação (quando aplicável)
- **Detalhes**: Informações específicas sobre o evento
- **IP de Origem**: Endereço IP da solicitação
- **Contexto**: Informações adicionais sobre o ambiente

### Exportando Logs

Para exportar logs para análise externa ou retenção:

1. Aplique os filtros desejados para selecionar os logs relevantes
2. Clique no botão **Exportar**
3. Selecione o formato desejado:
   - CSV (para análise em planilhas)
   - JSON (para processamento automatizado)
   - PDF (para relatórios formais)
4. Clique em **Confirmar Exportação**
5. Salve o arquivo gerado

### Alertas Baseados em Logs

Configure alertas automáticos com base em padrões nos logs:

1. Clique em **Configurar Alertas**
2. Clique em **Adicionar Novo Alerta**
3. Configure os critérios do alerta:
   - Tipo de evento
   - Severidade mínima
   - Quantidade de ocorrências
   - Período de tempo
4. Configure a ação a ser tomada:
   - Enviar notificação
   - Bloquear usuário automaticamente
   - Executar script personalizado
5. Clique em **Salvar Alerta**

## Gerenciamento de Usuários e Permissões

### Configurações de Segurança de Usuários

1. No painel de segurança, clique em **Usuários**
2. Selecione **Políticas de Segurança**

Configure as seguintes políticas:

- **Senha:**
  - Comprimento mínimo (recomendado: 12 caracteres)
  - Complexidade (maiúsculas, minúsculas, números, símbolos)
  - Período de expiração (recomendado: 90 dias)
  - Histórico de senhas (recomendado: 10 últimas senhas)

- **Bloqueio de Conta:**
  - Número de tentativas antes do bloqueio (recomendado: 5)
  - Duração do bloqueio (recomendado: 30 minutos)
  - Política de desbloqueio (automático/manual)

- **Sessão:**
  - Tempo máximo de inatividade (recomendado: 30 minutos)
  - Máximo de sessões simultâneas (recomendado: 1-3)
  - Validação de alteração de IP durante a sessão

### Gerenciamento de Permissões

1. No painel de segurança, clique em **Usuários**
2. Selecione **Grupos e Permissões**

Aqui você pode:

- Criar e gerenciar grupos de usuários
- Definir permissões para cada grupo
- Atribuir usuários a grupos
- Configurar permissões especiais para usuários específicos

Para as funcionalidades de segurança, recomendamos os seguintes grupos:

| Grupo | Descrição | Permissões Recomendadas |
|-------|-----------|-------------------------|
| Administradores de Segurança | Gerenciam todas as configurações de segurança | Acesso total ao módulo de segurança |
| Auditores | Visualizam logs e geram relatórios | Acesso de leitura aos logs e relatórios |
| Administradores de Usuários | Gerenciam contas de usuário | Gerenciamento de usuários, sem acesso a configurações avançadas |
| Usuários Padrão | Funcionalidades básicas do CRM | Sem acesso ao módulo de segurança |

## Configurações de Autenticação

### Configurando Métodos de Autenticação

1. No painel de segurança, clique em **Configurações**
2. Selecione **Autenticação**

Aqui você pode configurar:

#### Autenticação de Dois Fatores (2FA)

1. Ative ou desative o 2FA selecionando uma das opções:
   - Desativado
   - Opcional (usuários podem ativar)
   - Obrigatório para administradores
   - Obrigatório para todos os usuários

2. Configure os métodos de 2FA disponíveis:
   - Aplicativo autenticador (Google Authenticator, Microsoft Authenticator)
   - SMS
   - Email
   - Chaves de segurança física (YubiKey, etc.)

#### Single Sign-On (SSO)

Se sua organização utiliza um provedor de identidade externo:

1. Ative o SSO selecionando **Ativar Single Sign-On**
2. Selecione o tipo de integração:
   - SAML 2.0
   - OAuth 2.0
   - OpenID Connect
3. Configure os parâmetros de acordo com seu provedor de identidade:
   - URLs de endpoints
   - Certificados
   - Client ID e Client Secret (para OAuth)
   - Mapeamento de atributos

#### IP Allowlisting

Restrinja o acesso por endereço IP:

1. Ative o recurso marcando **Ativar restrição por IP**
2. Selecione o modo:
   - Whitelist (apenas IPs permitidos podem acessar)
   - Blacklist (IPs bloqueados não podem acessar)
3. Adicione os endereços IP ou faixas:
   - Clique em **Adicionar IP**
   - Insira o endereço IP ou faixa CIDR
   - Adicione uma descrição (opcional)
   - Clique em **Salvar**

## Resposta a Incidentes

### Recebendo Notificações de Segurança

Quando um incidente de segurança é detectado:

1. **Notificações In-App**:
   - Aparecerão no canto superior direito da tela
   - Incidentes críticos exibirão um pop-up de alerta
   - Clique na notificação para ver detalhes

2. **Notificações por Email**:
   - Verifique o assunto para a severidade do incidente
   - O corpo do email conterá detalhes sobre o evento
   - Siga as instruções ou links no email para ação imediata

### Analisando Incidentes

Para analisar um incidente de segurança:

1. Acesse o painel de segurança
2. Clique em **Logs de Atividade**
3. Localize o evento relacionado ao incidente
4. Clique em **Detalhes** para informações completas
5. Utilize a função **Eventos Relacionados** para ver o contexto completo

### Ações de Resposta

Dependendo do tipo de incidente, tome as ações apropriadas:

#### Tentativas de Login Suspeitas

1. Verifique o endereço IP e localização
2. Se for um ataque, clique em **Bloquear IP**
3. Considere notificar o usuário por um canal alternativo

#### Acesso Não Autorizado a Dados

1. Identifique os dados acessados
2. Clique em **Revogar Sessões** para encerrar todas as sessões do usuário
3. Revise e ajuste as permissões do usuário ou grupo

#### Alterações Não Autorizadas

1. Utilize a função **Visualizar Alterações** para ver o que foi modificado
2. Se necessário, use **Restaurar Versão Anterior** para reverter as alterações
3. Considere bloquear temporariamente a conta envolvida

### Documentando Incidentes

Para cada incidente significativo:

1. Clique em **Criar Relatório de Incidente**
2. Preencha os detalhes:
   - Descrição do incidente
   - Impacto
   - Ações tomadas
   - Lições aprendidas
3. Anexe evidências relevantes
4. Envie o relatório para as partes interessadas

## Manutenção e Atualizações

### Verificando por Atualizações de Segurança

1. No painel de segurança, clique em **Configurações**
2. Selecione **Atualizações**
3. Clique em **Verificar Atualizações**
4. Revise as atualizações disponíveis, especialmente aquelas marcadas como "Segurança"

### Aplicando Atualizações

Para atualizar o sistema:

1. Faça backup de dados e configurações
2. Clique em **Aplicar Atualizações Selecionadas**
3. Monitore o progresso da atualização
4. Verifique o sistema após a atualização para garantir funcionamento correto

### Manutenção Preventiva

Tarefas recomendadas de manutenção periódica:

| Frequência | Tarefa |
|------------|--------|
| Semanal | Revisar logs por atividades suspeitas |
| Mensal | Verificar e revogar acessos desnecessários |
| Trimestral | Revisar configurações de segurança |
| Semestral | Conduzir testes de penetração |
| Anual | Realizar auditoria completa de segurança |

## Perguntas Frequentes

### Configuração de Notificações

**P: As notificações por email são seguras?**

R: Sim, as notificações são enviadas por canais criptografados e não contêm dados sensíveis completos. Informações críticas são sempre parcialmente mascaradas.

**P: Há limite para o número de destinatários de notificações?**

R: Cada canal tem limites diferentes:
- Email: até 50 destinatários
- SMS: até 10 números
- Webhooks: até 5 endpoints

**P: Como evitar excesso de notificações?**

R: Configure cuidadosamente os níveis de severidade e tipos de eventos. Utilize a função "Agrupar Notificações Similares" para consolidar múltiplos eventos do mesmo tipo.

### Logs e Auditoria

**P: Por quanto tempo os logs são mantidos?**

R: Por padrão, os logs são mantidos por 90 dias no sistema. Após esse período, são arquivados por 12 meses e depois removidos. Esses períodos podem ser configurados de acordo com sua política de retenção de dados.

**P: É possível ocultar informações sensíveis nos logs?**

R: Sim, configure a máscara de dados na seção **Configurações > Logs > Mascaramento de Dados** para definir quais campos devem ser parcial ou totalmente mascarados.

### Gerenciamento de Usuários

**P: O que fazer se um usuário esquecer sua senha com 2FA ativado?**

R: Administradores podem gerar um código de recuperação temporário na página de detalhes do usuário. Este código permite acesso único para redefinir o 2FA.

**P: Como transferir permissões de um usuário para outro?**

R: Na página de usuários, selecione o usuário de origem, clique em **Ações > Transferir Permissões**, e selecione o usuário de destino.

---

**Suporte Técnico**

Para assistência adicional com o módulo de segurança, entre em contato com:

- Email: suporte@empresa.com.br
- Telefone: (11) 5555-1234
- Portal de Suporte: https://suporte.empresa.com.br 