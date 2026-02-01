import axios from 'axios';
import { TINY_CONFIG } from '@/config';

// Interfaces para a API do Tiny
export interface TinyApiConfig {
  token: string;
  baseUrl: string;
  version?: string;
}

export interface TinyContactSearchParams {
  pesquisa?: string;
  situacao?: 'A' | 'I' | 'E' | 'S'; // A = Ativo, I = Inativo, E = Excluído, S = Sem Movimento
  pagina?: number;
  registros_por_pagina?: number;
}

export interface TinyContact {
  id: string;
  codigo: string;
  nome: string;
  fantasia?: string;
  tipo_pessoa: string;
  cpf_cnpj: string;
  ie?: string;
  rg?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
  email?: string;
  email_nfe?: string;
  fone?: string;
  celular?: string;
  data_nascimento?: string;
  data_cadastro?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  situacao: string;
  obs?: string;
  limite_credito?: string;
}

export interface TinyContactsResponse {
  contatos: TinyContact[];
  pagina: number;
  numero_paginas: number;
  registros: number;
}

export interface TinyProductSearchParams {
  pesquisa?: string;
  situacao?: 'A' | 'I'; // A = Ativo, I = Inativo
  pagina?: number;
  registros_por_pagina?: number;
}

export interface TinyProduct {
  id: string;
  codigo: string;
  nome: string;
  preco: string;
  preco_promocional: string;
  unidade: string;
  gtin: string;
  ncm: string;
  estoque: string;
  situacao: string;
}

export interface TinyProductsResponse {
  produtos: TinyProduct[];
  pagina: number;
  numero_paginas: number;
  registros: number;
}

export interface TinyOrderSearchParams {
  pesquisa?: string;
  situacao?: string;
  data_inicio?: string;
  data_fim?: string;
  pagina?: number;
  registros_por_pagina?: number;
}

export interface TinyOrder {
  id: string;
  numero: string;
  numero_ecommerce?: string;
  data_pedido: string;
  data_prevista?: string;
  cliente: {
    id: string;
    nome: string;
    tipo_pessoa: string;
    cpf_cnpj: string;
  };
  situacao: string;
  valor: string;
  itens?: Array<{
    id: string;
    codigo: string;
    descricao: string;
    unidade: string;
    quantidade: string;
    valor_unitario: string;
  }>;
}

export interface TinyOrdersResponse {
  pedidos: TinyOrder[];
  pagina: number;
  numero_paginas: number;
  registros: number;
}

export interface TinyContactCreate {
  nome: string;
  tipo_pessoa: 'F' | 'J' | 'E'; // F = Física, J = Jurídica, E = Estrangeiro
  cpf_cnpj?: string;
  ie?: string;
  rg?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
  email?: string;
  fone?: string;
  celular?: string;
  obs?: string;
  limiteCredito?: number;
}

export interface TinyOrderCreate {
  numero?: string;
  data_pedido?: string;
  id_cliente: string;
  nome_cliente?: string;
  id_vendedor?: string;
  id_forma_pagamento?: string;
  valor_frete?: number;
  valor_desconto?: number;
  outras_despesas?: number;
  obs?: string;
  situacao?: string;
  itens: Array<{
    id_produto?: string;
    codigo?: string;
    descricao: string;
    unidade?: string;
    quantidade: number;
    valor_unitario: number;
  }>;
}

/**
 * Cliente para a API do Tiny ERP
 */
export class TinyApiClient {
  private token: string;
  private baseUrl: string;

  constructor(options: { token: string; baseUrl: string }) {
    this.token = options.token;
    this.baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl : `${options.baseUrl}/`;
    console.log(`[TinyAPI] Inicializando cliente com URL base: ${this.baseUrl}`);
  }

  /**
   * Realiza uma requisição GET para a API do Tiny
   * Usa proxy local para evitar CORS
   */
  async get<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`[TinyAPI] Requisição para: ${endpoint} com params:`, params);
      
      // Nao envia token/formato pois o proxy ja adiciona
      const response = await axios.get(url, {
        params: {
          ...params,
        },
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`[TinyAPI] Resposta com status: ${response.status}`);
      
      if (response.data && response.data.retorno) {
        if (response.data.retorno.status === 'OK') {
          return response.data.retorno as T;
        } else {
          throw new Error(
            response.data.retorno.erros?.[0]?.erro || 
            response.data.retorno.erro || 
            'Erro desconhecido na API Tiny'
          );
        }
      } else {
        console.error('[TinyAPI] Formato de resposta inválido:', response.data);
        throw new Error('Formato de resposta inválido da API Tiny');
      }
    } catch (error) {
      console.error('[TinyAPI] Erro na requisição GET:', error);
      
      if (axios.isAxiosError(error)) {
        // Verifica se é um erro de CORS
        if (error.message.includes('Network Error') || !error.response) {
          console.error('[TinyAPI] Possível erro de CORS ou problemas de conectividade');
          throw new Error('Erro de conexão: verifique se o proxy está configurado corretamente ou se há bloqueio CORS');
        }
        
        console.error('[TinyAPI] Status:', error.response?.status);
        console.error('[TinyAPI] Dados:', error.response?.data);
        
        throw new Error(`Erro na requisição: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Realiza uma requisição POST para a API do Tiny
   * Usa proxy local para evitar CORS
   */
  async post<T>(endpoint: string, data: Record<string, any> = {}): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`[TinyAPI] Requisição POST para: ${endpoint}`);
      
      // Preparar dados para formato aplicavel a API Tiny
      // Nao envia token/formato pois o proxy ja adiciona
      const formData = new URLSearchParams();
      
      for (const [key, value] of Object.entries(data)) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
      
      console.log(`[TinyAPI] Dados do formulário:`, Object.fromEntries(formData));
      
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      console.log(`[TinyAPI] Resposta com status: ${response.status}`);
      
      if (response.data && response.data.retorno) {
        if (response.data.retorno.status === 'OK') {
          return response.data.retorno as T;
        } else {
          throw new Error(
            response.data.retorno.erros?.[0]?.erro || 
            response.data.retorno.erro || 
            'Erro desconhecido na API Tiny'
          );
        }
      } else {
        console.error('[TinyAPI] Formato de resposta inválido:', response.data);
        throw new Error('Formato de resposta inválido da API Tiny');
      }
    } catch (error) {
      console.error('[TinyAPI] Erro na requisição POST:', error);
      
      if (axios.isAxiosError(error)) {
        // Verifica se é um erro de CORS
        if (error.message.includes('Network Error') || !error.response) {
          console.error('[TinyAPI] Possível erro de CORS ou problemas de conectividade');
          throw new Error('Erro de conexão: verifique se o proxy está configurado corretamente ou se há bloqueio CORS');
        }
        
        console.error('[TinyAPI] Status:', error.response?.status);
        console.error('[TinyAPI] Dados:', error.response?.data);
        
        throw new Error(`Erro na requisição: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Testa a conexão com a API do Tiny
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[TinyAPI] Testando conexão...');
      const response = await this.get('contatos.pesquisa.php', { pesquisa: '', registros_por_pagina: 1 });
      console.log('[TinyAPI] Conexão bem-sucedida!');
      return true;
    } catch (error) {
      console.error('[TinyAPI] Erro ao testar conexão:', error);
      return false;
    }
  }

  /**
   * Busca contatos na API do Tiny
   */
  async searchContacts(params: TinyContactSearchParams = {}): Promise<TinyContactsResponse> {
    return this.get<TinyContactsResponse>('contatos.pesquisa.php', params);
  }

  /**
   * Obtém um contato específico da API do Tiny
   */
  async getContact(id: number): Promise<{ contato: TinyContact }> {
    return this.get<{ contato: TinyContact }>('contato.obter.php', { id });
  }

  /**
   * Cria um novo contato na API do Tiny
   */
  async createContact(contact: TinyContactCreate): Promise<{ id: number }> {
    const contactData = { contato: contact };
    return this.post<{ id: number }>('contato.incluir.php', contactData);
  }

  /**
   * Busca produtos na API do Tiny
   */
  async searchProducts(params: TinyProductSearchParams = {}): Promise<TinyProductsResponse> {
    return this.get<TinyProductsResponse>('produtos.pesquisa.php', params);
  }

  /**
   * Obtém um produto específico da API do Tiny
   */
  async getProduct(id: number): Promise<{ produto: TinyProduct }> {
    return this.get<{ produto: TinyProduct }>('produto.obter.php', { id });
  }

  /**
   * Busca pedidos na API do Tiny
   */
  async searchOrders(params: TinyOrderSearchParams = {}): Promise<TinyOrdersResponse> {
    return this.get<TinyOrdersResponse>('pedidos.pesquisa.php', params);
  }

  /**
   * Obtém um pedido específico da API do Tiny
   */
  async getOrder(id: number): Promise<{ pedido: TinyOrder }> {
    return this.get<{ pedido: TinyOrder }>('pedido.obter.php', { id });
  }

  /**
   * Cria um novo pedido na API do Tiny
   */
  async createOrder(order: TinyOrderCreate): Promise<{ id: number; numero: string }> {
    const orderData = { pedido: order };
    return this.post<{ id: number; numero: string }>('pedido.incluir.php', orderData);
  }
}

/**
 * Instância padrão do cliente da API Tiny
 */
export const tinyApiClient = new TinyApiClient({
  token: TINY_CONFIG.API_TOKEN,
  baseUrl: TINY_CONFIG.API_BASE_URL,
}); 
