/**
 * Interface de base pour tous les repositories avec support offline-first
 */
import { Q } from '@nozbe/watermelondb';
import database from '../database';
import type { SyncResult, SyncStatus } from '../../types';

export interface IBaseRepository<T, TModel> {
  // CRUD operations
  create(data: Partial<T>, options?: { optimistic?: boolean }): Promise<T>;
  update(id: string, data: Partial<T>, options?: { optimistic?: boolean }): Promise<T>;
  delete(id: string, options?: { optimistic?: boolean }): Promise<void>;
  get(id: string, options?: { fromCache?: boolean }): Promise<T | null>;
  list(filters?: any, options?: { fromCache?: boolean }): Promise<T[]>;

  // Synchronization
  sync(): Promise<SyncResult>;
  forceSync(): Promise<SyncResult>;
  getSyncStatus(): Promise<SyncStatus>;
}

/**
 * Repository de base avec implémentation commune offline-first
 */
export abstract class BaseRepository<T, TModel> implements IBaseRepository<T, TModel> {
  protected abstract tableName: string;
  protected abstract modelClass: any;

  /**
   * Créer un nouvel enregistrement avec support optimiste
   */
  async create(data: Partial<T>, options: { optimistic?: boolean } = { optimistic: true }): Promise<T> {
    const collection = database.get(this.tableName);
    
    const record = await database.write(async () => {
      const newRecord = await collection.create((record: any) => {
        Object.assign(record, this.transformForDatabase(data));
        record.customSyncStatus = options.optimistic ? 'pending' : 'synced';
        record.createdAt = new Date();
        record.updatedAt = new Date();
      });

      // Ajouter à la queue de synchronisation si optimiste
      if (options.optimistic) {
        await this.addToSyncQueue('create', newRecord.id, data);
      }

      return newRecord;
    });

    return this.transformFromDatabase(record);
  }

  /**
   * Mettre à jour un enregistrement avec support optimiste
   */
  async update(id: string, data: Partial<T>, options: { optimistic?: boolean } = { optimistic: true }): Promise<T> {
    const collection = database.get(this.tableName);
    const record = await collection.find(id);

    const updatedRecord = await database.write(async () => {
      const updated = await record.update((record: any) => {
        Object.assign(record, this.transformForDatabase(data));
        record.customSyncStatus = options.optimistic ? 'pending' : 'synced';
        record.updatedAt = new Date();
      });

      // Ajouter à la queue de synchronisation si optimiste
      if (options.optimistic) {
        await this.addToSyncQueue('update', id, data);
      }

      return updated;
    });

    return this.transformFromDatabase(updatedRecord);
  }

  /**
   * Supprimer un enregistrement avec support optimiste
   */
  async delete(id: string, options: { optimistic?: boolean } = { optimistic: true }): Promise<void> {
    const collection = database.get(this.tableName);
    
    await database.write(async () => {
      // Ajouter à la queue de synchronisation avant suppression si optimiste
      if (options.optimistic) {
        await this.addToSyncQueue('delete', id, {});
      }

      const record = await collection.find(id);
      await record.markAsDeleted();
    });
  }

  /**
   * Récupérer un enregistrement par ID
   */
  async get(id: string, options: { fromCache?: boolean } = { fromCache: true }): Promise<T | null> {
    try {
      const collection = database.get(this.tableName);
      const record = await collection.find(id);
      return this.transformFromDatabase(record);
    } catch {
      return null;
    }
  }

  /**
   * Lister les enregistrements avec filtres optionnels
   */
  async list(filters: any = {}, options: { fromCache?: boolean } = { fromCache: true }): Promise<T[]> {
    const collection = database.get(this.tableName);
    const query = this.buildQuery(collection, filters);
    const records = await query.fetch();
    
    return records.map((record: any) => this.transformFromDatabase(record));
  }

  /**
   * Synchroniser avec le serveur
   */
  async sync(): Promise<SyncResult> {
    const startTime = new Date();
    let syncedRecords = 0;
    let failedRecords = 0;
    const errors: string[] = [];

    try {
      // Obtenir les éléments en attente de synchronisation
      const pendingItems = await this.getPendingSyncItems();

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          syncedRecords++;
        } catch (error) {
          failedRecords++;
          errors.push(`${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: failedRecords === 0,
        syncedRecords,
        failedRecords,
        errors,
        lastSyncAt: startTime,
      };
    } catch (error) {
      return {
        success: false,
        syncedRecords,
        failedRecords: failedRecords + 1,
        errors: [...errors, error instanceof Error ? error.message : 'Sync failed'],
        lastSyncAt: startTime,
      };
    }
  }

  /**
   * Forcer la synchronisation complète
   */
  async forceSync(): Promise<SyncResult> {
    // Marquer tous les enregistrements comme nécessitant une synchronisation
    const collection = database.get(this.tableName);
    await database.write(async () => {
      const allRecords = await collection.query().fetch();
      for (const record of allRecords) {
        await (record as any).markForSync();
      }
    });

    return this.sync();
  }

  /**
   * Obtenir le statut de synchronisation
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const collection = database.get(this.tableName);
    
    const [pendingItems, failedItems] = await Promise.all([
      collection.query(Q.where('sync_status', 'pending')).fetchCount(),
      collection.query(Q.where('sync_status', 'error')).fetchCount(),
    ]);

    // Détection basique de la connectivité (à améliorer avec NetInfo)
    const isOnline = true; // TODO: Intégrer NetInfo
    const isSyncing = false; // TODO: Tracker l'état de synchronisation global

    return {
      isOnline,
      isSyncing,
      lastSyncAt: undefined, // TODO: Tracker la dernière synchronisation
      pendingItems,
      failedItems,
    };
  }

  /**
   * Transformer les données pour la base de données (à implémenter par les repositories enfants)
   */
  protected abstract transformForDatabase(data: Partial<T>): any;

  /**
   * Transformer les données depuis la base de données (à implémenter par les repositories enfants)
   */
  protected abstract transformFromDatabase(record: any): T;

  /**
   * Construire une query WatermelonDB (à implémenter par les repositories enfants)
   */
  protected abstract buildQuery(collection: any, filters: any): any;

  /**
   * Ajouter un élément à la queue de synchronisation
   */
  private async addToSyncQueue(operation: 'create' | 'update' | 'delete', recordId: string, data: any): Promise<void> {
    const syncCollection = database.get('sync_queue');
    
    await syncCollection.create((syncRecord: any) => {
      syncRecord.tableName = this.tableName;
      syncRecord.recordId = recordId;
      syncRecord.operation = operation;
      syncRecord.dataJson = JSON.stringify(data);
      syncRecord.attempts = 0;
      syncRecord.customSyncStatus = 'pending';
      syncRecord.createdAt = new Date();
      syncRecord.updatedAt = new Date();
    });
  }

  /**
   * Obtenir les éléments en attente de synchronisation
   */
  private async getPendingSyncItems(): Promise<any[]> {
    const collection = database.get(this.tableName);
    return collection.query(Q.where('sync_status', 'pending')).fetch();
  }

  /**
   * Synchroniser un élément spécifique (à implémenter par les repositories enfants)
   */
  protected abstract syncItem(item: any): Promise<void>;
}
