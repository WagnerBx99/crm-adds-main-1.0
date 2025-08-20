/**
 * Serviço de Logs e Auditoria
 * 
 * Este módulo fornece funcionalidades para registrar, consultar e exportar
 * eventos de segurança e auditoria no sistema.
 */

import { cryptoService } from './cryptoService';
import { v4 as uuidv4 } from 'uuid';

// Tipos de eventos que podem ser registrados
export enum LogEventType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  ADMIN_ACTION = 'ADMIN_ACTION',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  SECURITY_SETTING_CHANGED = 'SECURITY_SETTING_CHANGED',
  API_ACCESS = 'API_ACCESS',
  EXPORT_DATA = 'EXPORT_DATA',
  KEY_ROTATION = 'KEY_ROTATION',
  CRITICAL_ERROR = 'CRITICAL_ERROR',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

// Níveis de severidade dos logs
export enum LogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Interface para entradas de log
export interface LogEntry {
  id: string;
  timestamp: number;
  eventType: LogEventType;
  severity: LogSeverity;
  userId?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  details?: any;
  resource?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

// Opções para filtragem de logs
export interface LogFilterOptions {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: LogEventType[];
  severity?: LogSeverity[];
  userId?: string;
  username?: string;
  ipAddress?: string;
  resource?: string;
  status?: 'success' | 'failure';
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  sortBy?: keyof LogEntry;
  sortDirection?: 'asc' | 'desc';
}

class LogService {
  private static instance: LogService;
  private readonly STORAGE_KEY = 'security_audit_logs';
  private readonly MAX_LOCAL_LOGS = 1000; // Limite para armazenamento local
  private logs: LogEntry[] = [];
  private alertCallbacks: Array<(log: LogEntry) => void> = [];
  
  private constructor() {
    this.loadLogsFromStorage();
  }
  
  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }
  
  /**
   * Carregar logs do armazenamento local
   */
  private loadLogsFromStorage(): void {
    try {
      const encryptedLogs = localStorage.getItem(this.STORAGE_KEY);
      
      if (encryptedLogs) {
        const decryptedLogs = cryptoService.decrypt(encryptedLogs, 'DOCUMENTS');
        this.logs = JSON.parse(decryptedLogs);
        console.log(`${this.logs.length} logs carregados do armazenamento local`);
      }
    } catch (error) {
      console.error('Erro ao carregar logs do armazenamento:', error);
      this.logs = [];
    }
  }
  
  /**
   * Salvar logs no armazenamento local
   */
  private saveLogsToStorage(): void {
    try {
      // Limitar o número de logs armazenados localmente
      const logsToSave = this.logs.slice(-this.MAX_LOCAL_LOGS);
      
      const logsJson = JSON.stringify(logsToSave);
      const encryptedLogs = cryptoService.encrypt(logsJson, 'DOCUMENTS');
      
      localStorage.setItem(this.STORAGE_KEY, encryptedLogs);
    } catch (error) {
      console.error('Erro ao salvar logs no armazenamento:', error);
    }
  }
  
  /**
   * Registrar um novo evento de log
   * @param eventType Tipo do evento
   * @param severity Severidade do log
   * @param action Descrição da ação realizada
   * @param details Detalhes adicionais sobre o evento (opcional)
   * @param options Opções adicionais para o log
   * @returns O objeto de log criado
   */
  public log(
    eventType: LogEventType,
    severity: LogSeverity,
    action: string,
    details?: any,
    options?: {
      userId?: string;
      username?: string;
      ipAddress?: string;
      userAgent?: string;
      resource?: string;
      status?: 'success' | 'failure';
      errorMessage?: string;
    }
  ): LogEntry {
    const logEntry: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      eventType,
      severity,
      action,
      details: details || {},
      status: options?.status || 'success',
      ...options
    };
    
    // Adicionar à lista de logs
    this.logs.push(logEntry);
    
    // Salvar no armazenamento local
    this.saveLogsToStorage();
    
    // Em uma implementação real, enviar para um servidor de logs também
    this.sendToServer(logEntry);
    
    // Verificar se é preciso disparar alertas
    this.checkForAlerts(logEntry);
    
    return logEntry;
  }
  
  /**
   * Enviar log para o servidor (simulado)
   * @param logEntry Entrada de log a ser enviada
   */
  private sendToServer(logEntry: LogEntry): void {
    // Simulação - em um sistema real, isto enviaria o log para um servidor
    // usando uma API ou um serviço de logging como Sentry, LogRocket, etc.
    console.log('Log enviado para servidor:', logEntry);
    
    // Aqui seria algo como:
    // api.post('/logs', logEntry).catch(error => {
    //   console.error('Erro ao enviar log para o servidor:', error);
    // });
  }
  
  /**
   * Verificar se o log deve disparar alertas
   * @param logEntry Entrada de log a ser verificada
   */
  private checkForAlerts(logEntry: LogEntry): void {
    // Verificar se o log é de severidade alta ou um tipo que requer alerta
    const requiresAlert = 
      logEntry.severity === LogSeverity.CRITICAL || 
      logEntry.severity === LogSeverity.ERROR ||
      logEntry.eventType === LogEventType.SUSPICIOUS_ACTIVITY ||
      (logEntry.eventType === LogEventType.LOGIN_FAILED && 
       logEntry.details?.attemptCount >= 3);
    
    if (requiresAlert) {
      // Notificar todos os callbacks registrados
      this.alertCallbacks.forEach(callback => {
        try {
          callback(logEntry);
        } catch (error) {
          console.error('Erro ao processar alerta:', error);
        }
      });
    }
  }
  
  /**
   * Consultar logs com filtros
   * @param options Opções de filtragem
   * @returns Logs filtrados e paginados
   */
  public queryLogs(options: LogFilterOptions = {}): {
    logs: LogEntry[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    let filteredLogs = [...this.logs];
    
    // Aplicar filtros
    if (options.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        log.timestamp >= options.startDate!.getTime()
      );
    }
    
    if (options.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        log.timestamp <= options.endDate!.getTime()
      );
    }
    
    if (options.eventTypes && options.eventTypes.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        options.eventTypes!.includes(log.eventType)
      );
    }
    
    if (options.severity && options.severity.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        options.severity!.includes(log.severity)
      );
    }
    
    if (options.userId) {
      filteredLogs = filteredLogs.filter(log => 
        log.userId === options.userId
      );
    }
    
    if (options.username) {
      filteredLogs = filteredLogs.filter(log => 
        log.username && log.username.toLowerCase().includes(options.username!.toLowerCase())
      );
    }
    
    if (options.ipAddress) {
      filteredLogs = filteredLogs.filter(log => 
        log.ipAddress && log.ipAddress.includes(options.ipAddress!)
      );
    }
    
    if (options.resource) {
      filteredLogs = filteredLogs.filter(log => 
        log.resource && log.resource.toLowerCase().includes(options.resource!.toLowerCase())
      );
    }
    
    if (options.status) {
      filteredLogs = filteredLogs.filter(log => 
        log.status === options.status
      );
    }
    
    if (options.searchTerm) {
      const searchTerm = options.searchTerm.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        (log.action && log.action.toLowerCase().includes(searchTerm)) || 
        (log.username && log.username.toLowerCase().includes(searchTerm)) ||
        (log.ipAddress && log.ipAddress.includes(searchTerm)) ||
        (log.resource && log.resource.toLowerCase().includes(searchTerm)) ||
        (log.errorMessage && log.errorMessage.toLowerCase().includes(searchTerm))
      );
    }
    
    // Ordenação
    if (options.sortBy) {
      const direction = options.sortDirection === 'desc' ? -1 : 1;
      filteredLogs.sort((a, b) => {
        const valA = a[options.sortBy!];
        const valB = b[options.sortBy!];
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return direction * valA.localeCompare(valB);
        } else {
          return direction * ((valA > valB) ? 1 : ((valB > valA) ? -1 : 0));
        }
      });
    } else {
      // Ordenação padrão: mais recentes primeiro
      filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    // Paginação
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const totalCount = filteredLogs.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    return {
      logs: paginatedLogs,
      totalCount,
      page,
      pageSize,
      totalPages
    };
  }
  
  /**
   * Exportar logs para formato CSV
   * @param filteredLogs Logs já filtrados para exportação
   * @returns String contendo os logs em formato CSV
   */
  public exportToCSV(filteredLogs: LogEntry[]): string {
    if (filteredLogs.length === 0) {
      return '';
    }
    
    // Colunas do CSV
    const columns = [
      'ID', 'Data', 'Hora', 'Tipo', 'Severidade', 'Usuário ID', 
      'Nome de Usuário', 'Endereço IP', 'Ação', 'Recurso', 
      'Status', 'Mensagem de Erro'
    ];
    
    // Linha de cabeçalho
    let csv = columns.join(';') + '\n';
    
    // Processar cada log
    for (const log of filteredLogs) {
      const date = new Date(log.timestamp);
      const dateStr = date.toLocaleDateString('pt-BR');
      const timeStr = date.toLocaleTimeString('pt-BR');
      
      const row = [
        log.id,
        dateStr,
        timeStr,
        log.eventType,
        log.severity,
        log.userId || '',
        log.username || '',
        log.ipAddress || '',
        log.action,
        log.resource || '',
        log.status,
        log.errorMessage || ''
      ];
      
      // Garantir que células com ponto-e-vírgula sejam citadas
      const formattedRow = row.map(cell => {
        const strCell = String(cell);
        return strCell.includes(';') ? `"${strCell}"` : strCell;
      });
      
      csv += formattedRow.join(';') + '\n';
    }
    
    return csv;
  }
  
  /**
   * Exportar logs para formato JSON
   * @param filteredLogs Logs já filtrados para exportação
   * @returns String contendo os logs em formato JSON
   */
  public exportToJSON(filteredLogs: LogEntry[]): string {
    return JSON.stringify(filteredLogs, null, 2);
  }
  
  /**
   * Registrar callback para alertas de eventos críticos
   * @param callback Função a ser chamada quando um evento crítico ocorrer
   * @returns Função para remover o callback
   */
  public registerAlertCallback(callback: (log: LogEntry) => void): () => void {
    this.alertCallbacks.push(callback);
    
    // Retornar função para remover o callback
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index !== -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Limpar logs antigos com base em dias ou limite de quantidade
   * @param options Opções para limpeza (dias ou limite)
   * @returns Número de logs removidos
   */
  public cleanupOldLogs(options: { olderThanDays?: number; maxCount?: number }): number {
    const originalCount = this.logs.length;
    
    if (options.olderThanDays) {
      const cutoffTime = Date.now() - (options.olderThanDays * 24 * 60 * 60 * 1000);
      this.logs = this.logs.filter(log => log.timestamp >= cutoffTime);
    }
    
    if (options.maxCount && this.logs.length > options.maxCount) {
      // Ordenar por timestamp e manter apenas os mais recentes
      this.logs.sort((a, b) => b.timestamp - a.timestamp);
      this.logs = this.logs.slice(0, options.maxCount);
    }
    
    const removedCount = originalCount - this.logs.length;
    
    if (removedCount > 0) {
      this.saveLogsToStorage();
    }
    
    return removedCount;
  }
  
  /**
   * Obter contagem de eventos por tipo
   * @param days Número de dias para calcular estatísticas (padrão: 30)
   * @returns Contagem por tipo de evento
   */
  public getEventTypeStats(days: number = 30): Record<LogEventType, number> {
    const stats = Object.values(LogEventType).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<LogEventType, number>);
    
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    for (const log of this.logs) {
      if (log.timestamp >= cutoffTime) {
        stats[log.eventType]++;
      }
    }
    
    return stats;
  }
  
  /**
   * Obter estatísticas de severidade
   * @param days Número de dias para calcular estatísticas (padrão: 30) 
   * @returns Contagem por severidade
   */
  public getSeverityStats(days: number = 30): Record<LogSeverity, number> {
    const stats = Object.values(LogSeverity).reduce((acc, severity) => {
      acc[severity] = 0;
      return acc;
    }, {} as Record<LogSeverity, number>);
    
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    for (const log of this.logs) {
      if (log.timestamp >= cutoffTime) {
        stats[log.severity]++;
      }
    }
    
    return stats;
  }
}

// Exportar instância única
export const logService = LogService.getInstance(); 