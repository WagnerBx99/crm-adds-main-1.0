/**
 * Tipos para a integração com a API Tiny
 * Baseado na documentação: https://www.tiny.com.br/ajuda/api/api2-campos-comum-todos-endpoints
 */

// Configuração da API
export interface TinyApiConfig {
  token: string;
  baseUrl: string;
  version?: string; // Opcional, pois a API v2 não usa versão no URL
}

// Resposta padrão da API Tiny
export interface TinyApiResponse {
  retorno: {
    status: string;
    codigo_erro?: string;
    erros?: Array<{
      erro: string;
      codigo: string;
    }>;
  };
}

// Paginação
export interface TinyPagination {
  page: number;
  limit: number;
  total: number;
}

// Resposta com paginação
export interface TinyPaginatedResponse<T> extends TinyApiResponse {
  data: T;
  pagination: TinyPagination;
}

// Cliente/Contato
export interface TinyContact {
  id: number;
  codigo: string;
  nome: string;
  fantasia?: string;
  tipo_pessoa: 'F' | 'J' | 'E';
  cpf_cnpj?: string;
  ie?: string;
  rg?: string;
  im?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
  pais?: string;
  fone?: string;
  celular?: string;
  email?: string;
  email_nfe?: string;
  situacao: 'A' | 'I';
  contribuinte?: 'S' | 'N';
  site?: string;
  obs?: string;
  data_criacao: string;
  data_alteracao: string;
}

// Parâmetros para pesquisa de contatos
export interface TinyContactSearchParams {
  pesquisa?: string;
  situacao?: 'A' | 'I' | 'T';
  data_criacao_inicio?: string;
  data_criacao_fim?: string;
  data_alteracao_inicio?: string;
  data_alteracao_fim?: string;
  pagina?: number;
  registros_por_pagina?: number;
  ordenar_por?: string;
  ordem?: 'ASC' | 'DESC';
}

// Resposta da pesquisa de contatos
export interface TinyContactsResponse {
  contatos: TinyContact[];
}

// Produto
export interface TinyProduct {
  id: number;
  codigo: string;
  nome: string;
  preco: number;
  preco_promocional?: number;
  unidade?: string;
  gtin?: string;
  tipoVariacao?: string;
  localizacao?: string;
  peso_bruto?: number;
  peso_liquido?: number;
  classe_ipi?: string;
  situacao: 'A' | 'I';
  tipo: 'P' | 'S';
  descricao?: string;
  descricao_complementar?: string;
  data_validade?: string;
  imagem?: string;
  estoque?: number;
  data_criacao: string;
  data_alteracao: string;
}

// Parâmetros para pesquisa de produtos
export interface TinyProductSearchParams {
  pesquisa?: string;
  situacao?: 'A' | 'I' | 'T';
  tipo?: 'P' | 'S' | 'T';
  data_criacao_inicio?: string;
  data_criacao_fim?: string;
  data_alteracao_inicio?: string;
  data_alteracao_fim?: string;
  pagina?: number;
  registros_por_pagina?: number;
  ordenar_por?: string;
  ordem?: 'ASC' | 'DESC';
}

// Resposta da pesquisa de produtos
export interface TinyProductsResponse {
  produtos: TinyProduct[];
}

// Pedido
export interface TinyOrder {
  id: number;
  numero: string;
  codigo_pedido_integracao?: string;
  data_pedido: string;
  data_prevista?: string;
  cliente: {
    codigo: string;
    nome: string;
  };
  situacao: string;
  valor_frete?: number;
  valor_desconto?: number;
  outras_despesas?: number;
  valor_total: number;
  forma_pagamento?: string;
  forma_frete?: string;
  observacoes?: string;
  observacoes_internas?: string;
  numero_ordem_compra?: string;
  itens: TinyOrderItem[];
}

// Item do pedido
export interface TinyOrderItem {
  item: {
    codigo: string;
    descricao: string;
    unidade?: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  };
}

// Parâmetros para pesquisa de pedidos
export interface TinyOrderSearchParams {
  pesquisa?: string;
  situacao?: string;
  data_criacao_inicio?: string;
  data_criacao_fim?: string;
  data_alteracao_inicio?: string;
  data_alteracao_fim?: string;
  pagina?: number;
  registros_por_pagina?: number;
  ordenar_por?: string;
  ordem?: 'ASC' | 'DESC';
}

// Resposta da pesquisa de pedidos
export interface TinyOrdersResponse {
  pedidos: TinyOrder[];
}

// Configuração da integração com o Tiny
export interface TinyIntegrationConfig {
  apiToken: string;
  apiUrl: string;
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // em minutos
  syncContacts: boolean;
  syncProducts: boolean;
  syncOrders: boolean;
}

// Estado da integração com o Tiny
export interface TinyIntegrationState {
  connected: boolean;
  lastSync: Date | null;
  lastError: string | null;
  syncInProgress: boolean;
  contactsCount: number;
  productsCount: number;
  ordersCount: number;
}

// Resultado da sincronização
export interface SyncResult {
  success: boolean;
  added: number;
  updated: number;
  failed: number;
  errors: string[];
}

// Resultado do teste de conexão
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
} 