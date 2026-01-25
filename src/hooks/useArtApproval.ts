/**
 * Hook useArtApproval - Gerencia estado de aprovação de arte
 * 
 * Este hook fornece uma interface unificada para o sistema de aprovação
 * de arte, escolhendo automaticamente entre backend e localStorage.
 */

import { useState, useCallback } from 'react';
import { config } from '@/config';
import { artApprovalService } from '@/lib/services/artApprovalService';
import { artApprovalServiceBackend } from '@/lib/services/artApprovalServiceBackend';
import type { ArtworkImage, ArtworkApprovalToken } from '@/types';

// Escolher serviço baseado na configuração
const getService = () => {
  if (config.USE_BACKEND_API) {
    return artApprovalServiceBackend;
  }
  return artApprovalService;
};

interface UseArtApprovalReturn {
  // Estado
  loading: boolean;
  error: string | null;
  
  // Ações
  uploadArtwork: (orderId: string, file: File, name?: string) => Promise<boolean>;
  generateLink: (orderId: string, artworkId: string, sendEmail?: boolean) => Promise<string | null>;
  uploadNewVersion: (orderId: string, previousArtworkId: string, file: File, name?: string) => Promise<boolean>;
  getHistory: (orderId: string) => Promise<{ artworks: ArtworkImage[]; tokens: ArtworkApprovalToken[] }>;
  
  // Utilitários
  clearError: () => void;
}

export function useArtApproval(): UseArtApprovalReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Upload de arte finalizada
   */
  const uploadArtwork = useCallback(async (
    orderId: string,
    file: File,
    name?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const service = getService();
      
      if (config.USE_BACKEND_API) {
        const result = await (service as typeof artApprovalServiceBackend).uploadFinalizedArtwork({
          orderId,
          file,
          name,
        });
        
        if (!result.success) {
          setError(result.error || result.message);
          return false;
        }
        
        return true;
      } else {
        const result = await (service as typeof artApprovalService).uploadFinalizedArtwork({
          orderId,
          file,
          name,
          uploadedBy: 'current_user', // Será substituído pelo serviço
        });
        
        if (!result.success) {
          setError(result.error || result.message);
          return false;
        }
        
        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload da arte');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Gera link de aprovação
   */
  const generateLink = useCallback(async (
    orderId: string,
    artworkId: string,
    sendEmail: boolean = true
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const service = getService();
      
      if (config.USE_BACKEND_API) {
        const result = await (service as typeof artApprovalServiceBackend).generateApprovalLink(
          orderId,
          artworkId,
          sendEmail
        );
        
        if (!result.success) {
          setError(result.error || result.message);
          return null;
        }
        
        return result.approvalLink || null;
      } else {
        const result = (service as typeof artApprovalService).generateApprovalLink(orderId, artworkId);
        
        if (!result.success) {
          setError(result.error || result.message);
          return null;
        }
        
        // Construir link manualmente para localStorage
        const token = result.token?.token;
        if (token) {
          return `${window.location.origin}/arte/aprovar/${token}`;
        }
        
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar link de aprovação');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload de nova versão da arte
   */
  const uploadNewVersion = useCallback(async (
    orderId: string,
    previousArtworkId: string,
    file: File,
    name?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      if (config.USE_BACKEND_API) {
        const result = await artApprovalServiceBackend.uploadNewVersion({
          orderId,
          previousArtworkId,
          file,
          name,
        });
        
        if (!result.success) {
          setError(result.error || result.message);
          return false;
        }
        
        return true;
      } else {
        // Para localStorage, fazer upload normal (não tem versionamento)
        const result = await artApprovalService.uploadFinalizedArtwork({
          orderId,
          file,
          name,
          uploadedBy: 'current_user',
        });
        
        if (!result.success) {
          setError(result.error || result.message);
          return false;
        }
        
        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload da nova versão');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtém histórico de versões
   */
  const getHistory = useCallback(async (
    orderId: string
  ): Promise<{ artworks: ArtworkImage[]; tokens: ArtworkApprovalToken[] }> => {
    setLoading(true);
    setError(null);

    try {
      if (config.USE_BACKEND_API) {
        const result = await artApprovalServiceBackend.getArtworkHistory(orderId);
        return {
          artworks: result.artworks,
          tokens: result.tokens,
        };
      } else {
        // Para localStorage, buscar do pedido
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const order = orders.find((o: any) => o.id === orderId);
        
        return {
          artworks: order?.finalizedArtworks || [],
          tokens: order?.artworkApprovalTokens || [],
        };
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar histórico');
      return { artworks: [], tokens: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    uploadArtwork,
    generateLink,
    uploadNewVersion,
    getHistory,
    clearError,
  };
}

export default useArtApproval;
