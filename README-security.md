# Módulo de Segurança - Sistema CRM

Este documento descreve o módulo de segurança implementado no sistema CRM, abrangendo componentes para criptografia, armazenamento seguro de dados sensíveis e gerenciamento de senhas.

## 1. Criptografia de Dados Sensíveis

### CryptoService (`src/lib/security/cryptoService.ts`)
Implementa criptografia AES-256-GCM para proteger dados sensíveis no banco de dados e em trânsito.

- **Características**:
  - Criptografia simétrica AES-256-GCM (AEAD)
  - Chaves derivadas para diferentes tipos de dados
  - Isolamento de dados por categorias (info pessoal, financeira, documentos, saúde)
  - Vetores de inicialização (IV) aleatórios
  - Suporte a rotação de chaves
  - Verificação de integridade dos dados

### KeyManager (`src/lib/security/keyManager.ts`)
Gerencia o ciclo de vida das chaves de criptografia.

- **Características**:
  - Armazenamento seguro de chaves
  - Gerenciamento de ciclo de vida (criação, rotação, revogação)
  - Derivação de chaves específicas por finalidade
  - Expiração e renovação automática

## 2. Armazenamento Seguro de Dados

### SecureLocalStorage (`src/lib/security/secureLocalStorage.ts`)
Implementação criptografada do localStorage para proteger dados sensíveis no armazenamento local.

- **Características**:
  - Criptografia transparente de dados
  - Proteção com chave mestra
  - Verificação de integridade
  - Rotação de chaves

### DatabaseEncryption (`src/lib/security/databaseEncryption.ts`)
Utilitários para integração da criptografia com operações de banco de dados.

- **Características**:
  - Criptografia automática de campos sensíveis
  - Configuração por modelo/tabela
  - Integração com operações CRUD
  - Suporte a diferentes tipos de dados (strings, objetos JSON)

## 3. Gestão Segura de Senhas

### PasswordService (`src/lib/security/passwordService.ts`)
Implementa hashing seguro com bcrypt e sistema de histórico de senhas.

- **Características**:
  - Hashing com bcrypt (12+ rounds)
  - Políticas de senha configuráveis
  - Histórico de senhas para evitar reutilização
  - Validação de força de senha
  - Geração de senhas fortes

## 4. Sistema de Auditoria e Logs

### LogService (`src/lib/security/logService.ts`)
Fornece um sistema completo de registro e auditoria de atividades de segurança.

- **Características**:
  - Classificação por tipo de evento e severidade
  - Armazenamento criptografado de logs
  - Filtros avançados por data, usuário, IP, tipo de evento, etc.
  - Exportação para formatos CSV e JSON
  - Estatísticas e tendências de eventos
  - Sistema de alertas para eventos críticos

### LogAPI (`src/lib/api/logApi.ts`)
Interface programática para consulta e gerenciamento de logs de segurança.

- **Funcionalidades**:
  - Consulta paginada com múltiplos filtros
  - Exportação de logs para análise
  - Obtenção de estatísticas por período
  - Resumo de segurança para dashboard
  - Monitoramento de eventos críticos e atividades suspeitas

### SecurityLogViewer (`src/components/admin/SecurityLogViewer.tsx`)
Interface para visualização, filtragem e exportação de logs.

- **Funcionalidades**:
  - Filtros por data, tipo, severidade, usuário, IP, etc.
  - Paginação de resultados
  - Exportação para CSV e JSON
  - Visualização detalhada de eventos

### SecurityDashboard (`src/components/admin/SecurityDashboard.tsx`)
Dashboard para monitoramento em tempo real de eventos críticos.

- **Funcionalidades**:
  - Resumo visual de estatísticas
  - Gráficos por tipo de evento e severidade
  - Lista de eventos críticos e atividades suspeitas recentes
  - Configuração de notificações e alertas
  - Atualizações automáticas de dados

## 5. Componentes de Interface

### CryptoKeyManager (`src/components/admin/CryptoKeyManager.tsx`)
Interface de administração para gerenciar chaves de criptografia.

- **Funcionalidades**:
  - Visualização de chaves ativas
  - Criação de novas chaves
  - Rotação de chaves existentes
  - Revogação de chaves comprometidas
  - Limpeza de chaves antigas

### PasswordManager (`src/components/auth/PasswordManager.tsx`)
Interface para usuários alterarem suas senhas com verificação de política de segurança.

- **Funcionalidades**:
  - Alteração de senha com validação em tempo real
  - Indicador de força de senha
  - Verificação de política de senha
  - Verificação de histórico
  - Geração de senhas fortes

## Instalação e Configuração

### Dependências
O módulo de segurança requer as seguintes dependências:

```bash
npm install bcryptjs @types/bcryptjs crypto-js @types/crypto-js uuid @types/uuid file-saver @types/file-saver
```

### Configuração de Ambiente
Para garantir a segurança das chaves de criptografia em produção, configure as seguintes variáveis de ambiente:

```
CRYPTO_MASTER_KEY=<chave-hexadecimal-gerada-aleatoriamente>
```

## Práticas de Segurança Implementadas

1. **Criptografia em repouso**: Todos os dados sensíveis são criptografados antes de armazenamento
2. **Estratégia de chaves**: Chaves específicas por categoria de dados
3. **Hashing seguro**: Senhas protegidas com bcrypt (12+ rounds)
4. **Prevenção de reutilização**: Histórico de senhas para evitar uso repetido
5. **Rotação de chaves**: Suporte a rotação periódica de chaves
6. **Verificação de integridade**: Proteção contra manipulação de dados criptografados
7. **Armazenamento seguro**: Medidas para proteger as chaves criptográficas
8. **Auditoria completa**: Registro detalhado de todas as ações de segurança
9. **Monitoramento em tempo real**: Dashboard e alertas para eventos críticos
10. **Análise forense**: Exportação e filtragem de logs para investigação

## Limitações e Considerações

- Em ambiente de produção, as chaves mestras devem ser armazenadas em serviços seguros de gerenciamento de chaves (AWS KMS, Azure Key Vault, HashiCorp Vault)
- Implementar backups seguros das chaves de criptografia
- Considerar a implementação de um HSM (Hardware Security Module) para operações criptográficas em ambientes de alta segurança
- Realizar auditorias de segurança periódicas no código e nas práticas de gerenciamento de chaves
- Para sistemas em produção, considerar integração com SIEM (Security Information and Event Management) para análise avançada de logs 