import { NextRequest, NextResponse } from 'next/server';
import { SecureApi } from '@/lib/services/apiAdapter';
import { AuthRequest } from '@/lib/middleware/authMiddleware';

// Mock de banco de dados de relatórios agendados
// Em uma implementação real, isso seria um banco de dados
let mockScheduledReports = [];

// Função para inicializar dados (em uma implementação real, isso seria um banco)
async function getReports() {
  // Se ainda não temos dados, inicializar com alguns exemplos
  if (mockScheduledReports.length === 0) {
    mockScheduledReports = [
      {
        id: '1',
        name: 'Relatório Mensal de Vendas',
        description: 'Relatório detalhado de vendas gerado mensalmente',
        type: 'vendas',
        frequency: 'mensal',
        format: 'pdf',
        recipients: ['gerente@empresa.com', 'diretoria@empresa.com'],
        lastGenerated: new Date(2023, 9, 1),
        nextScheduled: new Date(2023, 10, 1),
        status: 'ativo',
        configuration: {
          visualization: 'line',
          dateRange: {
            preset: 'lastMonth'
          },
          groupBy: ['cliente', 'produto'],
          metrics: ['valor_total', 'quantidade'],
          sort: [
            { field: 'valor_total', direction: 'desc' }
          ]
        }
      },
      {
        id: '2',
        name: 'Relatório Semanal de Status',
        description: 'Relatório de status dos projetos atualizado semanalmente',
        type: 'status',
        frequency: 'semanal',
        format: 'excel',
        recipients: ['coordenador@empresa.com', 'equipe@empresa.com'],
        lastGenerated: new Date(2023, 9, 25),
        nextScheduled: new Date(2023, 10, 1),
        status: 'ativo',
        configuration: {
          visualization: 'donut',
          filters: {
            id: 'filter-1',
            name: 'Projetos Ativos',
            conditions: [
              {
                id: 'condition-1',
                field: 'status',
                operator: 'in',
                value: ['Em Análise', 'Aprovado', 'Em Produção']
              }
            ],
            operator: 'AND'
          }
        }
      }
    ];
  }
  
  return mockScheduledReports;
}

// GET - Obter relatório agendado específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return new SecureApi()
    .requirePermission('canViewReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        const reportId = params.id;
        
        // Inicializar dados
        await getReports();
        
        // Buscar relatório
        const report = mockScheduledReports.find(r => r.id === reportId);
        
        // Verificar se o relatório existe
        if (!report) {
          return NextResponse.json(
            { message: 'Relatório agendado não encontrado' },
            { status: 404 }
          );
        }
        
        return NextResponse.json(report);
      } catch (error) {
        console.error('Erro ao buscar relatório agendado:', error);
        return NextResponse.json(
          { message: 'Erro ao buscar relatório agendado' },
          { status: 500 }
        );
      }
    });
}

// PUT - Atualizar relatório agendado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return new SecureApi()
    .requirePermission('canManageReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        const reportId = params.id;
        const updates = await request.json();
        
        // Inicializar dados
        await getReports();
        
        // Buscar relatório
        const reportIndex = mockScheduledReports.findIndex(r => r.id === reportId);
        
        // Verificar se o relatório existe
        if (reportIndex === -1) {
          return NextResponse.json(
            { message: 'Relatório agendado não encontrado' },
            { status: 404 }
          );
        }
        
        const report = mockScheduledReports[reportIndex];
        
        // Atualizar relatório
        const updatedReport = {
          ...report,
          name: updates.name || report.name,
          description: updates.description !== undefined ? updates.description : report.description,
          frequency: updates.frequency || report.frequency,
          format: updates.format || report.format,
          recipients: updates.recipients || report.recipients,
          status: updates.status || report.status,
          configuration: updates.configuration || report.configuration,
          nextScheduled: calculateNextScheduleDate(updates.frequency || report.frequency)
        };
        
        // Salvar no "banco de dados"
        mockScheduledReports[reportIndex] = updatedReport;
        
        return NextResponse.json({
          message: 'Relatório agendado atualizado com sucesso',
          data: updatedReport
        });
      } catch (error) {
        console.error('Erro ao atualizar relatório agendado:', error);
        return NextResponse.json(
          { message: 'Erro ao atualizar relatório agendado' },
          { status: 500 }
        );
      }
    });
}

// DELETE - Excluir relatório agendado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return new SecureApi()
    .requirePermission('canManageReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        const reportId = params.id;
        
        // Inicializar dados
        await getReports();
        
        // Buscar relatório
        const reportIndex = mockScheduledReports.findIndex(r => r.id === reportId);
        
        // Verificar se o relatório existe
        if (reportIndex === -1) {
          return NextResponse.json(
            { message: 'Relatório agendado não encontrado' },
            { status: 404 }
          );
        }
        
        // Remover do "banco de dados"
        mockScheduledReports.splice(reportIndex, 1);
        
        return NextResponse.json({
          message: 'Relatório agendado excluído com sucesso'
        });
      } catch (error) {
        console.error('Erro ao excluir relatório agendado:', error);
        return NextResponse.json(
          { message: 'Erro ao excluir relatório agendado' },
          { status: 500 }
        );
      }
    });
}

// Função auxiliar para calcular a próxima data de execução
function calculateNextScheduleDate(frequency: string): Date {
  const now = new Date();
  
  switch (frequency) {
    case 'diário':
      // Próximo dia
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0); // 8:00 AM
      return tomorrow;
      
    case 'semanal':
      // Próxima semana, mesmo dia da semana
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(8, 0, 0, 0); // 8:00 AM
      return nextWeek;
      
    case 'mensal':
      // Próximo mês, mesmo dia do mês
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setHours(8, 0, 0, 0); // 8:00 AM
      return nextMonth;
      
    default:
      // Por padrão, amanhã às 8:00
      const defaultDate = new Date(now);
      defaultDate.setDate(defaultDate.getDate() + 1);
      defaultDate.setHours(8, 0, 0, 0); // 8:00 AM
      return defaultDate;
  }
} 