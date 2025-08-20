# Canais de Comunicação para Incidentes de Segurança

## Visão Geral

Este documento detalha os canais oficiais de comunicação a serem utilizados durante a resposta a incidentes de segurança no Sistema de Notificações de Segurança. A comunicação eficaz é crítica para uma resposta rápida e coordenada a incidentes de segurança.

## Canais de Comunicação Internos

### Comunicação em Tempo Real

| Canal | Propósito | Gestão | SLA de Resposta |
|-------|-----------|--------|-----------------|
| **Grupo WhatsApp "ERIS-Alert"** | Notificações iniciais e comunicação rápida | Coordenador de Resposta | Imediato (24/7) |
| **Sala Teams "Resposta a Incidentes"** | Videoconferências e coordenação | Analista de Segurança | Configuração em 10 min |
| **Chat Corporativo - Canal #seguranca-incidentes** | Discussões técnicas e atualizações | Administrador de Sistemas | Monitoramento contínuo |
| **Ramal de Emergência: 8888** | Comunicação quando sistemas estão indisponíveis | Equipe de Suporte | Atendimento imediato |

### Comunicação Estruturada

| Canal | Propósito | Gestão | Frequência |
|-------|-----------|--------|------------|
| **Email seguranca-alerta@empresa.com.br** | Detalhes técnicos e atualizações documentadas | Analista de Segurança | Conforme necessário |
| **Sistema de Tickets - Categoria "Incidente"** | Acompanhamento de ações e status | Administrador de Sistemas | Atualização a cada hora |
| **Relatórios de Status** | Documentação formal do progresso | Coordenador de Resposta | A cada 4 horas |
| **Dashboard de Incidentes** | Visão geral visual do status do incidente | Analista de Segurança | Atualização em tempo real |

## Canais de Comunicação Externos

### Comunicação com Clientes e Usuários

| Canal | Propósito | Responsável | Aprovação Necessária |
|-------|-----------|-------------|----------------------|
| **Portal de Status de Serviços** | Informar sobre indisponibilidades | Comunicador | Coordenador |
| **Email Institucional** | Notificações oficiais sobre incidentes | Comunicador | Coordenador + Jurídico |
| **Central de Atendimento: 0800-123-4567** | Suporte e informações para clientes | Equipe de Suporte | Scripts aprovados pelo Coordenador |
| **SMS em Massa** | Alertas críticos para usuários | Comunicador | Diretor de TI |

### Comunicação com Autoridades

| Canal | Propósito | Responsável | Aprovação |
|-------|-----------|-------------|-----------|
| **Email Oficial para ANPD** | Notificações legais obrigatórias | Assessor Jurídico | Diretor Executivo |
| **Ofício Formal** | Comunicação oficial com autoridades | Assessor Jurídico | Diretor Executivo |
| **Canal Dedicado CERT.br** | Reporte de incidentes técnicos | Analista de Segurança | Coordenador |

### Comunicação com Imprensa

| Canal | Propósito | Responsável | Aprovação |
|-------|-----------|-------------|-----------|
| **Comunicados à Imprensa** | Informações oficiais para mídia | Comunicador | Diretor Executivo |
| **Coletivas de Imprensa** | Esclarecimentos diretos em casos graves | Diretor de Comunicação | CEO |
| **Respostas a Solicitações da Imprensa** | Gestão reativa de comunicação | Comunicador | Diretor de Comunicação |

## Protocolos de Comunicação

### Notificação Inicial de Incidente

1. Detectado um incidente, o primeiro respondente notifica o Coordenador via WhatsApp ERIS-Alert
2. Coordenador avalia e aciona membros necessários da equipe ERIS
3. Criação de ticket no sistema com categoria "Incidente-Segurança"
4. Agendamento de chamada inicial de alinhamento em até 30 minutos

### Comunicação Periódica Durante o Incidente

1. Atualizações no sistema de tickets a cada hora
2. Relatório resumido via email a cada 4 horas para stakeholders internos
3. Atualização do dashboard de incidentes em tempo real
4. Chamadas de status a cada 6 horas ou conforme necessidade

### Comunicação de Resolução

1. Notificação formal de contenção via email e sistema de tickets
2. Comunicado de resolução para todos os canais ativados
3. Relatório preliminar em até 24 horas após a resolução
4. Agendamento de reunião de lições aprendidas em até 72 horas

## Templates de Comunicação

### Template de Notificação Inicial (Interno)

```
ALERTA DE SEGURANÇA: [NÍVEL DE SEVERIDADE]
Incidente: [TIPO DE INCIDENTE]
Detectado em: [DATA E HORA]
Sistemas afetados: [LISTA DE SISTEMAS]
Impacto inicial: [DESCRIÇÃO DO IMPACTO]
Próximos passos: [AÇÕES IMEDIATAS]
Ponto de contato: [NOME E CONTATO]
```

### Template de Comunicação ao Cliente

```
Prezado cliente,

Identificamos um [TIPO DE INCIDENTE] em nossos sistemas que pode afetar [SERVIÇOS AFETADOS]. Nossa equipe de segurança está trabalhando ativamente na resolução.

Status atual: [STATUS]
Impacto esperado: [DESCRIÇÃO]
Previsão de normalização: [ESTIMATIVA]
Recomendações: [ORIENTAÇÕES AO CLIENTE]

Atualizações serão fornecidas através do [CANAL].

Agradecemos sua compreensão,
Equipe [EMPRESA]
```

### Template de Notificação à ANPD (Jurídico)

```
À Autoridade Nacional de Proteção de Dados,

Conforme Art. 48 da LGPD, comunicamos a ocorrência de incidente de segurança envolvendo dados pessoais sob nossa responsabilidade.

Descrição do incidente: [DETALHES]
Data e hora da detecção: [DATA/HORA]
Categorias de dados afetados: [TIPOS DE DADOS]
Quantidade estimada de titulares: [NÚMERO]
Possíveis consequências: [IMPACTOS]
Medidas adotadas: [AÇÕES]
Medidas futuras: [PLANO]

Permanecemos à disposição para esclarecimentos adicionais.

Atenciosamente,
[NOME]
DPO - [EMPRESA]
```

## Matriz de Acionamento

| Tipo de Incidente | Stakeholders Internos | Stakeholders Externos | Canais Primários | Tempo Máximo |
|-------------------|-----------------------|------------------------|------------------|--------------|
| Violação de Dados | ERIS + Diretoria + Jurídico | Clientes + ANPD | Email + Portal | 24h (LGPD) |
| Indisponibilidade | ERIS + Suporte + Infraestrutura | Clientes | Portal + SMS | 1h |
| Ataque em Andamento | ERIS + Segurança | CERT.br | Interno apenas | Imediato |
| Malware/Ransomware | ERIS + TI + Diretoria | Forensics externos | Telefone + Email | 2h |

## Árvore de Escalação

```
Incidente Detectado
│
├─ Nível Baixo/Médio ─── Analista de Segurança ─── Coordenador ERIS
│
├─ Nível Alto ─────────── Coordenador ERIS ─────── Diretor de TI
│
└─ Nível Crítico ──────── Diretor de TI ──────────── CEO
```

## Registros e Documentação

Toda comunicação relacionada a incidentes deve ser:

1. Arquivada no sistema de tickets com categoria "Incidente-[ID]"
2. Incluída no relatório pós-incidente
3. Revisada durante a análise de lições aprendidas
4. Mantida por período mínimo de 1 ano (incidentes comuns) ou 5 anos (violações de dados)

## Exercícios e Testes

Os canais de comunicação serão testados regularmente:

- Teste mensal do grupo WhatsApp ERIS-Alert
- Simulação trimestral de comunicação completa
- Revisão semestral dos templates e protocolos
- Validação anual de contatos externos

## Responsável pela Manutenção

A manutenção deste documento e dos canais de comunicação é responsabilidade do Coordenador de Resposta a Incidentes, com revisões programadas a cada três meses ou após alterações significativas nos sistemas de comunicação da empresa. 