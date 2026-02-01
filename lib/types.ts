// User Types
export type UserRole = 'MASTER' | 'GESTOR' | 'PRESTADOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  phone?: string;
  department?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

// Customer Types
export type PersonType = 'Fisica' | 'Juridica';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  personType?: PersonType;
  document?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  address?: string;
  neighborhood?: string;
  number?: string;
  complement?: string;
  logo?: string;
  tinyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export type OrderStatus =
  | 'FAZER'
  | 'AJUSTE'
  | 'APROVACAO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADO'
  | 'ARTE_APROVADA'
  | 'PRODUCAO'
  | 'EXPEDICAO'
  | 'FINALIZADO'
  | 'ENTREGUE'
  | 'FATURADO'
  | 'ARQUIVADO';

export type Priority = 'normal' | 'high';

export type OrderType = 'NOVO' | 'REPOSICAO' | 'AMOSTRA' | 'ORCAMENTO';

export type Label =
  | 'BOLETO'
  | 'AGUARDANDO_PAGAMENTO'
  | 'PEDIDO_CANCELADO'
  | 'APROV_AGUARDANDO_PAGAMENTO'
  | 'AMOSTRAS'
  | 'PAGO'
  | 'ORCAMENTO_PUBLICO';

export interface HistoryEntry {
  id: string;
  action: string;
  from?: string;
  to?: string;
  comment?: string;
  createdAt: Date;
  userId?: string;
  userName?: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
  uploadedBy: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface ArtworkImage {
  id: string;
  name: string;
  url: string;
  type?: string;
  createdAt: Date;
  uploadedBy: string;
  status?: 'pending' | 'approved' | 'adjustment_requested';
}

export interface ArtworkApprovalToken {
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

export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  tinyId?: string;
  active: boolean;
}

export interface Order {
  id: string;
  title: string;
  description?: string;
  customer: Customer;
  customerId: string;
  status: OrderStatus;
  priority: Priority;
  orderType?: OrderType;
  labels?: Label[];
  dueDate?: Date;
  startDate?: Date;
  assignedTo?: string;
  assignedToId?: string;
  watchers?: string[];
  history: HistoryEntry[];
  artworkUrl?: string;
  approvalLink?: string;
  personalizationDetails?: string;
  customerDetails?: string;
  checklists?: Checklist[];
  attachments?: Attachment[];
  comments?: Comment[];
  products?: Product[];
  artworkImages?: ArtworkImage[];
  artworkComments?: Comment[];
  finalizedArtworks?: ArtworkImage[];
  artworkApprovalTokens?: ArtworkApprovalToken[];
  createdAt: Date;
  updatedAt: Date;
}

// Kanban Types
export interface KanbanColumn {
  id: OrderStatus;
  title: string;
  orders: Order[];
  color: string;
  icon?: string;
}

export interface KanbanState {
  columns: KanbanColumn[];
  orders: Order[];
  loading: boolean;
  error: string | null;
}

// Personalization Types
export interface PersonalizationData {
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

// Notification Types
export interface Notification {
  id: string;
  type: 'order_created' | 'status_changed' | 'comment_added' | 'artwork_approved' | 'artwork_adjustment';
  title: string;
  message: string;
  read: boolean;
  orderId?: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tiny Integration Types
export interface TinyContact {
  id: string;
  nome: string;
  fantasia?: string;
  tipo_pessoa: 'F' | 'J';
  cpf_cnpj?: string;
  email?: string;
  fone?: string;
  celular?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
}

export interface TinyProduct {
  id: string;
  nome: string;
  codigo?: string;
  preco?: number;
  preco_promocional?: number;
  unidade?: string;
  ncm?: string;
  origem?: string;
  gtin?: string;
  marca?: string;
  tipoVariacao?: string;
  situacao?: string;
}

export interface TinyConfig {
  apiToken: string;
  enabled: boolean;
  lastSync?: Date;
}

// Status configuration
export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  FAZER: { label: 'A Fazer', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  AJUSTE: { label: 'Em Ajuste', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  APROVACAO: { label: 'Aprovacao', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovacao', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  APROVADO: { label: 'Aprovado', color: 'text-green-700', bgColor: 'bg-green-100' },
  ARTE_APROVADA: { label: 'Arte Aprovada', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  PRODUCAO: { label: 'Producao', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  EXPEDICAO: { label: 'Expedicao', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  FINALIZADO: { label: 'Finalizado', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  ENTREGUE: { label: 'Entregue', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  FATURADO: { label: 'Faturado', color: 'text-lime-700', bgColor: 'bg-lime-100' },
  ARQUIVADO: { label: 'Arquivado', color: 'text-slate-700', bgColor: 'bg-slate-100' },
};

export const LABEL_CONFIG: Record<Label, { label: string; color: string; bgColor: string }> = {
  BOLETO: { label: 'Boleto', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando Pagamento', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  PEDIDO_CANCELADO: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100' },
  APROV_AGUARDANDO_PAGAMENTO: { label: 'Aprov. Aguard. Pagamento', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  AMOSTRAS: { label: 'Amostras', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  PAGO: { label: 'Pago', color: 'text-green-700', bgColor: 'bg-green-100' },
  ORCAMENTO_PUBLICO: { label: 'Orcamento Publico', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string }> = {
  normal: { label: 'Normal', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  high: { label: 'Alta', color: 'text-red-700', bgColor: 'bg-red-100' },
};
