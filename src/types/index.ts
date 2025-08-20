export type Status = 
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

export type Label = 
  | 'BOLETO' 
  | 'AGUARDANDO_PAGAMENTO' 
  | 'PEDIDO_CANCELADO' 
  | 'APROV_AGUARDANDO_PAGAMENTO' 
  | 'AMOSTRAS' 
  | 'PAGO'
  | 'ORCAMENTO_PUBLICO';

export type OrderType = 
  | 'ORCAMENTO_PUBLICO'
  | 'INTERNO'
  | 'PERSONALIZADO'
  | 'RUSH'
  | 'PROMOCIONAL'
  | 'CORPORATIVO';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  createdAt: Date;
  personType?: 'Física' | 'Jurídica';
  document?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  address?: string;
  neighborhood?: string;
  number?: string;
  logo?: string;
}

export interface HistoryEntry {
  id: string;
  date: Date;
  status: Status;
  comment?: string;
  user: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'document' | 'other';
  createdAt: Date;
  uploadedBy: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  user: string;
  approved?: boolean;
  altered?: boolean;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
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

export type Priority = 'normal' | 'high';

export interface Order {
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

export interface KanbanColumn {
  id: Status;
  title: string;
  orders: Order[];
}

export interface Metric {
  id: string;
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
}

// Tipos de perfil de usuário
export type UserRole = 'MASTER' | 'GESTOR' | 'PRESTADOR';

// Interface para usuários do sistema
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  lastLogin?: Date;
  createdBy?: string; // ID do usuário que criou esta conta
  phone?: string;
  department?: string;
  avatar?: string;
  passwordResetAt?: Date; // Data em que a senha foi resetada pela última vez
}

// Permissões por tipo de perfil
export interface RolePermissions {
  // Permissões de gestão de usuários
  canManageUsers: boolean;
  canManageMasters: boolean;
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canResetUserPasswords: boolean;
  
  // Permissões de configurações
  canAccessSettings: boolean;
  canAccessCriticalSettings: boolean;
  canManageSecuritySettings: boolean;
  canViewAuditLogs: boolean;
  canExportAuditLogs: boolean;
  
  // Permissões de ordens/kanban
  canManageKanban: boolean;
  canCreateOrders: boolean;
  canEditOrders: boolean;
  canDeleteOrders: boolean;
  canChangeOrderStatus: boolean;
  canAssignTasks: boolean;
  canViewAllOrders: boolean;
  canViewOwnOrders: boolean;
  canApproveOrders: boolean;
  canRejectOrders: boolean;
  
  // Permissões de clientes
  canManageCustomers: boolean;
  canViewCustomers: boolean;
  canCreateCustomers: boolean;
  canEditCustomers: boolean;
  canDeleteCustomers: boolean;
  
  // Permissões de relatórios
  canViewReports: boolean;
  canExportReports: boolean;
  canCreateCustomReports: boolean;
  
  // Permissões de notificações e rótulos
  canManageLabels: boolean;
  canManageNotifications: boolean;
  
  // Permissões de arquivos
  canUploadFiles: boolean;
  canDownloadFiles: boolean;
  canDeleteFiles: boolean;
}

// Mapeamento de permissões por perfil
export const rolePermissions: Record<UserRole, RolePermissions> = {
  MASTER: {
    // Permissões de gestão de usuários
    canManageUsers: true,
    canManageMasters: true,
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canResetUserPasswords: true,
    
    // Permissões de configurações
    canAccessSettings: true,
    canAccessCriticalSettings: true,
    canManageSecuritySettings: true,
    canViewAuditLogs: true,
    canExportAuditLogs: true,
    
    // Permissões de ordens/kanban
    canManageKanban: true,
    canCreateOrders: true,
    canEditOrders: true,
    canDeleteOrders: true,
    canChangeOrderStatus: true,
    canAssignTasks: true,
    canViewAllOrders: true,
    canViewOwnOrders: true,
    canApproveOrders: true,
    canRejectOrders: true,
    
    // Permissões de clientes
    canManageCustomers: true,
    canViewCustomers: true,
    canCreateCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,
    
    // Permissões de relatórios
    canViewReports: true,
    canExportReports: true,
    canCreateCustomReports: true,
    
    // Permissões de notificações e rótulos
    canManageLabels: true,
    canManageNotifications: true,
    
    // Permissões de arquivos
    canUploadFiles: true,
    canDownloadFiles: true,
    canDeleteFiles: true
  },
  GESTOR: {
    // Permissões de gestão de usuários
    canManageUsers: true,
    canManageMasters: false,
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,
    canResetUserPasswords: true,
    
    // Permissões de configurações
    canAccessSettings: true,
    canAccessCriticalSettings: false,
    canManageSecuritySettings: false,
    canViewAuditLogs: true,
    canExportAuditLogs: false,
    
    // Permissões de ordens/kanban
    canManageKanban: true,
    canCreateOrders: true,
    canEditOrders: true,
    canDeleteOrders: true,
    canChangeOrderStatus: true,
    canAssignTasks: true,
    canViewAllOrders: true,
    canViewOwnOrders: true,
    canApproveOrders: true,
    canRejectOrders: true,
    
    // Permissões de clientes
    canManageCustomers: true,
    canViewCustomers: true,
    canCreateCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,
    
    // Permissões de relatórios
    canViewReports: true,
    canExportReports: true,
    canCreateCustomReports: true,
    
    // Permissões de notificações e rótulos
    canManageLabels: true,
    canManageNotifications: true,
    
    // Permissões de arquivos
    canUploadFiles: true,
    canDownloadFiles: true,
    canDeleteFiles: true
  },
  PRESTADOR: {
    // Permissões de gestão de usuários
    canManageUsers: false,
    canManageMasters: false,
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canResetUserPasswords: false,
    
    // Permissões de configurações
    canAccessSettings: false,
    canAccessCriticalSettings: false,
    canManageSecuritySettings: false,
    canViewAuditLogs: false,
    canExportAuditLogs: false,
    
    // Permissões de ordens/kanban
    canManageKanban: false,
    canCreateOrders: false,
    canEditOrders: true,
    canDeleteOrders: false,
    canChangeOrderStatus: true,
    canAssignTasks: false,
    canViewAllOrders: false,
    canViewOwnOrders: true,
    canApproveOrders: false,
    canRejectOrders: false,
    
    // Permissões de clientes
    canManageCustomers: false,
    canViewCustomers: true,
    canCreateCustomers: false,
    canEditCustomers: false,
    canDeleteCustomers: false,
    
    // Permissões de relatórios
    canViewReports: false,
    canExportReports: false,
    canCreateCustomReports: false,
    
    // Permissões de notificações e rótulos
    canManageLabels: false,
    canManageNotifications: false,
    
    // Permissões de arquivos
    canUploadFiles: true,
    canDownloadFiles: true,
    canDeleteFiles: false
  }
};

// Registro de atividades de auditoria
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  timestamp: Date;
  ipAddress?: string;
}

// Token para aprovação pública de arte
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

// Log de ações de arte
export interface ArtworkActionLog {
  id: string;
  orderId: string;
  artworkId?: string;
  action: 'approved' | 'adjustment_requested' | 'comment_altered' | 'artwork_uploaded';
  performedBy: string;
  performedByType: 'internal_user' | 'client';
  details?: string;
  timestamp: Date;
}
