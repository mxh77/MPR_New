/**
 * Modèle Activity pour WatermelonDB
 */
import { field, relation } from '@nozbe/watermelondb/decorators';
import BaseModel from './BaseModel';
import type { Activity as IActivity, Location } from '../../../types';

export default class Activity extends BaseModel {
  static table = 'activities';
  static associations = {
    step: { type: 'belongs_to' as const, key: 'step_id' },
  };

  @field('step_id') stepId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('type') type!: string;
  @field('start_time') startTime?: number;
  @field('end_time') endTime?: number;
  @field('duration') duration?: number;
  @field('cost') cost?: number;
  @field('rating') rating?: number;
  @field('notes') notes?: string;
  @field('location') locationJson?: string;
  @field('photos') photosJson!: string;
  @field('url') url?: string;
  @field('phone') phone?: string;
  @field('algolia_trail_id') algoliaTrailId?: string;

  @relation('steps', 'step_id') step: any;

  get location(): Location | undefined {
    try {
      return this.locationJson ? JSON.parse(this.locationJson) : undefined;
    } catch {
      return undefined;
    }
  }

  set location(value: Location | undefined) {
    this.locationJson = value ? JSON.stringify(value) : undefined;
  }

  get photos(): string[] {
    try {
      return JSON.parse(this.photosJson || '[]');
    } catch {
      return [];
    }
  }

  set photos(value: string[]) {
    this.photosJson = JSON.stringify(value);
  }

  toInterface(): IActivity {
    return {
      _id: this.id,
      stepId: this.stepId,
      title: this.title,
      description: this.description,
      type: this.type as any,
      startTime: this.startTime ? new Date(this.startTime) : undefined,
      endTime: this.endTime ? new Date(this.endTime) : undefined,
      duration: this.duration,
      cost: this.cost,
      rating: this.rating,
      notes: this.notes,
      location: this.location,
      photos: this.photos,
      url: this.url,
      phone: this.phone,
      algoliaTrailId: this.algoliaTrailId,
      syncStatus: this.customSyncStatus as any,
      lastSyncAt: this.lastSyncAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
