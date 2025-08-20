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
const isDevelopment = getEnvVariable('VITE_APP_ENV', 'development') === 'development';

// URL base da API (usando proxy em desenvolvimento)
const baseApiUrl = isDevelopment ? '/api/tiny/' : 'https://api.tiny.com.br/api2/';

// Configurações da API Tiny
export const TINY_CONFIG = {
  API_TOKEN: '8f45883a76440801fab9969236bad8a843393d693ab7ead62a2eced20859ca3a',
  API_BASE_URL: baseApiUrl,
};

// Ambiente da aplicação
export const APP_ENV = getEnvVariable('VITE_APP_ENV', 'development');

// Flag para habilitar mocks durante o desenvolvimento
export const USE_MOCK_API = false; // Desativando mocks para usar a API real

// Outras configurações globais
export const APP_CONFIG = {
  // Adicione outras configurações globais aqui
  DEFAULT_PAGINATION_LIMIT: 10,
  DATE_FORMAT: 'dd/MM/yyyy',
  CURRENCY_FORMAT: 'pt-BR',
}; 