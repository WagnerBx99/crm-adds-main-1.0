/**
 * Tipos para integração com a API Tiny v3.0
 */

/**
 * Interface para cliente do Tiny
 */
export interface Cliente {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'F' | 'J';
  cpf_cnpj: string;
  email: string;
  fone: string;
  celular?: string;
  data_cadastro: string;
  data_alteracao: string;
  observacao?: string;
  situacao: 'A' | 'I'; // A = Ativo, I = Inativo
  endereco: Endereco;
}

/**
 * Interface para endereço
 */
export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  pais?: string;
}

/**
 * Interface para filtros de busca de clientes
 */
export interface FiltroCliente {
  id?: string;
  cpf_cnpj?: string;
  nome?: string;
  email?: string;
  situacao?: 'A' | 'I';
  pagina?: number;
  registros_por_pagina?: number;
}

/**
 * Interface para criar/atualizar cliente
 */
export interface ClienteDTO {
  nome: string;
  tipo: 'F' | 'J';
  cpf_cnpj: string;
  email: string;
  fone: string;
  celular?: string;
  observacao?: string;
  situacao?: 'A' | 'I';
  endereco: Endereco;
}

/**
 * Tipos de status de pedido
 */
export enum StatusPedido {
  PENDENTE = 'pendente',
  APROVADO = 'aprovado',
  CANCELADO = 'cancelado',
  EM_PRODUCAO = 'em_producao',
  PRONTO_PARA_ENVIO = 'pronto_para_envio',
  ENVIADO = 'enviado',
  ENTREGUE = 'entregue',
  FINALIZADO = 'finalizado'
}

/**
 * Interface para item de pedido
 */
export interface ItemPedido {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

/**
 * Interface para pedido
 */
export interface Pedido {
  id: string;
  numero: string;
  numero_ecommerce?: string;
  data_pedido: string;
  data_criacao: string;
  data_modificacao: string;
  cliente: {
    id: string;
    nome: string;
    cpf_cnpj: string;
  };
  situacao: StatusPedido;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  itens: ItemPedido[];
  forma_pagamento?: string;
  forma_frete?: string;
  observacoes?: string;
}

/**
 * Interface para filtros de busca de pedidos
 */
export interface FiltroPedido {
  id?: string;
  numero?: string;
  cliente_id?: string;
  cliente_nome?: string;
  data_inicial?: string;
  data_final?: string;
  situacao?: StatusPedido;
  pagina?: number;
  registros_por_pagina?: number;
}

/**
 * Interface para resposta da API do Tiny
 */
export interface TinyApiResponse<T> {
  status: string;
  codigo_erro?: string;
  erro?: string;
  retorno: T;
}

/**
 * Interface para estrutura de paginação
 */
export interface PaginacaoResponse<T> {
  pagina_atual: number;
  total_de_paginas: number;
  total_de_registros: number;
  registros: T[];
}

/**
 * Interface para produto
 */
export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  preco: number;
  preco_promocional?: number;
  unidade: string;
  estoque: number;
  ncm?: string;
  origem?: string;
  gtin?: string;
  descricao?: string;
  situacao: 'A' | 'I'; // A = Ativo, I = Inativo
  marca?: string;
  categoria?: string;
  data_cadastro?: string;
  data_alteracao?: string;
}

/**
 * Interface para configuração da API Tiny
 */
export interface TinyApiConfig {
  token: string;  // Token para API v2 (mantido para retrocompatibilidade)
  clientId?: string; // Client ID para OAuth2 (API v3)
  clientSecret?: string; // Client Secret para OAuth2 (API v3)
  baseUrl?: string; // URL base para API v2
  apiV3Url?: string; // URL base para API v3
  timeout?: number;
  cache?: boolean;
  cacheExpiration?: number;
  useOAuth?: boolean; // Determina se deve usar OAuth2 (API v3) ou token (API v2)
}

/**
 * Interface para pedido detalhado 
 */
export interface PedidoDetalhado {
  id: string;
  numero: string;
  numero_ecommerce?: string;
  data_pedido: string;
  data_criacao: string;
  ultima_atualizacao: string;
  nome_cliente: string;
  cpf_cnpj_cliente?: string;
  valor_produtos: number;
  valor_frete: number;
  valor_desconto: number;
  valor_total: number;
  situacao: string;
  forma_pagamento?: string;
  forma_frete?: string;
  observacoes?: string;
  itens: ItemPedido[];
} 