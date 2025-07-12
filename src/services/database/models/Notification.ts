/**
 * Modèle Notification pour WatermelonDB
 */
import { field, relation } from '@nozbe/watermelondb/decorators';
import BaseModel from './BaseModel';
import type { Notification as INotification } from '../../../types';

export default class Notification extends BaseModel {
  static table = 'notifications';
  static associations = {
    roadtrip: { type: 'belongs_to' as const, key: 'roadtrip_id' },
  };

  @field('roadtrip_id') roadtripId!: string;
  @field('user_id') userId!: string;
  @field('type') type!: string;
  @field('title') title!: string;
  @field('message') message!: string;
  @field('data') dataJson?: string;
  @field('is_read') isRead!: boolean;
  @field('read_at') readAt?: number;

  @relation('roadtrips', 'roadtrip_id') roadtrip: any;

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

  toInterface(): INotification {
    return {
      _id: this.id,
      roadtripId: this.roadtripId,
      userId: this.userId,
      type: this.type as any,
      title: this.title,
      message: this.message,
      data: this.data,
      isRead: this.isRead,
      readAt: this.readAt ? new Date(this.readAt) : undefined,
      syncStatus: this.customSyncStatus as any,
      lastSyncAt: this.lastSyncAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
