import { NextRequest, NextResponse } from 'next/server';
import { SecureApi } from '@/lib/services/apiAdapter';
import { AuthRequest } from '@/lib/middleware/authMiddleware';

// Mock de banco de dados (importar o mesmo do arquivo anterior)
// Na prática, isso seria feito com um banco de dados real
import { mockDashboards } from '../../dashboards/mockData';

// GET - Obter dashboard específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return new SecureApi()
    .requirePermission('canViewReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        const dashboardId = params.id;
        
        // Buscar dashboard
        const dashboard = mockDashboards.find(d => d.id === dashboardId);
        
        // Verificar se o dashboard existe
        if (!dashboard) {
          return NextResponse.json(
            { message: 'Dashboard não encontrado' },
            { status: 404 }
          );
        }
        
        // Verificar se o usuário tem acesso
        if (dashboard.createdBy !== 'system' && dashboard.createdBy !== req.user?.id) {
          return NextResponse.json(
            { message: 'Você não tem permissão para acessar este dashboard' },
            { status: 403 }
          );
        }
        
        return NextResponse.json(dashboard);
      } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        return NextResponse.json(
          { message: 'Erro ao buscar dashboard' },
          { status: 500 }
        );
      }
    });
}

// PUT - Atualizar dashboard
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return new SecureApi()
    .requirePermission('canManageReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        const dashboardId = params.id;
        const updates = await request.json();
        
        // Buscar dashboard
        const dashboardIndex = mockDashboards.findIndex(d => d.id === dashboardId);
        
        // Verificar se o dashboard existe
        if (dashboardIndex === -1) {
          return NextResponse.json(
            { message: 'Dashboard não encontrado' },
            { status: 404 }
          );
        }
        
        const dashboard = mockDashboards[dashboardIndex];
        
        // Verificar se o usuário tem permissão para editar
        if (dashboard.createdBy !== 'system' && dashboard.createdBy !== req.user?.id) {
          return NextResponse.json(
            { message: 'Você não tem permissão para editar este dashboard' },
            { status: 403 }
          );
        }
        
        // Atualizar dashboard
        const updatedDashboard = {
          ...dashboard,
          name: updates.name || dashboard.name,
          description: updates.description !== undefined ? updates.description : dashboard.description,
          widgets: updates.widgets || dashboard.widgets,
          updatedAt: new Date()
        };
        
        // Salvar no "banco de dados"
        mockDashboards[dashboardIndex] = updatedDashboard;
        
        return NextResponse.json({
          message: 'Dashboard atualizado com sucesso',
          data: updatedDashboard
        });
      } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
        return NextResponse.json(
          { message: 'Erro ao atualizar dashboard' },
          { status: 500 }
        );
      }
    });
}

// DELETE - Excluir dashboard
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return new SecureApi()
    .requirePermission('canManageReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        const dashboardId = params.id;
        
        // Buscar dashboard
        const dashboardIndex = mockDashboards.findIndex(d => d.id === dashboardId);
        
        // Verificar se o dashboard existe
        if (dashboardIndex === -1) {
          return NextResponse.json(
            { message: 'Dashboard não encontrado' },
            { status: 404 }
          );
        }
        
        const dashboard = mockDashboards[dashboardIndex];
        
        // Não permitir exclusão de dashboards do sistema
        if (dashboard.isDefault) {
          return NextResponse.json(
            { message: 'Não é possível excluir dashboards padrão do sistema' },
            { status: 403 }
          );
        }
        
        // Verificar se o usuário tem permissão para excluir
        if (dashboard.createdBy !== req.user?.id) {
          return NextResponse.json(
            { message: 'Você não tem permissão para excluir este dashboard' },
            { status: 403 }
          );
        }
        
        // Remover do "banco de dados"
        mockDashboards.splice(dashboardIndex, 1);
        
        return NextResponse.json({
          message: 'Dashboard excluído com sucesso'
        });
      } catch (error) {
        console.error('Erro ao excluir dashboard:', error);
        return NextResponse.json(
          { message: 'Erro ao excluir dashboard' },
          { status: 500 }
        );
      }
    });
} 