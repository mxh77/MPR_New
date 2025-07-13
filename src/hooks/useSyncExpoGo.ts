/**
 * Hook pour gérer la synchronisation des données
 * Version compatible Expo Go
 */
import { useState, useCallback } from 'react';
import { useDatabase } from '../contexts';

export interface SyncState {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  error: string | null;
  pendingCount: number;
}

export const useSync = () => {
  const { isReady } = useDatabase();
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncAt: null,
    error: null,
    pendingCount: 0,
  });

  const syncNow = useCallback(async () => {
    if (!isReady) return;
    
    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));
    
    try {
      // TODO: Implémenter la synchronisation avec AsyncStorage
      console.log('📍 Synchronisation simulée (compatible Expo Go)');
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simule la sync
      
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
  }, [isReady]);

  const clearError = useCallback(() => {
    setSyncState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...syncState,
    syncNow,
    clearError,
  };
};
