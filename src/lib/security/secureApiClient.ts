import { csrfProtection } from '@/lib/csrf';
import { authService } from '@/lib/services/authService';

interface ApiOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  mode?: RequestMode;
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}

/**
 * Cliente HTTP seguro para realizar requisições com proteções de segurança
 */
export class SecureApiClient {
  private baseUrl: string;
  private defaultOptions: RequestInit;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  
  constructor(options: ApiOptions = {}) {
    this.baseUrl = options.baseUrl || '';
    this.timeout = options.timeout || 30000; // 30 segundos
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };
    this.defaultOptions = {
      credentials: options.credentials || 'same-origin',
      mode: options.mode || 'cors',
    };
  }
  
  /**
   * Realizar requisição GET
   * @param url URL da requisição
   * @param options Opções adicionais
   */
  public async get<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      method: 'GET',
      ...options
    });
  }
  
  /**
   * Realizar requisição POST
   * @param url URL da requisição
   * @param data Dados a serem enviados
   * @param options Opções adicionais
   */
  public async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data,
      ...options
    });
  }
  
  /**
   * Realizar requisição PUT
   * @param url URL da requisição
   * @param data Dados a serem enviados
   * @param options Opções adicionais
   */
  public async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data,
      ...options
    });
  }
  
  /**
   * Realizar requisição DELETE
   * @param url URL da requisição
   * @param options Opções adicionais
   */
  public async delete<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      method: 'DELETE',
      ...options
    });
  }
  
  /**
   * Método principal para realizar requisições
   * @param url URL da requisição
   * @param options Opções da requisição
   */
  private async request<T = any>(url: string, options: RequestOptions): Promise<T> {
    // Configurar URL completa
    const fullUrl = this.baseUrl ? `${this.baseUrl}${url}` : url;
    
    // Adicionar token de autenticação se o usuário estiver logado
    const headers = { ...this.defaultHeaders };
    
    if (authService.isLoggedIn()) {
      const tokens = authService.getTokens();
      if (tokens?.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`;
      }
    }
    
    // Adicionar token CSRF para métodos não GET
    if (options.method !== 'GET') {
      headers[csrfProtection.getHeaderName()] = csrfProtection.getToken();
    }
    
    // Mesclar headers
    const allHeaders = {
      ...headers,
      ...options.headers
    };
    
    // Preparar corpo da requisição
    let body: string | undefined;
    if (options.body && typeof options.body !== 'string') {
      body = JSON.stringify(options.body);
    } else {
      body = options.body;
    }
    
    // Criar controller para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    // Combinar signal do usuário com o do timeout
    const signal = options.signal
      ? this.combineSignals(options.signal, controller.signal)
      : controller.signal;
    
    try {
      const response = await fetch(fullUrl, {
        method: options.method || 'GET',
        headers: allHeaders,
        body,
        signal,
        ...this.defaultOptions
      });
      
      // Limpar timeout
      clearTimeout(timeoutId);
      
      // Verificar se a resposta é OK (status 2xx)
      if (!response.ok) {
        // Se o token expirou (401), tentar refresh
        if (response.status === 401 && authService.isLoggedIn()) {
          const refreshed = authService.refreshToken();
          if (refreshed) {
            // Tentar novamente com o novo token
            return this.request<T>(url, options);
          }
        }
        
        throw await this.handleErrorResponse(response);
      }
      
      // Verificar type de conteúdo
      const contentType = response.headers.get('content-type');
      
      // Processar resposta baseado no content-type
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Para outros tipos, retornar a resposta direta
        return response as any;
      }
    } catch (error) {
      // Limpar timeout se ocorrer erro
      clearTimeout(timeoutId);
      
      // Re-lançar AbortError para facilitar detecção de timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Requisição cancelada por timeout');
      }
      
      throw error;
    }
  }
  
  /**
   * Processar respostas de erro
   * @param response Resposta da requisição
   */
  private async handleErrorResponse(response: Response): Promise<Error> {
    let errorData: any;
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = await response.text();
      }
    } catch (e) {
      errorData = { message: 'Erro desconhecido' };
    }
    
    const error = new Error(
      typeof errorData === 'string' 
        ? errorData 
        : errorData.message || `Erro ${response.status}: ${response.statusText}`
    );
    
    (error as any).status = response.status;
    (error as any).statusText = response.statusText;
    (error as any).data = errorData;
    
    return error;
  }
  
  /**
   * Combinar múltiplos signals em um único
   * @param signals Signals a serem combinados
   */
  private combineSignals(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    
    const onAbort = () => {
      controller.abort();
      signals.forEach(signal => {
        signal.removeEventListener('abort', onAbort);
      });
    };
    
    signals.forEach(signal => {
      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener('abort', onAbort);
      }
    });
    
    return controller.signal;
  }
}

// Cliente API padrão
export const secureApi = new SecureApiClient({
  baseUrl: '/api'
}); 