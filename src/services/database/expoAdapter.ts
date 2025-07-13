/**
 * Adaptateur de base de données simplifié pour Expo Go
 * Utilise AsyncStorage pour le développement
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageItem {
  id: string;
  data: any;
  updatedAt: number;
}

class ExpoStorageAdapter {
  private storagePrefix = 'mpr_db_';

  async getAll(tableName: string): Promise<StorageItem[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tableKeys = keys.filter(key => key.startsWith(`${this.storagePrefix}${tableName}_`));
      
      if (tableKeys.length === 0) return [];
      
      const items = await AsyncStorage.multiGet(tableKeys);
      return items
        .filter(([_, value]) => value !== null)
        .map(([_, value]) => JSON.parse(value!));
    } catch (error) {
      console.error(`Erreur lors du chargement de ${tableName}:`, error);
      return [];
    }
  }

  async save(tableName: string, id: string, data: any): Promise<void> {
    try {
      const item: StorageItem = {
        id,
        data,
        updatedAt: Date.now(),
      };
      
      const key = `${this.storagePrefix}${tableName}_${id}`;
      await AsyncStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde dans ${tableName}:`, error);
      throw error;
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    try {
      const key = `${this.storagePrefix}${tableName}_${id}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Erreur lors de la suppression dans ${tableName}:`, error);
      throw error;
    }
  }

  async clear(tableName: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tableKeys = keys.filter(key => key.startsWith(`${this.storagePrefix}${tableName}_`));
      
      if (tableKeys.length > 0) {
        await AsyncStorage.multiRemove(tableKeys);
      }
    } catch (error) {
      console.error(`Erreur lors du nettoyage de ${tableName}:`, error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testKey = `${this.storagePrefix}test`;
      await AsyncStorage.setItem(testKey, 'test');
      const value = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);
      return value === 'test';
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error);
      return false;
    }
  }
}

export const expoStorageAdapter = new ExpoStorageAdapter();
