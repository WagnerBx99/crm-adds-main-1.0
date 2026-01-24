# CRM ADDS - Backend

Backend Node.js com PostgreSQL para o sistema CRM ADDS Brasil.

## Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para PostgreSQL
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- pnpm (recomendado) ou npm

## Instalação

1. **Instalar dependências:**
```bash
cd backend
pnpm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. **Configurar banco de dados:**
```bash
# Gerar cliente Prisma
pnpm db:generate

# Criar tabelas no banco
pnpm db:push

# Popular com dados iniciais
pnpm db:seed
```

4. **Iniciar servidor:**
```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm build
pnpm start
```

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://user:pass@localhost:5432/crm_adds` |
| `PORT` | Porta do servidor | `3001` |
| `JWT_SECRET` | Chave secreta para JWT | `sua_chave_secreta_32_caracteres` |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `7d` |
| `CORS_ORIGIN` | URL do frontend | `http://localhost:5173` |
| `TINY_API_TOKEN` | Token da API Tiny ERP | `seu_token_tiny` |

## Estrutura de Diretórios

```
backend/
├── prisma/
│   ├── schema.prisma    # Schema do banco de dados
│   └── seed.ts          # Dados iniciais
├── src/
│   ├── routes/          # Rotas da API
│   ├── middlewares/     # Middlewares (auth, etc)
│   ├── services/        # Lógica de negócio
│   ├── utils/           # Utilitários
│   └── server.ts        # Entrada da aplicação
├── uploads/             # Arquivos enviados
└── package.json
```

## Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registrar usuário (requer auth)
- `GET /api/auth/me` - Dados do usuário autenticado
- `PUT /api/auth/password` - Alterar senha
- `POST /api/auth/logout` - Logout

### Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Obter usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Desativar usuário
- `POST /api/users/:id/reset-password` - Resetar senha

### Clientes
- `GET /api/customers` - Listar clientes
- `GET /api/customers/:id` - Obter cliente
- `POST /api/customers` - Criar cliente
- `PUT /api/customers/:id` - Atualizar cliente
- `DELETE /api/customers/:id` - Excluir cliente

### Pedidos
- `GET /api/orders` - Listar pedidos
- `GET /api/orders/kanban` - Pedidos para Kanban
- `GET /api/orders/:id` - Obter pedido
- `POST /api/orders` - Criar pedido
- `PUT /api/orders/:id` - Atualizar pedido
- `PATCH /api/orders/:id/status` - Alterar status
- `DELETE /api/orders/:id` - Excluir pedido
- `POST /api/orders/:id/comments` - Adicionar comentário

### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Obter produto
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Desativar produto
- `POST /api/products/bulk` - Importar em lote

### Orçamentos Públicos
- `GET /api/public-quotes` - Listar orçamentos
- `GET /api/public-quotes/:id` - Obter orçamento
- `POST /api/public-quotes` - Criar orçamento (público)
- `PUT /api/public-quotes/:id` - Atualizar orçamento
- `POST /api/public-quotes/:id/convert` - Converter em pedido
- `DELETE /api/public-quotes/:id` - Excluir orçamento

### Contatos Públicos
- `GET /api/public-contacts` - Listar contatos
- `GET /api/public-contacts/:id` - Obter contato
- `POST /api/public-contacts` - Criar contato (público)
- `PUT /api/public-contacts/:id` - Atualizar contato
- `DELETE /api/public-contacts/:id` - Excluir contato

### Etiquetas
- `GET /api/labels` - Listar etiquetas
- `GET /api/labels/:id` - Obter etiqueta
- `POST /api/labels` - Criar etiqueta
- `PUT /api/labels/:id` - Atualizar etiqueta
- `DELETE /api/labels/:id` - Desativar etiqueta

### Logs de Auditoria
- `GET /api/audit-logs` - Listar logs
- `GET /api/audit-logs/actions` - Tipos de ações
- `GET /api/audit-logs/entity-types` - Tipos de entidades
- `GET /api/audit-logs/stats` - Estatísticas

### Configurações
- `GET /api/config` - Listar configurações
- `GET /api/config/:key` - Obter configuração
- `PUT /api/config/:key` - Atualizar configuração
- `DELETE /api/config/:key` - Excluir configuração
- `POST /api/config/bulk` - Atualizar em lote

### Integração Tiny
- `GET /api/tiny/config` - Configuração da integração
- `PUT /api/tiny/config` - Atualizar configuração
- `GET /api/tiny/contas-pagar` - Contas a pagar
- `GET /api/tiny/contas-receber` - Contas a receber
- `GET /api/tiny/resumo-financeiro` - Resumo financeiro
- `GET /api/tiny/produtos` - Produtos da Tiny
- `GET /api/tiny/contatos` - Contatos da Tiny
- `POST /api/tiny/sync/produtos` - Sincronizar produtos
- `POST /api/tiny/sync/contatos` - Sincronizar contatos

## Credenciais Padrão (Seed)

| Perfil | Email | Senha |
|--------|-------|-------|
| MASTER | admin@exemplo.com | admin123 |
| GESTOR | gestor@exemplo.com | gestor123 |
| PRESTADOR | prestador@exemplo.com | prestador123 |

## Scripts Disponíveis

```bash
pnpm dev          # Iniciar em modo desenvolvimento
pnpm build        # Compilar TypeScript
pnpm start        # Iniciar em produção
pnpm db:generate  # Gerar cliente Prisma
pnpm db:push      # Sincronizar schema com banco
pnpm db:migrate   # Criar migration
pnpm db:seed      # Popular banco com dados iniciais
pnpm db:studio    # Abrir Prisma Studio
```

## Deploy

### Railway / Render / Heroku

1. Configure as variáveis de ambiente
2. Configure o comando de build: `pnpm install && pnpm db:generate && pnpm build`
3. Configure o comando de start: `pnpm start`
4. Execute o seed manualmente após o primeiro deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## Licença

Propriedade de ADDS Brasil.
