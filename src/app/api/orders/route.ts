import { NextRequest, NextResponse } from 'next/server';
import { SecureApi } from '@/lib/services/apiAdapter';
import { AuthRequest } from '@/lib/middleware/authMiddleware';

// Listar ordens
export async function GET(request: NextRequest) {
  return new SecureApi()
    .requirePermission('canViewAllOrders')
    .handle(request, async (req: AuthRequest) => {
      try {
        // Obter parâmetros de consulta
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        // Em uma implementação real, buscaríamos do banco de dados
        // Aqui estamos apenas simulando para fins de demonstração
        const orders = [
          { id: '1', title: 'Ordem 1', status: 'FAZER', customer: { name: 'Cliente A' } },
          { id: '2', title: 'Ordem 2', status: 'APROVACAO', customer: { name: 'Cliente B' } },
          { id: '3', title: 'Ordem 3', status: 'PRODUCAO', customer: { name: 'Cliente C' } },
        ];
        
        // Filtrar por status se fornecido
        const filteredOrders = status 
          ? orders.filter(order => order.status === status)
          : orders;
        
        // Paginação simulada
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
        
        // Registrar acesso bem-sucedido
        console.log(`Usuário ${req.user?.id} listou ordens com sucesso`);
        
        return NextResponse.json({
          data: paginatedOrders,
          pagination: {
            total: filteredOrders.length,
            page,
            limit,
            pages: Math.ceil(filteredOrders.length / limit)
          }
        });
      } catch (error) {
        console.error('Erro ao listar ordens:', error);
        return NextResponse.json(
          { message: 'Erro ao buscar ordens' },
          { status: 500 }
        );
      }
    });
}

// Criar nova ordem
export async function POST(request: NextRequest) {
  return new SecureApi()
    .requirePermission('canCreateOrders')
    .handle(request, async (req: AuthRequest) => {
      try {
        // Obter dados da requisição
        const data = await request.json();
        
        // Validação básica
        if (!data.title || !data.customer) {
          return NextResponse.json(
            { message: 'Dados incompletos. Título e cliente são obrigatórios.' },
            { status: 400 }
          );
        }
        
        // Em uma implementação real, salvaríamos no banco de dados
        // Aqui estamos apenas simulando para fins de demonstração
        const newOrder = {
          id: Date.now().toString(),
          title: data.title,
          description: data.description || '',
          status: 'FAZER',
          customer: data.customer,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: req.user?.id
        };
        
        // Registrar criação bem-sucedida
        console.log(`Usuário ${req.user?.id} criou nova ordem: ${newOrder.id}`);
        
        return NextResponse.json(
          { message: 'Ordem criada com sucesso', data: newOrder },
          { status: 201 }
        );
      } catch (error) {
        console.error('Erro ao criar ordem:', error);
        return NextResponse.json(
          { message: 'Erro ao criar ordem' },
          { status: 500 }
        );
      }
    });
} 