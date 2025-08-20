import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimiter } from './lib/security/rateLimiter';
import { devCsp, prodCsp } from './lib/security/contentSecurityPolicy';

/**
 * Obter endereço IP real do cliente
 * @param request Requisição
 * @returns Endereço IP ou valor padrão
 */
function getClientIp(request: NextRequest): string {
  // Tentar obter o IP real por trás de proxies
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Pegar o primeiro IP (o do cliente original)
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fallback para desenvolvimento local
  return '127.0.0.1';
}

/**
 * Middleware global para processar todas as requisições
 * @param request Requisição Next.js
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request);

  // Ignorar rotas estáticas e públicas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname === '/login' ||
    pathname === '/acesso-negado'
  ) {
    return NextResponse.next();
  }

  // Aplicar rate limiting
  const limiter = RateLimiter.getInstance();
  
  // Diferentes configurações de rate limit baseado no tipo de endpoint
  let endpointType: 'normal' | 'auth' | 'api' | 'sensitive' = 'normal';
  
  if (pathname.startsWith('/api')) {
    endpointType = 'api';
    
    // Endpoints de autenticação têm limites mais restritivos
    if (pathname.includes('/auth') || pathname.includes('/login')) {
      endpointType = 'auth';
    }
    
    // Endpoints sensíveis (ex: admin, configurações)
    if (pathname.includes('/admin') || pathname.includes('/settings')) {
      endpointType = 'sensitive';
    }
  } else if (pathname === '/login' || pathname.includes('/auth')) {
    endpointType = 'auth';
  }
  
  // Verificar limites
  const result = limiter.checkRequest(clientIp, pathname, endpointType);
  
  if (!result.allowed) {
    // Adicionar cabeçalhos de rate limiting na resposta
    const response = NextResponse.json(
      { error: 'Limite de requisições excedido. Tente novamente mais tarde.' },
      { status: 429 }
    );
    
    response.headers.set('Retry-After', `${result.retryAfter}`);
    response.headers.set('X-RateLimit-Limit', DEFAULT_OPTIONS[endpointType].maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', `${Math.floor(Date.now() / 1000) + (result.retryAfter || 0)}`);
    
    return response;
  }
  
  // Adicionar cabeçalhos de segurança padrão
  const response = NextResponse.next();
  
  // Cabeçalhos de segurança básicos
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Aplicar Content Security Policy baseado no ambiente
  const isProduction = process.env.NODE_ENV === 'production';
  const csp = isProduction ? prodCsp : devCsp;
  const { name, value } = csp.getHeader();
  response.headers.set(name, value);
  
  // Configuração CORS para API
  if (pathname.startsWith('/api')) {
    // Em produção, limitar a origens específicas
    if (isProduction) {
      // Lista de domínios permitidos
      const allowedOrigins = [
        'https://crm-adds.exemplo.com',
        'https://admin.crm-adds.exemplo.com'
      ];
      
      const origin = request.headers.get('origin');
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
    } else {
      // Em desenvolvimento, permitir qualquer origem
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 horas
  }
  
  return response;
}

// Configurações de rate limiting
const DEFAULT_OPTIONS = {
  normal: {
    maxRequests: 60,
  },
  auth: {
    maxRequests: 10,
  },
  api: {
    maxRequests: 30,
  },
  sensitive: {
    maxRequests: 10,
  }
};

/**
 * Configurar caminhos onde o middleware será executado
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (ícone da página)
     * - public (arquivos públicos)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 