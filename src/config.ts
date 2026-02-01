/**
 * Arquivo de configuração centralizado para gerenciar variáveis de ambiente
 * e outras configurações globais da aplicação.
 */

// Função auxiliar para acessar variáveis de ambiente com fallback
const getEnvVariable = (key: string, defaultValue: string = ''): string => {
  // Tenta acessar usando import.meta.env (Vite)
  if (import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  
  // Fallback para process.env (caso esteja disponível)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Retorna valor padrão se nenhuma das opções acima estiver disponível
  return defaultValue;
};

// Identifica se está em ambiente de desenvolvimento
const isDevelopment = getEnvVariable('VITE_APP_ENV', 'development') === 'development' || 
                      typeof window !== 'undefined' && window.location.hostname === 'localhost';

// URL base da API Backend (PostgreSQL)
export const API_BASE_URL = getEnvVariable('VITE_API_BASE_URL', 'http://31.97.253.85:3001/api');

// URL base da API Tiny
// Em desenvolvimento usa proxy do Vite para evitar CORS
// Em produção usa a URL direta da API do Tiny
const getTinyApiUrl = (): string => {
  const envUrl = getEnvVariable('VITE_TINY_API_BASE_URL', '');
  if (envUrl) return envUrl;
  
  // Em desenvolvimento, usar o proxy configurado no vite.config.ts
  if (isDevelopment) {
    return '/api/tiny/';
  }
  
  // Em produção, usar a API diretamente (requer CORS ou backend proxy)
  return 'https://api.tiny.com.br/api2/';
};

// Configurações da API Tiny
export const TINY_CONFIG = {
  API_TOKEN: getEnvVariable('VITE_TINY_API_TOKEN', '8f45883a76440801fab9969236bad8a843393d693ab7ead62a2eced20859ca3a'),
  API_BASE_URL: getTinyApiUrl(),
  // Configurações adicionais
  TIMEOUT: 15000,
  CACHE_ENABLED: false, // Desabilitado por padrão para garantir dados atualizados
  CACHE_EXPIRATION: 1800000, // 30 minutos
};

// Ambiente da aplicação
export const APP_ENV = getEnvVariable('VITE_APP_ENV', 'development');

// Flag para usar o backend PostgreSQL (true) ou localStorage (false)
export const USE_BACKEND_API = getEnvVariable('VITE_USE_BACKEND_API', 'true') === 'true';

// Flag para habilitar mocks durante o desenvolvimento
export const USE_MOCK_API = false; // Desativando mocks para usar a API real

// Outras configurações globais
export const APP_CONFIG = {
  // Adicione outras configurações globais aqui
  DEFAULT_PAGINATION_LIMIT: 10,
  DATE_FORMAT: 'dd/MM/yyyy',
  CURRENCY_FORMAT: 'pt-BR',
};

// Objeto CONFIG consolidado para compatibilidade
export const CONFIG = {
  USE_BACKEND_API,
  API_BASE_URL,
  TINY_CONFIG,
  APP_ENV,
  USE_MOCK_API,
  ...APP_CONFIG,
};

// Alias para compatibilidade
export const config = CONFIG;
