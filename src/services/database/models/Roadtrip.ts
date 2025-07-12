/**
 * Modèle Roadtrip pour WatermelonDB
 */
import { field, children } from '@nozbe/watermelondb/decorators';
import BaseModel from './BaseModel';
import type { Roadtrip as IRoadtrip } from '../../../types';

export default class Roadtrip extends BaseModel {
  static table = 'roadtrips';
  static associations = {
    steps: { type: 'has_many' as const, foreignKey: 'roadtrip_id' },
    tasks: { type: 'has_many' as const, foreignKey: 'roadtrip_id' },
    files: { type: 'has_many' as const, foreignKey: 'roadtrip_id' },
    stories: { type: 'has_many' as const, foreignKey: 'roadtrip_id' },
    notifications: { type: 'has_many' as const, foreignKey: 'roadtrip_id' },
  };

  @field('title') title!: string;
  @field('description') description?: string;
  @field('start_date') startDate!: number;
  @field('end_date') endDate!: number;
  @field('user_id') userId!: string;
  @field('is_public') isPublic!: boolean;
  @field('thumbnail') thumbnail?: string;
  @field('total_steps') totalSteps!: number;
  @field('total_distance') totalDistance?: number;
  @field('estimated_duration') estimatedDuration?: number;
  @field('tags') tagsJson!: string;

  @children('steps') steps: any;
  @children('roadtrip_tasks') tasks: any;
  @children('files') files: any;
  @children('stories') stories: any;
  @children('notifications') notifications: any;

  /**
   * Getter pour les tags (parse du JSON)
   */
  get tags(): string[] {
    try {
      return JSON.parse(this.tagsJson || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Setter pour les tags (stringify en JSON)
   */
  set tags(value: string[]) {
    this.tagsJson = JSON.stringify(value);
  }

  /**
   * Convertit le modèle vers l'interface TypeScript
   */
  toInterface(): IRoadtrip {
    return {
      _id: this.id,
      title: this.title,
      description: this.description,
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate),
      userId: this.userId,
      isPublic: this.isPublic,
      thumbnail: this.thumbnail,
      totalSteps: this.totalSteps,
      totalDistance: this.totalDistance,
      estimatedDuration: this.estimatedDuration,
      tags: this.tags,
      syncStatus: this.customSyncStatus as any,
      lastSyncAt: this.lastSyncAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
