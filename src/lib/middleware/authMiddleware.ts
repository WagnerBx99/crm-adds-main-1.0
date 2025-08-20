import { authService } from '../services/authService';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types';

export interface AuthRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware para verificar autenticação
 * @param request Requisição
 * @returns Resposta ou passa para o próximo middleware
 */
export async function authMiddleware(
  request: NextRequest
): Promise<NextResponse | void> {
  // Obter token do cabeçalho Authorization
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return NextResponse.json(
      { message: 'Não autorizado. Token não fornecido.' },
      { status: 401 }
    );
  }

  try {
    // Validar token
    const tokens = authService.getTokens();
    if (!tokens || tokens.accessToken !== token) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado.' },
        { status: 401 }
      );
    }

    // Verificar se o token expirou
    if (tokens.expiresAt < Date.now()) {
      return NextResponse.json(
        { message: 'Token expirado. Faça login novamente.' },
        { status: 401 }
      );
    }

    // Obter usuário
    const user = authService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado.' },
        { status: 401 }
      );
    }

    // Adicionar informações do usuário à requisição
    (request as AuthRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // Renovar sessão para evitar timeout
    authService.renewSession();

    return NextResponse.next();
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return NextResponse.json(
      { message: 'Erro de autenticação.' },
      { status: 401 }
    );
  }
}

/**
 * Middleware para verificar permissões
 * @param requiredPermissions Lista de permissões necessárias
 * @returns Middleware para verificar permissões
 */
export function checkPermissions(requiredPermission: keyof import('@/types').RolePermissions) {
  return async function(
    request: NextRequest
  ): Promise<NextResponse | void> {
    try {
      // Verificar se o usuário está autenticado
      const authReq = request as AuthRequest;
      if (!authReq.user) {
        return NextResponse.json(
          { message: 'Não autorizado. Autenticação necessária.' },
          { status: 401 }
        );
      }

      // Verificar permissão
      const hasPermission = authService.hasPermission(requiredPermission);
      if (!hasPermission) {
        return NextResponse.json(
          { message: 'Acesso negado. Permissão insuficiente.' },
          { status: 403 }
        );
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return NextResponse.json(
        { message: 'Erro ao verificar permissões.' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware para verificar papéis
 * @param requiredRoles Lista de papéis permitidos
 * @returns Middleware para verificar papéis
 */
export function checkRoles(requiredRoles: UserRole[]) {
  return async function(
    request: NextRequest
  ): Promise<NextResponse | void> {
    try {
      // Verificar se o usuário está autenticado
      const authReq = request as AuthRequest;
      if (!authReq.user) {
        return NextResponse.json(
          { message: 'Não autorizado. Autenticação necessária.' },
          { status: 401 }
        );
      }

      // Verificar papel
      if (!requiredRoles.includes(authReq.user.role)) {
        return NextResponse.json(
          { message: 'Acesso negado. Perfil insuficiente.' },
          { status: 403 }
        );
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Erro ao verificar papel:', error);
      return NextResponse.json(
        { message: 'Erro ao verificar papel.' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware para verificar acesso a recurso específico
 * @param resourceType Tipo de recurso
 * @param getResourceId Função para obter ID do recurso da requisição
 * @returns Middleware para verificar acesso ao recurso
 */
export function checkResourceAccess(
  resourceType: 'order' | 'customer' | 'user',
  getResourceId: (req: NextRequest) => string
) {
  return async function(
    request: NextRequest
  ): Promise<NextResponse | void> {
    try {
      // Verificar se o usuário está autenticado
      const authReq = request as AuthRequest;
      if (!authReq.user) {
        return NextResponse.json(
          { message: 'Não autorizado. Autenticação necessária.' },
          { status: 401 }
        );
      }

      // Obter ID do recurso
      const resourceId = getResourceId(request);
      if (!resourceId) {
        return NextResponse.json(
          { message: 'ID do recurso não fornecido.' },
          { status: 400 }
        );
      }

      // MASTER tem acesso total
      if (authReq.user.role === 'MASTER') {
        return NextResponse.next();
      }

      // GESTOR pode acessar todos os recursos de ordems e clientes
      if (authReq.user.role === 'GESTOR' && resourceType !== 'user') {
        return NextResponse.next();
      }

      // Para PRESTADOR, verificar se o recurso pertence a ele
      if (authReq.user.role === 'PRESTADOR') {
        // Lógica para verificar propriedade do recurso
        // Em uma implementação real, consultaríamos o banco de dados
        // Aqui, estamos apenas simulando para fins de demonstração
        
        // Por exemplo: Verificar se a ordem está atribuída a este usuário
        // const isOwner = await checkResourceOwnership(resourceType, resourceId, authReq.user.id);
        
        // Simulando temporariamente
        const isOwner = resourceId.startsWith(authReq.user.id);
        
        if (!isOwner) {
          return NextResponse.json(
            { message: 'Acesso negado. Este recurso não pertence a você.' },
            { status: 403 }
          );
        }
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Erro ao verificar acesso a recurso:', error);
      return NextResponse.json(
        { message: 'Erro ao verificar acesso a recurso.' },
        { status: 500 }
      );
    }
  };
}

// Função auxiliar para registrar tentativas de acesso não autorizado
export function logAccessAttempt(
  userId: string,
  resourceType: string,
  resourceId: string,
  success: boolean
): void {
  try {
    // Em uma implementação real, registraríamos isso em um banco de dados
    console.log(`Tentativa de acesso: usuário=${userId}, recurso=${resourceType}/${resourceId}, sucesso=${success}`);
    
    // Registrar no log de auditoria
    const log = {
      id: crypto.randomUUID(),
      userId,
      action: success ? 'access_success' : 'access_denied',
      entityType: resourceType,
      entityId: resourceId,
      timestamp: new Date(),
      ipAddress: '127.0.0.1' // Em um ambiente real, obteríamos o IP real
    };

    // Salvar no localStorage para simulação
    const storedLogs = localStorage.getItem('auditLogs');
    const logs = storedLogs ? JSON.parse(storedLogs) : [];
    logs.push(log);
    localStorage.setItem('auditLogs', JSON.stringify(logs));
  } catch (error) {
    console.error('Erro ao registrar tentativa de acesso:', error);
  }
} 