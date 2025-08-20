import { NextRequest, NextResponse } from 'next/server';
import { SecureApi } from '@/lib/services/apiAdapter';
import { AuthRequest } from '@/lib/middleware/authMiddleware';
import { ReportType } from '@/types/reports';

// Função auxiliar para gerar dados fictícios
function generateMockData(type: ReportType, startDate?: Date, endDate?: Date) {
  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = endDate || new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Gerar datas entre start e end
  const dates: Date[] = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  switch (type) {
    case 'vendas':
      return {
        labels: dates.map(d => d.toLocaleDateString('pt-BR')),
        datasets: [
          {
            label: 'Vendas (R$)',
            data: dates.map(() => Math.floor(Math.random() * 5000) + 1000),
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          }
        ],
        summary: {
          total: 75000,
          average: 2500,
          min: 1000,
          max: 6000
        }
      };
    
    case 'status':
      const statusLabels = ['Em Análise', 'Aprovado', 'Em Produção', 'Finalizado', 'Cancelado'];
      const statusData = statusLabels.map(() => Math.floor(Math.random() * 30) + 5);
      const total = statusData.reduce((sum, val) => sum + val, 0);
      
      return {
        labels: statusLabels,
        datasets: [
          {
            label: 'Distribuição de Status',
            data: statusData,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
          }
        ],
        summary: {
          total,
          count: total
        }
      };
    
    case 'leadTime':
      const etapas = ['Análise', 'Aprovação', 'Desenvolvimento', 'Testes', 'Entrega'];
      
      return {
        labels: etapas,
        datasets: [
          {
            label: 'Tempo Médio (horas)',
            data: etapas.map(() => Math.floor(Math.random() * 24) + 4),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          }
        ],
        rawData: etapas.map(etapa => ({
          etapa,
          tempo_medio: Math.floor(Math.random() * 24) + 4,
          tempo_minimo: Math.floor(Math.random() * 4) + 1,
          tempo_maximo: Math.floor(Math.random() * 48) + 24
        })),
        summary: {
          average: 12
        }
      };
    
    case 'topClientes':
      const clientes = ['Empresa A', 'Empresa B', 'Empresa C', 'Empresa D', 'Empresa E'];
      
      return {
        labels: clientes,
        datasets: [
          {
            label: 'Quantidade de Pedidos',
            data: clientes.map(() => Math.floor(Math.random() * 50) + 10),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
          }
        ],
        rawData: clientes.map(cliente => ({
          cliente,
          quantidade_pedidos: Math.floor(Math.random() * 50) + 10,
          valor_total: Math.floor(Math.random() * 100000) + 10000,
          ticket_medio: Math.floor(Math.random() * 5000) + 1000
        }))
      };
    
    case 'aprovacao':
      const taxaAprovacao = Math.floor(Math.random() * 40) + 60; // 60-100%
      
      return {
        labels: ['Aprovado', 'Não Aprovado'],
        datasets: [
          {
            label: 'Taxa de Aprovação',
            data: [taxaAprovacao, 100 - taxaAprovacao],
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)',
              'rgba(255, 99, 132, 0.6)'
            ],
          }
        ],
        summary: {
          average: taxaAprovacao
        }
      };
      
    default:
      // Dados genéricos
      return {
        labels: dates.map(d => d.toLocaleDateString('pt-BR')),
        datasets: [
          {
            label: 'Dados',
            data: dates.map(() => Math.floor(Math.random() * 100)),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
          }
        ]
      };
  }
}

// Endpoint para obter dados de relatórios
export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  return new SecureApi()
    .requirePermission('canViewReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        const reportType = params.type as ReportType;
        const { config } = await request.json();
        
        // Validar tipo de relatório
        const validTypes: ReportType[] = [
          'vendas', 'estoque', 'clientes', 'financeiro', 
          'produção', 'desempenho', 'kanban', 'status', 
          'leadTime', 'aprovacao', 'retrabalho', 'topClientes', 
          'produtosMaisVendidos', 'produtividade', 'atrasados'
        ];
        
        if (!validTypes.includes(reportType)) {
          return NextResponse.json(
            { message: 'Tipo de relatório inválido' },
            { status: 400 }
          );
        }
        
        // Obter datas do filtro, se disponíveis
        const startDate = config.dateRange?.from ? new Date(config.dateRange.from) : undefined;
        const endDate = config.dateRange?.to ? new Date(config.dateRange.to) : undefined;
        
        // Gerar dados fictícios com base no tipo de relatório
        const data = generateMockData(reportType, startDate, endDate);
        
        // Registrar acesso
        console.log(`Usuário ${req.user?.id} acessou relatório ${reportType}`);
        
        return NextResponse.json(data);
      } catch (error) {
        console.error('Erro ao gerar dados do relatório:', error);
        return NextResponse.json(
          { message: 'Erro ao processar dados do relatório' },
          { status: 500 }
        );
      }
    });
} 