/**
 * Modèle de base pour toutes les entités avec tracking de synchronisation
 */
import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class BaseModel extends Model {
  @field('sync_status') customSyncStatus!: string;
  @date('last_sync_at') lastSyncAt?: Date;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  /**
   * Marque l'enregistrement comme nécessitant une synchronisation
   */
  async markForSync() {
    await this.update((record: any) => {
      record.customSyncStatus = 'pending';
    });
  }

  /**
   * Marque l'enregistrement comme synchronisé
   */
  async markAsSynced() {
    await this.update((record: any) => {
      record.customSyncStatus = 'synced';
      record.lastSyncAt = new Date();
    });
  }

  /**
   * Marque l'enregistrement avec une erreur de synchronisation
   */
  async markSyncError() {
    await this.update((record: any) => {
      record.customSyncStatus = 'error';
    });
  }
}
