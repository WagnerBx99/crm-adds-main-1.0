import axios from 'axios';
import { TinyApiConfig } from '../../../types/tiny';
import { CacheService } from './CacheService';

/**
 * Resposta do token OAuth 2.0
 */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope?: string;
}

/**
 * Serviço para gerenciar autenticação OAuth 2.0 com a API Tiny 3.0
 */
export class TinyAuthService {
  private config: TinyApiConfig;
  private cacheKeyPrefix = 'tiny_oauth_';
  
  constructor(config: TinyApiConfig) {
    this.config = config;
  }
  
  /**
   * Obtém um token de acesso, seja do cache ou gerando um novo
   * @returns Token de acesso para a API Tiny 3.0
   */
  async getAccessToken(): Promise<string> {
    const cacheKey = `${this.cacheKeyPrefix}access_token`;
    
    // Verifica se há um token válido em cache
    if (this.config.cache) {
      const cachedToken = CacheService.getItem<string>(cacheKey);
      if (cachedToken) {
        return cachedToken;
      }
    }
    
    // Não há token em cache, precisamos obter um novo
    try {
      // Na implementação real, aqui usaríamos o refresh token para obter um novo access token
      // Como não temos um fluxo web OAuth neste caso, usaremos client credentials
      const tokenResponse = await this.getClientCredentialsToken();
      
      // Armazena o token em cache
      if (this.config.cache) {
        const expirationTime = (tokenResponse.expires_in - 300) * 1000; // Expira 5 minutos antes para dar uma margem
        CacheService.setItem(cacheKey, tokenResponse.access_token, expirationTime);
        
        // Armazena também o refresh token
        CacheService.setItem(
          `${this.cacheKeyPrefix}refresh_token`,
          tokenResponse.refresh_token,
          this.config.cacheExpiration || 30 * 24 * 60 * 60 * 1000 // 30 dias por padrão
        );
      }
      
      return tokenResponse.access_token;
    } catch (error) {
      console.error('[TinyAuthService] Erro ao obter token de acesso:', error);
      throw new Error('Falha ao obter token de autenticação para a API Tiny');
    }
  }
  
  /**
   * Obtém um token usando credenciais de cliente (Client Credentials)
   * @returns Resposta com tokens de acesso e renovação
   */
  private async getClientCredentialsToken(): Promise<TokenResponse> {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Client ID e Client Secret são necessários para autenticação OAuth2');
    }
    
    try {
      // Formato correto para API do Tiny - usando URLSearchParams para enviar como application/x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.config.clientId);
      params.append('client_secret', this.config.clientSecret);
      
      const response = await axios.post<TokenResponse>(
        'https://api.tiny.com.br/api2/oauth2/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.info('[TinyAuthService] Token obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('[TinyAuthService] Erro ao obter token com credenciais de cliente:', error);
      
      // Log detalhado para ajudar no diagnóstico
      if (axios.isAxiosError(error) && error.response) {
        console.error('[TinyAuthService] Resposta do servidor:', error.response.data);
        console.error('[TinyAuthService] Status code:', error.response.status);
      }
      
      throw error;
    }
  }
  
  /**
   * Renova um token de acesso usando o refresh token
   * @returns Novo token de acesso
   */
  async refreshAccessToken(): Promise<string> {
    const refreshToken = CacheService.getItem<string>(`${this.cacheKeyPrefix}refresh_token`);
    
    if (!refreshToken) {
      throw new Error('Refresh token não encontrado. É necessário realizar autenticação novamente.');
    }
    
    try {
      // Usando formato correto para API do Tiny
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);
      params.append('client_id', this.config.clientId);
      params.append('client_secret', this.config.clientSecret);
      
      const response = await axios.post<TokenResponse>(
        'https://api.tiny.com.br/api2/oauth2/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      // Atualiza os tokens em cache
      if (this.config.cache) {
        const expirationTime = (response.data.expires_in - 300) * 1000;
        CacheService.setItem(
          `${this.cacheKeyPrefix}access_token`,
          response.data.access_token,
          expirationTime
        );
        
        CacheService.setItem(
          `${this.cacheKeyPrefix}refresh_token`,
          response.data.refresh_token,
          this.config.cacheExpiration || 30 * 24 * 60 * 60 * 1000
        );
      }
      
      return response.data.access_token;
    } catch (error) {
      console.error('[TinyAuthService] Erro ao renovar token de acesso:', error);
      
      // Limpa os tokens armazenados em caso de falha
      CacheService.removeItem(`${this.cacheKeyPrefix}access_token`);
      CacheService.removeItem(`${this.cacheKeyPrefix}refresh_token`);
      
      throw new Error('Falha ao renovar token de acesso. É necessário realizar autenticação novamente.');
    }
  }
  
  /**
   * Invalida os tokens armazenados
   */
  logout(): void {
    CacheService.removeItem(`${this.cacheKeyPrefix}access_token`);
    CacheService.removeItem(`${this.cacheKeyPrefix}refresh_token`);
  }
} 