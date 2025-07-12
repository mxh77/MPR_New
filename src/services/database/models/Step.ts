/**
 * Modèle Step pour WatermelonDB
 */
import { field, children, relation } from '@nozbe/watermelondb/decorators';
import BaseModel from './BaseModel';
import type { Step as IStep, Location, TransportInfo } from '../../../types';

export default class Step extends BaseModel {
  static table = 'steps';
  static associations = {
    roadtrip: { type: 'belongs_to' as const, key: 'roadtrip_id' },
    activities: { type: 'has_many' as const, foreignKey: 'step_id' },
    accommodations: { type: 'has_many' as const, foreignKey: 'step_id' },
    files: { type: 'has_many' as const, foreignKey: 'step_id' },
    stories: { type: 'has_many' as const, foreignKey: 'step_id' },
  };

  @field('roadtrip_id') roadtripId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('type') type!: string;
  @field('order_index') orderIndex!: number;
  @field('location') locationJson!: string;
  @field('start_date') startDate?: number;
  @field('end_date') endDate?: number;
  @field('duration') duration?: number;
  @field('distance') distance?: number;
  @field('thumbnail') thumbnail?: string;
  @field('transport_info') transportInfoJson?: string;

  @relation('roadtrips', 'roadtrip_id') roadtrip: any;
  @children('activities') activities: any;
  @children('accommodations') accommodations: any;
  @children('files') files: any;
  @children('stories') stories: any;

  get location(): Location {
    try {
      return JSON.parse(this.locationJson);
    } catch {
      return { latitude: 0, longitude: 0 };
    }
  }

  set location(value: Location) {
    this.locationJson = JSON.stringify(value);
  }

  get transportInfo(): TransportInfo | undefined {
    try {
      return this.transportInfoJson ? JSON.parse(this.transportInfoJson) : undefined;
    } catch {
      return undefined;
    }
  }

  set transportInfo(value: TransportInfo | undefined) {
    this.transportInfoJson = value ? JSON.stringify(value) : undefined;
  }

  toInterface(): IStep {
    return {
      _id: this.id,
      roadtripId: this.roadtripId,
      title: this.title,
      description: this.description,
      type: this.type as any,
      orderIndex: this.orderIndex,
      location: this.location,
      startDate: this.startDate ? new Date(this.startDate) : undefined,
      endDate: this.endDate ? new Date(this.endDate) : undefined,
      duration: this.duration,
      distance: this.distance,
      thumbnail: this.thumbnail,
      transportInfo: this.transportInfo,
      syncStatus: this.customSyncStatus as any,
      lastSyncAt: this.lastSyncAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
