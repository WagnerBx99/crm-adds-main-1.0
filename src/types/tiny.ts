/**
 * Tipos para integração com o Tiny ERP
 */

/**
 * Configuração da API do Tiny
 */
export interface TinyApiConfig {
  token: string;
  baseUrl?: string;
  apiV3Url?: string;
  clientId?: string;
  clientSecret?: string;
  useOAuth?: boolean;
  cache?: boolean;
  cacheExpiration?: number;
  timeout?: number;
}

/**
 * Resposta padrão da API do Tiny
 */
export interface TinyApiResponse<T = any> {
  status: string;
  erro?: string;
  retorno: {
    status: string;
    erros?: Array<{ erro: string }>;
  } & T;
}

/**
 * Resposta de paginação da API
 */
export interface PaginacaoResponse {
  pagina_atual: number;
  numero_paginas: number;
  total_registros: number;
}

/**
 * Enum de status de pedido
 */
export enum StatusPedido {
  PENDENTE = "pendente",
  APROVADO = "aprovado",
  EM_PRODUCAO = "em_producao",
  PRONTO_PARA_ENVIO = "pronto_para_envio",
  ENVIADO = "enviado",
  ENTREGUE = "entregue",
  FINALIZADO = "finalizado",
  CANCELADO = "cancelado"
}

/**
 * Interface para endereço
 */
export interface Endereco {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
}

/**
 * Interface para cliente
 */
export interface Cliente {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  cpf_cnpj: string;
  email: string;
  fone: string;
  celular: string;
  data_cadastro: string;
  data_alteracao: string;
  situacao: string;
  observacao: string;
  endereco: Endereco;
}

/**
 * Interface para filtros de cliente
 */
export interface FiltroCliente {
  id?: string;
  nome?: string;
  cpf_cnpj?: string;
  email?: string;
  situacao?: string;
  pagina?: number;
  registros_por_pagina?: number;
}

/**
 * Interface para criação/atualização de cliente
 */
export interface ClienteDTO {
  nome: string;
  tipo_pessoa?: string;
  cpf_cnpj?: string;
  ie?: string;
  rg?: string;
  email?: string;
  fone?: string;
  celular?: string;
  endereco?: Partial<Endereco>;
  situacao?: string;
  observacao?: string;
}

/**
 * Interface para filtros de pedido
 */
export interface FiltroPedido {
  id?: string;
  numero?: string;
  cliente_id?: string;
  cliente_nome?: string;
  data_inicial?: string;
  data_final?: string;
  situacao?: string;
  pagina?: number;
  registros_por_pagina?: number;
}

/**
 * Interface para cliente do pedido (resumido)
 */
export interface ClientePedido {
  id: string;
  nome: string;
  cpf_cnpj: string;
}

/**
 * Interface para pedido na listagem
 */
export interface Pedido {
  id: string;
  numero: string;
  numero_ecommerce?: string;
  data_pedido: string;
  data_criacao?: string;
  data_modificacao?: string;
  valor_total: number;
  valor_frete?: number;
  valor_desconto?: number;
  situacao: string;
  cliente: ClientePedido;
  itens?: any[];
  forma_pagamento?: string;
  forma_frete?: string;
  observacoes?: string;
}

/**
 * Tipo que representa um pedido detalhado retornado pela API do Tiny
 */
export interface PedidoDetalhado {
  id: string;
  numero: string;
  numero_ecommerce: string;
  data_pedido: string;
  data_criacao: string;
  ultima_atualizacao: string;
  nome_cliente: string;
  cpf_cnpj_cliente: string;
  valor_produtos: number;
  valor_frete: number;
  valor_desconto: number;
  valor_total: number;
  situacao: string;
  forma_pagamento: string;
  forma_frete: string;
  observacoes: string;
  itens: ItemPedido[];
}

/**
 * Tipo que representa um item do pedido
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
 * Interface para produto
 */
export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  preco: number;
  preco_promocional?: number;
  unidade: string;
  gtin?: string;
  estoque: number;
  situacao: string;
}

/**
 * Interface para filtros de notas fiscais
 */
export interface FiltroNotaFiscal {
  tipoNota?: 'E' | 'S'; // E=Entrada, S=Saída
  numero?: string;
  cliente?: string;
  cpf_cnpj?: string;
  dataInicial?: string; // formato dd/mm/yyyy
  dataFinal?: string; // formato dd/mm/yyyy
  situacao?: string;
  numeroEcommerce?: string;
  idVendedor?: number;
  idFormaEnvio?: number;
  nomeVendedor?: string;
  pagina?: number;
}

/**
 * Interface para endereço de entrega da nota fiscal
 */
export interface EnderecoEntregaNF {
  tipo_pessoa: string;
  cpf_cnpj: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  fone: string;
  nome_destinatario: string;
}

/**
 * Interface para transportador da nota fiscal
 */
export interface TransportadorNF {
  nome: string;
}

/**
 * Interface para nota fiscal
 */
export interface NotaFiscal {
  id: string;
  tipo: 'E' | 'S'; // E=Entrada, S=Saída
  numero: string;
  serie: string;
  data_emissao: string;
  data_saida_entrada: string;
  numero_ecommerce?: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_tipo_pessoa: string;
  cliente_cpf_cnpj: string;
  cliente_endereco: string;
  cliente_numero: string;
  cliente_complemento: string;
  cliente_bairro: string;
  cliente_cep: string;
  cliente_cidade: string;
  cliente_uf: string;
  cliente_fone: string;
  cliente_email: string;
  endereco_entrega?: EnderecoEntregaNF;
  transportador?: TransportadorNF;
  valor: number;
  valor_produtos: number;
  valor_frete: number;
  id_vendedor?: number;
  nome_vendedor?: string;
  situacao: number;
  descricao_situacao: string;
  chave_acesso?: string;
  id_forma_frete?: string;
  id_forma_envio?: string;
  codigo_rastreamento?: string;
  url_rastreamento?: string;
}

/**
 * Interface para resposta de pesquisa de notas fiscais
 */
export interface RespostaNotasFiscais {
  status: string;
  status_processamento: number;
  codigo_erro?: number;
  erros?: Array<{ erro: string }>;
  pagina: number;
  numero_paginas: number;
  notas_fiscais?: Array<{ nota_fiscal: NotaFiscal }>;
} 

/**
 * Enum de situação de conta financeira
 */
export enum SituacaoConta {
  ABERTO = "aberto",
  PAGO = "pago",
  PARCIAL = "parcial",
  CANCELADO = "cancelado",
  VENCIDO = "vencido"
}

/**
 * Interface para filtros de contas a pagar
 */
export interface FiltroContaPagar {
  dataInicial?: string;
  dataFinal?: string;
  dataVencimentoInicial?: string;
  dataVencimentoFinal?: string;
  situacao?: SituacaoConta | string;
  fornecedor?: string;
  numero?: string;
  pagina?: number;
}

/**
 * Interface para filtros de contas a receber
 */
export interface FiltroContaReceber {
  dataInicial?: string;
  dataFinal?: string;
  dataVencimentoInicial?: string;
  dataVencimentoFinal?: string;
  situacao?: SituacaoConta | string;
  cliente?: string;
  numero?: string;
  pagina?: number;
}

/**
 * Interface para conta a pagar
 */
export interface ContaPagar {
  id: string;
  numero_documento: string;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento?: string;
  valor: number;
  valor_pago: number;
  saldo: number;
  situacao: string;
  fornecedor: {
    id: string;
    nome: string;
    cpf_cnpj?: string;
  };
  categoria?: string;
  conta_bancaria?: string;
  forma_pagamento?: string;
  observacoes?: string;
  historico?: string;
}

/**
 * Interface para conta a receber
 */
export interface ContaReceber {
  id: string;
  numero_documento: string;
  data_emissao: string;
  data_vencimento: string;
  data_recebimento?: string;
  valor: number;
  valor_recebido: number;
  saldo: number;
  situacao: string;
  cliente: {
    id: string;
    nome: string;
    cpf_cnpj?: string;
  };
  categoria?: string;
  conta_bancaria?: string;
  forma_recebimento?: string;
  observacoes?: string;
  historico?: string;
  numero_pedido?: string;
  numero_nf?: string;
}

/**
 * Interface para resumo financeiro
 */
export interface ResumoFinanceiro {
  periodo: {
    inicio: string;
    fim: string;
  };
  contas_pagar: {
    total: number;
    pago: number;
    pendente: number;
    vencido: number;
    quantidade: number;
  };
  contas_receber: {
    total: number;
    recebido: number;
    pendente: number;
    vencido: number;
    quantidade: number;
  };
  saldo: number;
  fluxo_caixa: {
    entradas: number;
    saidas: number;
    saldo: number;
  };
}

/**
 * Interface para lançamento financeiro genérico
 */
export interface LancamentoFinanceiro {
  id: string;
  tipo: 'pagar' | 'receber';
  numero_documento: string;
  data_emissao: string;
  data_vencimento: string;
  data_baixa?: string;
  valor: number;
  valor_baixa: number;
  saldo: number;
  situacao: string;
  entidade: {
    id: string;
    nome: string;
    cpf_cnpj?: string;
  };
  categoria?: string;
  observacoes?: string;
}
