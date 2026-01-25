/**
 * Hook useAuditLogs - Gerencia estado de logs de auditoria
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  auditLogServiceBackend, 
  AuditLog, 
  AuditLogFilters, 
  AuditLogStats,
  PaginatedResponse 
} from '@/lib/services/auditLogServiceBackend';

interface UseAuditLogsState {
  logs: AuditLog[];
  stats: AuditLogStats | null;
  actions: string[];
  entityTypes: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

interface UseAuditLogsReturn extends UseAuditLogsState {
  fetchLogs: (filters?: AuditLogFilters) => Promise<void>;
  fetchStats: (days?: number) => Promise<void>;
  fetchActions: () => Promise<void>;
  fetchEntityTypes: () => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: AuditLogFilters) => void;
  refresh: () => Promise<void>;
  filters: AuditLogFilters;
}

export function useAuditLogs(initialFilters: AuditLogFilters = {}): UseAuditLogsReturn {
  const [state, setState] = useState<UseAuditLogsState>({
    logs: [],
    stats: null,
    actions: [],
    entityTypes: [],
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
    },
    loading: false,
    error: null,
  });

  const [filters, setFiltersState] = useState<AuditLogFilters>(initialFilters);

  const fetchLogs = useCallback(async (customFilters?: AuditLogFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const filtersToUse = customFilters || filters;
      const response = await auditLogServiceBackend.getLogs({
        ...filtersToUse,
        page: filtersToUse.page || state.pagination.page,
        limit: filtersToUse.limit || state.pagination.limit,
      });

      setState(prev => ({
        ...prev,
        logs: response.data,
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao buscar logs',
      }));
    }
  }, [filters, state.pagination.page, state.pagination.limit]);

  const fetchStats = useCallback(async (days: number = 30) => {
    try {
      const stats = await auditLogServiceBackend.getStats(days);
      setState(prev => ({ ...prev, stats }));
    } catch (error: any) {
      console.error('[useAuditLogs] Erro ao buscar estatísticas:', error);
    }
  }, []);

  const fetchActions = useCallback(async () => {
    try {
      const actions = await auditLogServiceBackend.getActions();
      setState(prev => ({ ...prev, actions }));
    } catch (error: any) {
      console.error('[useAuditLogs] Erro ao buscar ações:', error);
    }
  }, []);

  const fetchEntityTypes = useCallback(async () => {
    try {
      const entityTypes = await auditLogServiceBackend.getEntityTypes();
      setState(prev => ({ ...prev, entityTypes }));
    } catch (error: any) {
      console.error('[useAuditLogs] Erro ao buscar tipos de entidades:', error);
    }
  }, []);

  const setPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
    setFiltersState(prev => ({ ...prev, page }));
  }, []);

  const setFilters = useCallback((newFilters: AuditLogFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters, page: 1 }));
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchLogs(),
      fetchStats(),
      fetchActions(),
      fetchEntityTypes(),
    ]);
  }, [fetchLogs, fetchStats, fetchActions, fetchEntityTypes]);

  // Buscar logs quando filtros mudam
  useEffect(() => {
    fetchLogs();
  }, [filters]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchActions();
    fetchEntityTypes();
    fetchStats();
  }, []);

  return {
    ...state,
    fetchLogs,
    fetchStats,
    fetchActions,
    fetchEntityTypes,
    setPage,
    setFilters,
    refresh,
    filters,
  };
}

export default useAuditLogs;
