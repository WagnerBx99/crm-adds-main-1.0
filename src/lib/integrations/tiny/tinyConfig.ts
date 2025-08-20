import { TinyApiConfig } from '../../../types/tiny';
import { TINY_CONFIG } from '../../../config';

/**
 * Configuração da API Tiny
 * Em ambiente de desenvolvimento, usamos credenciais de teste
 * Em produção, esses valores devem ser carregados de variáveis de ambiente ou configuração segura
 */
export const tinyConfig: TinyApiConfig = {
  clientId: process.env.TINY_CLIENT_ID || 'tiny-api-26468819e59f580baea6e238dfef2cb1bad1d112-1741702565',
  clientSecret: process.env.TINY_CLIENT_SECRET || '4HfPNKKKKw4BRpEZWb27O680uY9KJw1C',
  token: TINY_CONFIG.API_TOKEN, // Usando o token da configuração centralizada
  baseUrl: TINY_CONFIG.API_BASE_URL || 'https://api.tiny.com.br/api2/',
  apiV3Url: process.env.TINY_API_V3_URL || 'https://api.tiny.com.br/api2/', // API v3 usa o mesmo base URL + oauth2
  timeout: 15000, // 15 segundos
  cache: false, // Desativando cache para garantir dados atualizados
  cacheExpiration: 1800000, // 30 minutos
  useOAuth: false // Define se deve usar OAuth2 (API v3) ou token simples (API v2)
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