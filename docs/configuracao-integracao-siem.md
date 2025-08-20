# Guia de Implementação: Integração com SIEM

## Visão Geral

Este guia fornece instruções passo a passo para configurar a integração do Sistema de Notificações de Segurança com uma plataforma SIEM. O documento tem como objetivo orientar administradores de segurança e desenvolvedores nas tarefas de implementação, configuração e validação da integração.

## Pré-requisitos

Antes de iniciar a integração, verifique se você possui:

1. **Acesso às plataformas**
   - Credenciais administrativas para o Sistema de Notificações de Segurança
   - Credenciais administrativas para a plataforma SIEM
   - Acesso ao servidor de aplicação onde o sistema está implantado

2. **Informações necessárias**
   - URL do endpoint de coleta do SIEM
   - Método de autenticação suportado pelo SIEM
   - Certificados ou tokens de acesso ao SIEM
   - Lista de eventos que devem ser enviados

3. **Ferramentas**
   - Cliente SSH para acesso ao servidor
   - Editor de texto para modificar arquivos de configuração
   - Ferramentas de monitoramento de rede (opcional, para diagnóstico)

## Configuração do Sistema de Notificações de Segurança

### Passo 1: Configuração de Variáveis de Ambiente

1. Acesse o servidor da aplicação via SSH:
   ```bash
   ssh usuario@servidor-aplicacao
   ```

2. Edite o arquivo de variáveis de ambiente para produção:
   ```bash
   nano /caminho/para/aplicacao/.env.production
   ```

3. Adicione as seguintes configurações para integração com SIEM:
   ```
   # Configuração SIEM - Splunk Enterprise
   SIEM_ENABLED=true
   SIEM_PROVIDER=splunk
   SIEM_ENDPOINT_URL=https://splunk.empresa.com.br:8088/services/collector/event
   SIEM_AUTH_TYPE=token
   SIEM_AUTH_TOKEN=seu-token-de-acesso-aqui
   SIEM_CONNECTION_TIMEOUT=30
   SIEM_RETRY_MAX=5
   SIEM_RETRY_INTERVAL=60
   SIEM_BUFFER_SIZE=1000
   SIEM_FORMAT=JSON
   SIEM_TLS_VERIFY=true
   SIEM_LOG_LEVEL=INFO
   ```

4. Salve o arquivo e saia do editor.

5. Recarregue as variáveis de ambiente ou reinicie a aplicação:
   ```bash
   systemctl restart sistema-notificacoes-seguranca
   ```

### Passo 2: Configuração de Certificados (se aplicável)

Se a integração utilizar autenticação baseada em certificados:

1. Crie o diretório para armazenar os certificados:
   ```bash
   mkdir -p /caminho/para/aplicacao/certs
   chmod 700 /caminho/para/aplicacao/certs
   ```

2. Copie os certificados para o diretório:
   ```bash
   cp /caminho/temporario/siem-client.pem /caminho/para/aplicacao/certs/
   cp /caminho/temporario/siem-client.key /caminho/para/aplicacao/certs/
   chmod 600 /caminho/para/aplicacao/certs/siem-client.key
   ```

3. Atualize as variáveis de ambiente para usar os certificados:
   ```
   SIEM_AUTH_TYPE=certificate
   SIEM_AUTH_CERT_PATH=/caminho/para/aplicacao/certs/siem-client.pem
   SIEM_AUTH_KEY_PATH=/caminho/para/aplicacao/certs/siem-client.key
   ```

### Passo 3: Configuração dos Eventos a Serem Enviados

1. Acesse o painel administrativo da aplicação em um navegador:
   ```
   https://sistema-notificacoes.empresa.com.br/admin
   ```

2. Navegue até **Configurações > Segurança > Integrações > SIEM**.

3. Configure os eventos a serem enviados:
   - Marque as categorias de eventos relevantes
   - Defina o nível de detalhamento dos logs
   - Configure a frequência de envio para cada categoria

4. Configure filtros para reduzir ruído (opcional):
   - Exclua eventos de usuários específicos (ex.: usuários de monitoramento)
   - Exclua IPs internos de monitoramento
   - Configure agrupamento de eventos similares

5. Salve as configurações.

## Configuração da Plataforma SIEM

### Passo 1: Criar Receptor de Eventos no SIEM

#### Para Splunk Enterprise:

1. Acesse o Splunk Web como administrador.
2. Navegue até **Configurações > Entradas de Dados > HTTP Event Collector**.
3. Clique em **Novo Token**.
4. Preencha os campos:
   - **Nome**: Sistema de Notificações de Segurança
   - **Fonte**: sistema_notificacoes_seguranca
   - **Tipo de Origem**: json
   - **Índice**: security
   - **Aplicativo**: search (ou o aplicativo específico)
5. Continue para revisar as configurações e anote o token gerado.
6. Certifique-se de que o HTTP Event Collector está habilitado em **Configurações > Entradas de Dados > HTTP Event Collector > Configurações Globais**.

#### Para IBM QRadar:

1. Acesse o Console QRadar como administrador.
2. Navegue até **Admin > QRadar Log Sources**.
3. Clique em **Adicionar**.
4. Preencha os campos:
   - **Nome do Log Source**: Sistema de Notificações de Segurança
   - **Descrição**: Eventos do Sistema de Notificações
   - **Tipo**: Syslog
   - **Protocolo**: UDP ou TCP
   - **Porta**: 514 (padrão) ou outra configurada
5. Salve a configuração.
6. Configure o firewall para permitir conexões de syslog do servidor da aplicação.

### Passo 2: Configurar Parsing e Visualização no SIEM

#### Para Splunk Enterprise:

1. Crie um arquivo de configuração de props.conf para processamento dos eventos:
   ```
   [source::sistema_notificacoes_seguranca]
   SHOULD_LINEMERGE = false
   TRUNCATE = 0
   TIME_PREFIX = "timestamp":"\s*
   TIME_FORMAT = %Y-%m-%dT%H:%M:%S.%3N%z
   SEDCMD-normalize = s/\\"/"/g
   KV_MODE = json
   ```

2. Salve este arquivo em `$SPLUNK_HOME/etc/system/local/props.conf` ou implante via gerenciamento de configuração.

3. Reinicie o Splunk ou recarregue a configuração:
   ```bash
   $SPLUNK_HOME/bin/splunk restart
   ```

4. Crie dashboards básicos para visualização dos eventos:
   - Dashboard de Autenticação
   - Dashboard de Ações Administrativas
   - Dashboard de Atividades de Usuário

#### Para IBM QRadar:

1. Configure o mapeamento de eventos na seção **Admin > QRadar Log Sources > Event Mapping**.
2. Crie regras para eventos críticos em **Rules**.
3. Configure dashboards personalizados para visualização.

## Validação da Integração

### Passo 1: Gerar Eventos de Teste

1. Acesse o painel administrativo da aplicação.
2. Navegue até **Configurações > Segurança > Integrações > SIEM > Teste**.
3. Clique em **Gerar Eventos de Teste** e selecione as categorias de eventos.
4. Alternativamente, use a API para gerar eventos de teste:
   ```bash
   curl -X POST \
     https://sistema-notificacoes.empresa.com.br/api/v1/admin/siem/test \
     -H 'Authorization: Bearer seu-token-de-admin' \
     -H 'Content-Type: application/json' \
     -d '{"eventTypes": ["authentication", "admin_action", "data_access"], "count": 5}'
   ```

### Passo 2: Verificar Recebimento no SIEM

#### Para Splunk Enterprise:

1. Acesse o Splunk Web.
2. Execute a seguinte pesquisa:
   ```
   source="sistema_notificacoes_seguranca" earliest=-1h
   ```
3. Verifique se os eventos de teste estão aparecendo nos resultados.
4. Confirme que os campos estão sendo extraídos corretamente.

#### Para IBM QRadar:

1. Acesse o Console QRadar.
2. Navegue até a guia **Log Activity**.
3. Adicione filtro para a fonte de log configurada.
4. Verifique se os eventos estão sendo recebidos e processados.

### Passo 3: Verificar Métricas de Integração

1. Acesse o painel administrativo da aplicação.
2. Navegue até **Monitoramento > Integrações > SIEM**.
3. Verifique as métricas de integração:
   - Taxa de sucesso no envio
   - Latência média
   - Volume de eventos enviados
   - Erros recentes

## Configuração de Monitoramento e Alertas

### Passo 1: Configurar Alertas para Falhas na Integração

1. Configure alertas para notificar a equipe quando houver falhas persistentes:
   ```bash
   nano /caminho/para/aplicacao/config/alerting.yaml
   ```

2. Adicione as seguintes regras:
   ```yaml
   alerts:
     - name: siem_connection_failure
       condition: "siem.connection.failures > 3 in 10m"
       severity: critical
       notification:
         channels: [email, slack]
         recipients:
           email: [equipe-seguranca@empresa.com.br]
           slack: [#seguranca-alertas]
         message: "Falha na conexão com SIEM detectada. Verifique a integração imediatamente."
     
     - name: siem_buffer_warning
       condition: "siem.buffer.usage > 80%"
       severity: warning
       notification:
         channels: [email]
         recipients:
           email: [administrador-sistema@empresa.com.br]
         message: "Buffer de eventos SIEM atingindo capacidade máxima ({{siem.buffer.usage}}%)."
   ```

3. Salve o arquivo e reinicie o serviço de alertas:
   ```bash
   systemctl restart sistema-notificacoes-alertas
   ```

### Passo 2: Configurar Dashboard de Monitoramento

1. Acesse o painel administrativo.
2. Navegue até **Monitoramento > Dashboards**.
3. Crie um novo dashboard para monitoramento de integrações:
   - Adicione widgets para métricas de SIEM
   - Configure gráficos de tendência para volume de eventos
   - Adicione indicadores de status para conexão

## Procedimentos Operacionais

### Procedimento de Verificação Diária

Execute estas verificações diariamente para garantir o funcionamento adequado:

1. Verifique o status da integração no dashboard de monitoramento.
2. Confirme que os eventos estão sendo recebidos pelo SIEM.
3. Verifique os logs de erro em `/var/log/security-notifications/integrations.log`.
4. Revise qualquer alerta gerado nas últimas 24 horas.

### Procedimento de Resolução de Problemas

Se ocorrerem problemas na integração, siga estas etapas:

1. **Verifique a conectividade de rede**:
   ```bash
   telnet splunk.empresa.com.br 8088
   ```

2. **Verifique a validade dos certificados**:
   ```bash
   openssl x509 -in /caminho/para/aplicacao/certs/siem-client.pem -text -noout
   ```

3. **Verifique os logs detalhados** habilitando o modo debug:
   ```bash
   sed -i 's/SIEM_LOG_LEVEL=INFO/SIEM_LOG_LEVEL=DEBUG/g' /caminho/para/aplicacao/.env.production
   systemctl restart sistema-notificacoes-seguranca
   ```

4. **Teste o envio manual de um evento**:
   ```bash
   curl -X POST \
     -H "Authorization: Splunk sua-token-aqui" \
     -H "Content-Type: application/json" \
     -d '{"event": {"test": true, "message": "evento de teste"}, "source": "teste-manual", "sourcetype": "json"}' \
     https://splunk.empresa.com.br:8088/services/collector/event
   ```

### Procedimento de Rotação de Credenciais

Execute este procedimento a cada 90 dias ou conforme política de segurança:

1. **Para autenticação por token**:
   - Gere um novo token no SIEM
   - Atualize o token no arquivo .env.production
   - Reinicie o serviço para aplicar a mudança

2. **Para autenticação por certificado**:
   - Gere novos certificados cliente
   - Instale os novos certificados no diretório apropriado
   - Atualize as referências no arquivo .env.production
   - Reinicie o serviço para aplicar a mudança

## Considerações de Segurança

### Proteção de Credenciais

- Armazene as credenciais SIEM em um cofre de segredos (HashiCorp Vault, AWS Secrets Manager, etc.)
- Limite o acesso ao arquivo .env.production apenas a usuários administrativos
- Registre todas as alterações nas configurações SIEM em um log de auditoria

### Proteção de Dados

- Implemente filtragem para evitar o envio de dados sensíveis para o SIEM
- Configure ofuscação para informações pessoais quando necessário
- Utilize conexão TLS para toda comunicação com o SIEM
- Valide certificados TLS para evitar ataques man-in-the-middle

### Hardening da Infraestrutura

- Configure o firewall para permitir apenas conexões necessárias para o SIEM
- Implemente lista de controle de acesso para limitar quais servidores podem se conectar ao receptor SIEM
- Considere usar uma rede segura dedicada para tráfego de logs de segurança

## Apêndice

### Exemplo de Formato de Log para Diferentes Eventos

#### Evento de Login bem-sucedido:

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

#### Evento de Alteração de Configuração:

```json
{
  "timestamp": "2023-06-15T15:30:42.567Z",
  "event_id": "ADMIN-20230615-153042-789012",
  "source": "sistema_notificacoes_seguranca",
  "source_ip": "10.0.2.15",
  "event_type": "admin_action",
  "event_action": "configuration_change",
  "severity": "medium",
  "actor": {
    "user_id": "admin.sistema",
    "user_type": "internal",
    "department": "TI"
  },
  "target": {
    "resource_type": "configuration",
    "resource_id": "security_policy"
  },
  "context": {
    "session_id": "SES-20230615-153042-123456",
    "browser": "Firefox 102.0",
    "os": "Ubuntu 22.04",
    "location": "Escritório Matriz"
  },
  "details": {
    "previous_value": {
      "password_expiry_days": 90
    },
    "new_value": {
      "password_expiry_days": 60
    },
    "change_reason": "Compliance com nova política de segurança"
  },
  "tags": ["configuracao", "alteracao", "politica_seguranca"]
}
```

#### Evento de Acesso a Dados Sensíveis:

```json
{
  "timestamp": "2023-06-15T16:45:23.789Z",
  "event_id": "DATA-20230615-164523-456789",
  "source": "sistema_notificacoes_seguranca",
  "source_ip": "10.0.2.15",
  "event_type": "data_access",
  "event_action": "sensitive_data_export",
  "severity": "high",
  "actor": {
    "user_id": "maria.santos",
    "user_type": "internal",
    "department": "RH"
  },
  "target": {
    "resource_type": "data",
    "resource_id": "employee_records",
    "classification": "confidential"
  },
  "context": {
    "session_id": "SES-20230615-164523-234567",
    "browser": "Edge 114.0.1823.43",
    "os": "Windows 11",
    "location": "Acesso Remoto"
  },
  "details": {
    "records_accessed": 42,
    "query": "SELECT * FROM employees WHERE department='Financeiro'",
    "export_format": "CSV",
    "justification": "Relatório anual de compensação",
    "approval_id": "APR-20230614-103045-123456"
  },
  "tags": ["dados_sensiveis", "exportacao", "rh"]
}
```

### Referências

- [Documentação Splunk HTTP Event Collector](https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector)
- [Documentação IBM QRadar](https://www.ibm.com/docs/en/qsip/7.4?topic=administration-configuring-log-sources)
- [Guia de Melhores Práticas para Integração SIEM](https://www.sans.org/reading-room/whitepapers/incident/paper/39800)
- [Documentação Sistema de Notificações de Segurança - Integrações](../integracao-sistemas-externos.md) 