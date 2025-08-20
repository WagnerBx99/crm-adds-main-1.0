import { NextRequest, NextResponse } from 'next/server';
import { SecureApi } from '@/lib/services/apiAdapter';
import { AuthRequest } from '@/lib/middleware/authMiddleware';
import { ScheduledReport, ReportStatus } from '@/lib/services/reportService';

// Dados simulados para relatórios agendados
let mockScheduledReports: ScheduledReport[] = [
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

// GET - Listar relatórios agendados
export async function GET(request: NextRequest) {
  return new SecureApi()
    .requirePermission('canViewReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        // Filtrar por status se solicitado
        const url = new URL(request.url);
        const status = url.searchParams.get('status') as ReportStatus | null;
        
        // Filtrar os relatórios
        const filteredReports = status 
          ? mockScheduledReports.filter(report => report.status === status)
          : mockScheduledReports;
        
        return NextResponse.json(filteredReports);
      } catch (error) {
        console.error('Erro ao buscar relatórios agendados:', error);
        return NextResponse.json(
          { message: 'Erro ao buscar relatórios agendados' },
          { status: 500 }
        );
      }
    });
}

// POST - Criar novo relatório agendado
export async function POST(request: NextRequest) {
  return new SecureApi()
    .requirePermission('canManageReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        const data = await request.json();
        
        // Validação básica
        if (!data.name || !data.type || !data.frequency || !data.format) {
          return NextResponse.json(
            { message: 'Dados incompletos. Nome, tipo, frequência e formato são obrigatórios.' },
            { status: 400 }
          );
        }
        
        // Calcular próxima data de execução com base na frequência
        const nextScheduled = calculateNextScheduleDate(data.frequency);
        
        const newReport: ScheduledReport = {
          id: `report-${Date.now()}`,
          name: data.name,
          description: data.description || '',
          type: data.type,
          frequency: data.frequency,
          format: data.format,
          recipients: data.recipients || [],
          nextScheduled,
          status: 'ativo',
          configuration: data.configuration
        };
        
        // Adicionar ao "banco de dados"
        mockScheduledReports.push(newReport);
        
        return NextResponse.json(
          { message: 'Relatório agendado com sucesso', data: newReport },
          { status: 201 }
        );
      } catch (error) {
        console.error('Erro ao criar relatório agendado:', error);
        return NextResponse.json(
          { message: 'Erro ao criar relatório agendado' },
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