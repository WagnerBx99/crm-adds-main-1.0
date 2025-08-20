/**
 * API para consulta e exportação de logs de segurança
 * 
 * Este módulo fornece endpoints para consulta, filtragem e exportação de logs
 * de segurança e auditoria do sistema.
 */

import { logService, LogFilterOptions, LogEventType, LogSeverity, LogEntry } from '../security/logService';

// Cliente mockado para simular chamadas de API
class LogApiClient {
  /**
   * Consultar logs com filtros
   * @param filters Filtros para a consulta
   * @returns Promise com resultado paginado
   */
  public async queryLogs(filters: LogFilterOptions = {}): Promise<{
    logs: LogEntry[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      // Usar o serviço de logs para obter os dados filtrados
      return logService.queryLogs(filters);
    } catch (error) {
      console.error('Erro ao consultar logs:', error);
      throw new Error('Falha ao consultar logs');
    }
  }
  
  /**
   * Exportar logs para CSV
   * @param filters Filtros para a exportação
   * @returns Promise com string CSV
   */
  public async exportLogsAsCSV(filters: LogFilterOptions = {}): Promise<string> {
    try {
      // Obter todos os logs que correspondem aos filtros (sem paginação)
      const allFilters: LogFilterOptions = {
        ...filters,
        page: 1,
        pageSize: 10000 // Um número grande para obter todos os registros
      };
      
      const { logs } = logService.queryLogs(allFilters);
      
      // Converter para CSV
      return logService.exportToCSV(logs);
    } catch (error) {
      console.error('Erro ao exportar logs para CSV:', error);
      throw new Error('Falha ao exportar logs para CSV');
    }
  }
  
  /**
   * Exportar logs para JSON
   * @param filters Filtros para a exportação
   * @returns Promise com string JSON
   */
  public async exportLogsAsJSON(filters: LogFilterOptions = {}): Promise<string> {
    try {
      // Obter todos os logs que correspondem aos filtros (sem paginação)
      const allFilters: LogFilterOptions = {
        ...filters,
        page: 1,
        pageSize: 10000 // Um número grande para obter todos os registros
      };
      
      const { logs } = logService.queryLogs(allFilters);
      
      // Converter para JSON
      return logService.exportToJSON(logs);
    } catch (error) {
      console.error('Erro ao exportar logs para JSON:', error);
      throw new Error('Falha ao exportar logs para JSON');
    }
  }
  
  /**
   * Obter estatísticas de eventos
   * @param days Número de dias para incluir nas estatísticas
   * @returns Promise com estatísticas de tipos de eventos
   */
  public async getEventTypeStats(days: number = 30): Promise<Record<LogEventType, number>> {
    try {
      return logService.getEventTypeStats(days);
    } catch (error) {
      console.error('Erro ao obter estatísticas de eventos:', error);
      throw new Error('Falha ao obter estatísticas de eventos');
    }
  }
  
  /**
   * Obter estatísticas de severidade
   * @param days Número de dias para incluir nas estatísticas
   * @returns Promise com estatísticas de severidade
   */
  public async getSeverityStats(days: number = 30): Promise<Record<LogSeverity, number>> {
    try {
      return logService.getSeverityStats(days);
    } catch (error) {
      console.error('Erro ao obter estatísticas de severidade:', error);
      throw new Error('Falha ao obter estatísticas de severidade');
    }
  }
  
  /**
   * Obter eventos recentes para alertas e notificações
   * @param count Número de eventos a retornar
   * @returns Promise com eventos recentes
   */
  public async getRecentCriticalEvents(count: number = 5): Promise<LogEntry[]> {
    try {
      const filters: LogFilterOptions = {
        severity: [LogSeverity.CRITICAL, LogSeverity.ERROR],
        page: 1,
        pageSize: count,
        sortBy: 'timestamp',
        sortDirection: 'desc'
      };
      
      const { logs } = logService.queryLogs(filters);
      return logs;
    } catch (error) {
      console.error('Erro ao obter eventos críticos recentes:', error);
      throw new Error('Falha ao obter eventos críticos recentes');
    }
  }
  
  /**
   * Obter eventos suspeitos recentes
   * @param count Número de eventos a retornar
   * @returns Promise com eventos suspeitos
   */
  public async getRecentSuspiciousActivities(count: number = 10): Promise<LogEntry[]> {
    try {
      const filters: LogFilterOptions = {
        eventTypes: [
          LogEventType.SUSPICIOUS_ACTIVITY,
          LogEventType.LOGIN_FAILED
        ],
        page: 1,
        pageSize: count,
        sortBy: 'timestamp',
        sortDirection: 'desc'
      };
      
      const { logs } = logService.queryLogs(filters);
      return logs;
    } catch (error) {
      console.error('Erro ao obter atividades suspeitas:', error);
      throw new Error('Falha ao obter atividades suspeitas');
    }
  }
  
  /**
   * Obter resumo de segurança para dashboard
   * @returns Promise com resumo de segurança
   */
  public async getSecuritySummary(): Promise<{
    recentCriticalEvents: LogEntry[];
    recentSuspiciousActivities: LogEntry[];
    eventTypeStats: Record<LogEventType, number>;
    severityStats: Record<LogSeverity, number>;
    totalEvents24h: number;
    criticalEvents24h: number;
  }> {
    try {
      // Obter eventos críticos recentes
      const recentCriticalEvents = await this.getRecentCriticalEvents(3);
      
      // Obter atividades suspeitas recentes
      const recentSuspiciousActivities = await this.getRecentSuspiciousActivities(3);
      
      // Obter estatísticas de eventos
      const eventTypeStats = await this.getEventTypeStats(7);
      
      // Obter estatísticas de severidade
      const severityStats = await this.getSeverityStats(7);
      
      // Calcular totais das últimas 24 horas
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const filters24h: LogFilterOptions = {
        startDate: oneDayAgo,
        page: 1,
        pageSize: 1 // Não precisamos dos logs, apenas da contagem
      };
      
      const { totalCount } = logService.queryLogs(filters24h);
      
      const filtersCritical24h: LogFilterOptions = {
        startDate: oneDayAgo,
        severity: [LogSeverity.CRITICAL, LogSeverity.ERROR],
        page: 1,
        pageSize: 1
      };
      
      const { totalCount: criticalCount } = logService.queryLogs(filtersCritical24h);
      
      return {
        recentCriticalEvents,
        recentSuspiciousActivities,
        eventTypeStats,
        severityStats,
        totalEvents24h: totalCount,
        criticalEvents24h: criticalCount
      };
    } catch (error) {
      console.error('Erro ao obter resumo de segurança:', error);
      throw new Error('Falha ao obter resumo de segurança');
    }
  }
  
  /**
   * Limpar logs antigos
   * @param olderThanDays Remover logs mais antigos que este número de dias
   * @returns Promise com número de logs removidos
   */
  public async cleanupOldLogs(olderThanDays: number = 90): Promise<number> {
    try {
      return logService.cleanupOldLogs({ olderThanDays });
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
      throw new Error('Falha ao limpar logs antigos');
    }
  }
}

// Exportar instância única
export const logApi = new LogApiClient(); 