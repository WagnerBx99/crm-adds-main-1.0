/**
 * Rate Limiter Middleware - CRM ADDS
 * 
 * Implementa limitação de taxa de requisições para proteger
 * endpoints públicos contra abuso e ataques de força bruta.
 */

import { Request, Response, NextFunction } from 'express';

// Armazenamento em memória para contagem de requisições
// Em produção, considere usar Redis para ambientes com múltiplas instâncias
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configurações padrão
const DEFAULT_CONFIG = {
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 60, // 60 requisições por minuto
  blockDurationMs: 5 * 60 * 1000, // 5 minutos de bloqueio
  maxBlockedAttempts: 3, // Após 3 bloqueios, aumenta o tempo
};

// Configurações específicas por tipo de endpoint
const ENDPOINT_CONFIGS: Record<string, typeof DEFAULT_CONFIG> = {
  // Links públicos de aprovação de arte - mais restritivo
  'art-approval-public': {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10, // 10 requisições por minuto
    blockDurationMs: 10 * 60 * 1000, // 10 minutos de bloqueio
    maxBlockedAttempts: 3,
  },
  // Login - muito restritivo para prevenir força bruta
  'auth-login': {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 5, // 5 tentativas por minuto
    blockDurationMs: 15 * 60 * 1000, // 15 minutos de bloqueio
    maxBlockedAttempts: 3,
  },
  // Orçamentos públicos
  'public-quotes': {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 20, // 20 requisições por minuto
    blockDurationMs: 5 * 60 * 1000, // 5 minutos de bloqueio
    maxBlockedAttempts: 3,
  },
  // Contatos públicos
  'public-contacts': {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10, // 10 requisições por minuto
    blockDurationMs: 10 * 60 * 1000, // 10 minutos de bloqueio
    maxBlockedAttempts: 3,
  },
  // API geral (autenticada)
  'api-general': {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100, // 100 requisições por minuto
    blockDurationMs: 5 * 60 * 1000, // 5 minutos de bloqueio
    maxBlockedAttempts: 5,
  },
};

/**
 * Obtém o identificador único do cliente
 */
function getClientIdentifier(req: Request): string {
  // Prioriza X-Forwarded-For para proxies reversos (Nginx, etc.)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ips.trim();
  }
  
  // Fallback para IP direto
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Limpa entradas expiradas do store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entradas que não estão bloqueadas e passaram do tempo de reset
    if (!entry.blocked && entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
    // Remove entradas bloqueadas que já passaram do tempo de bloqueio
    if (entry.blocked && entry.blockUntil && entry.blockUntil < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Limpa entradas expiradas a cada 5 minutos
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Cria um middleware de rate limiting
 */
export function createRateLimiter(endpointType: string = 'api-general') {
  const config = ENDPOINT_CONFIGS[endpointType] || DEFAULT_CONFIG;
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientIdentifier(req);
    const key = `${endpointType}:${clientId}`;
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);
    
    // Verificar se está bloqueado
    if (entry?.blocked && entry.blockUntil && entry.blockUntil > now) {
      const retryAfter = Math.ceil((entry.blockUntil - now) / 1000);
      
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', entry.blockUntil.toString());
      
      console.warn(`[RateLimiter] IP ${clientId} bloqueado para ${endpointType}. Retry after: ${retryAfter}s`);
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Muitas requisições. Por favor, aguarde antes de tentar novamente.',
        retryAfter,
        blockedUntil: new Date(entry.blockUntil).toISOString(),
      });
    }
    
    // Criar nova entrada ou resetar se expirou
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
      };
    }
    
    // Incrementar contador
    entry.count++;
    
    // Verificar se excedeu o limite
    if (entry.count > config.maxRequests) {
      // Calcular duração do bloqueio (aumenta progressivamente)
      const blockMultiplier = Math.min(entry.count - config.maxRequests, config.maxBlockedAttempts);
      const blockDuration = config.blockDurationMs * blockMultiplier;
      
      entry.blocked = true;
      entry.blockUntil = now + blockDuration;
      
      rateLimitStore.set(key, entry);
      
      const retryAfter = Math.ceil(blockDuration / 1000);
      
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', entry.blockUntil.toString());
      
      console.warn(`[RateLimiter] IP ${clientId} excedeu limite para ${endpointType}. Bloqueado por ${retryAfter}s`);
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Limite de requisições excedido. Por favor, aguarde antes de tentar novamente.',
        retryAfter,
        blockedUntil: new Date(entry.blockUntil).toISOString(),
      });
    }
    
    // Atualizar store
    rateLimitStore.set(key, entry);
    
    // Adicionar headers informativos
    const remaining = Math.max(0, config.maxRequests - entry.count);
    res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());
    
    next();
  };
}

/**
 * Rate limiters pré-configurados para diferentes endpoints
 */
export const rateLimiters = {
  artApprovalPublic: createRateLimiter('art-approval-public'),
  authLogin: createRateLimiter('auth-login'),
  publicQuotes: createRateLimiter('public-quotes'),
  publicContacts: createRateLimiter('public-contacts'),
  apiGeneral: createRateLimiter('api-general'),
};

/**
 * Middleware de rate limiting global (mais permissivo)
 */
export const globalRateLimiter = createRateLimiter('api-general');

/**
 * Obtém estatísticas do rate limiter (para monitoramento)
 */
export function getRateLimiterStats(): {
  totalEntries: number;
  blockedIPs: number;
  entriesByEndpoint: Record<string, number>;
} {
  const stats = {
    totalEntries: rateLimitStore.size,
    blockedIPs: 0,
    entriesByEndpoint: {} as Record<string, number>,
  };
  
  for (const [key, entry] of rateLimitStore.entries()) {
    const [endpoint] = key.split(':');
    stats.entriesByEndpoint[endpoint] = (stats.entriesByEndpoint[endpoint] || 0) + 1;
    
    if (entry.blocked) {
      stats.blockedIPs++;
    }
  }
  
  return stats;
}

/**
 * Limpa manualmente uma entrada (para desbloqueio administrativo)
 */
export function clearRateLimitEntry(clientId: string, endpointType?: string): boolean {
  if (endpointType) {
    const key = `${endpointType}:${clientId}`;
    return rateLimitStore.delete(key);
  }
  
  // Limpa todas as entradas do cliente
  let cleared = false;
  for (const key of rateLimitStore.keys()) {
    if (key.endsWith(`:${clientId}`)) {
      rateLimitStore.delete(key);
      cleared = true;
    }
  }
  return cleared;
}

export default rateLimiters;
