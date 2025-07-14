/**
 * Utilitaires de développement pour WatermelonDB
 * ⚠️ À UTILISER UNIQUEMENT EN DÉVELOPPEMENT
 */
import { database } from './index';

/**
 * Réinitialise complètement la base de données
 * ⚠️ SUPPRIME TOUTES LES DONNÉES !
 */
export const resetDatabase = async (): Promise<void> => {
  if (__DEV__) {
    console.log('🗑️ Réinitialisation de la base de données...');
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    console.log('✅ Base de données réinitialisée');
  } else {
    console.warn('⚠️ resetDatabase() ne peut être utilisé qu\'en développement');
  }
};

/**
 * Affiche des statistiques sur la base de données
 */
export const getDatabaseStats = async (): Promise<void> => {
  if (__DEV__) {
    const roadtrips = await database.get('roadtrips').query().fetchCount();
    const steps = await database.get('steps').query().fetchCount();
    const activities = await database.get('activities').query().fetchCount();
    const accommodations = await database.get('accommodations').query().fetchCount();
    
    console.log('📊 Statistiques base de données:');
    console.log(`  - Roadtrips: ${roadtrips}`);
    console.log(`  - Steps: ${steps}`);
    console.log(`  - Activities: ${activities}`);
    console.log(`  - Accommodations: ${accommodations}`);
  }
};

/**
 * Vide une table spécifique
 */
export const clearTable = async (tableName: string): Promise<void> => {
  if (__DEV__) {
    console.log(`🗑️ Vidage de la table ${tableName}...`);
    await database.write(async () => {
      const records = await database.get(tableName).query().fetch();
      await Promise.all(records.map(record => record.destroyPermanently()));
    });
    console.log(`✅ Table ${tableName} vidée`);
  } else {
    console.warn('⚠️ clearTable() ne peut être utilisé qu\'en développement');
  }
};
