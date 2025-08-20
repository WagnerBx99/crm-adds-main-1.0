import { apiClient } from '../apiClient';
import { toast } from 'sonner';
import {
  ReportFrequency,
  ReportFormat,
  ReportType,
  ReportStatus,
  VisualizationType,
  DateRange
} from '@/types/reports';

export interface FilterCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: any;
}

export interface Filter {
  id: string;
  name: string;
  dateRange?: DateRange;
  conditions: FilterCondition[];
  operator: 'AND' | 'OR';
  favorite?: boolean;
}

export interface ReportConfig {
  visualization: VisualizationType;
  filters?: Filter;
  dateRange?: DateRange;
  groupBy?: string[];
  metrics?: string[];
  columns?: string[];
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
}

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  frequency: ReportFrequency;
  format: ReportFormat;
  recipients: string[];
  lastGenerated?: Date;
  nextScheduled?: Date;
  status: ReportStatus;
  configuration: ReportConfig;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DashboardWidget {
  id: string;
  reportId: string;
  position: { x: number; y: number; w: number; h: number };
  title: string;
  type: VisualizationType;
  filters?: Filter;
}

export interface ReportDataPoint {
  [key: string]: any;
}

export interface ReportData {
  labels?: string[];
  datasets?: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
  rawData?: ReportDataPoint[];
  summary?: {
    total?: number;
    average?: number;
    min?: number;
    max?: number;
    count?: number;
  };
}

class ReportService {
  /**
   * Busca dados para um relatório com base nos parâmetros
   */
  async getReportData(
    reportType: ReportType,
    config: ReportConfig
  ): Promise<ReportData> {
    try {
      const response = await apiClient.post(`/api/reports/data/${reportType}`, {
        config
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      toast.error('Não foi possível carregar os dados do relatório');
      throw error;
    }
  }

  /**
   * Busca relatórios agendados do usuário
   */
  async getScheduledReports(): Promise<ScheduledReport[]> {
    try {
      const response = await apiClient.get('/api/reports/scheduled');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar relatórios agendados:', error);
      toast.error('Não foi possível carregar os relatórios agendados');
      throw error;
    }
  }

  /**
   * Cria um novo relatório agendado
   */
  async createScheduledReport(report: Omit<ScheduledReport, 'id'>): Promise<ScheduledReport> {
    try {
      const response = await apiClient.post('/api/reports/scheduled', report);
      toast.success('Relatório agendado com sucesso');
      return response.data;
    } catch (error) {
      console.error('Erro ao criar relatório agendado:', error);
      toast.error('Não foi possível agendar o relatório');
      throw error;
    }
  }

  /**
   * Atualiza um relatório agendado existente
   */
  async updateScheduledReport(id: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    try {
      const response = await apiClient.put(`/api/reports/scheduled/${id}`, updates);
      toast.success('Relatório atualizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar relatório agendado:', error);
      toast.error('Não foi possível atualizar o relatório');
      throw error;
    }
  }

  /**
   * Exclui um relatório agendado
   */
  async deleteScheduledReport(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/reports/scheduled/${id}`);
      toast.success('Relatório excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir relatório agendado:', error);
      toast.error('Não foi possível excluir o relatório');
      throw error;
    }
  }

  /**
   * Busca dashboards do usuário
   */
  async getDashboards(): Promise<Dashboard[]> {
    try {
      const response = await apiClient.get('/api/reports/dashboards');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dashboards:', error);
      toast.error('Não foi possível carregar os dashboards');
      throw error;
    }
  }

  /**
   * Cria um novo dashboard
   */
  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    try {
      const response = await apiClient.post('/api/reports/dashboards', dashboard);
      toast.success('Dashboard criado com sucesso');
      return response.data;
    } catch (error) {
      console.error('Erro ao criar dashboard:', error);
      toast.error('Não foi possível criar o dashboard');
      throw error;
    }
  }

  /**
   * Atualiza um dashboard existente
   */
  async updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
    try {
      const response = await apiClient.put(`/api/reports/dashboards/${id}`, updates);
      toast.success('Dashboard atualizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
      toast.error('Não foi possível atualizar o dashboard');
      throw error;
    }
  }

  /**
   * Exclui um dashboard
   */
  async deleteDashboard(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/reports/dashboards/${id}`);
      toast.success('Dashboard excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir dashboard:', error);
      toast.error('Não foi possível excluir o dashboard');
      throw error;
    }
  }

  /**
   * Exporta um relatório para o formato especificado
   */
  async exportReport(
    reportType: ReportType,
    config: ReportConfig,
    format: ReportFormat
  ): Promise<string> {
    try {
      const response = await apiClient.post('/api/reports/export', {
        reportType,
        config,
        format
      });
      toast.success(`Relatório exportado com sucesso para ${format.toUpperCase()}`);
      return response.data.downloadUrl;
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Não foi possível exportar o relatório');
      throw error;
    }
  }
}

export const reportService = new ReportService(); 