/**
 * Hook useSyncStatus - Gerencia estado de sincronização
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncStatus, SyncOperation } from '@/lib/services/syncService';

interface UseSyncStatusReturn {
  status: SyncStatus;
  pendingOperations: SyncOperation[];
  failedOperations: SyncOperation[];
  sync: () => Promise<void>;
  retryFailed: () => Promise<void>;
  discardFailed: () => void;
  clearQueue: () => void;
}

export function useSyncStatus(): UseSyncStatusReturn {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());
  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>([]);
  const [failedOperations, setFailedOperations] = useState<SyncOperation[]>([]);

  // Atualizar status periodicamente
  useEffect(() => {
    const updateStatus = () => {
      setStatus(syncService.getStatus());
      setPendingOperations(syncService.getPendingOperations());
      setFailedOperations(syncService.getFailedOperations());
    };

    // Atualizar imediatamente
    updateStatus();

    // Atualizar a cada 5 segundos
    const interval = setInterval(updateStatus, 5000);

    // Atualizar quando a conexão mudar
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sync = useCallback(async () => {
    await syncService.sync();
    setStatus(syncService.getStatus());
    setPendingOperations(syncService.getPendingOperations());
    setFailedOperations(syncService.getFailedOperations());
  }, []);

  const retryFailed = useCallback(async () => {
    await syncService.retryFailedOperations();
    setStatus(syncService.getStatus());
    setPendingOperations(syncService.getPendingOperations());
    setFailedOperations(syncService.getFailedOperations());
  }, []);

  const discardFailed = useCallback(() => {
    syncService.discardFailedOperations();
    setStatus(syncService.getStatus());
    setPendingOperations(syncService.getPendingOperations());
    setFailedOperations(syncService.getFailedOperations());
  }, []);

  const clearQueue = useCallback(() => {
    syncService.clearQueue();
    setStatus(syncService.getStatus());
    setPendingOperations(syncService.getPendingOperations());
    setFailedOperations(syncService.getFailedOperations());
  }, []);

  return {
    status,
    pendingOperations,
    failedOperations,
    sync,
    retryFailed,
    discardFailed,
    clearQueue,
  };
}

export default useSyncStatus;
