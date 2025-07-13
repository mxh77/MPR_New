/**
 * Contexte pour la base de données WatermelonDB
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '../services/database/schema';
import { Roadtrip, Step, Activity, SyncQueue } from '../services/database/models';

interface DatabaseContextType {
  database: Database | null;
  isReady: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [database, setDatabase] = useState<Database | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        console.log('🔄 Initialisation WatermelonDB...');
        
        // Configuration de l'adaptateur SQLite
        const adapter = new SQLiteAdapter({
          schema,
          dbName: 'mprnew.db',
          jsi: true, // Utilise JSI pour de meilleures performances
          onSetUpError: (error: any) => {
            console.error('❌ Erreur setup WatermelonDB:', error);
            setError(error.message);
          },
        });

        // Création de la base de données
        const db = new Database({
          adapter,
          modelClasses: [Roadtrip, Step, Activity, SyncQueue],
        });

        setDatabase(db);
        setIsReady(true);
        console.log('✅ WatermelonDB initialisé avec succès');
      } catch (err) {
        console.error('❌ Erreur initialisation WatermelonDB:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setIsReady(true);
      }
    };

    initDatabase();
  }, []);

  const value = {
    database,
    isReady,
    error,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
