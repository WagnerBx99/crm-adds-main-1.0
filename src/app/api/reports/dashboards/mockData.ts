import { Dashboard } from '@/lib/services/reportService';

// Simulação de banco de dados de dashboards
export const mockDashboards: Dashboard[] = [
  {
    id: '1',
    name: 'Visão Geral do Negócio',
    description: 'Principais indicadores de desempenho do negócio',
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date(2023, 0, 1),
    widgets: [
      {
        id: 'widget-1',
        reportId: 'pedidos-periodo',
        position: { x: 0, y: 0, w: 8, h: 4 },
        title: 'Volume de Pedidos por Período',
        type: 'line'
      },
      {
        id: 'widget-2',
        reportId: 'distribuicao-status',
        position: { x: 8, y: 0, w: 4, h: 4 },
        title: 'Distribuição de Status',
        type: 'donut'
      },
      {
        id: 'widget-3',
        reportId: 'top-clientes',
        position: { x: 0, y: 4, w: 6, h: 4 },
        title: 'Top 5 Clientes',
        type: 'bar'
      },
      {
        id: 'widget-4',
        reportId: 'taxa-aprovacao',
        position: { x: 6, y: 4, w: 6, h: 4 },
        title: 'Taxa de Aprovação',
        type: 'gauge'
      }
    ]
  },
  {
    id: '2',
    name: 'Dashboard de Produção',
    description: 'Métricas relacionadas à produção e lead time',
    createdBy: 'system',
    createdAt: new Date(2023, 1, 15),
    widgets: [
      {
        id: 'widget-5',
        reportId: 'lead-time-medio',
        position: { x: 0, y: 0, w: 12, h: 4 },
        title: 'Lead Time Médio por Etapa',
        type: 'bar'
      },
      {
        id: 'widget-6',
        reportId: 'produtividade-colaborador',
        position: { x: 0, y: 4, w: 6, h: 4 },
        title: 'Produtividade por Colaborador',
        type: 'radar'
      },
      {
        id: 'widget-7',
        reportId: 'pedidos-atrasados',
        position: { x: 6, y: 4, w: 6, h: 4 },
        title: 'Pedidos Atrasados',
        type: 'table'
      }
    ]
  }
]; 