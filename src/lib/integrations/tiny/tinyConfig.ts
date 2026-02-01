import { TinyApiConfig } from '../../../types/tiny';
import { TINY_CONFIG } from '../../../config';

/**
 * Configuração da API Tiny
 * Todas as configurações são centralizadas em /src/config.ts
 * Este arquivo apenas exporta a configuração formatada para o TinyApiService
 */
export const tinyConfig: TinyApiConfig = {
  // Credenciais OAuth (para API v3 - não utilizado atualmente)
  clientId: import.meta.env?.VITE_TINY_CLIENT_ID || 'tiny-api-26468819e59f580baea6e238dfef2cb1bad1d112-1741702565',
  clientSecret: import.meta.env?.VITE_TINY_CLIENT_SECRET || '4HfPNKKKKw4BRpEZWb27O680uY9KJw1C',
  
  // Token da API v2 (método principal)
  token: TINY_CONFIG.API_TOKEN,
  
  // URLs da API
  baseUrl: TINY_CONFIG.API_BASE_URL,
  apiV3Url: 'https://api.tiny.com.br/api2/', // API v3 usa o mesmo base URL
  
  // Configurações de comportamento
  timeout: TINY_CONFIG.TIMEOUT || 15000,
  cache: TINY_CONFIG.CACHE_ENABLED || false,
  cacheExpiration: TINY_CONFIG.CACHE_EXPIRATION || 1800000,
  useOAuth: false // API v2 usa token simples, não OAuth
};

/**
 * Limpa o cache de tokens OAuth e força uma nova autenticação
 */
export const resetOAuthTokens = (): void => {
  try {
    localStorage.removeItem('tiny_oauth_access_token');
    localStorage.removeItem('tiny_oauth_refresh_token');
    console.info('[tinyConfig] Tokens OAuth foram resetados');
  } catch (e) {
    console.error('[tinyConfig] Erro ao resetar tokens OAuth:', e);
  }
};

/**
 * Verifica se deve usar mock em desenvolvimento
 * Sempre retorna false para garantir uso da API real
 */
export const useMockApi = (): boolean => {
  // Sempre usa a API real, nunca mock
  return false;
}; 
