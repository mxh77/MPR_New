/**
 * Contexte de base de données WatermelonDB
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { database } from '../services';
import { ENV_CONFIG } from '../config';
import type { SyncStatus } from '../types';

// Types pour le contexte de base de données
interface DatabaseContextValue {
  database: typeof database;
  isOnline: boolean;
  syncStatus: SyncStatus;
  syncData: () => Promise<void>;
  forceSync: () => Promise<void>;
}

// Création du contexte
const DatabaseContext = createContext<DatabaseContextValue | undefined>(undefined);

// Props du provider
interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * Provider de base de données WatermelonDB
 */
export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSyncAt: undefined,
    pendingItems: 0,
    failedItems: 0,
  });

  // Surveillance de la connectivité réseau
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable === true;
      setIsOnline(online);
      
      setSyncStatus(prev => ({
        ...prev,
        isOnline: online,
      }));

      if (ENV_CONFIG.DEBUG_SYNC) {
        console.log('Network state changed:', { online, state });
      }
    });

    return unsubscribe;
  }, []);

  // Synchronisation automatique périodique
  useEffect(() => {
    if (!ENV_CONFIG.ENABLE_OFFLINE_MODE) return;

    const interval = setInterval(async () => {
      if (isOnline && !syncStatus.isSyncing) {
        await syncData();
      }
    }, 30000); // Sync toutes les 30 secondes

    return () => clearInterval(interval);
  }, [isOnline, syncStatus.isSyncing]);

  // Fonction de synchronisation
  const syncData = async (): Promise<void> => {
    if (!isOnline || syncStatus.isSyncing) {
      if (ENV_CONFIG.DEBUG_SYNC) {
        console.log('Sync skipped:', { isOnline, isSyncing: syncStatus.isSyncing });
      }
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      if (ENV_CONFIG.DEBUG_SYNC) {
        console.log('Starting sync...');
      }

      // TODO: Implémenter la synchronisation réelle avec les repositories
      // Pour l'instant, simulation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        pendingItems: 0,
        failedItems: 0,
      }));

      if (ENV_CONFIG.DEBUG_SYNC) {
        console.log('Sync completed successfully');
      }
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        failedItems: prev.failedItems + 1,
      }));

      if (ENV_CONFIG.DEBUG_SYNC) {
        console.error('Sync failed:', error);
      }
    }
  };

  // Fonction de synchronisation forcée
  const forceSync = async (): Promise<void> => {
    if (!isOnline) {
      throw new Error('Synchronisation impossible hors ligne');
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      if (ENV_CONFIG.DEBUG_SYNC) {
        console.log('Starting force sync...');
      }

      // TODO: Implémenter la synchronisation forcée avec les repositories
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        pendingItems: 0,
        failedItems: 0,
      }));

      if (ENV_CONFIG.DEBUG_SYNC) {
        console.log('Force sync completed successfully');
      }
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        failedItems: prev.failedItems + 1,
      }));

      throw error;
    }
  };

  const contextValue: DatabaseContextValue = {
    database,
    isOnline,
    syncStatus,
    syncData,
    forceSync,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte de base de données
 */
export const useDatabase = (): DatabaseContextValue => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export default DatabaseProvider;
