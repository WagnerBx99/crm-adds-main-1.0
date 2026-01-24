# Backend PostgreSQL - CRM ADDS

## Visão Geral

Este documento descreve a implementação do backend Node.js com PostgreSQL para o CRM ADDS.

## Arquitetura

### Stack Tecnológico

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Runtime | Node.js | 20.x |
| Framework | Express.js | 4.x |
| ORM | Prisma | 5.x |
| Banco de Dados | PostgreSQL | 16.x |
| Autenticação | JWT | - |
| Hash de Senha | bcryptjs | - |
| Gerenciador de Processos | PM2 | - |

### Estrutura de Diretórios

```
backend/
├── prisma/
│   ├── schema.prisma    # Definição das tabelas
│   └── seed.ts          # Dados iniciais
├── src/
│   ├── routes/
│   │   ├── auth.ts      # Autenticação (login, logout, etc.)
│   │   ├── users.ts     # CRUD de usuários
│   │   ├── customers.ts # CRUD de clientes
│   │   ├── orders.ts    # CRUD de pedidos + Kanban
│   │   ├── products.ts  # CRUD de produtos
│   │   ├── labels.ts    # CRUD de etiquetas
│   │   ├── publicQuotes.ts    # Orçamentos públicos
│   │   ├── publicContacts.ts  # Contatos públicos
│   │   ├── auditLogs.ts # Logs de auditoria
│   │   ├── config.ts    # Configurações do sistema
│   │   └── tiny.ts      # Integração Tiny ERP
│   ├── middlewares/
│   │   └── auth.ts      # Middleware JWT
│   └── server.ts        # Servidor Express
├── package.json
├── tsconfig.json
├── .env                 # Variáveis de ambiente (não versionado)
└── README.md
```

## Banco de Dados

### Entidades Principais

| Tabela | Descrição |
|--------|-----------|
| `User` | Usuários do sistema (MASTER, GESTOR, PRESTADOR) |
| `Customer` | Clientes (PF ou PJ) |
| `Order` | Pedidos/Ordens de serviço |
| `OrderHistory` | Histórico de alterações de pedidos |
| `OrderComment` | Comentários em pedidos |
| `OrderAttachment` | Anexos de pedidos |
| `OrderChecklist` | Checklists de pedidos |
| `Product` | Produtos/Serviços |
| `Label` | Etiquetas para categorização |
| `PublicQuote` | Orçamentos públicos |
| `PublicContact` | Contatos públicos |
| `AuditLog` | Logs de auditoria |
| `Config` | Configurações do sistema |
| `TinyConfig` | Configuração da integração Tiny |

### Diagrama de Relacionamentos

```
User (1) ----< (N) Order
User (1) ----< (N) OrderComment
User (1) ----< (N) AuditLog

Customer (1) ----< (N) Order
Customer (1) ----< (N) PublicQuote

Order (1) ----< (N) OrderHistory
Order (1) ----< (N) OrderComment
Order (1) ----< (N) OrderAttachment
Order (1) ----< (N) OrderChecklist
Order (N) >----< (N) Label
Order (N) >----< (N) Product
```

## API REST

### Endpoints de Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login com email e senha |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Dados do usuário logado |
| PUT | `/api/auth/password` | Alterar senha |

### Endpoints de Recursos

| Recurso | Endpoints |
|---------|-----------|
| Users | GET, POST, PUT, DELETE `/api/users` |
| Customers | GET, POST, PUT, DELETE `/api/customers` |
| Orders | GET, POST, PUT, DELETE `/api/orders` |
| Products | GET, POST, PUT, DELETE `/api/products` |
| Labels | GET, POST, PUT, DELETE `/api/labels` |
| Public Quotes | GET, POST `/api/public-quotes` |
| Public Contacts | GET, POST `/api/public-contacts` |
| Audit Logs | GET `/api/audit-logs` |
| Config | GET, PUT `/api/config` |
| Tiny | GET, POST `/api/tiny/*` |

### Autenticação

Todas as rotas (exceto login e endpoints públicos) requerem autenticação via JWT.

**Header:**
```
Authorization: Bearer <token>
```

## Configuração na VPS

### Informações do Servidor

| Item | Valor |
|------|-------|
| IP | 31.97.253.85 |
| Porta Backend | 3001 |
| Banco de Dados | crm_adds |
| Usuário BD | crm_adds |
| Processo PM2 | crm-adds-api |

### Variáveis de Ambiente (.env)

```env
DATABASE_URL="postgresql://crm_adds:CrmAdds2024Secure@localhost:5432/crm_adds?schema=public"
PORT=3001
NODE_ENV=production
JWT_SECRET=CrmAdds2024JwtSecretKey32CharactersMin
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://crm-adds-main-1-0.vercel.app,http://localhost:5173
TINY_API_BASE_URL=https://api.tiny.com.br/api2
TINY_API_TOKEN=<seu_token_tiny>
```

### Comandos Úteis

```bash
# Ver status do backend
pm2 status

# Ver logs do backend
pm2 logs crm-adds-api

# Reiniciar backend
pm2 restart crm-adds-api

# Parar backend
pm2 stop crm-adds-api

# Executar migrations
cd /var/www/crm-adds-backend
npx prisma db push

# Executar seed
npx tsx prisma/seed.ts
```

## Credenciais Padrão

| Tipo | Email | Senha | Role |
|------|-------|-------|------|
| Admin | admin@exemplo.com | admin123 | MASTER |
| Gestor | gestor@exemplo.com | gestor123 | GESTOR |
| Prestador | prestador@exemplo.com | prestador123 | PRESTADOR |

## Integração com Frontend

### Configuração

No arquivo `.env` do frontend:

```env
# URL da API Backend
VITE_API_BASE_URL=http://31.97.253.85:3001/api

# Usar backend PostgreSQL (true) ou localStorage (false)
VITE_USE_BACKEND_API=true
```

### Serviços Criados

1. **apiService.ts** - Serviço HTTP para comunicação com o backend
2. **authServiceBackend.ts** - Serviço de autenticação usando o backend
3. **useAuth.ts** - Hook React para autenticação

## Próximos Passos

1. **Abrir porta 3001 no firewall** da VPS:
   ```bash
   ufw allow 3001
   ```

2. **Configurar HTTPS** com certificado SSL (recomendado para produção)

3. **Configurar domínio** para a API (ex: api.crm-adds.seudominio.com.br)

4. **Migrar dados existentes** do localStorage para o PostgreSQL

5. **Atualizar frontend** para usar os novos serviços de API

## Troubleshooting

### Backend não inicia
```bash
pm2 logs crm-adds-api --lines 50
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Testar conexão
psql -U crm_adds -d crm_adds -h localhost
```

### CORS bloqueando requisições
Verificar se a URL do frontend está na variável `CORS_ORIGIN` do `.env` do backend.
