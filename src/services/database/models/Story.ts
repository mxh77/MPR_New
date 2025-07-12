/**
 * Modèle Story pour WatermelonDB
 */
import { field, relation } from '@nozbe/watermelondb/decorators';
import BaseModel from './BaseModel';
import type { Story as IStory, Comment } from '../../../types';

export default class Story extends BaseModel {
  static table = 'stories';
  static associations = {
    roadtrip: { type: 'belongs_to' as const, key: 'roadtrip_id' },
    step: { type: 'belongs_to' as const, key: 'step_id' },
  };

  @field('roadtrip_id') roadtripId!: string;
  @field('step_id') stepId?: string;
  @field('title') title!: string;
  @field('content') content!: string;
  @field('photos') photosJson!: string;
  @field('published_at') publishedAt?: number;
  @field('is_public') isPublic!: boolean;
  @field('likes') likes!: number;

  @relation('roadtrips', 'roadtrip_id') roadtrip: any;
  @relation('steps', 'step_id') step: any;

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

  toInterface(): IStory {
    return {
      _id: this.id,
      roadtripId: this.roadtripId,
      stepId: this.stepId,
      title: this.title,
      content: this.content,
      photos: this.photos,
      publishedAt: this.publishedAt ? new Date(this.publishedAt) : undefined,
      isPublic: this.isPublic,
      likes: this.likes,
      comments: [], // Les commentaires seront gérés séparément
      syncStatus: this.customSyncStatus as any,
      lastSyncAt: this.lastSyncAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
