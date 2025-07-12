/**
 * Hook pour gérer la synchronisation des données
 */
import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts';
import { syncService } from '../services';

export interface SyncState {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  error: string | null;
  pendingCount: number;
}

export const useSync = () => {
  const { database } = useDatabase();
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncAt: null,
    error: null,
    pendingCount: 0,
  });

  // Synchronisation manuelle
  const triggerSync = useCallback(async () => {
    if (!database || syncState.isSyncing) return;

    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      await syncService.performSync();
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        pendingCount: 0,
      }));
    } catch (error) {
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Erreur de synchronisation',
      }));
    }
  }, [database, syncState.isSyncing]);

  // Obtenir le nombre d'éléments en attente de sync
  const getPendingCount = useCallback(async () => {
    if (!database) return;

    try {
      const count = await syncService.getPendingItemsCount();
      setSyncState(prev => ({ ...prev, pendingCount: count }));
    } catch (error) {
      console.error('Erreur lors du comptage des éléments en attente:', error);
    }
  }, [database]);

  // Mise à jour périodique du compteur
  useEffect(() => {
    if (database) {
      getPendingCount();
      const interval = setInterval(getPendingCount, 30000); // Toutes les 30 secondes
      return () => clearInterval(interval);
    }
  }, [database, getPendingCount]);

  return {
    ...syncState,
    triggerSync,
    refreshPendingCount: getPendingCount,
  };
};
