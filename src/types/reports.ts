/**
 * Tipos para módulo de relatórios
 */

export type ReportFrequency = 'diário' | 'semanal' | 'mensal' | 'sob demanda';

export type ReportType = 
  | 'vendas' 
  | 'estoque' 
  | 'clientes' 
  | 'financeiro' 
  | 'produção' 
  | 'desempenho' 
  | 'kanban' 
  | 'status' 
  | 'leadTime' 
  | 'aprovacao' 
  | 'retrabalho' 
  | 'topClientes' 
  | 'produtosMaisVendidos' 
  | 'produtividade' 
  | 'atrasados';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'html' | 'json';

export type ReportStatus = 'ativo' | 'inativo';

export type VisualizationType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'donut' 
  | 'radar' 
  | 'table' 
  | 'gauge' 
  | 'card' 
  | 'kpi' 
  | 'stackedBar' 
  | 'heatmap' 
  | 'gantt';

export interface DateRange {
  from?: Date;
  to?: Date;
  preset?: string;
} 