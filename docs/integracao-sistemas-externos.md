# Integração com Sistemas Externos de Segurança

## Visão Geral

Este documento descreve as integrações do Sistema de Notificações de Segurança com sistemas externos, permitindo monitoramento avançado, correlação de eventos e resposta coordenada a incidentes de segurança. As integrações seguem princípios de segurança por design, com autenticação robusta, comunicação criptografada e monitoramento constante.

## Envio de Logs para SIEM

### Arquitetura de Integração com SIEM

O Sistema de Notificações de Segurança envia logs estruturados para a plataforma SIEM (Security Information and Event Management) corporativa, permitindo correlação com eventos de outros sistemas e detecção avançada de ameaças.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│ Geração de Logs │────►│  Normalização   │────►│  Buffer de      │
│ de Segurança    │     │  e Enriquecimento│     │  Eventos       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Plataforma     │◄────┤  Transporte     │◄────┤  Criptografia   │
│  SIEM           │     │  Seguro (TLS)   │     │  e Assinatura   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Tipos de Eventos Enviados

| Categoria de Evento | Exemplos | Nível de Criticidade | Frequência de Envio |
|---------------------|----------|----------------------|---------------------|
| Autenticação | Login, logout, alterações de senha, falhas de login | Alto | Tempo real |
| Acesso a Dados | Visualização de dados sensíveis, exportações, alterações em massa | Alto | Tempo real |
| Ações Administrativas | Modificações de configuração, criação de usuários, alterações de perfil | Médio | Tempo real |
| Operações do Sistema | Inicialização, desligamento, backups, restauração | Médio | Lote (5 minutos) |
| Atividades de Usuário | Navegação, consultas padrão, ações rotineiras | Baixo | Lote (15 minutos) |

### Formato dos Logs

Os logs são enviados em formato JSON estruturado compatível com o padrão Common Event Format (CEF) e incluem:

```json
{
  "timestamp": "2023-06-15T14:22:36.123Z",
  "event_id": "AUTH-20230615-142236-123456",
  "source": "sistema_notificacoes_seguranca",
  "source_ip": "10.0.2.15",
  "event_type": "authentication",
  "event_action": "login_success",
  "severity": "informational",
  "actor": {
    "user_id": "joao.silva",
    "user_type": "internal",
    "department": "TI"
  },
  "target": {
    "resource_type": "application",
    "resource_id": "sistema_crm"
  },
  "context": {
    "session_id": "SES-20230615-142236-789012",
    "browser": "Chrome 114.0.5735.134",
    "os": "Windows 10",
    "location": "Escritório São Paulo"
  },
  "tags": ["login", "autenticacao", "acesso"]
}
```

### Configuração de Conexão com SIEM

#### Compatibilidade com Plataformas SIEM

O sistema suporta integração com as seguintes plataformas SIEM:

- Splunk Enterprise Security
- IBM QRadar
- Microsoft Sentinel
- Elastic Security
- ArcSight ESM
- LogRhythm NextGen SIEM

#### Parâmetros de Configuração

| Parâmetro | Descrição | Valor Padrão | Obrigatório |
|-----------|-----------|--------------|-------------|
| `siem.endpoint.url` | URL do endpoint receptor no SIEM | - | Sim |
| `siem.auth.type` | Tipo de autenticação (token, certificado, básica) | token | Sim |
| `siem.auth.token` | Token de autenticação quando usando tipo token | - | Condicional |
| `siem.auth.cert.path` | Caminho para o certificado cliente | /certs/siem-client.pem | Condicional |
| `siem.auth.key.path` | Caminho para a chave privada do certificado | /certs/siem-client.key | Condicional |
| `siem.connection.timeout` | Timeout de conexão em segundos | 30 | Não |
| `siem.retry.max` | Número máximo de tentativas de reenvio | 5 | Não |
| `siem.retry.interval` | Intervalo entre tentativas em segundos | 60 | Não |
| `siem.buffer.size` | Tamanho do buffer de eventos | 1000 | Não |
| `siem.format` | Formato de envio (CEF, LEEF, JSON) | JSON | Não |

#### Exemplo de Configuração (no arquivo .env.production)

```
# Configuração SIEM
SIEM_ENDPOINT_URL=https://siem.empresa.com.br:8088/services/collector/event
SIEM_AUTH_TYPE=token
SIEM_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SIEM_CONNECTION_TIMEOUT=30
SIEM_RETRY_MAX=5
SIEM_RETRY_INTERVAL=60
SIEM_BUFFER_SIZE=1000
SIEM_FORMAT=JSON
```

### Monitoramento da Integração

Para garantir que a integração com o SIEM esteja funcionando corretamente:

1. **Dashboard de Saúde da Integração**
   - Taxa de sucesso de envio de eventos
   - Latência média de entrega
   - Eventos pendentes no buffer
   - Últimos erros de conexão

2. **Alertas de Falha**
   - Notificação automática em caso de falha persistente (mais de 3 tentativas)
   - Alertas para buffer atingindo capacidade máxima (80%+)
   - Monitoramento de certificados próximos do vencimento (30 dias)

3. **Procedimento de Fallback**
   - Armazenamento local temporário de logs em caso de falha na conexão
   - Sincronização automática quando a conexão for restaurada
   - Rotação de logs locais para evitar esgotamento de espaço

## Integração com Sistemas de Detecção de Intrusão (IDS/IPS)

### Arquitetura de Integração com IDS/IPS

O Sistema de Notificações de Segurança integra-se com sistemas de detecção e prevenção de intrusão para receber alertas em tempo real e iniciar ações de resposta automatizadas quando necessário.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    IDS/IPS      │────►│  API Gateway    │────►│  Processador    │
│    Corporativo  │     │  de Segurança   │     │  de Alertas     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Notificação    │◄────┤  Sistema de     │◄────┤  Avaliação de   │
│  de Resposta    │     │  Regras         │     │  Severidade     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Tipos de Alertas Processados

| Tipo de Alerta | Descrição | Severidade Padrão | Ação Automática |
|----------------|-----------|-------------------|-----------------|
| Força Bruta | Tentativas repetidas de login | Alta | Bloqueio temporário de IP |
| Injeção SQL | Tentativas de injeção de SQL em inputs | Crítica | Bloqueio de sessão + alerta |
| XSS | Tentativas de Cross-Site Scripting | Alta | Bloqueio de sessão + alerta |
| Acesso Anômalo | Padrões de acesso incomuns | Média | Notificação para revisão |
| Varredura de Portas | Tentativas de descoberta de serviços | Média | Bloqueio temporário de IP |
| Tráfego Criptografado Suspeito | Comunicações TLS anômalas | Alta | Alerta para análise |

### Configuração da API de Integração

#### Endpoint de Recepção

O sistema expõe um endpoint seguro para receber alertas dos sistemas IDS/IPS:

```
POST /api/v1/security/ids-alerts
Content-Type: application/json
Authorization: Bearer [token]
```

Corpo da requisição:

```json
{
  "alert_id": "IDS-20230615-153042-789012",
  "timestamp": "2023-06-15T15:30:42.567Z",
  "source": "ids_corporativo",
  "alert_type": "intrusion_attempt",
  "signature_id": "SQL-INJ-1234",
  "signature_name": "SQL Injection Attempt",
  "severity": "high",
  "confidence": 85,
  "source_ip": "203.0.113.42",
  "destination_ip": "10.0.3.25",
  "destination_port": 443,
  "protocol": "TCP",
  "user_agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
  "payload_snippet": "SELECT * FROM users WHERE id='1' OR '1'='1'",
  "raw_data": {
    "packet_id": "PKT-20230615-153042-123456",
    "rule_id": "RULE-SQL-INJ-1234"
  }
}
```

#### Configuração de Conexão com IDS/IPS

| Parâmetro | Descrição | Valor Padrão | Obrigatório |
|-----------|-----------|--------------|-------------|
| `ids.sources.allowed` | Lista de fontes de IDS/IPS permitidas | - | Sim |
| `ids.token.validation` | Método de validação de token | JWT | Sim |
| `ids.token.secret` | Segredo para validação de token | - | Condicional |
| `ids.token.public_key` | Chave pública para validação de token | /certs/ids-public.pem | Condicional |
| `ids.alert.throttling` | Limite de alertas similares por minuto | 10 | Não |
| `ids.response.timeout` | Timeout para respostas automáticas em segundos | 5 | Não |

#### Exemplo de Configuração (no arquivo .env.production)

```
# Configuração IDS/IPS
IDS_SOURCES_ALLOWED=ids_corporativo,ips_perimetral,waf_aplicacoes
IDS_TOKEN_VALIDATION=JWT
IDS_TOKEN_PUBLIC_KEY=/certs/ids-public.pem
IDS_ALERT_THROTTLING=10
IDS_RESPONSE_TIMEOUT=5
```

### Regras de Correlação e Resposta

O sistema utiliza um mecanismo de regras para determinar a resposta aos alertas recebidos:

| ID | Nome da Regra | Condições | Ações |
|----|---------------|-----------|-------|
| R1 | Bloqueio de IP por Força Bruta | Tipo: Força Bruta<br>Contagem: > 5 em 10 min<br>Confiança: > 70% | 1. Adicionar IP à lista de bloqueio<br>2. Notificar equipe de segurança<br>3. Registrar no SIEM |
| R2 | Alerta de Injeção SQL | Tipo: Injeção SQL<br>Severidade: Alta/Crítica | 1. Encerrar sessão do usuário<br>2. Notificar administrador<br>3. Criar incidente no sistema de tickets |
| R3 | Investigação de Tráfego Criptografado | Tipo: Tráfego Suspeito<br>Duração: > 30 min | 1. Notificar analista para revisão<br>2. Aumentar logging para sessão<br>3. Marcar IP para monitoramento |

### Testes e Validação

Para verificar a integração com sistemas IDS/IPS:

1. **Testes Automatizados**
   - Simulação de alertas de diferentes tipos
   - Verificação de acionamento correto das regras
   - Validação das ações tomadas

2. **Procedimento de Teste Manual**
   - Envio de alerta de teste através da interface do IDS
   - Verificação da recepção no Sistema de Notificações
   - Confirmação das ações resultantes

## Webhooks para Notificações Externas

### Visão Geral dos Webhooks

O Sistema de Notificações de Segurança permite configurar webhooks para enviar notificações em tempo real para sistemas externos quando eventos de segurança relevantes ocorrem.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Evento de     │────►│  Processador    │────►│  Filtro de      │
│   Segurança     │     │  de Eventos     │     │  Eventos        │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Sistema        │◄────┤  Dispatcher     │◄────┤  Formatador     │
│  Externo        │     │  de Webhook     │     │  de Payload     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Eventos Disponíveis para Webhooks

| Categoria | Eventos | Payload | Uso Típico |
|-----------|---------|---------|------------|
| Autenticação | login.success, login.failure, password.changed, mfa.enabled | Detalhes do usuário, timestamp, local | Sistemas de fraude, monitoramento |
| Incidentes | incident.created, incident.updated, incident.closed | Detalhes do incidente, severidade, impacto | Sistemas de tickets, SOAR |
| Configurações | config.security.changed, user.permission.changed | Alterações realizadas, usuário responsável | Auditoria, compliance |
| Alertas | alert.generated, alert.acknowledged, alert.resolved | Detalhes do alerta, sistemas afetados | Dashboards, sistemas de NOC |
| Disponibilidade | system.down, system.up, maintenance.started | Estado do sistema, impacto estimado | Status pages, monitoramento |

### Configuração de Webhooks

#### Interface de Administração

Os webhooks podem ser configurados na interface de administração em:
**Configurações > Segurança > Integrações > Webhooks**

#### Parâmetros de Configuração

Para cada webhook, os seguintes parâmetros são configuráveis:

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| Nome | Identificador amigável do webhook | "Integração ServiceNow" |
| URL | Endpoint que receberá as requisições | https://empresa.service-now.com/api/incident |
| Eventos | Lista de eventos que acionarão o webhook | incident.created, incident.updated |
| Formato | Formato do payload | JSON, XML |
| Headers | Cabeçalhos HTTP adicionais | Content-Type, Authorization |
| Segredo | Valor usado para assinar as requisições | a1b2c3d4e5f6g7h8i9j0 |
| Ativo | Estado do webhook | Ativo/Inativo |
| Retry | Política de retry em caso de falha | 3 tentativas, intervalo de 60s |
| Filtro Avançado | Condições adicionais para envio | severity == 'critical' |

#### Exemplo de Payload

Payload para `incident.created`:

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

### Segurança dos Webhooks

#### Assinatura das Requisições

Todas as requisições de webhook são assinadas usando HMAC-SHA256:

1. O cabeçalho `X-Webhook-Signature` é adicionado a cada requisição
2. Valor: `sha256=HMAC(segredo, payload)`
3. O receptor deve validar a assinatura para garantir autenticidade

#### Exemplo de Código de Validação (Node.js)

```javascript
const crypto = require('crypto');

function validateWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  );
}

// Uso em Express:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const secret = 'seu_segredo_webhook';
  
  if (!validateWebhook(payload, signature, secret)) {
    return res.status(401).send('Assinatura inválida');
  }
  
  // Processar o webhook...
  res.status(200).send('OK');
});
```

#### Boas Práticas de Segurança

1. **Rotação de Segredos**
   - Rotacionar segredos regularmente (a cada 90 dias)
   - Suporte para múltiplos segredos durante período de transição

2. **Limitação de Taxa**
   - Limite de 10 requisições por segundo por webhook
   - Atraso exponencial para retentativas

3. **Monitoramento**
   - Registro de todas as execuções de webhook (sucesso/falha)
   - Alertas para falhas consecutivas (mais de 5)

### Teste e Depuração de Webhooks

#### Console de Debugging

Uma interface de depuração está disponível em:
**Configurações > Segurança > Integrações > Webhooks > Logs**

Funcionalidades:
- Visualização de tentativas recentes (sucesso/falha)
- Detalhes da requisição e resposta
- Opção para reenvio manual
- Validação da assinatura

#### Webhook de Teste

Para validar a configuração, use o endpoint de teste:

```
POST /api/v1/webhooks/test
Content-Type: application/json
Authorization: Bearer [token]

{
  "webhook_id": "wh_123456789",
  "event": "test.event",
  "custom_payload": {
    "message": "Este é um teste de webhook",
    "timestamp": "2023-06-15T17:00:00.000Z"
  }
}
```

## Diagnóstico e Resolução de Problemas

### Logs de Integração

Todos os logs relacionados às integrações externas são armazenados em:
- Arquivo: `/var/log/security-notifications/integrations.log`
- Nível: `INFO` em produção, `DEBUG` em desenvolvimento
- Rotação: Diária com compressão, mantidos por 30 dias

Formato do log:
```
[2023-06-15T16:45:23.789Z] [INFO] [WEBHOOK] [wh_123456789] Enviando evento incident.created para https://empresa.service-now.com/api/incident
[2023-06-15T16:45:23.895Z] [INFO] [WEBHOOK] [wh_123456789] Resposta recebida: HTTP 200 OK
```

### Monitoramento de Saúde

Um dashboard consolidado está disponível em:
**Administração > Monitoramento > Integrações**

Métricas monitoradas:
- Taxa de sucesso de integração com SIEM
- Tempo médio de processamento de alertas IDS
- Taxa de entrega de webhooks
- Erros por tipo de integração

### Problemas Comuns e Soluções

| Problema | Possíveis Causas | Soluções |
|----------|------------------|----------|
| Falha na conexão com SIEM | Certificado expirado, firewall bloqueando | Verificar certificado, testar conectividade |
| Alertas IDS não processados | Formato incorreto, token inválido | Validar formato JSON, renovar token |
| Falha na entrega de webhooks | Endpoint indisponível, timeout | Verificar disponibilidade do sistema externo |
| Alta latência nas integrações | Sobrecarga do sistema, buffer cheio | Aumentar recursos, ajustar tamanho do buffer |

## Níveis de Serviço (SLAs)

Para garantir a eficácia das integrações, os seguintes SLAs são definidos:

| Integração | Métrica | Objetivo |
|------------|---------|----------|
| SIEM | Latência de entrega | < 5 segundos para 99% dos eventos |
| SIEM | Disponibilidade | 99.95% |
| IDS/IPS | Tempo de processamento | < 2 segundos para 99% dos alertas |
| IDS/IPS | Disponibilidade | 99.99% |
| Webhooks | Taxa de entrega | > 99.5% |
| Webhooks | Latência | < 3 segundos para 95% das entregas |

## Planejamento de Capacidade

Para dimensionar corretamente as integrações, considere:

| Parâmetro | Métrica Base | Escala |
|-----------|--------------|--------|
| Volume de logs SIEM | 50 MB/hora por 100 usuários | Linear |
| Alertas IDS | 500/dia em ambiente padrão | Exponencial com nº de sistemas |
| Webhooks | 1000/dia para todos os eventos | Depende da configuração |

## Responsabilidades

| Função | Responsabilidades |
|--------|-------------------|
| Administrador de Segurança | Configuração e manutenção das integrações |
| Analista de Segurança | Monitoramento e resposta a alertas |
| Administrador de Sistemas | Infraestrutura e disponibilidade dos serviços |
| Desenvolvedor | Implementação de novos webhooks e integrações |

## Melhores Práticas

1. **Planejamento**
   - Documente todas as integrações em um inventário central
   - Realize revisões periódicas da necessidade e eficácia

2. **Implementação**
   - Use autenticação mútua (TLS) quando possível
   - Implemente circuit breakers para falhas de integração
   - Mantenha buffers locais para eventos críticos

3. **Monitoramento**
   - Configure alertas para falhas persistentes
   - Realize testes periódicos automatizados
   - Mantenha dashboards atualizados

4. **Otimização**
   - Ajuste os filtros para reduzir ruído
   - Implemente batch processing para eventos de baixa prioridade
   - Utilize compressão para reduzir tráfego de rede

## Glossário

- **SIEM (Security Information and Event Management)**: Sistema que coleta e analisa logs de segurança de múltiplas fontes.
- **IDS (Intrusion Detection System)**: Sistema que monitora redes e sistemas para atividades maliciosas.
- **IPS (Intrusion Prevention System)**: Sistema similar ao IDS, mas com capacidade de bloquear ataques.
- **Webhook**: Mecanismo de notificação HTTP em tempo real para sistemas externos.
- **SOAR (Security Orchestration, Automation and Response)**: Plataforma que coordena resposta a incidentes.
- **Circuit Breaker**: Padrão que previne falhas em cascata em integrações. 