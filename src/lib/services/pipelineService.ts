/**
 * Pipeline Service - Serviço de Processamento de Dados
 * 
 * Este serviço implementa um pipeline de processamento de dados com:
 * - Fila de processamento com prioridades
 * - Logs de auditoria
 * - Tratamento de erros e retry
 * - Consistência de dados
 */

import { TinyApiService } from '@/lib/integrations/tiny/TinyApiService';
import { TINY_CONFIG } from '@/config';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type PipelineTaskType = 
  | 'sync_clientes'
  | 'sync_pedidos'
  | 'sync_financeiro'
  | 'sync_notas_fiscais'
  | 'update_order_status'
  | 'process_art_approval'
  | 'generate_report'
  | 'backup_data';

export type PipelineTaskStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'retrying';

export type PipelineTaskPriority = 'low' | 'normal' | 'high' | 'critical';

export interface PipelineTask {
  id: string;
  type: PipelineTaskType;
  status: PipelineTaskStatus;
  priority: PipelineTaskPriority;
  payload: Record<string, any>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  result?: any;
}

export interface PipelineLog {
  id: string;
  taskId: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: Record<string, any>;
}

export interface PipelineStats {
  totalTasks: number;
  pendingTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  lastProcessedAt?: Date;
}

// ============================================
// PIPELINE SERVICE CLASS
// ============================================

class PipelineService {
  private tasks: Map<string, PipelineTask> = new Map();
  private logs: PipelineLog[] = [];
  private isProcessing: boolean = false;
  private tinyApi: TinyApiService | null = null;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeTinyApi();
  }

  /**
   * Inicializa a conexão com a API do Tiny
   */
  private initializeTinyApi(): void {
    try {
      this.tinyApi = new TinyApiService({
        token: TINY_CONFIG.API_TOKEN,
        baseUrl: TINY_CONFIG.API_BASE_URL,
        cache: false,
        timeout: 30000
      });
      this.log('info', 'system', 'TinyAPI inicializada com sucesso');
    } catch (error) {
      this.log('error', 'system', 'Erro ao inicializar TinyAPI', { error });
    }
  }

  /**
   * Gera um ID único para tarefas e logs
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Adiciona um log ao sistema
   */
  private log(
    level: PipelineLog['level'],
    taskId: string,
    message: string,
    details?: Record<string, any>
  ): void {
    const logEntry: PipelineLog = {
      id: this.generateId(),
      taskId,
      timestamp: new Date(),
      level,
      message,
      details
    };

    this.logs.push(logEntry);
    
    // Manter apenas os últimos 1000 logs em memória
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Log no console para debug
    const prefix = `[Pipeline ${level.toUpperCase()}]`;
    if (level === 'error') {
      console.error(prefix, message, details || '');
    } else if (level === 'warn') {
      console.warn(prefix, message, details || '');
    } else {
      console.log(prefix, message, details || '');
    }

    // Persistir logs importantes no localStorage
    if (level === 'error' || level === 'warn') {
      this.persistLog(logEntry);
    }
  }

  /**
   * Persiste logs importantes no localStorage
   */
  private persistLog(logEntry: PipelineLog): void {
    try {
      const storedLogs = JSON.parse(localStorage.getItem('pipeline_logs') || '[]');
      storedLogs.push(logEntry);
      
      // Manter apenas os últimos 100 logs persistidos
      const trimmedLogs = storedLogs.slice(-100);
      localStorage.setItem('pipeline_logs', JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('[Pipeline] Erro ao persistir log:', error);
    }
  }

  /**
   * Adiciona uma nova tarefa ao pipeline
   */
  public addTask(
    type: PipelineTaskType,
    payload: Record<string, any> = {},
    priority: PipelineTaskPriority = 'normal',
    maxRetries: number = 3
  ): PipelineTask {
    const task: PipelineTask = {
      id: this.generateId(),
      type,
      status: 'pending',
      priority,
      payload,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries
    };

    this.tasks.set(task.id, task);
    this.log('info', task.id, `Tarefa adicionada: ${type}`, { priority, payload });

    // Iniciar processamento se não estiver rodando
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return task;
  }

  /**
   * Obtém a próxima tarefa a ser processada (por prioridade)
   */
  private getNextTask(): PipelineTask | null {
    const priorityOrder: PipelineTaskPriority[] = ['critical', 'high', 'normal', 'low'];
    
    for (const priority of priorityOrder) {
      for (const task of this.tasks.values()) {
        if (task.status === 'pending' && task.priority === priority) {
          return task;
        }
      }
    }
    
    return null;
  }

  /**
   * Inicia o processamento do pipeline
   */
  public startProcessing(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.log('info', 'system', 'Pipeline iniciado');

    this.processingInterval = setInterval(() => {
      this.processNextTask();
    }, 1000); // Processa uma tarefa por segundo
  }

  /**
   * Para o processamento do pipeline
   */
  public stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    this.log('info', 'system', 'Pipeline parado');
  }

  /**
   * Processa a próxima tarefa na fila
   */
  private async processNextTask(): Promise<void> {
    const task = this.getNextTask();
    if (!task) return;

    task.status = 'processing';
    task.startedAt = new Date();
    this.log('info', task.id, `Processando tarefa: ${task.type}`);

    try {
      const result = await this.executeTask(task);
      
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      
      this.log('info', task.id, `Tarefa concluída: ${task.type}`, { 
        duration: task.completedAt.getTime() - task.startedAt!.getTime() 
      });

    } catch (error: any) {
      task.error = error.message || 'Erro desconhecido';
      task.retryCount++;

      if (task.retryCount < task.maxRetries) {
        task.status = 'retrying';
        this.log('warn', task.id, `Tarefa falhou, tentando novamente (${task.retryCount}/${task.maxRetries})`, { error: task.error });
        
        // Reagendar com delay exponencial
        setTimeout(() => {
          task.status = 'pending';
        }, Math.pow(2, task.retryCount) * 1000);

      } else {
        task.status = 'failed';
        task.completedAt = new Date();
        this.log('error', task.id, `Tarefa falhou definitivamente: ${task.type}`, { error: task.error });
      }
    }
  }

  /**
   * Executa uma tarefa específica
   */
  private async executeTask(task: PipelineTask): Promise<any> {
    switch (task.type) {
      case 'sync_clientes':
        return this.syncClientes(task.payload);
      
      case 'sync_pedidos':
        return this.syncPedidos(task.payload);
      
      case 'sync_financeiro':
        return this.syncFinanceiro(task.payload);
      
      case 'sync_notas_fiscais':
        return this.syncNotasFiscais(task.payload);
      
      case 'update_order_status':
        return this.updateOrderStatus(task.payload);
      
      case 'process_art_approval':
        return this.processArtApproval(task.payload);
      
      case 'generate_report':
        return this.generateReport(task.payload);
      
      case 'backup_data':
        return this.backupData(task.payload);
      
      default:
        throw new Error(`Tipo de tarefa desconhecido: ${task.type}`);
    }
  }

  // ============================================
  // IMPLEMENTAÇÕES DE TAREFAS
  // ============================================

  private async syncClientes(payload: Record<string, any>): Promise<any> {
    if (!this.tinyApi) throw new Error('TinyAPI não inicializada');
    
    const clientes = await this.tinyApi.getClientes(payload.filtros, true);
    
    // Salvar no localStorage para persistência local
    localStorage.setItem('sync_clientes', JSON.stringify({
      data: clientes,
      syncedAt: new Date().toISOString()
    }));

    return { count: clientes.length, syncedAt: new Date() };
  }

  private async syncPedidos(payload: Record<string, any>): Promise<any> {
    if (!this.tinyApi) throw new Error('TinyAPI não inicializada');
    
    const pedidos = await this.tinyApi.getPedidos(payload.filtros, true);
    
    localStorage.setItem('sync_pedidos', JSON.stringify({
      data: pedidos,
      syncedAt: new Date().toISOString()
    }));

    return { count: pedidos.length, syncedAt: new Date() };
  }

  private async syncFinanceiro(payload: Record<string, any>): Promise<any> {
    if (!this.tinyApi) throw new Error('TinyAPI não inicializada');
    
    const { dataInicial, dataFinal } = payload;
    
    // Buscar contas a pagar e receber em paralelo
    const [contasPagar, contasReceber] = await Promise.all([
      this.tinyApi.getContasPagar({ dataInicial, dataFinal }, true),
      this.tinyApi.getContasReceber({ dataInicial, dataFinal }, true)
    ]);

    localStorage.setItem('sync_financeiro', JSON.stringify({
      contasPagar,
      contasReceber,
      syncedAt: new Date().toISOString()
    }));

    return { 
      contasPagar: contasPagar.length, 
      contasReceber: contasReceber.length,
      syncedAt: new Date() 
    };
  }

  private async syncNotasFiscais(payload: Record<string, any>): Promise<any> {
    if (!this.tinyApi) throw new Error('TinyAPI não inicializada');
    
    const notas = await this.tinyApi.getNotasFiscais(payload.filtros, true);
    
    localStorage.setItem('sync_notas_fiscais', JSON.stringify({
      data: notas,
      syncedAt: new Date().toISOString()
    }));

    return { count: notas.length, syncedAt: new Date() };
  }

  private async updateOrderStatus(payload: Record<string, any>): Promise<any> {
    const { orderId, newStatus, userId } = payload;
    
    // Atualizar no localStorage
    const ordersData = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = ordersData.findIndex((o: any) => o.id === orderId);
    
    if (orderIndex === -1) {
      throw new Error(`Pedido não encontrado: ${orderId}`);
    }

    const oldStatus = ordersData[orderIndex].status;
    ordersData[orderIndex].status = newStatus;
    ordersData[orderIndex].updatedAt = new Date().toISOString();
    ordersData[orderIndex].history = ordersData[orderIndex].history || [];
    ordersData[orderIndex].history.push({
      id: this.generateId(),
      date: new Date().toISOString(),
      status: newStatus,
      user: userId || 'Sistema',
      comment: `Status alterado de ${oldStatus} para ${newStatus}`
    });

    localStorage.setItem('orders', JSON.stringify(ordersData));

    return { orderId, oldStatus, newStatus, updatedAt: new Date() };
  }

  private async processArtApproval(payload: Record<string, any>): Promise<any> {
    const { orderId, approved, feedback, artVersion } = payload;
    
    const ordersData = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = ordersData.findIndex((o: any) => o.id === orderId);
    
    if (orderIndex === -1) {
      throw new Error(`Pedido não encontrado: ${orderId}`);
    }

    const order = ordersData[orderIndex];
    order.artApproval = order.artApproval || [];
    order.artApproval.push({
      id: this.generateId(),
      version: artVersion,
      approved,
      feedback,
      processedAt: new Date().toISOString()
    });

    if (approved) {
      order.status = 'arte_aprovada';
    } else {
      order.status = 'revisao_arte';
    }

    order.updatedAt = new Date().toISOString();
    localStorage.setItem('orders', JSON.stringify(ordersData));

    return { orderId, approved, version: artVersion, processedAt: new Date() };
  }

  private async generateReport(payload: Record<string, any>): Promise<any> {
    const { reportType, filters } = payload;
    
    // Gerar relatório baseado no tipo
    const report = {
      id: this.generateId(),
      type: reportType,
      filters,
      generatedAt: new Date().toISOString(),
      data: {} as any
    };

    switch (reportType) {
      case 'orders_summary':
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        report.data = {
          total: orders.length,
          byStatus: orders.reduce((acc: any, o: any) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
          }, {})
        };
        break;
      
      case 'financial_summary':
        const financeiro = JSON.parse(localStorage.getItem('sync_financeiro') || '{}');
        report.data = financeiro;
        break;
    }

    // Salvar relatório
    const reports = JSON.parse(localStorage.getItem('generated_reports') || '[]');
    reports.push(report);
    localStorage.setItem('generated_reports', JSON.stringify(reports.slice(-50)));

    return report;
  }

  private async backupData(payload: Record<string, any>): Promise<any> {
    const backup = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      data: {
        orders: localStorage.getItem('orders'),
        clientes: localStorage.getItem('sync_clientes'),
        pedidos: localStorage.getItem('sync_pedidos'),
        financeiro: localStorage.getItem('sync_financeiro'),
        notas: localStorage.getItem('sync_notas_fiscais')
      }
    };

    // Salvar backup
    const backups = JSON.parse(localStorage.getItem('data_backups') || '[]');
    backups.push(backup);
    
    // Manter apenas os últimos 10 backups
    localStorage.setItem('data_backups', JSON.stringify(backups.slice(-10)));

    return { backupId: backup.id, createdAt: backup.createdAt };
  }

  // ============================================
  // MÉTODOS PÚBLICOS DE CONSULTA
  // ============================================

  /**
   * Obtém estatísticas do pipeline
   */
  public getStats(): PipelineStats {
    const tasks = Array.from(this.tasks.values());
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    let totalProcessingTime = 0;
    completedTasks.forEach(t => {
      if (t.startedAt && t.completedAt) {
        totalProcessingTime += t.completedAt.getTime() - t.startedAt.getTime();
      }
    });

    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      processingTasks: tasks.filter(t => t.status === 'processing').length,
      completedTasks: completedTasks.length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      averageProcessingTime: completedTasks.length > 0 
        ? totalProcessingTime / completedTasks.length 
        : 0,
      lastProcessedAt: completedTasks.length > 0 
        ? completedTasks[completedTasks.length - 1].completedAt 
        : undefined
    };
  }

  /**
   * Obtém uma tarefa pelo ID
   */
  public getTask(taskId: string): PipelineTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Obtém todas as tarefas
   */
  public getAllTasks(): PipelineTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Obtém logs do pipeline
   */
  public getLogs(limit: number = 100): PipelineLog[] {
    return this.logs.slice(-limit);
  }

  /**
   * Obtém logs de uma tarefa específica
   */
  public getTaskLogs(taskId: string): PipelineLog[] {
    return this.logs.filter(log => log.taskId === taskId);
  }

  /**
   * Limpa tarefas concluídas ou falhas antigas
   */
  public cleanupTasks(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, task] of this.tasks.entries()) {
      if (
        (task.status === 'completed' || task.status === 'failed') &&
        task.completedAt &&
        now - task.completedAt.getTime() > olderThanMs
      ) {
        this.tasks.delete(id);
        cleaned++;
      }
    }

    this.log('info', 'system', `Limpeza de tarefas: ${cleaned} removidas`);
    return cleaned;
  }

  /**
   * Cancela uma tarefa pendente
   */
  public cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'pending') {
      this.tasks.delete(taskId);
      this.log('info', taskId, 'Tarefa cancelada');
      return true;
    }
    return false;
  }
}

// Exportar instância singleton
export const pipelineService = new PipelineService();

// Exportar classe para testes
export { PipelineService };
