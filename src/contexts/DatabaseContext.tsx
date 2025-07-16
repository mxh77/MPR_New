/**
 * Contexte de base de données avec gestion d'erreur robuste pour WatermelonDB
 * Résout le problème "No driver with tag 2 available" en production
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '../services/database/schema';
import { migrations } from '../services/database/migrations';

// Import des modèles
import Roadtrip from '../services/database/models/Roadtrip';
import Step from '../services/database/models/Step';
import Activity from '../services/database/models/Activity';
import Accommodation from '../services/database/models/Accommodation';
import RoadtripTask from '../services/database/models/RoadtripTask';
import File from '../services/database/models/File';
import Story from '../services/database/models/Story';
import Notification from '../services/database/models/Notification';
import SyncQueue from '../services/database/models/SyncQueue';

interface DatabaseContextType {
  database: Database | null;
  isReady: boolean;
  error: string | null;
  retryInitialization: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({
  database: null,
  isReady: false,
  error: null,
  retryInitialization: async () => {},
});

interface DatabaseProviderProps {
  children: ReactNode;
}

let databaseInstance: Database | null = null;

/**
 * Initialise la base de données avec gestion d'erreur robuste
 * Résout le problème "No driver with tag 2 available"
 */
const initializeDatabase = async (): Promise<Database> => {
  try {
    console.log('🔧 Initialisation WatermelonDB...');

    // Configuration de l'adaptateur SQLite avec options pour production
    const adapter = new SQLiteAdapter({
      schema,
      migrations,
      jsi: true, // Activé pour de meilleures performances en production
      onSetUpError: (error) => {
        console.error('❌ Erreur setup WatermelonDB:', error);
        // Ne pas crash en production, loguer seulement
      },
    });

    console.log('✅ Adaptateur SQLite configuré');

    // Création de l'instance de base de données
    const database = new Database({
      adapter,
      modelClasses: [
        Roadtrip,
        Step,
        Activity,
        Accommodation,
        RoadtripTask,
        File,
        Story,
        Notification,
        SyncQueue,
      ],
    });

    console.log('✅ Instance Database créée');

    // Test de connexion pour vérifier que tout fonctionne
    try {
      const testQuery = await database.get('roadtrips').query().fetch();
      console.log('✅ Test de connexion réussi, roadtrips trouvés:', testQuery.length);
    } catch (testError) {
      console.warn('⚠️ Erreur test initial (normal si première utilisation):', testError);
    }

    console.log('🎉 WatermelonDB initialisé avec succès');
    return database;

  } catch (error) {
    console.error('❌ Erreur critique d\'initialisation WatermelonDB:', error);
    
    // Tentative de récupération avec reset
    if (databaseInstance) {
      try {
        console.log('🔄 Tentative de reset de la base...');
        await databaseInstance.write(async () => {
          await databaseInstance!.unsafeResetDatabase();
        });
        console.log('✅ Reset réussi, nouvelle tentative...');
        
        // Récursion pour réessayer après reset
        return await initializeDatabase();
      } catch (resetError) {
        console.error('❌ Échec du reset:', resetError);
      }
    }
    
    throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [database, setDatabase] = useState<Database | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initDb = async () => {
    try {
      setError(null);
      setIsReady(false);
      
      console.log('🚀 Démarrage initialisation base de données...');
      
      // Réutiliser l'instance existante si disponible
      if (databaseInstance) {
        console.log('♻️ Réutilisation instance database existante');
        setDatabase(databaseInstance);
        setIsReady(true);
        return;
      }

      // Créer nouvelle instance
      const dbInstance = await initializeDatabase();
      databaseInstance = dbInstance;
      setDatabase(dbInstance);
      setIsReady(true);
      
      console.log('✅ DatabaseContext prêt');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Erreur DatabaseProvider:', errorMessage);
      setError(errorMessage);
      setIsReady(false);
    }
  };

  const retryInitialization = async () => {
    console.log('🔄 Retry initialisation database...');
    databaseInstance = null; // Force nouvelle création
    await initDb();
  };

  useEffect(() => {
    initDb();
  }, []);

  const contextValue: DatabaseContextType = {
    database,
    isReady,
    error,
    retryInitialization,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

// Export de l'instance pour compatibilité avec le code existant
export { databaseInstance as database };
export default DatabaseContext;
