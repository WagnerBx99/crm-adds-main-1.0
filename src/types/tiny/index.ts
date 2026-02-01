/**
 * Tipos para integração com a API Tiny v2.0 e v3.0
 * 
 * Este arquivo re-exporta todos os tipos do arquivo principal /src/types/tiny.ts
 * para manter compatibilidade com imports existentes que usam '@/types/tiny'
 * 
 * Uso:
 * - import { Cliente, Pedido } from '@/types/tiny' - importa do arquivo principal
 * - import { Cliente, Pedido } from '@/types/tiny/index' - também funciona (re-exporta)
 */

// Re-exporta todos os tipos do arquivo principal
export * from '../tiny';
