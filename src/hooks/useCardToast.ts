import { useCallback } from 'react';
import { toast } from 'sonner';
import { Status } from '@/types';
import { statusNames } from '@/lib/data';

interface ToastOptions {
  duration?: number;
  showUndo?: boolean;
  undoTimeout?: number;
}

export function useCardToast() {
  const showMoveSuccess = useCallback(
    (
      cardTitle: string,
      fromStatus: Status,
      toStatus: Status,
      onUndo?: () => void,
      options: ToastOptions = {}
    ) => {
      const {
        duration = 5000,
        showUndo = true,
        undoTimeout = 3000
      } = options;

      let toastId: string | number;
      let undoTimeoutId: NodeJS.Timeout;

      const undoAction = showUndo && onUndo ? {
        label: 'Desfazer',
        onClick: () => {
          clearTimeout(undoTimeoutId);
          onUndo();
          toast.dismiss(toastId);
          
          // Toast de confirmação do undo
          toast.info('Movimento desfeito', {
            duration: 2000,
            description: `"${cardTitle}" voltou para ${statusNames[fromStatus]}`
          });
        }
      } : undefined;

      toastId = toast.success(
        `📍 Card movido para ${statusNames[toStatus]}!`,
        {
          duration,
          description: `"${cardTitle}" transferido com sucesso`,
          action: undoAction
        }
      );

      // Auto-remover ação de desfazer após timeout
      if (showUndo && onUndo) {
        undoTimeoutId = setTimeout(() => {
          toast.dismiss(toastId);
          toast.success('Movimento confirmado', {
            duration: 1500,
            description: 'Alteração salva permanentemente'
          });
        }, undoTimeout);
      }

      return toastId;
    },
    []
  );

  const showReorderSuccess = useCallback(
    (
      cardTitle: string,
      columnName: string,
      onUndo?: () => void,
      options: ToastOptions = {}
    ) => {
      const {
        duration = 2000,
        showUndo = false
      } = options;

      const undoAction = showUndo && onUndo ? {
        label: 'Desfazer',
        onClick: () => {
          onUndo();
          toast.info('Posição restaurada', { duration: 1500 });
        }
      } : undefined;

      return toast.success(
        '✨ Posição atualizada!',
        {
          duration,
          description: `"${cardTitle}" reordenado em ${columnName}`,
          action: undoAction
        }
      );
    },
    []
  );

  const showError = useCallback(
    (
      message: string,
      description?: string,
      onRetry?: () => void
    ) => {
      const retryAction = onRetry ? {
        label: 'Tentar novamente',
        onClick: onRetry
      } : undefined;

      return toast.error(message, {
        duration: 6000,
        description,
        action: retryAction
      });
    },
    []
  );

  const showBulkMoveSuccess = useCallback(
    (
      count: number,
      toStatus: Status,
      onUndo?: () => void
    ) => {
      const undoAction = onUndo ? {
        label: 'Desfazer tudo',
        onClick: () => {
          onUndo();
          toast.info(`${count} cards restaurados`, { duration: 2000 });
        }
      } : undefined;

      return toast.success(
        `📦 ${count} cards movidos!`,
        {
          duration: 4000,
          description: `Transferidos para ${statusNames[toStatus]}`,
          action: undoAction
        }
      );
    },
    []
  );

  const showDragStart = useCallback(
    (cardTitle: string) => {
      return toast.info(
        '🎯 Movendo card...',
        {
          duration: 1000,
          description: `"${cardTitle}" em movimento`,
          style: {
            background: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgb(59, 130, 246)',
            color: 'rgb(30, 64, 175)'
          }
        }
      );
    },
    []
  );

  const showValidationError = useCallback(
    (
      error: 'invalid_move' | 'same_position' | 'permission_denied' | 'network_error',
      cardTitle?: string
    ) => {
      const errorMessages = {
        invalid_move: {
          title: '❌ Movimento inválido',
          description: 'Esta movimentação não é permitida'
        },
        same_position: {
          title: '🔄 Mesma posição',
          description: 'O card já está nesta posição'
        },
        permission_denied: {
          title: '🚫 Sem permissão',
          description: 'Você não tem permissão para mover este card'
        },
        network_error: {
          title: '📡 Erro de conexão',
          description: 'Verifique sua conexão e tente novamente'
        }
      };

      const errorConfig = errorMessages[error];
      
      return toast.error(errorConfig.title, {
        duration: 4000,
        description: cardTitle 
          ? `"${cardTitle}": ${errorConfig.description}`
          : errorConfig.description
      });
    },
    []
  );

  return {
    showMoveSuccess,
    showReorderSuccess,
    showError,
    showBulkMoveSuccess,
    showDragStart,
    showValidationError
  };
} 