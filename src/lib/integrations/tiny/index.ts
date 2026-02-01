/**
 * Exportações centralizadas do módulo de integração Tiny ERP
 * 
 * Estrutura:
 * - types.ts: Interfaces e tipos TypeScript
 * - api.ts: Cliente HTTP básico (TinyApiClient)
 * - TinyApiService.ts: Serviço completo com cache e normalização
 * - tinyServiceFactory.ts: Factory e Context Provider para React
 * - CacheService.ts: Gerenciamento de cache local
 */

// Re-exporta tipos (interfaces, enums, etc.)
export * from './types';

// Re-exporta cliente de API básico
export * from './api';

// Re-exporta serviço de integração legado (para compatibilidade)
export * from './service';

// Re-exporta o serviço principal via factory
export { tinyService, useTinyService, TinyServiceProvider, TinyServiceFactory } from './tinyServiceFactory';

// Re-exporta configurações
export { tinyConfig, resetOAuthTokens, useMockApi } from './tinyConfig';

// Re-exporta serviço de cache
export { CacheService } from './CacheService'; 
