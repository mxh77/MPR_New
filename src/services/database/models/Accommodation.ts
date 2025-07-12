/**
 * Modèle Accommodation pour WatermelonDB
 */
import { field, relation } from '@nozbe/watermelondb/decorators';
import BaseModel from './BaseModel';
import type { Accommodation as IAccommodation, Location } from '../../../types';

export default class Accommodation extends BaseModel {
  static table = 'accommodations';
  static associations = {
    step: { type: 'belongs_to' as const, key: 'step_id' },
  };

  @field('step_id') stepId!: string;
  @field('name') name!: string;
  @field('type') type!: string;
  @field('check_in') checkIn!: number;
  @field('check_out') checkOut!: number;
  @field('price_per_night') pricePerNight?: number;
  @field('rating') rating?: number;
  @field('location') locationJson!: string;
  @field('photos') photosJson!: string;
  @field('url') url?: string;
  @field('phone') phone?: string;
  @field('notes') notes?: string;
  @field('amenities') amenitiesJson!: string;

  @relation('steps', 'step_id') step: any;

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

  get amenities(): string[] {
    try {
      return JSON.parse(this.amenitiesJson || '[]');
    } catch {
      return [];
    }
  }

  set amenities(value: string[]) {
    this.amenitiesJson = JSON.stringify(value);
  }

  toInterface(): IAccommodation {
    return {
      _id: this.id,
      stepId: this.stepId,
      name: this.name,
      type: this.type as any,
      checkIn: new Date(this.checkIn),
      checkOut: new Date(this.checkOut),
      pricePerNight: this.pricePerNight,
      rating: this.rating,
      location: this.location,
      photos: this.photos,
      url: this.url,
      phone: this.phone,
      notes: this.notes,
      amenities: this.amenities,
      syncStatus: this.customSyncStatus as any,
      lastSyncAt: this.lastSyncAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
