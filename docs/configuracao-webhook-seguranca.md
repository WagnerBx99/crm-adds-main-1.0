# Configuração de Webhooks para Notificações Externas de Segurança

## Visão Geral

Este guia prático orienta a configuração de webhooks para enviar notificações de segurança em tempo real para sistemas externos. Webhooks permitem que o Sistema de Notificações de Segurança notifique automaticamente outros sistemas e aplicações quando eventos de segurança relevantes ocorrem.

## Pré-requisitos

Antes de configurar webhooks, verifique se você possui:

1. **Acesso administrativo** ao Sistema de Notificações de Segurança
2. **Endpoint receptor** configurado no sistema externo para receber as requisições
3. **Credenciais** necessárias para autenticação no sistema externo (se aplicável)
4. **Lista de eventos** que precisam ser notificados externamente

## Configuração do Receptor de Webhook

Antes de configurar o envio, é necessário preparar o sistema receptor:

### Exemplo para Microsoft Teams

1. Abra o canal do Teams onde deseja receber as notificações
2. Clique em "..." (mais opções) ao lado do nome do canal
3. Selecione "Conectores"
4. Procure por "Webhook Recebido" e clique em "Configurar"
5. Dê um nome como "Alertas de Segurança CRM"
6. Clique em "Criar" e copie a URL do webhook gerada

### Exemplo para Slack

1. Acesse a página de aplicativos do Slack (api.slack.com/apps)
2. Clique em "Criar Aplicativo" > "Do zero"
3. Dê um nome como "Notificações de Segurança" e selecione seu workspace
4. No menu lateral, acesse "Webhooks Recebidos"
5. Ative os webhooks recebidos
6. Clique em "Adicionar Novo Webhook ao Workspace"
7. Selecione o canal para receber as notificações
8. Copie a URL do webhook gerada

### Exemplo para Sistema de Tickets (Jira)

1. Acesse as configurações do Jira como administrador
2. Vá para "Sistema" > "Webhooks"
3. Clique em "Criar Webhook"
4. Dê um nome como "Alertas de Segurança CRM"
5. Em URL, informe o endpoint para receber webhooks do Sistema de Notificações
6. Selecione os eventos relevantes (ex.: criação de tickets)
7. Salve a configuração

## Configuração do Webhook no Sistema de Notificações

### Configuração via Interface Administrativa

1. Acesse o painel administrativo em `https://sistema-notificacoes.empresa.com.br/admin`
2. Navegue até **Configurações > Segurança > Integrações > Webhooks**
3. Clique em "Adicionar Novo Webhook"
4. Preencha o formulário com as seguintes informações:

   | Campo | Descrição | Exemplo |
   |-------|-----------|---------|
   | Nome | Identificador do webhook | Integração Jira |
   | URL | Endpoint do receptor | https://empresa.atlassian.net/rest/api/2/issue |
   | Eventos | Eventos que acionarão o webhook | incident.created, alert.critical |
   | Método HTTP | Método da requisição | POST |
   | Formato | Formato dos dados | JSON |
   | Headers | Cabeçalhos HTTP adicionais | `{"Authorization": "Bearer xxx", "Content-Type": "application/json"}` |
   | Segredo | Valor para assinatura HMAC | um-segredo-aleatorio-dificil-de-adivinhar |
   | Status | Estado do webhook | Ativo |
   | Filtro Avançado | Condições para envio | `severity >= 'high'` |

5. Clique em "Testar Webhook" para enviar uma requisição de teste
6. Verifique se o sistema externo recebeu a notificação
7. Salve a configuração

### Configuração via API

Você também pode configurar webhooks programaticamente via API:

```bash
curl -X POST \
  https://sistema-notificacoes.empresa.com.br/api/v1/admin/webhooks \
  -H 'Authorization: Bearer seu-token-de-admin' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Integração ServiceNow",
    "url": "https://empresa.service-now.com/api/now/table/incident",
    "events": ["incident.created", "incident.updated", "incident.closed"],
    "method": "POST",
    "format": "JSON",
    "headers": {
      "Authorization": "Basic dXNlcm5hbWU6cGFzc3dvcmQ=",
      "Content-Type": "application/json"
    },
    "secret": "um-segredo-aleatorio-dificil-de-adivinhar",
    "status": "active",
    "advancedFilter": "severity == \"critical\" || severity == \"high\"",
    "retryConfig": {
      "maxRetries": 3,
      "retryInterval": 60
    }
  }'
```

## Personalização do Payload

### Mapeamento de Campos

Para cada destino, você pode personalizar o formato do payload para se adequar ao sistema externo:

1. Na configuração do webhook, expanda a seção "Mapeamento de Campos"
2. Defina a estrutura esperada pelo sistema receptor usando a notação de template

### Exemplo para Jira

```json
{
  "fields": {
    "project": {
      "key": "SEC"
    },
    "summary": "{{event.title}}",
    "description": "{{event.description}}\n\nDetalhes do incidente:\n{{event.details}}",
    "issuetype": {
      "name": "Incidente de Segurança"
    },
    "priority": {
      "name": "{% if event.severity == 'critical' %}Crítico{% elif event.severity == 'high' %}Alta{% elif event.severity == 'medium' %}Média{% else %}Baixa{% endif %}"
    },
    "customfield_10001": "{{event.source_ip}}",
    "customfield_10002": "{{event.timestamp}}",
    "labels": ["seguranca", "automatico", "{{event.event_type}}"]
  }
}
```

### Exemplo para Slack

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 {{event.severity | uppercase}} - {{event.title}}"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "{{event.description}}"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Evento:* {{event.event_type}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Origem:* {{event.source}}"
        },
        {
          "type": "mrkdwn",
          "text": "*IP:* {{event.source_ip}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Data:* {{event.timestamp | date: 'dd/MM/yyyy HH:mm:ss'}}"
        }
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Ver Detalhes"
          },
          "url": "https://sistema-notificacoes.empresa.com.br/incidents/{{event.incident_id}}"
        }
      ]
    }
  ]
}
```

## Validação e Segurança

### Validação da Assinatura

Para verificar a autenticidade das requisições recebidas, implemente a validação da assinatura HMAC no receptor:

#### Exemplo em Node.js (Express)

```javascript
const crypto = require('crypto');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const secret = 'um-segredo-aleatorio-dificil-de-adivinhar';
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  if (!crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  )) {
    return res.status(401).send('Assinatura inválida');
  }
  
  // Processar o webhook...
  console.log('Evento recebido:', req.body.event);
  
  // Gerar resposta
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Servidor webhook rodando na porta 3000');
});
```

#### Exemplo em PHP

```php
<?php
// Receber o payload
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';
$secret = 'um-segredo-aleatorio-dificil-de-adivinhar';

// Calcular assinatura esperada
$expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

// Validar assinatura (usando comparação de tempo constante)
if (!hash_equals($expectedSignature, $signature)) {
  http_response_code(401);
  echo 'Assinatura inválida';
  exit;
}

// Processar o webhook
$data = json_decode($payload, true);
$event = $data['event'] ?? 'desconhecido';

// Gerar log
error_log("Webhook recebido: " . $event);

// Responder
http_response_code(200);
echo 'OK';
?>
```

## Monitoramento e Resolução de Problemas

### Dashboard de Webhooks

Para monitorar o funcionamento dos webhooks:

1. Acesse **Monitoramento > Integrações > Webhooks**
2. Verifique as estatísticas:
   - Taxa de entrega
   - Tempo médio de resposta
   - Erros por tipo
   - Últimas entregas com status

### Logs de Webhooks

Examine os logs detalhados em caso de problemas:

1. Acesse **Configurações > Segurança > Integrações > Webhooks > Logs**
2. Filtre por:
   - Período
   - Webhook específico
   - Status (sucesso/falha)
   - Evento
3. Verifique detalhes de requisições com falha:
   - Código de resposta
   - Mensagem de erro
   - Payload enviado
   - Resposta recebida

### Reenvio de Webhooks

Para reenviar webhooks que falharam:

1. Na tabela de logs, localize o webhook com falha
2. Clique no botão "Reenviar"
3. Observe o status do reenvio em tempo real

## Casos de Uso Comuns

### Integração com SOC (Security Operation Center)

Configure webhooks para notificar o SOC sobre incidentes críticos:

1. Endpoint: API do sistema SOAR (Security Orchestration, Automation and Response)
2. Eventos: incident.created (severidade alta ou crítica)
3. Payload: Detalhes completos do incidente, incluindo evidências e logs

### Notificações para Equipe de Resposta a Incidentes

Configure webhooks para canais de comunicação da equipe:

1. Endpoint: Microsoft Teams ou Slack
2. Eventos: incident.created, incident.escalated
3. Payload: Resumo do incidente, links para detalhes, ações necessárias

### Integração com Status Page

Configure webhooks para atualizar um status page público:

1. Endpoint: API do Statuspage.io ou similar
2. Eventos: system.outage.started, system.outage.resolved
3. Payload: Título do incidente, descrição, componentes afetados

## Melhores Práticas

1. **Segurança**:
   - Rotacione os segredos de webhook periodicamente
   - Utilize HTTPS para todas as comunicações de webhook
   - Implemente validação de assinatura em todos os endpoints

2. **Confiabilidade**:
   - Configure política de retry para lidar com falhas temporárias
   - Implemente mecanismo de fila para garantir entrega de mensagens
   - Monitore a performance de endpoints externos

3. **Manutenção**:
   - Documente todos os webhooks configurados
   - Teste regularmente o funcionamento dos webhooks
   - Atualize endpoints quando sistemas externos mudarem

4. **Performance**:
   - Processe webhooks assincronamente quando possível
   - Implemente rate limiting para evitar sobrecarga
   - Priorize webhooks críticos em caso de alta carga

## Solução de Problemas Comuns

| Problema | Possíveis Causas | Soluções |
|----------|------------------|----------|
| Webhook não é acionado | Filtro excluindo evento, webhook inativo | Verifique filtros e status do webhook |
| Erro 401/403 | Credenciais inválidas ou expiradas | Atualize token/credenciais de autenticação |
| Erro 404 | URL do endpoint incorreta | Verifique e corrija a URL configurada |
| Erro de timeout | Receptor lento ou indisponível | Aumente timeout, verifique disponibilidade |
| Falha na validação de assinatura | Segredo diferente entre sistemas | Sincronize o segredo entre os sistemas |
| Payload rejeitado | Formato de dados incompatível | Ajuste o formato para atender requisitos |

## Apêndice: Exemplos de Payload por Evento

### incident.created

```json
{
  "webhook_id": "wh_123456789",
  "event": "incident.created",
  "timestamp": "2023-06-15T16:45:23.789Z",
  "signature": "sha256=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "data": {
    "incident_id": "INC-20230615-164523-123456",
    "title": "Tentativa de acesso não autorizado detectada",
    "description": "Múltiplas tentativas de login com credenciais inválidas para o usuário admin",
    "severity": "high",
    "status": "new",
    "created_at": "2023-06-15T16:45:23.789Z",
    "created_by": "sistema_ids",
    "affected_systems": ["crm", "auth_service"],
    "source_ip": "203.0.113.42",
    "details": {
      "login_attempts": 15,
      "timeframe": "5 minutes",
      "blocked": true
    }
  }
}
```

### alert.critical

```json
{
  "webhook_id": "wh_123456789",
  "event": "alert.critical",
  "timestamp": "2023-06-15T17:30:15.123Z",
  "signature": "sha256=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "data": {
    "alert_id": "ALT-20230615-173015-789012",
    "title": "Comportamento anômalo de usuário privilegiado",
    "description": "O usuário admin.sistema realizou operações incomuns em horário não comercial",
    "severity": "critical",
    "status": "new",
    "created_at": "2023-06-15T17:30:15.123Z",
    "detected_by": "sistema_anomalia",
    "user": "admin.sistema",
    "activities": [
      {
        "action": "bulk_user_delete",
        "timestamp": "2023-06-15T17:25:12.456Z",
        "target": "usuarios_departamento_financeiro",
        "count": 15
      },
      {
        "action": "config_change",
        "timestamp": "2023-06-15T17:28:45.789Z",
        "target": "seguranca_firewall",
        "details": "Desativação de regras"
      }
    ],
    "risk_score": 95
  }
}
```

## Referências

- [Documentação completa da API de Webhooks](../api/webhooks.md)
- [Guia de Segurança para Webhooks](../seguranca/webhooks-seguranca.md)
- [Especificação OpenAPI para endpoints de Webhook](../api/openapi.yaml) 