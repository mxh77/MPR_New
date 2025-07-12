/**
 * Service de synchronisation des données
 */
import { Database } from '@nozbe/watermelondb';
import { SyncQueue } from '../database/models';
import { apiClient } from '../api';

class SyncService {
  private database: Database | null = null;

  /**
   * Initialise le service avec la base de données
   */
  init(database: Database): void {
    this.database = database;
  }

  /**
   * Effectue une synchronisation complète
   */
  async performSync(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // 1. Pousser les modifications locales
      await this.pushLocalChanges();

      // 2. Récupérer les modifications du serveur
      await this.pullServerChanges();

      // 3. Nettoyer la queue de synchronisation
      await this.cleanupSyncQueue();
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }

  /**
   * Pousse les modifications locales vers le serveur
   */
  private async pushLocalChanges(): Promise<void> {
    if (!this.database) return;

    const syncQueueCollection = this.database.get<SyncQueue>('sync_queue');
    const pendingItems = await syncQueueCollection
      .query()
      .fetch();

    for (const item of pendingItems) {
      try {
        switch (item.operation) {
          case 'create':
            await this.createRemoteRecord(item);
            break;
          case 'update':
            await this.updateRemoteRecord(item);
            break;
          case 'delete':
            await this.deleteRemoteRecord(item);
            break;
        }
        
        // Marquer comme synchronisé
        await item.markAsSynced();
      } catch (error) {
        console.error(`Failed to sync ${item.operation} for ${item.tableName}:`, error);
        // Continuer avec les autres éléments
      }
    }
  }

  /**
   * Récupère les modifications du serveur
   */
  private async pullServerChanges(): Promise<void> {
    // TODO: Implémenter la synchronisation descendante
    // Cette logique dépendra de l'API backend
    console.log('Pull server changes - À implémenter');
  }

  /**
   * Nettoie la queue de synchronisation
   */
  private async cleanupSyncQueue(): Promise<void> {
    if (!this.database) return;

    const syncQueueCollection = this.database.get<SyncQueue>('sync_queue');
    const synchronizedItems = await syncQueueCollection
      .query()
      .fetch();

    // Filtrer les éléments synchronisés
    const itemsToDelete = synchronizedItems.filter(item => item.customSyncStatus === 'synced');

    await this.database.write(async () => {
      for (const item of itemsToDelete) {
        await item.destroyPermanently();
      }
    });
  }

  /**
   * Crée un enregistrement sur le serveur
   */
  private async createRemoteRecord(syncItem: SyncQueue): Promise<void> {
    const endpoint = this.getEndpointForTable(syncItem.tableName);
    await apiClient.post(endpoint, syncItem.data);
  }

  /**
   * Met à jour un enregistrement sur le serveur
   */
  private async updateRemoteRecord(syncItem: SyncQueue): Promise<void> {
    const endpoint = this.getEndpointForTable(syncItem.tableName);
    await apiClient.put(`${endpoint}/${syncItem.recordId}`, syncItem.data);
  }

  /**
   * Supprime un enregistrement sur le serveur
   */
  private async deleteRemoteRecord(syncItem: SyncQueue): Promise<void> {
    const endpoint = this.getEndpointForTable(syncItem.tableName);
    await apiClient.delete(`${endpoint}/${syncItem.recordId}`);
  }

  /**
   * Obtient l'endpoint API pour une table donnée
   */
  private getEndpointForTable(tableName: string): string {
    const endpoints: Record<string, string> = {
      roadtrips: '/roadtrips',
      steps: '/steps',
      activities: '/activities',
      accommodations: '/accommodations',
      roadtrip_tasks: '/roadtrip-tasks',
      files: '/files',
      stories: '/stories',
      notifications: '/notifications',
    };

    return endpoints[tableName] || `/${tableName}`;
  }

  /**
   * Obtient le nombre d'éléments en attente de synchronisation
   */
  async getPendingItemsCount(): Promise<number> {
    if (!this.database) return 0;

    const syncQueueCollection = this.database.get<SyncQueue>('sync_queue');
    const allItems = await syncQueueCollection
      .query()
      .fetch();

    // Filtrer les éléments non synchronisés
    const pendingItems = allItems.filter(item => item.customSyncStatus !== 'synced');
    return pendingItems.length;
  }

  /**
   * Ajoute un élément à la queue de synchronisation
   */
  async addToSyncQueue(
    tableName: string,
    recordId: string,
    action: 'create' | 'update' | 'delete',
    data?: any
  ): Promise<void> {
    if (!this.database) return;

    const syncQueueCollection = this.database.get<SyncQueue>('sync_queue');
    
    await this.database.write(async () => {
      await syncQueueCollection.create(syncItem => {
        syncItem.tableName = tableName;
        syncItem.recordId = recordId;
        syncItem.operation = action;
        syncItem.data = data || {};
        syncItem.attempts = 0;
      });
    });
  }
}

export const syncService = new SyncService();
