import { NextRequest, NextResponse } from 'next/server';
import { SecureApi } from '@/lib/services/apiAdapter';
import { AuthRequest } from '@/lib/middleware/authMiddleware';
import { Dashboard } from '@/lib/services/reportService';
import { mockDashboards } from './mockData';

// GET - Listar dashboards
export async function GET(request: NextRequest) {
  return new SecureApi()
    .requirePermission('canViewReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        // Filtra dashboards que o usuário tem acesso
        const userDashboards = mockDashboards.filter(dashboard => 
          dashboard.createdBy === 'system' || dashboard.createdBy === req.user?.id
        );
        
        return NextResponse.json(userDashboards);
      } catch (error) {
        console.error('Erro ao buscar dashboards:', error);
        return NextResponse.json(
          { message: 'Erro ao buscar dashboards' },
          { status: 500 }
        );
      }
    });
}

// POST - Criar dashboard
export async function POST(request: NextRequest) {
  return new SecureApi()
    .requirePermission('canManageReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        const data = await request.json();
        
        // Validação básica
        if (!data.name) {
          return NextResponse.json(
            { message: 'Nome do dashboard é obrigatório' },
            { status: 400 }
          );
        }
        
        const newDashboard: Dashboard = {
          id: `dashboard-${Date.now()}`,
          name: data.name,
          description: data.description || '',
          widgets: data.widgets || [],
          createdBy: req.user?.id || 'unknown',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDefault: false
        };
        
        // Adicionar ao "banco de dados"
        mockDashboards.push(newDashboard);
        
        return NextResponse.json(
          { message: 'Dashboard criado com sucesso', data: newDashboard },
          { status: 201 }
        );
      } catch (error) {
        console.error('Erro ao criar dashboard:', error);
        return NextResponse.json(
          { message: 'Erro ao criar dashboard' },
          { status: 500 }
        );
      }
    });
} 