import { NextRequest, NextResponse } from 'next/server';
import { SecureApi } from '@/lib/services/apiAdapter';
import { AuthRequest } from '@/lib/middleware/authMiddleware';

// Obter ordem por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return new SecureApi()
    // Verificar se o usuário tem permissão para ver ordens
    .requirePermission('canViewOwnOrders')
    // Verificar se o usuário tem acesso a este recurso específico
    .requireResourceAccess('order', () => params.id)
    .handle(request, async (req: AuthRequest) => {
      try {
        const orderId = params.id;
        
        // Em uma implementação real, buscaríamos do banco de dados
        // Aqui estamos apenas simulando para fins de demonstração
        const order = {
          id: orderId,
          title: `Ordem ${orderId}`,
          description: 'Descrição detalhada da ordem',
          status: 'PRODUCAO',
          customer: { id: '123', name: 'Cliente Exemplo' },
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedTo: req.user?.id
        };
        
        // Registrar acesso bem-sucedido
        console.log(`Usuário ${req.user?.id} acessou a ordem ${orderId}`);
        
        return NextResponse.json({ data: order });
      } catch (error) {
        console.error(`Erro ao buscar ordem ${params.id}:`, error);
        return NextResponse.json(
          { message: 'Erro ao buscar ordem' },
          { status: 500 }
        );
      }
    });
}

// Atualizar ordem
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return new SecureApi()
    // Verificar se o usuário tem permissão para editar ordens
    .requirePermission('canEditOrders')
    // Verificar se o usuário tem acesso a este recurso específico
    .requireResourceAccess('order', () => params.id)
    .handle(request, async (req: AuthRequest) => {
      try {
        const orderId = params.id;
        const data = await request.json();
        
        // Validação básica
        if (!data.title) {
          return NextResponse.json(
            { message: 'Título é obrigatório.' },
            { status: 400 }
          );
        }
        
        // Em uma implementação real, atualizaríamos no banco de dados
        // Aqui estamos apenas simulando para fins de demonstração
        const updatedOrder = {
          id: orderId,
          title: data.title,
          description: data.description || '',
          status: data.status || 'PRODUCAO',
          customer: data.customer || { id: '123', name: 'Cliente Exemplo' },
          updatedAt: new Date(),
          updatedBy: req.user?.id
        };
        
        // Registrar atualização bem-sucedida
        console.log(`Usuário ${req.user?.id} atualizou a ordem ${orderId}`);
        
        return NextResponse.json({ 
          message: 'Ordem atualizada com sucesso',
          data: updatedOrder
        });
      } catch (error) {
        console.error(`Erro ao atualizar ordem ${params.id}:`, error);
        return NextResponse.json(
          { message: 'Erro ao atualizar ordem' },
          { status: 500 }
        );
      }
    });
}

// Excluir ordem
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return new SecureApi()
    // Verificar se o usuário tem permissão para excluir ordens
    .requirePermission('canDeleteOrders')
    // Verificar se o usuário tem acesso a este recurso específico
    .requireResourceAccess('order', () => params.id)
    .handle(request, async (req: AuthRequest) => {
      try {
        const orderId = params.id;
        
        // Em uma implementação real, excluiríamos do banco de dados
        // Aqui estamos apenas simulando para fins de demonstração
        
        // Registrar exclusão bem-sucedida
        console.log(`Usuário ${req.user?.id} excluiu a ordem ${orderId}`);
        
        return NextResponse.json({ 
          message: 'Ordem excluída com sucesso'
        });
      } catch (error) {
        console.error(`Erro ao excluir ordem ${params.id}:`, error);
        return NextResponse.json(
          { message: 'Erro ao excluir ordem' },
          { status: 500 }
        );
      }
    });
} 