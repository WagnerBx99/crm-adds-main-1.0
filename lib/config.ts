// API Configuration
// Backend esta hospedado na VPS Hostinger
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://31.97.253.85:3001/api';

// Tiny API Configuration
export const TINY_CONFIG = {
  API_TOKEN: '9a6db31b0fc596d5911e541f7502c1bfd559744dfe4ba44b99129e876d36c581',
  API_BASE_URL: `${API_BASE_URL}/tiny`,
  TIMEOUT: 15000,
  CACHE_ENABLED: false,
  CACHE_EXPIRATION: 1800000, // 30 minutos
};

// Auth Configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'crm_auth_token',
  USER_KEY: 'crm_user',
  REMEMBER_KEY: 'crm_remember',
  TOKEN_EXPIRATION: 24 * 60 * 60 * 1000, // 24 horas
  REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutos
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'CRM ADDS',
  APP_VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
};

// Feature Flags
export const FEATURES = {
  TINY_INTEGRATION: true,
  NOTIFICATIONS: true,
  DARK_MODE: true,
  ARTWORK_APPROVAL: true,
  DEV_LOGIN: process.env.NODE_ENV === 'development',
};

// Status Colors for Kanban
export const STATUS_COLORS: Record<string, string> = {
  FAZER: '#6B7280',
  AJUSTE: '#F59E0B',
  APROVACAO: '#3B82F6',
  AGUARDANDO_APROVACAO: '#6366F1',
  APROVADO: '#10B981',
  ARTE_APROVADA: '#059669',
  PRODUCAO: '#F97316',
  EXPEDICAO: '#8B5CF6',
  FINALIZADO: '#14B8A6',
  ENTREGUE: '#06B6D4',
  FATURADO: '#84CC16',
  ARQUIVADO: '#64748B',
};

// Navigation Items
export const NAVIGATION_ITEMS = [
  { id: 'kanban', label: 'Pipeline Kanban', href: '/', icon: 'Kanban' },
  { id: 'personalizacao', label: 'Personalizacao', href: '/personalization', icon: 'PaintBucket' },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'contatos', label: 'Contatos', href: '/contacts', icon: 'UserCheck' },
  { id: 'tiny', label: 'Integracao Tiny', href: '/tiny', icon: 'ExternalLink' },
];

export const BOTTOM_NAVIGATION_ITEMS = [
  { id: 'configuracoes', label: 'Configuracoes', href: '/settings', icon: 'Cog' },
];

// Estados brasileiros
export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapa' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceara' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espirito Santo' },
  { value: 'GO', label: 'Goias' },
  { value: 'MA', label: 'Maranhao' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Para' },
  { value: 'PB', label: 'Paraiba' },
  { value: 'PR', label: 'Parana' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piaui' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondonia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'Sao Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];
