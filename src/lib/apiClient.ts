import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, AxiosHeaders } from 'axios';
import { authService } from './services/authService';
import { csrfProtection } from './csrf';
import { toast } from 'sonner';

// Configurações base para o axios
const apiConfig: AxiosRequestConfig = {
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Classe para gerenciar requisições com interceptores
class ApiClient {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
    config: AxiosRequestConfig;
  }> = [];

  constructor() {
    this.api = axios.create(apiConfig);
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Interceptor de requisição - adiciona token JWT e CSRF
    this.api.interceptors.request.use(
      (config) => {
        // Inicializar headers se necessário
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        
        // Verificar se o usuário está autenticado e adicionar token JWT
        if (authService.isLoggedIn()) {
          const tokens = authService.getTokens();
          if (tokens && tokens.accessToken) {
            config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
          }
        }
        
        // Adicionar token CSRF para métodos que modificam estado (não para GET ou HEAD)
        if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
          const csrfToken = csrfProtection.getToken();
          config.headers.set(csrfProtection.getHeaderName(), csrfToken);
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor de resposta - trata erros de autenticação
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        // Não prosseguir se não houver config ou já estiver tentando novamente
        if (!originalRequest || !originalRequest.headers) {
          return Promise.reject(error);
        }

        // Status 401 - Token expirado ou inválido
        if (error.response?.status === 401 && !originalRequest.headers.get('X-Retry')) {
          if (this.isRefreshing) {
            // Se já estiver atualizando o token, aguardar
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject, config: originalRequest });
            });
          }

          this.isRefreshing = true;
          originalRequest.headers.set('X-Retry', 'true');

          try {
            // Tentar renovar o token
            const refreshed = await authService.refreshToken();

            if (refreshed) {
              // Processar requisições pendentes com o novo token
              this.processQueue(null);

              // Tentar novamente a requisição original
              const tokens = authService.getTokens();
              if (tokens && tokens.accessToken) {
                originalRequest.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
                
                // Adicionar novo token CSRF se necessário
                if (['post', 'put', 'delete', 'patch'].includes(originalRequest.method?.toLowerCase() || '')) {
                  const csrfToken = csrfProtection.getToken();
                  originalRequest.headers.set(csrfProtection.getHeaderName(), csrfToken);
                }
                
                return this.api(originalRequest);
              }
            } else {
              // Se não conseguiu renovar, fazer logout
              this.processQueue(new Error('Falha ao renovar token.'));
              authService.logout();
              toast.error('Sua sessão expirou. Por favor, faça login novamente.');
              window.location.href = '/login';
              return Promise.reject(error);
            }
          } catch (refreshError) {
            this.processQueue(refreshError as Error);
            authService.logout();
            toast.error('Erro de autenticação. Por favor, faça login novamente.');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }
        
        // Status 403 - Acesso negado (permissões insuficientes)
        if (error.response?.status === 403) {
          toast.error('Você não tem permissão para acessar este recurso.');
          // Opcionalmente redirecionar para página de acesso negado
          // window.location.href = '/acesso-negado';
        }
        
        // Erro de CSRF (normalmente retornado como 403, mas com header específico)
        if (error.response?.headers?.['x-csrf-error']) {
          // Gerar novo token para próximas requisições
          csrfProtection.generateToken();
          toast.error('Erro de validação de segurança. Tente novamente.');
        }

        // Outros erros de servidor
        if (error.response?.status && error.response?.status >= 500) {
          toast.error('Erro no servidor. Por favor, tente novamente mais tarde.');
        }

        return Promise.reject(error);
      }
    );
  }

  // Processa a fila de requisições pendentes durante refresh de token
  private processQueue(error: Error | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(null);
      }
    });
    this.failedQueue = [];
  }

  // Métodos públicos para fazer requisições
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }
}

// Exportar instância única
export const apiClient = new ApiClient(); 