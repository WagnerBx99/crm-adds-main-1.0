/**
 * Serviço de Sincronização com Tratamento de Falhas
 * 
 * Gerencia a sincronização de dados entre localStorage e backend,
 * com retry automático, fila de operações offline e resolução de conflitos.
 */

import { apiService } from './apiService';
import { CONFIG } from '@/config';

// Tipos
export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'success' | 'failed';
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  failedOperations: number;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  localData: any;
  serverData: any;
  localTimestamp: number;
  serverTimestamp: number;
}

// Constantes
const SYNC_QUEUE_KEY = 'sync_queue';
const SYNC_STATUS_KEY = 'sync_status';
const MAX_RETRY_COUNT = 5;
const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1min, 5min
const SYNC_INTERVAL = 30000; // 30 segundos

/**
 * Serviço de Sincronização
 */
class SyncService {
  private syncQueue: SyncOperation[] = [];
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private conflictResolver: ((conflict: SyncConflict) => Promise<'local' | 'server' | 'merge'>) | null = null;

  constructor() {
    this.loadQueue();
    this.setupEventListeners();
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  /**
   * Inicializar o serviço de sincronização
   */
  initialize(): void {
    if (!CONFIG.USE_BACKEND_API) {
      console.log('[SyncService] Backend não habilitado, sincronização desativada');
      return;
    }

    this.loadQueue();
    this.startAutoSync();
    console.log('[SyncService] Inicializado com', this.syncQueue.length, 'operações pendentes');
  }

  /**
   * Parar o serviço de sincronização
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.removeEventListeners();
  }

  // ============================================
  // FILA DE OPERAÇÕES
  // ============================================

  /**
   * Adicionar operação à fila de sincronização
   */
  addToQueue(
    type: SyncOperation['type'],
    entityType: string,
    entityId: string,
    data: any
  ): string {
    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      type,
      entityType,
      entityId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    // Verificar se já existe operação para a mesma entidade
    const existingIndex = this.syncQueue.findIndex(
      op => op.entityType === entityType && op.entityId === entityId && op.status === 'pending'
    );

    if (existingIndex !== -1) {
      // Substituir operação existente (última operação prevalece)
      this.syncQueue[existingIndex] = operation;
    } else {
      this.syncQueue.push(operation);
    }

    this.saveQueue();
    
    // Tentar sincronizar imediatamente se online
    if (navigator.onLine && !this.isSyncing) {
      this.sync();
    }

    return operation.id;
  }

  /**
   * Remover operação da fila
   */
  removeFromQueue(operationId: string): void {
    this.syncQueue = this.syncQueue.filter(op => op.id !== operationId);
    this.saveQueue();
  }

  /**
   * Obter operações pendentes
   */
  getPendingOperations(): SyncOperation[] {
    return this.syncQueue.filter(op => op.status === 'pending');
  }

  /**
   * Obter operações com falha
   */
  getFailedOperations(): SyncOperation[] {
    return this.syncQueue.filter(op => op.status === 'failed');
  }

  // ============================================
  // SINCRONIZAÇÃO
  // ============================================

  /**
   * Executar sincronização
   */
  async sync(): Promise<void> {
    if (!CONFIG.USE_BACKEND_API || this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    const pendingOps = this.getPendingOperations();

    console.log('[SyncService] Iniciando sincronização de', pendingOps.length, 'operações');

    for (const operation of pendingOps) {
      try {
        operation.status = 'syncing';
        this.saveQueue();

        await this.executeOperation(operation);

        operation.status = 'success';
        this.removeFromQueue(operation.id);

        console.log('[SyncService] Operação sincronizada:', operation.id);
      } catch (error: any) {
        console.error('[SyncService] Erro na operação:', operation.id, error);

        operation.retryCount++;
        operation.lastError = error.message || 'Erro desconhecido';

        if (operation.retryCount >= MAX_RETRY_COUNT) {
          operation.status = 'failed';
        } else {
          operation.status = 'pending';
          // Agendar retry com delay exponencial
          this.scheduleRetry(operation);
        }

        this.saveQueue();
      }
    }

    this.isSyncing = false;
    this.updateSyncStatus();
  }

  /**
   * Executar operação individual
   */
  private async executeOperation(operation: SyncOperation): Promise<void> {
    const endpoint = this.getEndpoint(operation.entityType);

    switch (operation.type) {
      case 'CREATE':
        await apiService.post(endpoint, operation.data);
        break;
      case 'UPDATE':
        await apiService.put(`${endpoint}/${operation.entityId}`, operation.data);
        break;
      case 'DELETE':
        await apiService.delete(`${endpoint}/${operation.entityId}`);
        break;
    }
  }

  /**
   * Obter endpoint para tipo de entidade
   */
  private getEndpoint(entityType: string): string {
    const endpoints: Record<string, string> = {
      user: '/users',
      customer: '/customers',
      order: '/orders',
      product: '/products',
      label: '/labels',
      publicQuote: '/public-quotes',
      publicContact: '/public-contacts',
    };

    return endpoints[entityType] || `/${entityType}s`;
  }

  /**
   * Agendar retry de operação
   */
  private scheduleRetry(operation: SyncOperation): void {
    const delay = RETRY_DELAYS[Math.min(operation.retryCount - 1, RETRY_DELAYS.length - 1)];
    
    setTimeout(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync();
      }
    }, delay);
  }

  // ============================================
  // RESOLUÇÃO DE CONFLITOS
  // ============================================

  /**
   * Definir resolver de conflitos customizado
   */
  setConflictResolver(
    resolver: (conflict: SyncConflict) => Promise<'local' | 'server' | 'merge'>
  ): void {
    this.conflictResolver = resolver;
  }

  /**
   * Resolver conflito de sincronização
   */
  async resolveConflict(conflict: SyncConflict): Promise<any> {
    if (!this.conflictResolver) {
      // Estratégia padrão: última modificação vence
      return conflict.localTimestamp > conflict.serverTimestamp
        ? conflict.localData
        : conflict.serverData;
    }

    const decision = await this.conflictResolver(conflict);

    switch (decision) {
      case 'local':
        return conflict.localData;
      case 'server':
        return conflict.serverData;
      case 'merge':
        // Merge simples: combinar propriedades, local prevalece em caso de conflito
        return { ...conflict.serverData, ...conflict.localData };
    }
  }

  // ============================================
  // STATUS E PERSISTÊNCIA
  // ============================================

  /**
   * Obter status atual da sincronização
   */
  getStatus(): SyncStatus {
    return {
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing,
      pendingOperations: this.getPendingOperations().length,
      failedOperations: this.getFailedOperations().length,
      lastSyncAt: localStorage.getItem('last_sync_at'),
      lastError: localStorage.getItem('last_sync_error'),
    };
  }

  /**
   * Atualizar status de sincronização
   */
  private updateSyncStatus(): void {
    localStorage.setItem('last_sync_at', new Date().toISOString());
    
    const failedOps = this.getFailedOperations();
    if (failedOps.length > 0) {
      localStorage.setItem('last_sync_error', `${failedOps.length} operações falharam`);
    } else {
      localStorage.removeItem('last_sync_error');
    }
  }

  /**
   * Carregar fila do localStorage
   */
  private loadQueue(): void {
    try {
      const saved = localStorage.getItem(SYNC_QUEUE_KEY);
      if (saved) {
        this.syncQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('[SyncService] Erro ao carregar fila:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Salvar fila no localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('[SyncService] Erro ao salvar fila:', error);
    }
  }

  // ============================================
  // AUTO-SYNC E EVENT LISTENERS
  // ============================================

  /**
   * Iniciar sincronização automática
   */
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing && this.getPendingOperations().length > 0) {
        this.sync();
      }
    }, SYNC_INTERVAL);
  }

  /**
   * Configurar event listeners
   */
  private setupEventListeners(): void {
    this.onlineHandler = () => {
      console.log('[SyncService] Conexão restaurada, iniciando sincronização');
      this.sync();
    };

    this.offlineHandler = () => {
      console.log('[SyncService] Conexão perdida, operações serão enfileiradas');
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  /**
   * Remover event listeners
   */
  private removeEventListeners(): void {
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
    }
  }

  // ============================================
  // RETRY DE OPERAÇÕES FALHAS
  // ============================================

  /**
   * Retentar todas as operações com falha
   */
  async retryFailedOperations(): Promise<void> {
    const failedOps = this.getFailedOperations();
    
    for (const op of failedOps) {
      op.status = 'pending';
      op.retryCount = 0;
      op.lastError = undefined;
    }

    this.saveQueue();
    await this.sync();
  }

  /**
   * Descartar operações com falha
   */
  discardFailedOperations(): void {
    this.syncQueue = this.syncQueue.filter(op => op.status !== 'failed');
    this.saveQueue();
  }

  /**
   * Limpar toda a fila
   */
  clearQueue(): void {
    this.syncQueue = [];
    this.saveQueue();
  }
}

// Instância singleton
export const syncService = new SyncService();
export default syncService;
