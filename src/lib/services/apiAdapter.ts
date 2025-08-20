import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, checkPermissions, checkRoles, checkResourceAccess, AuthRequest } from '../middleware/authMiddleware';
import { UserRole } from '@/types';

/**
 * Classe para facilitar a composição de middlewares de segurança nas rotas
 */
export class SecureApi {
  private middlewares: Array<(req: NextRequest) => Promise<NextResponse | void>> = [];

  /**
   * Construtor que sempre inicia com o middleware de autenticação
   */
  constructor() {
    this.middlewares.push(authMiddleware);
  }

  /**
   * Adiciona verificação de permissão ao pipeline
   * @param permission Permissão requerida
   */
  requirePermission(permission: keyof import('@/types').RolePermissions): SecureApi {
    this.middlewares.push(checkPermissions(permission));
    return this;
  }

  /**
   * Adiciona verificação de papel ao pipeline
   * @param roles Papéis permitidos
   */
  requireRoles(roles: UserRole[]): SecureApi {
    this.middlewares.push(checkRoles(roles));
    return this;
  }

  /**
   * Adiciona verificação de acesso a recurso ao pipeline
   * @param resourceType Tipo de recurso
   * @param getResourceId Função para extrair ID do recurso da requisição
   */
  requireResourceAccess(
    resourceType: 'order' | 'customer' | 'user',
    getResourceId: (req: NextRequest) => string
  ): SecureApi {
    this.middlewares.push(checkResourceAccess(resourceType, getResourceId));
    return this;
  }

  /**
   * Executa o handler da rota com todas as verificações de segurança
   * @param handler Função de processamento da rota
   */
  async handle(
    request: NextRequest,
    handler: (req: AuthRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Executar todos os middlewares em sequência
      for (const middleware of this.middlewares) {
        const result = await middleware(request);
        if (result instanceof NextResponse) {
          return result; // Retornar imediatamente se um middleware retornar uma resposta
        }
      }

      // Se todos os middlewares passarem, executar o handler
      return await handler(request as AuthRequest);
    } catch (error) {
      console.error('Erro ao processar requisição segura:', error);
      return NextResponse.json(
        { message: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  }
}

/**
 * Exemplo de como criar um manipulador de rota seguro
 * 
 * @example
 * // Rota segura que requer autenticação e permissão específica
 * export async function GET(request: NextRequest) {
 *   return new SecureApi()
 *     .requirePermission('canViewReports')
 *     .handle(request, async (req) => {
 *       // Processar a requisição
 *       return NextResponse.json({ data: 'Relatório Confidencial' });
 *     });
 * }
 * 
 * @example
 * // Rota segura com verificação de acesso a recurso
 * export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
 *   return new SecureApi()
 *     .requireResourceAccess('order', (req) => params.id)
 *     .handle(request, async (req) => {
 *       // Processar a requisição
 *       return NextResponse.json({ data: `Ordem ${params.id}` });
 *     });
 * }
 */ 