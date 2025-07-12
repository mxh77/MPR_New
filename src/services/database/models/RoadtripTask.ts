/**
 * Modèle RoadtripTask pour WatermelonDB
 */
import { field, relation } from '@nozbe/watermelondb/decorators';
import BaseModel from './BaseModel';
import type { RoadtripTask as IRoadtripTask } from '../../../types';

export default class RoadtripTask extends BaseModel {
  static table = 'roadtrip_tasks';
  static associations = {
    roadtrip: { type: 'belongs_to' as const, key: 'roadtrip_id' },
  };

  @field('roadtrip_id') roadtripId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('category') category!: string;
  @field('priority') priority!: string;
  @field('status') status!: string;
  @field('due_date') dueDate?: number;
  @field('completed_at') completedAt?: number;
  @field('assigned_to') assignedTo?: string;

  @relation('roadtrips', 'roadtrip_id') roadtrip: any;

  toInterface(): IRoadtripTask {
    return {
      _id: this.id,
      roadtripId: this.roadtripId,
      title: this.title,
      description: this.description,
      category: this.category as any,
      priority: this.priority as any,
      status: this.status as any,
      dueDate: this.dueDate ? new Date(this.dueDate) : undefined,
      completedAt: this.completedAt ? new Date(this.completedAt) : undefined,
      assignedTo: this.assignedTo,
      syncStatus: this.customSyncStatus as any,
      lastSyncAt: this.lastSyncAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
