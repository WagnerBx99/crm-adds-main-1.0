/**
 * Implementação de Rate Limiting para proteção contra ataques de força bruta
 * 
 * Esta implementação usa um mapa em memória para armazenar contadores por IP e rota.
 * Em um ambiente de produção, seria recomendável usar um armazenamento distribuído como Redis.
 */

interface RateLimitEntry {
  count: number;
  lastRequest: number;
  blocked: boolean;
  blockedUntil?: number;
}

interface RateLimitOptions {
  windowMs: number;    // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições na janela
  blockDuration: number; // Duração do bloqueio em ms após exceder limite
}

// Configurações padrão para diferentes tipos de endpoints
const DEFAULT_OPTIONS: Record<string, RateLimitOptions> = {
  normal: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 60,     // 60 req/min
    blockDuration: 5 * 60 * 1000 // 5 minutos de bloqueio
  },
  auth: {
    windowMs: 10 * 60 * 1000, // 10 minutos
    maxRequests: 10,          // 10 tentativas em 10 minutos
    blockDuration: 30 * 60 * 1000 // 30 minutos de bloqueio
  },
  api: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30,     // 30 req/min
    blockDuration: 10 * 60 * 1000 // 10 minutos de bloqueio
  },
  sensitive: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10,     // 10 req/min
    blockDuration: 15 * 60 * 1000 // 15 minutos de bloqueio
  }
};

export class RateLimiter {
  private static instance: RateLimiter;
  private records: Map<string, RateLimitEntry>;
  private cleanupInterval: number = 60 * 60 * 1000; // Limpar entradas antigas a cada hora
  private intervalId: number | null = null;

  private constructor() {
    this.records = new Map();
    this.startCleanup();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Verificar se um IP está bloqueado para uma determinada rota
   * @param ip Endereço IP
   * @param route Rota/endpoint
   * @returns true se bloqueado, false caso contrário
   */
  public isBlocked(ip: string, route: string): boolean {
    const key = this.generateKey(ip, route);
    const record = this.records.get(key);

    if (!record) return false;
    if (!record.blocked) return false;
    
    // Verificar se o bloqueio expirou
    if (record.blockedUntil && record.blockedUntil < Date.now()) {
      // Reset do bloqueio expirado
      record.blocked = false;
      record.blockedUntil = undefined;
      return false;
    }
    
    return true;
  }

  /**
   * Registrar tentativa de requisição e verificar se deve ser bloqueada
   * @param ip Endereço IP
   * @param route Rota/endpoint
   * @param type Tipo de endpoint (auth, api, normal, sensitive)
   * @returns Objeto com resultado da verificação
   */
  public checkRequest(ip: string, route: string, type: keyof typeof DEFAULT_OPTIONS = 'normal'): { 
    allowed: boolean;
    remaining?: number;
    retryAfter?: number;
  } {
    const key = this.generateKey(ip, route);
    const options = DEFAULT_OPTIONS[type];
    const now = Date.now();
    
    // Verificar se já está bloqueado
    if (this.isBlocked(ip, route)) {
      const record = this.records.get(key)!;
      const retryAfter = Math.ceil((record.blockedUntil! - now) / 1000);
      return { 
        allowed: false,
        retryAfter
      };
    }
    
    // Obter ou criar registro
    let record = this.records.get(key);
    
    if (!record) {
      record = { count: 0, lastRequest: now, blocked: false };
      this.records.set(key, record);
    }
    
    // Reset contador se estiver fora da janela de tempo
    if (now - record.lastRequest > options.windowMs) {
      record.count = 0;
      record.lastRequest = now;
    }
    
    // Incrementar contador
    record.count++;
    record.lastRequest = now;
    
    // Verificar se excedeu limite
    if (record.count > options.maxRequests) {
      record.blocked = true;
      record.blockedUntil = now + options.blockDuration;
      
      return {
        allowed: false,
        retryAfter: Math.ceil(options.blockDuration / 1000)
      };
    }
    
    return {
      allowed: true,
      remaining: options.maxRequests - record.count
    };
  }

  /**
   * Bloquear manualmente um IP para uma rota específica
   * @param ip Endereço IP
   * @param route Rota/endpoint 
   * @param duration Duração do bloqueio em ms
   */
  public blockIp(ip: string, route: string, duration: number): void {
    const key = this.generateKey(ip, route);
    const now = Date.now();
    
    this.records.set(key, {
      count: 999999, // Valor alto para garantir que excede qualquer limite
      lastRequest: now,
      blocked: true,
      blockedUntil: now + duration
    });
    
    console.log(`IP ${ip} bloqueado para ${route} por ${duration/1000} segundos`);
  }

  /**
   * Desbloquear um IP para uma rota específica
   * @param ip Endereço IP
   * @param route Rota/endpoint
   */
  public unblockIp(ip: string, route: string): void {
    const key = this.generateKey(ip, route);
    const record = this.records.get(key);
    
    if (record) {
      record.blocked = false;
      record.blockedUntil = undefined;
      record.count = 0;
      console.log(`IP ${ip} desbloqueado para ${route}`);
    }
  }

  /**
   * Gerar chave única para identificar combinação IP+rota
   */
  private generateKey(ip: string, route: string): string {
    return `${ip}:${route}`;
  }

  /**
   * Iniciar limpeza periódica de entradas antigas
   */
  private startCleanup(): void {
    if (this.intervalId !== null) return;
    
    this.intervalId = window.setInterval(() => {
      const now = Date.now();
      
      // Limpar entradas expiradas
      for (const [key, record] of this.records.entries()) {
        const [ip, route] = key.split(':');
        
        // Se bloqueado e o bloqueio expirou, remover bloqueio
        if (record.blocked && record.blockedUntil && record.blockedUntil < now) {
          record.blocked = false;
          record.blockedUntil = undefined;
          record.count = 0;
        }
        
        // Se a última requisição foi há mais de 24h, remover entrada
        if (now - record.lastRequest > 24 * 60 * 60 * 1000) {
          this.records.delete(key);
        }
      }
      
      console.log(`Limpeza do Rate Limiter: ${this.records.size} entradas restantes`);
    }, this.cleanupInterval);
  }

  /**
   * Parar limpeza periódica
   */
  public stopCleanup(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Obter estatísticas de uso
   */
  public getStats(): object {
    const stats = {
      totalEntries: this.records.size,
      blockedIps: 0,
      endpointStats: {} as Record<string, { requests: number, blocked: number }>
    };
    
    for (const [key, record] of this.records.entries()) {
      const [ip, route] = key.split(':');
      
      if (record.blocked) {
        stats.blockedIps++;
      }
      
      if (!stats.endpointStats[route]) {
        stats.endpointStats[route] = { requests: 0, blocked: 0 };
      }
      
      stats.endpointStats[route].requests += record.count;
      if (record.blocked) {
        stats.endpointStats[route].blocked++;
      }
    }
    
    return stats;
  }
}

// Middleware para aplicar rate limiting em requisições
export function rateLimitMiddleware(
  request: Request, 
  endpoint: string, 
  type: keyof typeof DEFAULT_OPTIONS = 'normal'
): Response | null {
  // Obter IP do cliente (em uma aplicação real, usaria o IP real)
  const clientIp = '127.0.0.1'; // Simulação para desenvolvimento
  
  // Verificar limite
  const limiter = RateLimiter.getInstance();
  const result = limiter.checkRequest(clientIp, endpoint, type);
  
  if (!result.allowed) {
    // Requisição bloqueada - retornar resposta 429 Too Many Requests
    const response = new Response(
      JSON.stringify({
        error: 'Limite de requisições excedido. Tente novamente mais tarde.',
        retryAfter: result.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': `${result.retryAfter}`
        }
      }
    );
    
    return response;
  }
  
  // Se permitido, retornar null para continuar o processamento
  return null;
} 