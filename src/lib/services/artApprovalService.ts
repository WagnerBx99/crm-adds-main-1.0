/**
 * Art Approval Service - Serviço de Aprovação de Arte
 * 
 * Este serviço gerencia o fluxo completo de aprovação de artes:
 * - Upload de artes finalizadas
 * - Geração de links públicos para aprovação
 * - Processamento de aprovações e solicitações de ajuste
 * - Integração com Pipeline e Auditoria
 */

import { pipelineService } from './pipelineService';
import { auditService } from './auditService';
import { 
  Order, 
  ArtworkImage, 
  ArtworkApprovalToken, 
  ArtworkActionLog,
  Comment 
} from '@/types';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type ArtworkStatus = 'pending' | 'approved' | 'adjustment_requested';

export interface ArtApprovalResult {
  success: boolean;
  message: string;
  artwork?: ArtworkImage;
  token?: ArtworkApprovalToken;
  error?: string;
}

export interface ArtworkUploadOptions {
  orderId: string;
  file: File;
  name?: string;
  uploadedBy: string;
}

export interface ApprovalDecision {
  orderId: string;
  artworkId: string;
  decision: 'approved' | 'adjustment_requested';
  clientName: string;
  feedback?: string;
  isPublicApproval: boolean;
}

// ============================================
// ART APPROVAL SERVICE CLASS
// ============================================

class ArtApprovalService {
  private readonly ORDERS_KEY = 'orders';
  private readonly TOKENS_KEY = 'artworkApprovalTokens';
  private readonly TOKEN_EXPIRY_DAYS = 7;

  /**
   * Gera um ID único
   */
  private generateId(prefix: string = 'art'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtém todos os pedidos do localStorage
   */
  private getOrders(): Order[] {
    try {
      const stored = localStorage.getItem(this.ORDERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[ArtApproval] Erro ao carregar pedidos:', error);
      return [];
    }
  }

  /**
   * Salva pedidos no localStorage
   */
  private saveOrders(orders: Order[]): void {
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
  }

  /**
   * Obtém um pedido pelo ID
   */
  private getOrderById(orderId: string): Order | null {
    const orders = this.getOrders();
    return orders.find(o => o.id === orderId || String(o.id) === String(orderId)) || null;
  }

  /**
   * Atualiza um pedido
   */
  private updateOrder(orderId: string, updates: Partial<Order>): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId || String(o.id) === String(orderId));
    
    if (index === -1) return null;

    orders[index] = {
      ...orders[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveOrders(orders);
    return orders[index];
  }

  /**
   * Obtém todos os tokens de aprovação
   */
  private getTokens(): ArtworkApprovalToken[] {
    try {
      const stored = localStorage.getItem(this.TOKENS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[ArtApproval] Erro ao carregar tokens:', error);
      return [];
    }
  }

  /**
   * Salva tokens no localStorage
   */
  private saveTokens(tokens: ArtworkApprovalToken[]): void {
    localStorage.setItem(this.TOKENS_KEY, JSON.stringify(tokens));
  }

  // ============================================
  // MÉTODOS PÚBLICOS
  // ============================================

  /**
   * Faz upload de uma arte finalizada para um pedido
   */
  async uploadFinalizedArtwork(options: ArtworkUploadOptions): Promise<ArtApprovalResult> {
    const { orderId, file, name, uploadedBy } = options;

    try {
      console.log(`📤 [ArtApproval] Upload de arte para pedido ${orderId}`);

      const order = this.getOrderById(orderId);
      if (!order) {
        return { success: false, message: 'Pedido não encontrado', error: 'ORDER_NOT_FOUND' };
      }

      // Converter arquivo para base64
      const base64 = await this.fileToBase64(file);
      
      const artwork: ArtworkImage = {
        id: this.generateId('artwork'),
        name: name || file.name,
        url: base64,
        type: file.type,
        createdAt: new Date(),
        uploadedBy,
        status: 'pending'
      };

      // Adicionar arte ao pedido
      const updatedArtworks = [...(order.finalizedArtworks || []), artwork];
      
      // Criar log de ação
      const actionLog: ArtworkActionLog = {
        id: this.generateId('log'),
        orderId,
        artworkId: artwork.id,
        action: 'artwork_uploaded',
        performedBy: uploadedBy,
        performedByType: 'internal_user',
        details: `Arte "${artwork.name}" enviada para aprovação`,
        timestamp: new Date()
      };

      this.updateOrder(orderId, {
        finalizedArtworks: updatedArtworks,
        artworkActionLogs: [...(order.artworkActionLogs || []), actionLog],
        status: 'AGUARDANDO_APROVACAO'
      });

      // Registrar na auditoria
      auditService.logCreate('art', artwork.id, artwork, { orderId });

      // Adicionar tarefa ao pipeline
      pipelineService.addTask('process_art_approval', {
        orderId,
        artworkId: artwork.id,
        action: 'uploaded'
      }, 'normal');

      console.log(`✅ [ArtApproval] Arte ${artwork.id} enviada com sucesso`);
      return { success: true, message: 'Arte enviada com sucesso', artwork };

    } catch (error: any) {
      console.error('[ArtApproval] Erro no upload:', error);
      auditService.log('create', 'art', { 
        entityId: orderId, 
        success: false, 
        errorMessage: error.message 
      });
      return { success: false, message: 'Erro ao enviar arte', error: error.message };
    }
  }

  /**
   * Gera um link público para aprovação de arte
   */
  generateApprovalLink(orderId: string, artworkId: string): ArtApprovalResult {
    try {
      console.log(`🔗 [ArtApproval] Gerando link de aprovação para arte ${artworkId}`);

      const order = this.getOrderById(orderId);
      if (!order) {
        return { success: false, message: 'Pedido não encontrado', error: 'ORDER_NOT_FOUND' };
      }

      const artwork = order.finalizedArtworks?.find(a => a.id === artworkId);
      if (!artwork) {
        return { success: false, message: 'Arte não encontrada', error: 'ARTWORK_NOT_FOUND' };
      }

      // Gerar token único
      const tokenValue = `${orderId}-${artworkId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const token: ArtworkApprovalToken = {
        id: this.generateId('token'),
        orderId: String(orderId),
        artworkId,
        token: tokenValue,
        expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        used: false,
        createdAt: new Date()
      };

      // Salvar token
      const tokens = this.getTokens();
      tokens.push(token);
      this.saveTokens(tokens);

      // Atualizar pedido com o token
      this.updateOrder(orderId, {
        artworkApprovalTokens: [...(order.artworkApprovalTokens || []), token]
      });

      // Registrar na auditoria
      auditService.log('create', 'public_link', {
        entityId: token.id,
        metadata: { orderId, artworkId, expiresAt: token.expiresAt }
      });

      const approvalLink = `${window.location.origin}/arte/aprovar/${tokenValue}`;
      console.log(`✅ [ArtApproval] Link gerado: ${approvalLink}`);

      return { 
        success: true, 
        message: `Link de aprovação gerado (válido por ${this.TOKEN_EXPIRY_DAYS} dias)`,
        token
      };

    } catch (error: any) {
      console.error('[ArtApproval] Erro ao gerar link:', error);
      return { success: false, message: 'Erro ao gerar link', error: error.message };
    }
  }

  /**
   * Processa uma decisão de aprovação (interna ou pública)
   */
  async processApprovalDecision(decision: ApprovalDecision): Promise<ArtApprovalResult> {
    const { orderId, artworkId, decision: approvalDecision, clientName, feedback, isPublicApproval } = decision;

    try {
      console.log(`📋 [ArtApproval] Processando decisão: ${approvalDecision} para arte ${artworkId}`);

      const order = this.getOrderById(orderId);
      if (!order) {
        return { success: false, message: 'Pedido não encontrado', error: 'ORDER_NOT_FOUND' };
      }

      const artwork = order.finalizedArtworks?.find(a => a.id === artworkId);
      if (!artwork) {
        return { success: false, message: 'Arte não encontrada', error: 'ARTWORK_NOT_FOUND' };
      }

      // Atualizar status da arte
      const updatedArtwork: ArtworkImage = {
        ...artwork,
        status: approvalDecision
      };

      const updatedArtworks = order.finalizedArtworks?.map(a => 
        a.id === artworkId ? updatedArtwork : a
      ) || [];

      // Criar log de ação
      const actionLog: ArtworkActionLog = {
        id: this.generateId('log'),
        orderId,
        artworkId,
        action: approvalDecision,
        performedBy: clientName,
        performedByType: isPublicApproval ? 'client' : 'internal_user',
        details: approvalDecision === 'approved' 
          ? `Arte aprovada por ${clientName}${isPublicApproval ? ' via link público' : ''}`
          : `Ajuste solicitado por ${clientName}${isPublicApproval ? ' via link público' : ''}: "${feedback || 'Sem detalhes'}"`,
        timestamp: new Date()
      };

      // Se for solicitação de ajuste, criar comentário
      let updatedComments = order.artworkComments || [];
      if (approvalDecision === 'adjustment_requested' && feedback) {
        const comment: Comment = {
          id: this.generateId('comment'),
          text: feedback,
          createdAt: new Date(),
          user: clientName,
          approved: false,
          altered: false
        };
        updatedComments = [...updatedComments, comment];
      }

      // Determinar novo status do pedido
      const newStatus = approvalDecision === 'approved' ? 'ARTE_APROVADA' : 'AJUSTE';

      // Criar entrada no histórico
      const historyEntry = {
        id: this.generateId('history'),
        date: new Date(),
        status: newStatus as any,
        comment: actionLog.details,
        user: clientName
      };

      // Atualizar pedido
      this.updateOrder(orderId, {
        finalizedArtworks: updatedArtworks,
        artworkActionLogs: [...(order.artworkActionLogs || []), actionLog],
        artworkComments: updatedComments,
        status: newStatus as any,
        history: [...order.history, historyEntry]
      });

      // Registrar na auditoria
      auditService.logArtApproval(orderId, approvalDecision === 'approved', feedback);

      // Adicionar tarefa ao pipeline
      pipelineService.addTask('process_art_approval', {
        orderId,
        artworkId,
        approved: approvalDecision === 'approved',
        feedback
      }, 'high');

      console.log(`✅ [ArtApproval] Decisão processada: ${approvalDecision}`);
      return { 
        success: true, 
        message: approvalDecision === 'approved' 
          ? 'Arte aprovada com sucesso!' 
          : 'Solicitação de ajuste registrada!',
        artwork: updatedArtwork
      };

    } catch (error: any) {
      console.error('[ArtApproval] Erro ao processar decisão:', error);
      auditService.log('update', 'art', {
        entityId: artworkId,
        success: false,
        errorMessage: error.message
      });
      return { success: false, message: 'Erro ao processar decisão', error: error.message };
    }
  }

  /**
   * Valida um token de aprovação pública
   */
  validateToken(tokenValue: string): { 
    valid: boolean; 
    token?: ArtworkApprovalToken; 
    order?: Order; 
    artwork?: ArtworkImage;
    error?: string;
  } {
    try {
      const tokens = this.getTokens();
      const token = tokens.find(t => t.token === tokenValue);

      if (!token) {
        return { valid: false, error: 'Token não encontrado' };
      }

      if (token.used) {
        return { valid: false, error: 'Token já utilizado' };
      }

      if (new Date(token.expiresAt) < new Date()) {
        return { valid: false, error: 'Token expirado' };
      }

      const order = this.getOrderById(token.orderId);
      if (!order) {
        return { valid: false, error: 'Pedido não encontrado' };
      }

      const artwork = order.finalizedArtworks?.find(a => a.id === token.artworkId);
      if (!artwork) {
        return { valid: false, error: 'Arte não encontrada' };
      }

      return { valid: true, token, order, artwork };

    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Marca um token como utilizado
   */
  markTokenAsUsed(tokenValue: string, clientName: string, decision: 'approved' | 'adjustment_requested', feedback?: string): void {
    const tokens = this.getTokens();
    const updatedTokens = tokens.map(t => 
      t.token === tokenValue 
        ? {
            ...t,
            used: true,
            usedAt: new Date(),
            clientName,
            clientDecision: decision,
            adjustmentComment: feedback
          }
        : t
    );
    this.saveTokens(updatedTokens);
  }

  /**
   * Obtém estatísticas de aprovação de artes
   */
  getApprovalStats(): {
    totalArtworks: number;
    pending: number;
    approved: number;
    adjustmentRequested: number;
    approvalRate: number;
    averageApprovalTime: number;
  } {
    const orders = this.getOrders();
    let totalArtworks = 0;
    let pending = 0;
    let approved = 0;
    let adjustmentRequested = 0;

    orders.forEach(order => {
      if (order.finalizedArtworks) {
        order.finalizedArtworks.forEach(artwork => {
          totalArtworks++;
          switch (artwork.status) {
            case 'pending':
              pending++;
              break;
            case 'approved':
              approved++;
              break;
            case 'adjustment_requested':
              adjustmentRequested++;
              break;
          }
        });
      }
    });

    return {
      totalArtworks,
      pending,
      approved,
      adjustmentRequested,
      approvalRate: totalArtworks > 0 ? approved / totalArtworks : 0,
      averageApprovalTime: 0 // TODO: Calcular baseado nos logs
    };
  }

  /**
   * Obtém histórico de ações de uma arte
   */
  getArtworkHistory(orderId: string, artworkId: string): ArtworkActionLog[] {
    const order = this.getOrderById(orderId);
    if (!order) return [];

    return (order.artworkActionLogs || [])
      .filter(log => log.artworkId === artworkId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Converte arquivo para base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Limpa tokens expirados
   */
  cleanupExpiredTokens(): number {
    const tokens = this.getTokens();
    const now = new Date();
    const validTokens = tokens.filter(t => new Date(t.expiresAt) > now || t.used);
    const removedCount = tokens.length - validTokens.length;
    
    if (removedCount > 0) {
      this.saveTokens(validTokens);
      console.log(`[ArtApproval] ${removedCount} tokens expirados removidos`);
    }

    return removedCount;
  }
}

// Exportar instância singleton
export const artApprovalService = new ArtApprovalService();

// Exportar classe para testes
export { ArtApprovalService };
