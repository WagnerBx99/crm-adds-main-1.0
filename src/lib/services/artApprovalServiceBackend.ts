/**
 * Art Approval Service Backend - Serviço de Aprovação de Arte (Backend)
 * 
 * Este serviço se comunica com o backend PostgreSQL para gerenciar
 * o fluxo de aprovação de artes, incluindo:
 * - Upload de artes
 * - Geração de links públicos
 * - Histórico de versões
 * - Notificações por email
 */

import { apiService } from './apiService';
import { ArtworkImage, ArtworkApprovalToken, Order } from '@/types';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type ArtworkStatus = 'pending' | 'approved' | 'adjustment_requested' | 'replaced';

export interface ArtApprovalResult {
  success: boolean;
  message: string;
  artwork?: ArtworkImage;
  token?: ArtworkApprovalToken;
  approvalLink?: string;
  emailSent?: boolean;
  error?: string;
}

export interface ArtworkUploadOptions {
  orderId: string;
  file: File;
  name?: string;
}

export interface NewVersionOptions {
  orderId: string;
  previousArtworkId: string;
  file: File;
  name?: string;
}

export interface ApprovalDecision {
  orderId: string;
  artworkId: string;
  decision: 'approved' | 'adjustment_requested';
  clientName: string;
  feedback?: string;
}

export interface ArtworkHistoryResponse {
  artworks: ArtworkImage[];
  tokens: ArtworkApprovalToken[];
  totalVersions: number;
}

export interface PublicApprovalData {
  order: {
    id: string;
    title: string;
    description?: string;
    customer: {
      id: string;
      name: string;
      email?: string;
    };
  };
  artwork: {
    id: string;
    name: string;
    url: string;
    type?: string;
    version: number;
    status: ArtworkStatus;
  };
  token: {
    expiresAt: Date;
  };
  comments: any[];
}

// ============================================
// ART APPROVAL SERVICE CLASS (BACKEND)
// ============================================

class ArtApprovalServiceBackend {
  /**
   * Converte arquivo para base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Faz upload de uma arte finalizada para um pedido
   */
  async uploadFinalizedArtwork(options: ArtworkUploadOptions): Promise<ArtApprovalResult> {
    try {
      console.log(`📤 [ArtApprovalBackend] Upload de arte para pedido ${options.orderId}`);

      const artworkData = await this.fileToBase64(options.file);

      const response = await apiService.post<ArtApprovalResult>('/art-approval/upload', {
        orderId: options.orderId,
        artworkData,
        artworkName: options.name || options.file.name,
        artworkType: options.file.type,
      });

      console.log(`✅ [ArtApprovalBackend] Arte enviada com sucesso`);
      return response;
    } catch (error: any) {
      console.error('[ArtApprovalBackend] Erro no upload:', error);
      return {
        success: false,
        message: 'Erro ao enviar arte',
        error: error.message,
      };
    }
  }

  /**
   * Gera um link público para aprovação de arte
   */
  async generateApprovalLink(
    orderId: string,
    artworkId: string,
    sendEmail: boolean = true
  ): Promise<ArtApprovalResult> {
    try {
      console.log(`🔗 [ArtApprovalBackend] Gerando link de aprovação para arte ${artworkId}`);

      const response = await apiService.post<ArtApprovalResult>('/art-approval/generate-link', {
        orderId,
        artworkId,
        sendEmail,
      });

      console.log(`✅ [ArtApprovalBackend] Link gerado: ${response.approvalLink}`);
      return response;
    } catch (error: any) {
      console.error('[ArtApprovalBackend] Erro ao gerar link:', error);
      return {
        success: false,
        message: 'Erro ao gerar link',
        error: error.message,
      };
    }
  }

  /**
   * Upload de nova versão da arte (após ajuste)
   */
  async uploadNewVersion(options: NewVersionOptions): Promise<ArtApprovalResult> {
    try {
      console.log(`📤 [ArtApprovalBackend] Upload de nova versão para pedido ${options.orderId}`);

      const artworkData = await this.fileToBase64(options.file);

      const response = await apiService.post<ArtApprovalResult>('/art-approval/new-version', {
        orderId: options.orderId,
        previousArtworkId: options.previousArtworkId,
        artworkData,
        artworkName: options.name || options.file.name,
        artworkType: options.file.type,
      });

      console.log(`✅ [ArtApprovalBackend] Nova versão enviada com sucesso`);
      return response;
    } catch (error: any) {
      console.error('[ArtApprovalBackend] Erro ao criar nova versão:', error);
      return {
        success: false,
        message: 'Erro ao criar nova versão',
        error: error.message,
      };
    }
  }

  /**
   * Obtém histórico de versões de arte de um pedido
   */
  async getArtworkHistory(orderId: string): Promise<ArtworkHistoryResponse> {
    try {
      console.log(`📜 [ArtApprovalBackend] Buscando histórico de artes do pedido ${orderId}`);

      const response = await apiService.get<ArtworkHistoryResponse>(
        `/art-approval/history/${orderId}`
      );

      return response;
    } catch (error: any) {
      console.error('[ArtApprovalBackend] Erro ao buscar histórico:', error);
      return {
        artworks: [],
        tokens: [],
        totalVersions: 0,
      };
    }
  }

  /**
   * Obtém dados para a página pública de aprovação
   */
  async getPublicApprovalData(token: string): Promise<PublicApprovalData | null> {
    try {
      console.log(`🔍 [ArtApprovalBackend] Buscando dados públicos para token`);

      const response = await apiService.get<PublicApprovalData>(
        `/art-approval/public/${token}`,
        false // Não requer autenticação
      );

      return response;
    } catch (error: any) {
      console.error('[ArtApprovalBackend] Erro ao buscar dados públicos:', error);
      return null;
    }
  }

  /**
   * Processa decisão de aprovação (público)
   */
  async processPublicDecision(
    token: string,
    decision: ApprovalDecision
  ): Promise<ArtApprovalResult> {
    try {
      console.log(`📋 [ArtApprovalBackend] Processando decisão: ${decision.decision}`);

      const response = await apiService.post<ArtApprovalResult>(
        `/art-approval/public/${token}/decide`,
        {
          decision: decision.decision,
          clientName: decision.clientName,
          feedback: decision.feedback,
        },
        false // Não requer autenticação
      );

      console.log(`✅ [ArtApprovalBackend] Decisão processada com sucesso`);
      return response;
    } catch (error: any) {
      console.error('[ArtApprovalBackend] Erro ao processar decisão:', error);
      return {
        success: false,
        message: 'Erro ao processar decisão',
        error: error.message,
      };
    }
  }
}

export const artApprovalServiceBackend = new ArtApprovalServiceBackend();
export default artApprovalServiceBackend;
