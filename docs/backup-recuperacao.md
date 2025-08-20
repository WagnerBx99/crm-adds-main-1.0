# Procedimentos de Backup e Recuperação de Dados

Este documento descreve os procedimentos recomendados para backup e recuperação de dados do CRM Empresarial, garantindo a continuidade dos negócios e a proteção de informações críticas.

## Política de Backup

### Tipos de Backup

O sistema utiliza uma estratégia de backup em camadas:

1. **Backup Completo**
   - Periodicidade: Semanal (domingo às 01:00)
   - Retenção: 8 semanas
   - Conteúdo: Banco de dados completo, arquivos de configuração e arquivos anexados
   
2. **Backup Incremental**
   - Periodicidade: Diário (segunda a sábado às 01:00)
   - Retenção: 30 dias
   - Conteúdo: Alterações desde o último backup completo ou incremental
   
3. **Backup de Logs de Transação**
   - Periodicidade: A cada 4 horas
   - Retenção: 14 dias
   - Conteúdo: Logs de transação do banco de dados

4. **Backup de Configurações**
   - Periodicidade: Após cada alteração significativa
   - Retenção: 10 versões anteriores
   - Conteúdo: Configurações de sistema, templates e parâmetros

### Armazenamento de Backup

Os backups são armazenados em múltiplas localidades para garantir segurança e disponibilidade:

1. **Armazenamento Primário**
   - Localização: Servidor de backup dedicado na infraestrutura principal
   - Criptografia: AES-256
   - Acesso: Restrito à equipe de operações

2. **Armazenamento Secundário**
   - Localização: Serviço de armazenamento em nuvem (AWS S3 ou Azure Blob)
   - Criptografia: AES-256 em trânsito e em repouso
   - Regras de retenção: Configuradas no nível da política do bucket/container
   
3. **Armazenamento Offline**
   - Localização: Mídias externas armazenadas em cofre
   - Periodicidade: Mensal (backup completo)
   - Rotação: Esquema de 3 gerações

## Procedimentos de Backup

### Backup Automático

O sistema realiza backups automáticos de acordo com a política definida:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Agendamento    │────►│  Execução do    │────►│  Validação do   │
│  de Backup      │     │  Backup         │     │  Backup         │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
        ┌─────────────────┐     ┌─────────────────┐     │
        │                 │     │                 │     │
        │  Notificação    │◄────┤  Arquivamento   │◄────┘
        │  de Status      │     │  do Backup      │
        │                 │     │                 │
        └─────────────────┘     └─────────────────┘
```

### Comandos para Backup Manual

Em caso de necessidade, os seguintes comandos podem ser usados para criar backups manuais:

**Backup do Banco de Dados:**
```bash
# Para PostgreSQL
pg_dump -U [usuario] -F c -b -v -f "[caminho]/crm_backup_$(date +%Y%m%d_%H%M%S).backup" [nome_do_banco]

# Para MySQL/MariaDB
mysqldump -u [usuario] -p [nome_do_banco] > "[caminho]/crm_backup_$(date +%Y%m%d_%H%M%S).sql"
```

**Backup de Arquivos:**
```bash
tar -czf "[caminho]/crm_files_backup_$(date +%Y%m%d_%H%M%S).tar.gz" [diretorio_de_arquivos]
```

**Criptografia do Backup:**
```bash
gpg --symmetric --cipher-algo AES256 "[caminho]/arquivo_backup"
```

## Procedimentos de Recuperação

### Análise da Falha

Antes de iniciar a recuperação, realize a análise da falha:

1. Identifique a natureza do problema (corrupção de dados, falha física, erro humano)
2. Determine a extensão dos dados afetados
3. Escolha o backup mais apropriado para recuperação
4. Documente a situação antes de iniciar a recuperação

### Recuperação do Banco de Dados

1. **Preparação:**
   - Pare os serviços do CRM
   - Faça backup do estado atual (mesmo com falhas)
   - Prepare o ambiente de destino

2. **Recuperação do Backup Completo:**
   ```bash
   # Para PostgreSQL
   pg_restore -U [usuario] -d [nome_do_banco] -v "[caminho]/backup_completo.backup"
   
   # Para MySQL/MariaDB
   mysql -u [usuario] -p [nome_do_banco] < "[caminho]/backup_completo.sql"
   ```

3. **Aplicação de Backups Incrementais:**
   - Aplique os backups incrementais em ordem cronológica
   - Verifique a integridade dos dados após cada aplicação

4. **Recuperação de Logs de Transação:**
   - Aplique os logs de transação para recuperar até o ponto mais recente possível
   
5. **Verificação:**
   - Execute verificações de integridade no banco de dados
   - Valide a consistência dos dados em nível de aplicação

### Recuperação de Arquivos

1. Restaure os arquivos do backup para o local apropriado
   ```bash
   tar -xzf "[caminho]/crm_files_backup.tar.gz" -C [diretorio_destino]
   ```

2. Ajuste permissões e propriedade
   ```bash
   chown -R [usuario]:[grupo] [diretorio_destino]
   chmod -R 755 [diretorio_destino]
   ```

3. Verifique a integridade dos arquivos restaurados

### Recuperação de Configurações

1. Restaure os arquivos de configuração
2. Verifique se as variáveis de ambiente estão corretamente definidas
3. Atualize referências a recursos externos se necessário

## Plano de Recuperação de Desastres (DRP)

### Cenários de Desastre

1. **Falha de Hardware:**
   - Utilize infraestrutura redundante (se disponível)
   - Restaure backups em hardware alternativo

2. **Corrupção de Dados:**
   - Identifique o ponto da corrupção
   - Restaure a partir do backup anterior ao ponto de corrupção

3. **Desastre Físico (incêndio, inundação):**
   - Ative o site de DR secundário
   - Restaure a partir de backups offsite

4. **Ataque Cibernético:**
   - Isole sistemas comprometidos
   - Restaure a partir do último backup seguro
   - Implemente correções antes de restaurar

### Tempos Objetivos

- **RPO (Recovery Point Objective):** 4 horas
  - Máxima perda de dados aceitável em caso de desastre
  
- **RTO (Recovery Time Objective):** 8 horas
  - Tempo máximo para restauração do sistema

### Verificação e Testes

1. **Testes Programados:**
   - Realizar testes de recuperação trimestralmente
   - Documentar resultados e tempos de recuperação
   
2. **Verificações de Integridade:**
   - Executar verificações semanais automatizadas nos backups
   - Validar a restauração em ambiente de teste

## Responsabilidades

| Função | Responsabilidades |
|--------|-------------------|
| Administrador de Banco de Dados | Configuração e verificação de backups de banco de dados |
| Administrador de Sistemas | Backups de arquivos e configurações |
| Equipe de Segurança | Verificação de integridade e proteção dos backups |
| Gerente de TI | Aprovação de procedimentos de recuperação |
| Equipe de Suporte | Execução de rotinas de backup e recuperação |

## Registros e Auditoria

1. **Registros de Backup:**
   - Data e hora de início/término
   - Tamanho e localização do backup
   - Status de conclusão
   - Responsável pela execução

2. **Registros de Recuperação:**
   - Natureza do incidente
   - Data e hora de início/término da recuperação
   - Backups utilizados
   - Problemas encontrados e soluções aplicadas
   - Responsável pela execução

3. **Auditoria:**
   - Verificação mensal dos registros de backup
   - Revisão trimestral da política e procedimentos
   - Teste anual de recuperação completa

## Contatos em Caso de Emergência

| Nome | Função | Contato |
|------|--------|---------|
| [Nome do DBA] | DBA | [telefone]/[email] |
| [Nome do Admin] | Administrador de Sistemas | [telefone]/[email] |
| [Nome do Gerente] | Gerente de TI | [telefone]/[email] |
| [Nome do Suporte] | Suporte 24/7 | [telefone]/[email] |

---

**Nota Importante:** Este documento deve ser revisado e atualizado a cada 6 meses ou após alterações significativas na infraestrutura.

Data da última revisão: [DATA]
Responsável pela revisão: [NOME] 