/**
 * Audit Service - Serviço de Logs de Auditoria
 * 
 * Este serviço registra todas as ações importantes do sistema para:
 * - Rastreabilidade de alterações
 * - Compliance e segurança
 * - Debugging e análise
 */

// ============================================
// TIPOS E INTERFACES
// ============================================

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'sync'
  | 'export'
  | 'import'
  | 'status_change'
  | 'permission_change'
  | 'settings_change';

export type AuditEntity = 
  | 'order'
  | 'client'
  | 'product'
  | 'art'
  | 'user'
  | 'settings'
  | 'report'
  | 'financial'
  | 'invoice'
  | 'public_link';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  action?: AuditAction;
  entity?: AuditEntity;
  entityId?: string;
  userId?: string;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalEntries: number;
  entriesByAction: Record<string, number>;
  entriesByEntity: Record<string, number>;
  entriesByUser: Record<string, number>;
  successRate: number;
  lastEntry?: AuditEntry;
}

// ============================================
// AUDIT SERVICE CLASS
// ============================================

class AuditService {
  private entries: AuditEntry[] = [];
  private readonly STORAGE_KEY = 'audit_logs';
  private readonly MAX_ENTRIES = 5000;
  private readonly PERSIST_THRESHOLD = 100;
  private pendingPersist = 0;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Gera um ID único para entradas de auditoria
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Carrega logs do localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.entries = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        console.log(`[Audit] ${this.entries.length} entradas carregadas do storage`);
      }
    } catch (error) {
      console.error('[Audit] Erro ao carregar logs:', error);
      this.entries = [];
    }
  }

  /**
   * Persiste logs no localStorage
   */
  private persistToStorage(): void {
    try {
      // Manter apenas as últimas MAX_ENTRIES entradas
      const entriesToStore = this.entries.slice(-this.MAX_ENTRIES);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entriesToStore));
      this.pendingPersist = 0;
    } catch (error) {
      console.error('[Audit] Erro ao persistir logs:', error);
    }
  }

  /**
   * Obtém informações do contexto atual (usuário, IP, etc.)
   */
  private getContext(): { userId?: string; userName?: string; ipAddress?: string; userAgent?: string } {
    try {
      // Tentar obter usuário do localStorage
      const userStr = localStorage.getItem('currentUser');
      const user = userStr ? JSON.parse(userStr) : null;

      return {
        userId: user?.id,
        userName: user?.name || user?.email,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        // IP não é acessível diretamente no frontend, seria preenchido pelo backend
        ipAddress: undefined
      };
    } catch {
      return {};
    }
  }

  /**
   * Registra uma entrada de auditoria
   */
  public log(
    action: AuditAction,
    entity: AuditEntity,
    options: {
      entityId?: string;
      oldValue?: any;
      newValue?: any;
      metadata?: Record<string, any>;
      success?: boolean;
      errorMessage?: string;
      userId?: string;
      userName?: string;
    } = {}
  ): AuditEntry {
    const context = this.getContext();
    
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      entity,
      entityId: options.entityId,
      userId: options.userId || context.userId,
      userName: options.userName || context.userName,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      oldValue: options.oldValue,
      newValue: options.newValue,
      metadata: options.metadata,
      success: options.success !== false,
      errorMessage: options.errorMessage
    };

    this.entries.push(entry);
    this.pendingPersist++;

    // Log no console para debug
    const emoji = entry.success ? '✅' : '❌';
    console.log(
      `${emoji} [Audit] ${action.toUpperCase()} ${entity}`,
      entry.entityId ? `#${entry.entityId}` : '',
      entry.userName ? `por ${entry.userName}` : ''
    );

    // Persistir periodicamente ou em ações importantes
    if (
      this.pendingPersist >= this.PERSIST_THRESHOLD ||
      action === 'delete' ||
      action === 'permission_change' ||
      action === 'settings_change'
    ) {
      this.persistToStorage();
    }

    return entry;
  }

  // ============================================
  // MÉTODOS DE CONVENIÊNCIA PARA AÇÕES COMUNS
  // ============================================

  /**
   * Registra criação de entidade
   */
  public logCreate(entity: AuditEntity, entityId: string, newValue: any, metadata?: Record<string, any>): AuditEntry {
    return this.log('create', entity, { entityId, newValue, metadata });
  }

  /**
   * Registra atualização de entidade
   */
  public logUpdate(entity: AuditEntity, entityId: string, oldValue: any, newValue: any, metadata?: Record<string, any>): AuditEntry {
    return this.log('update', entity, { entityId, oldValue, newValue, metadata });
  }

  /**
   * Registra exclusão de entidade
   */
  public logDelete(entity: AuditEntity, entityId: string, oldValue: any, metadata?: Record<string, any>): AuditEntry {
    return this.log('delete', entity, { entityId, oldValue, metadata });
  }

  /**
   * Registra visualização de entidade
   */
  public logView(entity: AuditEntity, entityId: string, metadata?: Record<string, any>): AuditEntry {
    return this.log('view', entity, { entityId, metadata });
  }

  /**
   * Registra login
   */
  public logLogin(userId: string, userName: string, success: boolean, errorMessage?: string): AuditEntry {
    return this.log('login', 'user', { 
      entityId: userId, 
      userId, 
      userName, 
      success, 
      errorMessage 
    });
  }

  /**
   * Registra logout
   */
  public logLogout(userId: string, userName: string): AuditEntry {
    return this.log('logout', 'user', { entityId: userId, userId, userName });
  }

  /**
   * Registra aprovação de arte
   */
  public logArtApproval(orderId: string, approved: boolean, feedback?: string): AuditEntry {
    return this.log(approved ? 'approve' : 'reject', 'art', {
      entityId: orderId,
      metadata: { feedback, approved }
    });
  }

  /**
   * Registra mudança de status
   */
  public logStatusChange(entity: AuditEntity, entityId: string, oldStatus: string, newStatus: string): AuditEntry {
    return this.log('status_change', entity, {
      entityId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus }
    });
  }

  /**
   * Registra sincronização
   */
  public logSync(entity: AuditEntity, count: number, success: boolean, errorMessage?: string): AuditEntry {
    return this.log('sync', entity, {
      metadata: { count },
      success,
      errorMessage
    });
  }

  // ============================================
  // MÉTODOS DE CONSULTA
  // ============================================

  /**
   * Busca entradas de auditoria com filtros
   */
  public query(filter: AuditFilter = {}): AuditEntry[] {
    let results = [...this.entries];

    if (filter.startDate) {
      results = results.filter(e => e.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      results = results.filter(e => e.timestamp <= filter.endDate!);
    }

    if (filter.action) {
      results = results.filter(e => e.action === filter.action);
    }

    if (filter.entity) {
      results = results.filter(e => e.entity === filter.entity);
    }

    if (filter.entityId) {
      results = results.filter(e => e.entityId === filter.entityId);
    }

    if (filter.userId) {
      results = results.filter(e => e.userId === filter.userId);
    }

    if (filter.success !== undefined) {
      results = results.filter(e => e.success === filter.success);
    }

    // Ordenar por timestamp decrescente (mais recente primeiro)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Aplicar paginação
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    
    return results.slice(offset, offset + limit);
  }

  /**
   * Obtém histórico de uma entidade específica
   */
  public getEntityHistory(entity: AuditEntity, entityId: string): AuditEntry[] {
    return this.query({ entity, entityId, limit: 1000 });
  }

  /**
   * Obtém atividade de um usuário
   */
  public getUserActivity(userId: string, limit: number = 100): AuditEntry[] {
    return this.query({ userId, limit });
  }

  /**
   * Obtém estatísticas de auditoria
   */
  public getStats(): AuditStats {
    const entriesByAction: Record<string, number> = {};
    const entriesByEntity: Record<string, number> = {};
    const entriesByUser: Record<string, number> = {};
    let successCount = 0;

    this.entries.forEach(entry => {
      entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1;
      entriesByEntity[entry.entity] = (entriesByEntity[entry.entity] || 0) + 1;
      
      if (entry.userId) {
        const userKey = entry.userName || entry.userId;
        entriesByUser[userKey] = (entriesByUser[userKey] || 0) + 1;
      }

      if (entry.success) successCount++;
    });

    return {
      totalEntries: this.entries.length,
      entriesByAction,
      entriesByEntity,
      entriesByUser,
      successRate: this.entries.length > 0 ? successCount / this.entries.length : 1,
      lastEntry: this.entries.length > 0 ? this.entries[this.entries.length - 1] : undefined
    };
  }

  /**
   * Exporta logs para JSON
   */
  public exportToJson(filter?: AuditFilter): string {
    const entries = filter ? this.query(filter) : this.entries;
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Exporta logs para CSV
   */
  public exportToCsv(filter?: AuditFilter): string {
    const entries = filter ? this.query(filter) : this.entries;
    
    const headers = [
      'ID',
      'Timestamp',
      'Action',
      'Entity',
      'Entity ID',
      'User ID',
      'User Name',
      'Success',
      'Error Message'
    ];

    const rows = entries.map(entry => [
      entry.id,
      entry.timestamp.toISOString(),
      entry.action,
      entry.entity,
      entry.entityId || '',
      entry.userId || '',
      entry.userName || '',
      entry.success ? 'true' : 'false',
      entry.errorMessage || ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  }

  /**
   * Limpa logs antigos
   */
  public cleanup(olderThanDays: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const originalCount = this.entries.length;
    this.entries = this.entries.filter(e => e.timestamp >= cutoffDate);
    const removedCount = originalCount - this.entries.length;

    if (removedCount > 0) {
      this.persistToStorage();
      console.log(`[Audit] ${removedCount} entradas antigas removidas`);
    }

    return removedCount;
  }

  /**
   * Força persistência imediata
   */
  public flush(): void {
    this.persistToStorage();
  }
}

// Exportar instância singleton
export const auditService = new AuditService();

// Exportar classe para testes
export { AuditService };
