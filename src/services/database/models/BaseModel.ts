/**
 * Modèle de base pour toutes les entités avec tracking de synchronisation
 */
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class BaseModel extends Model {
  @field('sync_status') customSyncStatus!: string;
  @field('last_sync_at') lastSyncAt?: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  /**
   * Marque l'enregistrement comme nécessitant une synchronisation
   */
  async markForSync() {
    await this.update((record: any) => {
      record._setRaw('sync_status', 'pending');
      record._setRaw('updated_at', Date.now());
    });
  }

  /**
   * Marque l'enregistrement comme synchronisé
   */
  async markAsSynced() {
    await this.update((record: any) => {
      record._setRaw('sync_status', 'synced');
      record._setRaw('last_sync_at', Date.now());
      record._setRaw('updated_at', Date.now());
    });
  }

  /**
   * Marque l'enregistrement avec une erreur de synchronisation
   */
  async markSyncError() {
    await this.update((record: any) => {
      record._setRaw('sync_status', 'error');
      record._setRaw('last_sync_at', Date.now());
      record._setRaw('updated_at', Date.now());
    });
  }
}
