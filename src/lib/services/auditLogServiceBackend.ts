/**
 * Serviço de Logs de Auditoria - Backend
 * 
 * Gerencia logs de auditoria usando o backend PostgreSQL
 */

import { apiService } from './apiService';
import { CONFIG } from '@/config';

// Tipos
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogStats {
  totalLogs: number;
  logsByAction: { action: string; count: number }[];
  logsByUser: { userId: string; userName: string; count: number }[];
  logsByDay: { date: string; count: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Serviço de Logs de Auditoria usando Backend
 */
class AuditLogServiceBackend {
  private baseUrl = '/audit-logs';

  /**
   * Listar logs de auditoria com filtros e paginação
   */
  async getLogs(filters: AuditLogFilters = {}): Promise<PaginatedResponse<AuditLog>> {
    if (!CONFIG.USE_BACKEND_API) {
      return this.getLogsFromLocalStorage(filters);
    }

    try {
      const params = new URLSearchParams();
      
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.entityId) params.append('entityId', filters.entityId);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

      return await apiService.get<PaginatedResponse<AuditLog>>(url);
    } catch (error) {
      console.error('[AuditLogService] Erro ao buscar logs:', error);
      // Fallback para localStorage
      return this.getLogsFromLocalStorage(filters);
    }
  }

  /**
   * Obter tipos de ações disponíveis
   */
  async getActions(): Promise<string[]> {
    if (!CONFIG.USE_BACKEND_API) {
      return this.getActionsFromLocalStorage();
    }

    try {
      return await apiService.get<string[]>(`${this.baseUrl}/actions`);
    } catch (error) {
      console.error('[AuditLogService] Erro ao buscar ações:', error);
      return this.getActionsFromLocalStorage();
    }
  }

  /**
   * Obter tipos de entidades disponíveis
   */
  async getEntityTypes(): Promise<string[]> {
    if (!CONFIG.USE_BACKEND_API) {
      return this.getEntityTypesFromLocalStorage();
    }

    try {
      return await apiService.get<string[]>(`${this.baseUrl}/entity-types`);
    } catch (error) {
      console.error('[AuditLogService] Erro ao buscar tipos de entidades:', error);
      return this.getEntityTypesFromLocalStorage();
    }
  }

  /**
   * Obter estatísticas de logs
   */
  async getStats(days: number = 30): Promise<AuditLogStats> {
    if (!CONFIG.USE_BACKEND_API) {
      return this.getStatsFromLocalStorage(days);
    }

    try {
      return await apiService.get<AuditLogStats>(`${this.baseUrl}/stats?days=${days}`);
    } catch (error) {
      console.error('[AuditLogService] Erro ao buscar estatísticas:', error);
      return this.getStatsFromLocalStorage(days);
    }
  }

  /**
   * Registrar um novo log de auditoria
   * (Normalmente feito automaticamente pelo backend, mas disponível para uso manual)
   */
  async logAction(
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>
  ): Promise<void> {
    if (!CONFIG.USE_BACKEND_API) {
      this.logToLocalStorage(action, entityType, entityId, details);
      return;
    }

    // O backend registra automaticamente os logs nas operações
    // Este método é para logs manuais específicos
    console.log('[AuditLog]', { action, entityType, entityId, details });
  }

  // ============================================
  // FALLBACK PARA LOCALSTORAGE
  // ============================================

  private getLogsFromLocalStorage(filters: AuditLogFilters): PaginatedResponse<AuditLog> {
    const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]') as AuditLog[];
    
    let filtered = logs;

    if (filters.action) {
      filtered = filtered.filter(l => l.action === filters.action);
    }
    if (filters.entityType) {
      filtered = filtered.filter(l => l.entityType === filters.entityType);
    }
    if (filters.entityId) {
      filtered = filtered.filter(l => l.entityId === filters.entityId);
    }
    if (filters.userId) {
      filtered = filtered.filter(l => l.userId === filters.userId);
    }
    if (filters.startDate) {
      filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(filters.startDate!));
    }
    if (filters.endDate) {
      filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(filters.endDate!));
    }

    // Ordenar por data decrescente
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const page = filters.page || 1;
    const limit = filters.limit || 100;
    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }

  private getActionsFromLocalStorage(): string[] {
    const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]') as AuditLog[];
    const actions = [...new Set(logs.map(l => l.action))];
    return actions.sort();
  }

  private getEntityTypesFromLocalStorage(): string[] {
    const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]') as AuditLog[];
    const types = [...new Set(logs.map(l => l.entityType))];
    return types.sort();
  }

  private getStatsFromLocalStorage(days: number): AuditLogStats {
    const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]') as AuditLog[];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentLogs = logs.filter(l => new Date(l.timestamp) >= startDate);

    // Contagem por ação
    const actionCounts: Record<string, number> = {};
    recentLogs.forEach(l => {
      actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
    });

    // Contagem por usuário
    const userCounts: Record<string, { count: number; name: string }> = {};
    recentLogs.forEach(l => {
      if (!userCounts[l.userId]) {
        userCounts[l.userId] = { count: 0, name: l.user?.name || 'Desconhecido' };
      }
      userCounts[l.userId].count++;
    });

    // Contagem por dia
    const dayCounts: Record<string, number> = {};
    recentLogs.forEach(l => {
      const date = new Date(l.timestamp).toISOString().split('T')[0];
      dayCounts[date] = (dayCounts[date] || 0) + 1;
    });

    return {
      totalLogs: recentLogs.length,
      logsByAction: Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      logsByUser: Object.entries(userCounts)
        .map(([userId, data]) => ({ userId, userName: data.name, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      logsByDay: Object.entries(dayCounts)
        .map(([date, count]) => ({ date, count: Number(count) }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30),
    };
  }

  private logToLocalStorage(
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>
  ): void {
    const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      userId: currentUser.id || 'unknown',
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : undefined,
      timestamp: new Date().toISOString(),
      user: currentUser.id ? {
        id: currentUser.id,
        name: currentUser.name || 'Desconhecido',
        email: currentUser.email || '',
      } : undefined,
    };

    logs.unshift(newLog);

    // Manter apenas os últimos 1000 logs
    if (logs.length > 1000) {
      logs.splice(1000);
    }

    localStorage.setItem('audit_logs', JSON.stringify(logs));
  }
}

export const auditLogServiceBackend = new AuditLogServiceBackend();
export default auditLogServiceBackend;
