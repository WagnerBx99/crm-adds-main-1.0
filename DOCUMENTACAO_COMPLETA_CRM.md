# DOCUMENTACAO COMPLETA DO SISTEMA CRM ADDS

## Visao Geral do Sistema

Este e um CRM (Customer Relationship Management) completo para gestao de pedidos, clientes e personalizacao de produtos. O sistema possui:

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: React Context + TanStack Query
- **Drag & Drop**: @hello-pangea/dnd
- **Animacoes**: Framer Motion
- **Notificacoes**: Sonner

---

## 1. ARQUITETURA DO SISTEMA

### 1.1 Estrutura de Pastas

```
/
├── src/                          # Frontend React
│   ├── components/               # Componentes reutilizaveis
│   │   ├── auth/                 # Autenticacao
│   │   ├── contacts/             # Gestao de contatos
│   │   ├── dashboard/            # Dashboard e metricas
│   │   ├── kanban/               # Quadro Kanban
│   │   ├── layout/               # Layout principal
│   │   ├── notifications/        # Sistema de notificacoes
│   │   ├── personalization/      # Personalizacao de produtos
│   │   ├── public/               # Formularios publicos
│   │   └── ui/                   # Componentes shadcn/ui
│   ├── contexts/                 # React Contexts
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utilitarios e services
│   ├── pages/                    # Paginas da aplicacao
│   ├── styles/                   # CSS e tokens
│   ├── theme/                    # Sistema de temas
│   └── types/                    # TypeScript types
├── backend/                      # Backend Node.js
│   ├── prisma/                   # Schema e migrations
│   ├── src/
│   │   ├── middlewares/          # Auth, rate limiting
│   │   ├── routes/               # API routes
│   │   └── services/             # Business logic
│   └── uploads/                  # Arquivos enviados
└── tokens/                       # Design tokens JSON
```

---

## 2. FUNCIONALIDADES DO SISTEMA

### 2.1 Sistema de Autenticacao

**Arquivo**: `/src/components/auth/LoginForm.tsx`

```typescript
// Funcionalidades:
- Login com email e senha
- Opcao "Mantenha-me conectado"
- Visualizacao de senha (show/hide)
- Validacao de campos
- Login de desenvolvimento (apenas em dev)
- Mensagens de erro
- Redirecionamento apos login

// Props:
interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string; // default: '/dashboard'
}
```

**Backend Auth**: `/backend/src/routes/auth.ts`
```typescript
// Endpoints:
POST /api/auth/login      - Autenticar usuario
POST /api/auth/register   - Registrar usuario (apenas MASTER/GESTOR)
GET  /api/auth/me         - Dados do usuario autenticado
PUT  /api/auth/password   - Alterar senha
POST /api/auth/logout     - Logout (auditoria)

// Seguranca:
- Senha hashada com bcrypt (salt rounds: 10)
- Token JWT com expiracao configuravel
- Rate limiting para prevenir forca bruta
- Logs de auditoria para todas as acoes
```

### 2.2 Sistema de Permissoes (RBAC)

**Arquivo**: `/src/types/index.ts`

```typescript
// Perfis de Usuario:
type UserRole = 'MASTER' | 'GESTOR' | 'PRESTADOR';

// Permissoes por perfil:
MASTER:
  - Acesso total ao sistema
  - Gerencia usuarios, inclusive outros MASTER
  - Configuracoes criticas e seguranca
  - Exportacao de logs de auditoria

GESTOR:
  - Gerencia usuarios (exceto MASTER)
  - Acesso a configuracoes (nao criticas)
  - Visualizacao de logs de auditoria
  - Gestao completa de pedidos e clientes

PRESTADOR:
  - Visualiza apenas seus proprios pedidos
  - Edita pedidos atribuidos a ele
  - Upload/download de arquivos
  - Sem acesso a configuracoes
```

### 2.3 Quadro Kanban

**Arquivo**: `/src/components/kanban/ModernKanbanBoard.tsx`

```typescript
// Funcionalidades:
- Visualizacao de pedidos em colunas por status
- Drag and drop para mover pedidos entre colunas
- Filtros por prioridade, labels, data
- Busca por titulo, cliente, descricao
- Modo compacto
- Metricas em tempo real
- Scroll horizontal responsivo
- Auto-scroll durante drag

// Status disponiveis (colunas):
type Status = 
  | 'FAZER'                  // A fazer
  | 'AJUSTE'                 // Em ajuste
  | 'APROVACAO'              // Aguardando aprovacao
  | 'AGUARDANDO_APROVACAO'   // Aprovacao pendente
  | 'APROVADO'               // Aprovado
  | 'ARTE_APROVADA'          // Arte aprovada
  | 'PRODUCAO'               // Em producao
  | 'EXPEDICAO'              // Expedicao
  | 'FINALIZADO'             // Finalizado
  | 'ENTREGUE'               // Entregue
  | 'FATURADO'               // Faturado
  | 'ARQUIVADO';             // Arquivado

// Labels para pedidos:
type Label = 
  | 'BOLETO'
  | 'AGUARDANDO_PAGAMENTO'
  | 'PEDIDO_CANCELADO'
  | 'APROV_AGUARDANDO_PAGAMENTO'
  | 'AMOSTRAS'
  | 'PAGO'
  | 'ORCAMENTO_PUBLICO';

// Prioridades:
type Priority = 'normal' | 'high';
```

### 2.4 Gestao de Pedidos

**Interface Order**:
```typescript
interface Order {
  id: string;
  title: string;
  description?: string;
  customer: Customer;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  startDate?: Date;
  assignedTo?: string;
  watchers?: string[];
  history: HistoryEntry[];
  artworkUrl?: string;
  approvalLink?: string;
  priority: Priority;
  orderType?: OrderType;
  checklists?: Checklist[];
  attachments?: Attachment[];
  comments?: Comment[];
  labels?: Label[];
  products?: Product[];
  personalizationDetails?: string;
  customerDetails?: string;
  artworkImages?: ArtworkImage[];
  artworkComments?: Comment[];
  finalizedArtworks?: ArtworkImage[];
  artworkApprovalTokens?: ArtworkApprovalToken[];
  artworkActionLogs?: ArtworkActionLog[];
}
```

**API Endpoints**:
```typescript
GET    /api/orders          - Listar pedidos (paginado)
GET    /api/orders/kanban   - Pedidos agrupados por status
GET    /api/orders/:id      - Detalhes do pedido
POST   /api/orders          - Criar pedido
PUT    /api/orders/:id      - Atualizar pedido
PATCH  /api/orders/:id/status - Atualizar status (drag & drop)
DELETE /api/orders/:id      - Excluir pedido (MASTER/GESTOR)
POST   /api/orders/:id/comments - Adicionar comentario
```

### 2.5 Gestao de Clientes

**Interface Customer**:
```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  createdAt: Date;
  personType?: 'Fisica' | 'Juridica';
  document?: string;       // CPF ou CNPJ
  zipCode?: string;
  city?: string;
  state?: string;
  address?: string;
  neighborhood?: string;
  number?: string;
  logo?: string;
}
```

### 2.6 Sistema de Personalizacao

**Arquivo**: `/src/components/personalization/PersonalizationForm.tsx`

```typescript
// Funcionalidades:
- Formulario de dados de contato (telefone, WhatsApp)
- Selecao de estado/cidade
- Redes sociais (Instagram, Facebook, TikTok)
- Upload de logo (PNG/PDF, max 10MB)
- Selecao de cor de impressao
- Validacao em tempo real
- Drag and drop para upload

// Dados coletados:
interface PersonalizationData {
  telefone: string;
  whatsapp: string;
  cidade: string;
  estado: string;
  redes: {
    instagram: string;
    facebook: string;
    tiktok: string;
    outro: string;
  };
  logo: File | null;
  logoPreview: string;
  cor_impressao: 'branco' | 'preto' | 'custom';
  cor_custom: string;
}
```

### 2.7 Aprovacao de Arte

**Funcionalidades**:
- Upload de arte para aprovacao
- Link publico para cliente aprovar/solicitar ajuste
- Token de aprovacao com expiracao
- Historico de acoes (aprovado, ajuste solicitado)
- Comentarios do cliente
- Versionamento de artes

```typescript
interface ArtworkImage {
  id: string;
  name: string;
  url: string;
  type?: string;
  createdAt: Date;
  uploadedBy: string;
  status?: 'pending' | 'approved' | 'adjustment_requested';
}

interface ArtworkApprovalToken {
  id: string;
  orderId: string;
  artworkId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  clientName?: string;
  clientDecision?: 'approved' | 'adjustment_requested';
  adjustmentComment?: string;
  createdAt: Date;
}
```

### 2.8 Integracao com Tiny ERP

**Arquivo**: `/backend/src/routes/tiny.ts`

```typescript
// Funcionalidades:
- Sincronizacao de contatos
- Sincronizacao de produtos
- Envio de pedidos para Tiny
- Webhook para receber atualizacoes
- Configuracao de token de API
```

### 2.9 Sistema de Notificacoes

**Arquivo**: `/src/components/notifications/NotificationBell.tsx`

```typescript
// Funcionalidades:
- Badge com contagem de nao lidas
- Lista de notificacoes
- Marcar como lida
- Tipos de notificacao:
  - Novo pedido
  - Status alterado
  - Comentario adicionado
  - Arte aprovada/ajuste solicitado
```

### 2.10 Dashboard e Metricas

**Arquivo**: `/src/components/dashboard/StatCard.tsx`

```typescript
// Metricas exibidas:
- Total de pedidos
- Pedidos de alta prioridade
- Pedidos atrasados
- Concluidos hoje
- Taxa de produtividade
- Tempo medio no pipeline
- Taxa de conclusao
```

---

## 3. SISTEMA DE DESIGN (DESIGN TOKENS)

### 3.1 Paleta de Cores

**Arquivo**: `/tokens/color.json` e `/src/styles/tokens.css`

```css
/* Tema Claro */
:root {
  --surface-0: #FFFFFF;          /* Background principal */
  --surface-1: #F4F7FA;          /* Background secundario */
  --text-high: #111827;          /* Texto principal */
  --text-low: #475569;           /* Texto secundario */
  --accent-primary: #1999C0;     /* Cor de destaque principal (azul-ciano) */
  --accent-secondary: #D96A1C;   /* Cor de destaque secundaria (laranja) */
  --accent-tertiary: #5A1FCC;    /* Cor de destaque terciaria (roxo) */
  --semantic-success: #22C65B;   /* Sucesso (verde) */
  --semantic-warning: #FFB547;   /* Aviso (amarelo) */
  --semantic-error: #D9363A;     /* Erro (vermelho) */
}

/* Tema Escuro */
[data-theme="dark"] {
  --surface-0: #0F111A;
  --surface-1: #1B1E2A;
  --text-high: #FFFFFF;
  --text-low: #A3A3B1;
  --accent-primary: #21ADD6;
  --accent-secondary: #FF7B1F;
  --accent-tertiary: #6D28D9;
  --semantic-success: #39FF14;
  --semantic-warning: #FFAA00;
  --semantic-error: #FF4D4F;
}
```

### 3.2 Sistema de Design no Kanban

```typescript
const designSystem = {
  typography: {
    hero: "text-4xl md:text-5xl lg:text-6xl font-black tracking-tight",
    title: "text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight",
    heading: "text-xl md:text-2xl font-semibold tracking-tight",
    subheading: "text-lg md:text-xl font-medium",
    body: "text-base font-normal",
    caption: "text-sm font-medium",
    micro: "text-xs font-semibold uppercase tracking-wider"
  },
  spacing: {
    section: "space-y-8 md:space-y-12 lg:space-y-16",
    card: "p-6 md:p-8 lg:p-10",
    compact: "p-4 md:p-6",
    minimal: "p-3 md:p-4"
  },
  gradients: {
    primary: "bg-gradient-to-br from-accent-primary via-accent-primary to-accent-secondary",
    secondary: "bg-gradient-to-br from-surface-1 via-surface-0 to-surface-1",
    accent: "bg-gradient-to-r from-accent-secondary to-accent-tertiary",
    warning: "bg-gradient-to-r from-semantic-warning to-accent-secondary",
    danger: "bg-gradient-to-r from-semantic-error to-semantic-warning",
    surface: "bg-gradient-to-br from-surface-0 via-surface-1 to-surface-0"
  },
  surfaces: {
    primary: "bg-surface-0",
    secondary: "bg-surface-1",
    accent: "bg-accent-primary",
    success: "bg-semantic-success",
    warning: "bg-semantic-warning",
    error: "bg-semantic-error"
  },
  shadows: {
    elegant: "shadow-2xl shadow-accent-primary/10",
    floating: "shadow-lg shadow-accent-primary/20",
    subtle: "shadow-sm shadow-accent-primary/10",
    glow: "shadow-2xl shadow-accent-primary/20"
  },
  animations: {
    smooth: "transition-all duration-300 ease-out",
    bounce: "transition-all duration-200 ease-bounce",
    elastic: "transition-all duration-500 ease-elastic"
  }
};
```

### 3.3 Configuracao do Tailwind

**Arquivo**: `/tailwind.config.ts`

```typescript
// Espacamentos customizados:
spacing: {
  '15': '3.75rem',  // 60px - sidebar collapsed
  '60': '15rem',    // 240px - sidebar expandido
}

// Animacoes:
keyframes: {
  'accordion-down': { height: '0' -> 'var(--radix-accordion-content-height)' },
  'accordion-up': { height: 'var(--radix-accordion-content-height)' -> '0' },
  'fade-in': { opacity: '0' -> '1' },
  'fade-out': { opacity: '1' -> '0' },
  'slide-in': { translateY: '20px', opacity: '0' -> translateY: '0', opacity: '1' },
  'slide-out': { translateY: '0', opacity: '1' -> translateY: '20px', opacity: '0' }
}
```

---

## 4. LAYOUT E COMPONENTES PRINCIPAIS

### 4.1 AppLayout

**Arquivo**: `/src/components/layout/AppLayout.tsx`

```typescript
// Estrutura:
- Sidebar (fixo, collapsible)
- Header (dinamico por rota)
- Main content area
- Background pattern sutil

// Estados:
- sidebarCollapsed: boolean
- sidebarExpanded: boolean (hover)
- isMobile: boolean

// Responsividade:
- Desktop: sidebar fixo com toggle
- Mobile: sidebar em overlay com backdrop
```

### 4.2 Sidebar

**Arquivo**: `/src/components/layout/Sidebar.tsx`

```typescript
// Navegacao principal:
const navigationItems = [
  { id: 'kanban', label: 'Pipeline Kanban', icon: Kanban, href: '/' },
  { id: 'personalizacao', label: 'Personalizacao', icon: PaintBucket, href: '/personalization' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'contatos', label: 'Contatos', icon: UserCheck, href: '/contacts' },
  { id: 'tiny', label: 'Integracao Tiny', icon: ExternalLink, href: '/tiny' }
];

// Itens do rodape:
const bottomItems = [
  { id: 'configuracoes', label: 'Configuracoes', icon: Cog, href: '/settings' }
];

// Estilos:
- Largura: 60px (collapsed) / 240px (expandido)
- Gradientes no header e rodape
- Hover expansion com delay
- Animacoes suaves
```

### 4.3 Header

**Arquivo**: `/src/components/layout/Header.tsx`

```typescript
// Elementos:
- Botao de menu (mobile)
- Titulo da pagina (dinamico)
- Breadcrumb
- Sino de notificacoes
- Menu do usuario (avatar, dropdown)

// Menu do usuario:
- Informacoes do perfil
- Link para perfil
- Link para configuracoes
- Botao de logout
```

---

## 5. ROTAS DO SISTEMA

### 5.1 Rotas Publicas

```typescript
'/login'              - Pagina de login
'/acesso-negado'      - Acesso negado
'/cadastro'           - Formulario de cadastro publico
'/orcamento'          - Formulario de orcamento
'/personalizar'       - Formulario de personalizacao
'/public/personalize' - Personalizacao publica
'/arte/aprovar/:token'- Aprovacao de arte publica
```

### 5.2 Rotas Protegidas

```typescript
'/'                   - Kanban (Pipeline de Vendas)
'/dashboard'          - Dashboard (requer canViewReports)
'/contacts'           - Contatos
'/personalization'    - Personalizacao
'/settings'           - Configuracoes (requer canAccessSettings)
'/tiny'               - Integracao Tiny
'/multiple-products'  - Selecao multipla de produtos
'/design-system-demo' - Demo do sistema de design
```

---

## 6. BANCO DE DADOS (SCHEMA PRISMA)

### 6.1 Modelos Principais

```prisma
// Usuario
model User {
  id              String    @id @default(uuid())
  name            String
  email           String    @unique
  passwordHash    String
  role            UserRole  @default(PRESTADOR)
  active          Boolean   @default(true)
  phone           String?
  department      String?
  avatar          String?
  passwordResetAt DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastLogin       DateTime?
}

// Cliente
model Customer {
  id                  String     @id @default(uuid())
  name                String
  email               String?
  phone               String?
  company             String?
  personType          PersonType @default(FISICA)
  document            String?
  zipCode             String?
  city                String?
  state               String?
  address             String?
  neighborhood        String?
  number              String?
  complement          String?
  logo                String?
  tinyId              String?
}

// Pedido
model Order {
  id                    String      @id @default(uuid())
  title                 String
  description           String?
  status                OrderStatus @default(FAZER)
  priority              Priority    @default(normal)
  orderType             OrderType?
  dueDate               DateTime?
  startDate             DateTime?
  artworkUrl            String?
  approvalLink          String?
  personalizationDetails String?
  customerDetails       String?
  customerId            String
  assignedToId          String?
}

// Produto
model Product {
  id          String   @id @default(uuid())
  name        String
  sku         String?  @unique
  description String?
  price       Decimal?
  imageUrl    String?
  tinyId      String?
  active      Boolean  @default(true)
}
```

---

## 7. COMPONENTES UI (shadcn/ui)

### 7.1 Componentes Utilizados

```typescript
// Formularios:
- Button, Input, Label, Checkbox
- Select, RadioGroup
- Textarea, Switch

// Feedback:
- Alert, Badge, Progress
- Skeleton, Toast (Sonner)

// Navegacao:
- DropdownMenu, Tabs
- Dialog, Sheet
- Tooltip, Popover

// Layout:
- Card, Separator
- Avatar, ScrollArea

// Dados:
- Table, DataTable
```

### 7.2 Estilos dos Componentes

```typescript
// Botoes:
<Button variant="default">   // bg-accent-primary
<Button variant="secondary"> // bg-surface-1
<Button variant="outline">   // border-accent-primary/20
<Button variant="ghost">     // hover:bg-accent-primary/10
<Button variant="destructive"> // bg-semantic-error

// Cards:
<Card className="bg-surface-0 border-accent-primary/20 shadow-sm">

// Inputs:
<Input className="border-accent-primary/20 focus:ring-accent-primary">

// Badges:
<Badge className="bg-accent-primary/10 text-accent-primary">
```

---

## 8. HOOKS CUSTOMIZADOS

```typescript
// useViewport - Detecta largura da viewport
const { width } = useViewport();

// useColumnWidth - Calcula largura das colunas do Kanban
const columnWidth = useColumnWidth();

// useAutoScroll - Auto scroll durante drag
useAutoScroll({ containerRef, isDragging });

// useCardToast - Notificacoes para acoes do Kanban
const { showSuccess, showError } = useCardToast();

// useTheme - Controle de tema light/dark
const { theme, toggleTheme, setTheme } = useTheme();
```

---

## 9. CONTEXTOS

### 9.1 KanbanContext

```typescript
interface KanbanContextType {
  state: KanbanState;
  dispatch: React.Dispatch<KanbanAction>;
  addPublicOrder: (orderData) => Promise<Order>;
  refreshFromApi: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  updateOrderStatusApi: (orderId, newStatus, comment?) => Promise<void>;
}

// Actions:
'SET_COLUMNS'
'SET_ORDERS'
'ADD_ORDER'
'UPDATE_ORDER_STATUS'
'ADD_COMMENT'
'UPDATE_ORDER'
'REORDER_ORDERS_IN_COLUMN'
'SET_LOADING'
'SET_ERROR'
```

### 9.2 ThemeContext

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Funcionalidades:
- Persistencia no localStorage
- Detecta preferencia do sistema
- Aplica via data-theme no HTML
```

---

## 10. SERVICOS

### 10.1 apiService

```typescript
// Metodos:
apiService.login(email, password)
apiService.getOrdersKanban()
apiService.getOrderById(id)
apiService.createOrder(data)
apiService.updateOrder(id, data)
apiService.updateOrderStatus(id, status, comment?)
apiService.getCustomers()
apiService.createCustomer(data)
// ... e outros
```

### 10.2 authService

```typescript
// Metodos:
authService.login({ email, password, rememberMe })
authService.logout()
authService.isLoggedIn()
authService.getCurrentUser()
authService.renewSession()
authService.refreshToken()
authService.devLogin() // Apenas em desenvolvimento
```

---

## 11. SEGURANCA

### 11.1 Rate Limiting

```typescript
// Configuracoes:
authLogin: 5 tentativas por 15 minutos
artApprovalPublic: 20 requisicoes por hora
publicQuotes: 10 requisicoes por hora
publicContacts: 10 requisicoes por hora
global: 100 requisicoes por minuto
```

### 11.2 Autenticacao JWT

```typescript
// Payload do token:
{
  id: string,
  email: string,
  role: UserRole,
  name: string
}

// Expiracao configuravel (default: 7 dias)
```

### 11.3 Logs de Auditoria

```typescript
// Acoes registradas:
- LOGIN, LOGOUT
- CREATE_USER, UPDATE_USER, DELETE_USER
- CREATE_ORDER, UPDATE_ORDER, DELETE_ORDER
- CHANGE_ORDER_STATUS
- CHANGE_PASSWORD
// ... e outras
```

---

## 12. CONFIGURACAO DO AMBIENTE

### 12.1 Variaveis de Ambiente (Backend)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/crm_adds"
JWT_SECRET="sua-chave-secreta-aqui"
JWT_EXPIRES_IN="7d"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
UPLOAD_DIR="./uploads"
ADMIN_API_KEY="chave-admin"
```

### 12.2 Scripts NPM

```json
// Frontend:
"dev": "vite",
"build": "vite build",
"preview": "vite preview",
"design-tokens": "node scripts/build-tokens.js"

// Backend:
"dev": "tsx watch src/server.ts",
"build": "tsc",
"start": "node dist/server.js",
"prisma:migrate": "prisma migrate dev",
"prisma:generate": "prisma generate",
"prisma:seed": "tsx prisma/seed.ts"
```

---

## 13. DEPENDENCIAS PRINCIPAIS

### 13.1 Frontend

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "typescript": "^5.x",
  "vite": "^5.x",
  "tailwindcss": "^3.x",
  "@tanstack/react-query": "^5.x",
  "@hello-pangea/dnd": "^16.x",
  "framer-motion": "^10.x",
  "lucide-react": "^0.x",
  "sonner": "^1.x",
  "@radix-ui/*": "latest",
  "class-variance-authority": "^0.x",
  "clsx": "^2.x",
  "tailwind-merge": "^2.x"
}
```

### 13.2 Backend

```json
{
  "express": "^4.x",
  "@prisma/client": "^5.x",
  "prisma": "^5.x",
  "bcryptjs": "^2.x",
  "jsonwebtoken": "^9.x",
  "cors": "^2.x",
  "dotenv": "^16.x",
  "express-rate-limit": "^7.x"
}
```

---

## 14. COMO RECRIAR O SISTEMA

### 14.1 Passo a Passo

1. **Inicializar projeto React + Vite + TypeScript**
2. **Configurar TailwindCSS com shadcn/ui**
3. **Criar sistema de design tokens**
4. **Implementar ThemeProvider**
5. **Criar layout (AppLayout, Sidebar, Header)**
6. **Implementar sistema de autenticacao**
7. **Criar contexto do Kanban**
8. **Implementar quadro Kanban com drag & drop**
9. **Criar formularios de personalizacao**
10. **Implementar backend com Express + Prisma**
11. **Criar rotas de API**
12. **Implementar sistema de permissoes**
13. **Adicionar logs de auditoria**
14. **Configurar rate limiting**
15. **Integrar com Tiny ERP**

### 14.2 Componentes Essenciais para Recriar

1. **LoginForm** - Autenticacao
2. **AppLayout** - Layout principal
3. **Sidebar** - Navegacao
4. **Header** - Cabecalho
5. **ModernKanbanBoard** - Quadro principal
6. **ModernKanbanColumn** - Colunas do Kanban
7. **ModernKanbanCard** - Cards dos pedidos
8. **NewOrderDialog** - Criar pedido
9. **OrderDetailsDialog** - Detalhes do pedido
10. **PersonalizationForm** - Formulario de personalizacao
11. **ContactList/ContactForm** - Gestao de contatos
12. **NotificationBell/NotificationCenter** - Notificacoes

---

Esta documentacao contem todas as informacoes necessarias para recriar um sistema similar ao CRM ADDS, incluindo estrutura, funcionalidades, estilos e configuracoes.
