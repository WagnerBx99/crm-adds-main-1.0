/**
 * Serviço de API para comunicação com o backend PostgreSQL
 * 
 * Este serviço gerencia todas as requisições HTTP para o backend,
 * incluindo autenticação, tratamento de erros e refresh de token.
 */

// URL base da API - pode ser configurada via variável de ambiente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://31.97.253.85:3001/api';

// Chave para armazenar o token no localStorage
const TOKEN_KEY = 'crm_adds_token';
const USER_KEY = 'crm_adds_user';

/**
 * Interface para resposta de erro da API
 */
interface ApiError {
  error: string;
  message: string;
}

/**
 * Interface para resposta de login
 */
interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    department: string | null;
  };
}

/**
 * Interface para resposta paginada
 */
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Classe principal do serviço de API
 */
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Obtém o token de autenticação armazenado
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Armazena o token de autenticação
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Remove o token de autenticação
   */
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Obtém o usuário armazenado
   */
  getUser(): LoginResponse['user'] | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Armazena o usuário
   */
  setUser(user: LoginResponse['user']): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Constrói os headers para as requisições
   */
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Faz uma requisição HTTP genérica
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(includeAuth),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Se não autorizado, limpar token e redirecionar
      if (response.status === 401) {
        this.removeToken();
        window.location.href = '/login';
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const data = await response.json();

      if (!response.ok) {
        const error = data as ApiError;
        throw new Error(error.message || 'Erro na requisição');
      }

      return data as T;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, paramsOrAuth?: Record<string, string> | boolean, includeAuth: boolean = true): Promise<T> {
    let url = endpoint;
    let auth = includeAuth;
    
    // Se o segundo parâmetro for boolean, é o includeAuth
    if (typeof paramsOrAuth === 'boolean') {
      auth = paramsOrAuth;
    } else if (paramsOrAuth) {
      const searchParams = new URLSearchParams(paramsOrAuth);
      url = `${endpoint}?${searchParams.toString()}`;
    }
    
    return this.request<T>(url, { method: 'GET' }, auth);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ==================== AUTH ====================

  /**
   * Login do usuário
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>(
      '/auth/login',
      { email, password },
      false
    );
    
    this.setToken(response.token);
    this.setUser(response.user);
    
    return response;
  }

  /**
   * Logout do usuário
   */
  async logout(): Promise<void> {
    try {
      await this.post('/auth/logout');
    } catch {
      // Ignora erros no logout
    } finally {
      this.removeToken();
    }
  }

  /**
   * Obtém dados do usuário autenticado
   */
  async getMe(): Promise<LoginResponse['user']> {
    return this.get<LoginResponse['user']>('/auth/me');
  }

  /**
   * Altera a senha do usuário
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.put('/auth/password', { currentPassword, newPassword });
  }

  // ==================== USERS ====================

  /**
   * Lista usuários
   */
  async getUsers(params?: { role?: string; active?: string; search?: string }): Promise<PaginatedResponse<any>> {
    return this.get('/users', params as Record<string, string>);
  }

  /**
   * Obtém um usuário por ID
   */
  async getUser(id: string): Promise<any> {
    return this.get(`/users/${id}`);
  }

  /**
   * Atualiza um usuário
   */
  async updateUser(id: string, data: any): Promise<any> {
    return this.put(`/users/${id}`, data);
  }

  /**
   * Desativa um usuário
   */
  async deleteUser(id: string): Promise<{ message: string }> {
    return this.delete(`/users/${id}`);
  }

  // ==================== CUSTOMERS ====================

  /**
   * Lista clientes
   */
  async getCustomers(params?: { search?: string; personType?: string; page?: string; limit?: string }): Promise<PaginatedResponse<any>> {
    return this.get('/customers', params as Record<string, string>);
  }

  /**
   * Obtém um cliente por ID
   */
  async getCustomer(id: string): Promise<any> {
    return this.get(`/customers/${id}`);
  }

  /**
   * Cria um cliente
   */
  async createCustomer(data: any): Promise<any> {
    return this.post('/customers', data);
  }

  /**
   * Atualiza um cliente
   */
  async updateCustomer(id: string, data: any): Promise<any> {
    return this.put(`/customers/${id}`, data);
  }

  /**
   * Exclui um cliente
   */
  async deleteCustomer(id: string): Promise<{ message: string }> {
    return this.delete(`/customers/${id}`);
  }

  // ==================== ORDERS ====================

  /**
   * Lista pedidos
   */
  async getOrders(params?: { status?: string; customerId?: string; assignedToId?: string; search?: string; page?: string; limit?: string }): Promise<PaginatedResponse<any>> {
    return this.get('/orders', params as Record<string, string>);
  }

  /**
   * Obtém pedidos para o Kanban
   */
  async getOrdersKanban(): Promise<any[]> {
    return this.get('/orders/kanban');
  }

  /**
   * Obtém um pedido por ID
   */
  async getOrder(id: string): Promise<any> {
    return this.get(`/orders/${id}`);
  }

  /**
   * Cria um pedido
   */
  async createOrder(data: any): Promise<any> {
    return this.post('/orders', data);
  }

  /**
   * Atualiza um pedido
   */
  async updateOrder(id: string, data: any): Promise<any> {
    return this.put(`/orders/${id}`, data);
  }

  /**
   * Atualiza o status de um pedido
   */
  async updateOrderStatus(id: string, status: string, comment?: string): Promise<any> {
    return this.patch(`/orders/${id}/status`, { status, comment });
  }

  /**
   * Exclui um pedido
   */
  async deleteOrder(id: string): Promise<{ message: string }> {
    return this.delete(`/orders/${id}`);
  }

  /**
   * Adiciona comentário a um pedido
   */
  async addOrderComment(id: string, comment: string): Promise<any> {
    return this.post(`/orders/${id}/comments`, { comment });
  }

  // ==================== PRODUCTS ====================

  /**
   * Lista produtos
   */
  async getProducts(params?: { search?: string; active?: string; page?: string; limit?: string }): Promise<PaginatedResponse<any>> {
    return this.get('/products', params as Record<string, string>);
  }

  /**
   * Obtém um produto por ID
   */
  async getProduct(id: string): Promise<any> {
    return this.get(`/products/${id}`);
  }

  /**
   * Cria um produto
   */
  async createProduct(data: any): Promise<any> {
    return this.post('/products', data);
  }

  /**
   * Atualiza um produto
   */
  async updateProduct(id: string, data: any): Promise<any> {
    return this.put(`/products/${id}`, data);
  }

  /**
   * Desativa um produto
   */
  async deleteProduct(id: string): Promise<{ message: string }> {
    return this.delete(`/products/${id}`);
  }

  // ==================== LABELS ====================

  /**
   * Lista etiquetas
   */
  async getLabels(params?: { active?: string }): Promise<any[]> {
    return this.get('/labels', params as Record<string, string>);
  }

  /**
   * Cria uma etiqueta
   */
  async createLabel(data: { name: string; color: string; description?: string }): Promise<any> {
    return this.post('/labels', data);
  }

  /**
   * Atualiza uma etiqueta
   */
  async updateLabel(id: string, data: any): Promise<any> {
    return this.put(`/labels/${id}`, data);
  }

  /**
   * Desativa uma etiqueta
   */
  async deleteLabel(id: string): Promise<{ message: string }> {
    return this.delete(`/labels/${id}`);
  }

  // ==================== PUBLIC QUOTES ====================

  /**
   * Lista orçamentos públicos
   */
  async getPublicQuotes(params?: { status?: string; search?: string; page?: string; limit?: string }): Promise<PaginatedResponse<any>> {
    return this.get('/public-quotes', params as Record<string, string>);
  }

  /**
   * Cria um orçamento público (não requer auth)
   */
  async createPublicQuote(data: any): Promise<any> {
    return this.post('/public-quotes', data, false);
  }

  /**
   * Converte orçamento em pedido
   */
  async convertQuoteToOrder(id: string): Promise<{ quote: any; order: any }> {
    return this.post(`/public-quotes/${id}/convert`);
  }

  // ==================== TINY INTEGRATION ====================

  /**
   * Obtém configuração da integração Tiny
   */
  async getTinyConfig(): Promise<any> {
    return this.get('/tiny/config');
  }

  /**
   * Atualiza configuração da integração Tiny
   */
  async updateTinyConfig(data: { apiToken?: string; config?: any }): Promise<any> {
    return this.put('/tiny/config', data);
  }

  /**
   * Obtém contas a pagar da Tiny
   */
  async getTinyContasPagar(params?: { situacao?: string; dataInicial?: string; dataFinal?: string }): Promise<any> {
    return this.get('/tiny/contas-pagar', params as Record<string, string>);
  }

  /**
   * Obtém contas a receber da Tiny
   */
  async getTinyContasReceber(params?: { situacao?: string; dataInicial?: string; dataFinal?: string }): Promise<any> {
    return this.get('/tiny/contas-receber', params as Record<string, string>);
  }

  /**
   * Obtém resumo financeiro da Tiny
   */
  async getTinyResumoFinanceiro(): Promise<any> {
    return this.get('/tiny/resumo-financeiro');
  }

  /**
   * Sincroniza produtos da Tiny
   */
  async syncTinyProdutos(): Promise<{ success: boolean; total: number; created: number; updated: number }> {
    return this.post('/tiny/sync/produtos');
  }

  /**
   * Sincroniza contatos da Tiny
   */
  async syncTinyContatos(): Promise<{ success: boolean; total: number; created: number; updated: number }> {
    return this.post('/tiny/sync/contatos');
  }

  // ==================== AUDIT LOGS ====================

  /**
   * Lista logs de auditoria
   */
  async getAuditLogs(params?: { action?: string; entityType?: string; userId?: string; startDate?: string; endDate?: string; page?: string; limit?: string }): Promise<PaginatedResponse<any>> {
    return this.get('/audit-logs', params as Record<string, string>);
  }

  /**
   * Obtém estatísticas de auditoria
   */
  async getAuditStats(days?: number): Promise<any> {
    return this.get('/audit-logs/stats', days ? { days: String(days) } : undefined);
  }

  // ==================== CONFIG ====================

  /**
   * Obtém todas as configurações
   */
  async getConfig(): Promise<Record<string, any>> {
    return this.get('/config');
  }

  /**
   * Obtém uma configuração específica
   */
  async getConfigValue(key: string): Promise<any> {
    return this.get(`/config/${key}`);
  }

  /**
   * Atualiza uma configuração
   */
  async setConfigValue(key: string, value: any): Promise<any> {
    return this.put(`/config/${key}`, { value });
  }

  /**
   * Atualiza múltiplas configurações
   */
  async setConfigBulk(configs: Record<string, any>): Promise<any[]> {
    return this.post('/config/bulk', { configs });
  }
}

// Exporta uma instância singleton do serviço
export const apiService = new ApiService();

// Exporta a classe para casos onde seja necessário criar instâncias customizadas
export default ApiService;
