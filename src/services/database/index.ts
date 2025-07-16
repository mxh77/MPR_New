/**
 * Configuration et initialisation de WatermelonDB
 */
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { migrations } from './migrations';
import { DATABASE_CONFIG } from '../../config';

// Import des modèles
import {
  Roadtrip,
  Step,
  Activity,
  Accommodation,
  RoadtripTask,
  File,
  Story,
  Notification,
  SyncQueue,
} from './models';

let _database: Database | null = null;
let databaseInitialized = false;

/**
 * ✅ CORRECTION CRITIQUE: Initialisation robuste pour éviter "No driver with tag 2 available"
 */
const initializeDatabase = async (): Promise<Database> => {
  if (databaseInitialized && _database) {
    return _database;
  }

  try {
    console.log('🔧 Initialisation WatermelonDB...');
    
    // Configuration de l'adaptateur SQLite avec gestion d'erreur robuste
    const adapter = new SQLiteAdapter({
      dbName: DATABASE_CONFIG.name,
      schema,
      migrations,
      jsi: true, // ✅ CRITIQUE: JSI pour performances en production
      onSetUpError: (error) => {
        console.error('❌ Erreur setup WatermelonDB:', error);
        // Ne pas crash en production, continuer avec fallback
      },
    });

    // Initialisation de la base de données
    _database = new Database({
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

    // ✅ Test de connection pour valider que tout fonctionne
    await _database.get('roadtrips').query().fetch();
    console.log('✅ WatermelonDB initialisé avec succès');
    
    databaseInitialized = true;
    return _database;

  } catch (error) {
    console.error('❌ Erreur critique d\'initialisation WatermelonDB:', error);
    
    // ✅ FALLBACK: Tentative de reset si base corrompue
    if (_database) {
      try {
        console.log('🔄 Tentative de réinitialisation de la base...');
        await _database.write(async () => {
          await _database!.unsafeResetDatabase();
        });
        console.log('🔄 Base réinitialisée, nouvelle tentative...');
        databaseInitialized = true;
        return _database;
      } catch (resetError) {
        console.error('❌ Impossible de réinitialiser la base:', resetError);
      }
    }
    
    throw new Error(`Database unavailable: ${error}`);
  }
};

// ✅ Export de la fonction d'initialisation
export { initializeDatabase };

// ✅ Fonction pour obtenir la base de données de manière sûre
export const getDatabase = async (): Promise<Database> => {
  if (!_database) {
    _database = await initializeDatabase();
  }
  return _database;
};

// ✅ Instance par défaut synchrone pour compatibilité
export const database = new Database({
  adapter: new SQLiteAdapter({
    dbName: DATABASE_CONFIG.name,
    schema,
    migrations,
    jsi: true,
    onSetUpError: (error) => {
      console.error('❌ Erreur WatermelonDB:', error);
    },
  }),
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

// 🚨 RESET TEMPORAIRE POUR DÉVELOPPEMENT
// Réinitialise la base de données au démarrage pour résoudre les conflits de version
if (__DEV__) {
  (async () => {
    try {
      console.log('🔄 Réinitialisation de la base de données en développement...');
      await database.write(async () => {
        await database.unsafeResetDatabase();
      });
      console.log('✅ Base de données réinitialisée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
    }
  })();
}

export default database;
