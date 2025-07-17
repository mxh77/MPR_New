/**
 * Contexte pour gérer les rafraîchissements de données
 * Permet de notifier les écrans qu'ils doivent rafraîchir sans créer de boucles infinies
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

interface DataRefreshContextType {
  lastStepUpdate: number;
  notifyStepUpdate: (stepId: string) => void;
}

const DataRefreshContext = createContext<DataRefreshContextType | undefined>(undefined);

export const DataRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastStepUpdate, setLastStepUpdate] = useState(0);

  const notifyStepUpdate = useCallback((stepId: string) => {
    console.log('🔔 DataRefreshContext - Notification de mise à jour step:', stepId);
    setLastStepUpdate(Date.now());
  }, []);

  return (
    <DataRefreshContext.Provider value={{
      lastStepUpdate,
      notifyStepUpdate,
    }}>
      {children}
    </DataRefreshContext.Provider>
  );
};

export const useDataRefresh = () => {
  const context = useContext(DataRefreshContext);
  if (context === undefined) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
};
