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

// Configuration de l'adaptateur SQLite pour Expo Dev Client
const adapter = new SQLiteAdapter({
  dbName: DATABASE_CONFIG.name,
  schema,
  migrations,
  jsi: true, // Utilise JSI pour de meilleures performances
  onSetUpError: (error) => {
    console.error('❌ Erreur configuration WatermelonDB:', error);
  },
});

// Initialisation de la base de données
export const database = new Database({
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
