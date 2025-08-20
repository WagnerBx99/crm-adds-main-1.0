import { NextRequest, NextResponse } from 'next/server';
import { SecureApi } from '@/lib/services/apiAdapter';
import { AuthRequest } from '@/lib/middleware/authMiddleware';
import { ReportType, VisualizationType } from '@/types/reports';
import { mockDashboards } from '../mockData';

// Interface para as solicitações de widget dinâmicos
interface WidgetRequest {
  id: string;
  type: ReportType;
  visualization: VisualizationType;
  title: string;
  dateRange?: any;
  filters?: any;
}

// Função para gerar dados de um widget de dashboard
function generateWidgetData(widget: WidgetRequest) {
  const { type, visualization } = widget;
  
  // Dados básicos baseados no tipo e visualização
  switch (type) {
    case 'vendas':
      if (visualization === 'line' || visualization === 'bar') {
        return {
          labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
          datasets: [
            {
              label: 'Vendas 2023',
              data: [65, 59, 80, 81, 56, 55],
              borderColor: 'rgb(53, 162, 235)',
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
            }
          ]
        };
      } else if (visualization === 'donut' || visualization === 'pie') {
        return {
          labels: ['Produto A', 'Produto B', 'Produto C', 'Produto D'],
          datasets: [
            {
              data: [300, 250, 150, 100],
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
              ],
            }
          ]
        };
      }
      break;
      
    case 'status':
      if (visualization === 'donut' || visualization === 'pie') {
        return {
          labels: ['Em Análise', 'Aprovado', 'Em Produção', 'Finalizado', 'Cancelado'],
          datasets: [
            {
              data: [12, 19, 8, 15, 5],
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
              ],
            }
          ]
        };
      } else if (visualization === 'table') {
        return {
          headers: ['Status', 'Quantidade', 'Porcentagem'],
          rows: [
            ['Em Análise', '12', '20%'],
            ['Aprovado', '19', '32%'],
            ['Em Produção', '8', '13%'],
            ['Finalizado', '15', '25%'],
            ['Cancelado', '5', '10%'],
          ]
        };
      }
      break;
      
    case 'leadTime':
      if (visualization === 'bar') {
        return {
          labels: ['Análise', 'Aprovação', 'Produção', 'Testes', 'Entrega'],
          datasets: [
            {
              label: 'Tempo Médio (horas)',
              data: [12, 8, 24, 6, 3],
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            }
          ]
        };
      }
      break;
      
    case 'produtividade':
      if (visualization === 'radar') {
        return {
          labels: ['Velocidade', 'Qualidade', 'Eficiência', 'Entrega no Prazo', 'Custo'],
          datasets: [
            {
              label: 'Equipe A',
              data: [85, 90, 78, 95, 70],
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgb(255, 99, 132)',
            },
            {
              label: 'Equipe B',
              data: [75, 95, 85, 80, 85],
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgb(54, 162, 235)',
            }
          ]
        };
      }
      break;
      
    case 'topClientes':
      if (visualization === 'bar' || visualization === 'table') {
        return {
          labels: ['Cliente A', 'Cliente B', 'Cliente C', 'Cliente D', 'Cliente E'],
          datasets: [
            {
              label: 'Valor Total (R$)',
              data: [120000, 98000, 75000, 62000, 45000],
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            }
          ]
        };
      }
      break;
  }
  
  // Dados genéricos para outros tipos
  return {
    labels: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
    datasets: [
      {
        label: 'Dados',
        data: [12, 19, 3, 5, 2],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      }
    ]
  };
}

// Endpoint para gerar dados de dashboard
export async function POST(request: NextRequest) {
  return new SecureApi()
    .requirePermission('canViewReports')
    .handle(request, async (req: AuthRequest) => {
      try {
        const { widgets, dashboardId } = await request.json();
        
        // Validação básica
        if (!widgets && !dashboardId) {
          return NextResponse.json(
            { message: 'É necessário fornecer widgets ou dashboardId' },
            { status: 400 }
          );
        }
        
        let widgetsToProcess: WidgetRequest[] = [];
        
        // Se fornecido um dashboardId, buscar os widgets desse dashboard
        if (dashboardId) {
          const dashboard = mockDashboards.find(d => d.id === dashboardId);
          
          if (!dashboard) {
            return NextResponse.json(
              { message: 'Dashboard não encontrado' },
              { status: 404 }
            );
          }
          
          // Converter widgets do dashboard para o formato esperado
          widgetsToProcess = dashboard.widgets.map(w => ({
            id: w.id,
            type: w.reportId.split('-')[0] as ReportType, // Extrair tipo do reportId
            visualization: w.type,
            title: w.title,
            dateRange: undefined,
            filters: undefined
          }));
        } else {
          // Usar os widgets fornecidos diretamente
          widgetsToProcess = widgets;
        }
        
        // Gerar dados para cada widget
        const results = {};
        
        for (const widget of widgetsToProcess) {
          results[widget.id] = {
            title: widget.title,
            type: widget.type,
            visualization: widget.visualization,
            data: generateWidgetData(widget)
          };
        }
        
        return NextResponse.json({ widgets: results });
      } catch (error) {
        console.error('Erro ao gerar dados do dashboard:', error);
        return NextResponse.json(
          { message: 'Erro ao processar dados do dashboard' },
          { status: 500 }
        );
      }
    });
} 