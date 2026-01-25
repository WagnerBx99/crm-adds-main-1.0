/**
 * Componente SyncStatusIndicator
 * 
 * Exibe o status de sincronização no canto da tela
 */

import React, { useState } from 'react';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle, 
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  RotateCcw
} from 'lucide-react';

export const SyncStatusIndicator: React.FC = () => {
  const { 
    status, 
    pendingOperations, 
    failedOperations,
    sync,
    retryFailed,
    discardFailed 
  } = useSyncStatus();
  
  const [isExpanded, setIsExpanded] = useState(false);

  // Determinar cor e ícone baseado no status
  const getStatusInfo = () => {
    if (!status.isOnline) {
      return {
        icon: CloudOff,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        label: 'Offline',
      };
    }

    if (status.isSyncing) {
      return {
        icon: RefreshCw,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
        label: 'Sincronizando...',
        animate: true,
      };
    }

    if (status.failedOperations > 0) {
      return {
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        label: `${status.failedOperations} falha(s)`,
      };
    }

    if (status.pendingOperations > 0) {
      return {
        icon: Cloud,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100',
        label: `${status.pendingOperations} pendente(s)`,
      };
    }

    return {
      icon: Check,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      label: 'Sincronizado',
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  // Não mostrar se não houver nada para mostrar
  if (status.isOnline && status.pendingOperations === 0 && status.failedOperations === 0 && !status.isSyncing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`rounded-lg shadow-lg ${statusInfo.bgColor} border border-gray-200`}>
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 w-full"
        >
          <Icon 
            className={`w-4 h-4 ${statusInfo.color} ${statusInfo.animate ? 'animate-spin' : ''}`} 
          />
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          {(status.pendingOperations > 0 || status.failedOperations > 0) && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-400 ml-auto" />
            )
          )}
        </button>

        {/* Detalhes expandidos */}
        {isExpanded && (status.pendingOperations > 0 || status.failedOperations > 0) && (
          <div className="px-3 pb-3 border-t border-gray-200 pt-2">
            {/* Operações pendentes */}
            {pendingOperations.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  Pendentes ({pendingOperations.length})
                </p>
                <ul className="text-xs text-gray-500 max-h-20 overflow-y-auto">
                  {pendingOperations.slice(0, 5).map(op => (
                    <li key={op.id} className="truncate">
                      {op.type} {op.entityType} #{op.entityId.slice(0, 8)}
                    </li>
                  ))}
                  {pendingOperations.length > 5 && (
                    <li className="text-gray-400">
                      +{pendingOperations.length - 5} mais...
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Operações com falha */}
            {failedOperations.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-red-600 font-medium mb-1">
                  Falhas ({failedOperations.length})
                </p>
                <ul className="text-xs text-gray-500 max-h-20 overflow-y-auto">
                  {failedOperations.slice(0, 3).map(op => (
                    <li key={op.id} className="truncate">
                      {op.type} {op.entityType}: {op.lastError}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2 mt-2">
              {status.isOnline && status.pendingOperations > 0 && (
                <button
                  onClick={() => sync()}
                  disabled={status.isSyncing}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sincronizar
                </button>
              )}

              {failedOperations.length > 0 && (
                <>
                  <button
                    onClick={() => retryFailed()}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retentar
                  </button>
                  <button
                    onClick={() => discardFailed()}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                    Descartar
                  </button>
                </>
              )}
            </div>

            {/* Última sincronização */}
            {status.lastSyncAt && (
              <p className="text-xs text-gray-400 mt-2">
                Última sync: {new Date(status.lastSyncAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatusIndicator;
