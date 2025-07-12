/**
 * Modèle SyncQueue pour WatermelonDB
 */
import { field } from '@nozbe/watermelondb/decorators';
import BaseModel from './BaseModel';
import type { SyncQueue as ISyncQueue } from '../../../types';

export default class SyncQueue extends BaseModel {
  static table = 'sync_queue';

  @field('table_name') tableName!: string;
  @field('record_id') recordId!: string;
  @field('operation') operation!: string;
  @field('data') dataJson?: string;
  @field('attempts') attempts!: number;
  @field('last_attempt_at') lastAttemptAt?: number;
  @field('error') error?: string;

  get data(): Record<string, any> | undefined {
    try {
      return this.dataJson ? JSON.parse(this.dataJson) : undefined;
    } catch {
      return undefined;
    }
  }

  set data(value: Record<string, any> | undefined) {
    this.dataJson = value ? JSON.stringify(value) : undefined;
  }

  toInterface(): ISyncQueue {
    return {
      _id: this.id,
      tableName: this.tableName,
      recordId: this.recordId,
      operation: this.operation as any,
      data: this.data,
      attempts: this.attempts,
      lastAttemptAt: this.lastAttemptAt ? new Date(this.lastAttemptAt) : undefined,
      error: this.error,
      syncStatus: this.customSyncStatus as any,
      lastSyncAt: this.lastSyncAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
