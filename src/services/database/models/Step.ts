/**
 * Modèle Step pour WatermelonDB
 */
import { field, children, relation } from '@nozbe/watermelondb/decorators';
import BaseModel from './BaseModel';
import type { Step as IStep, Location, TransportInfo, StepType } from '../../../types';

export default class Step extends BaseModel {
  static table = 'steps';
  static associations = {
    roadtrip: { type: 'belongs_to' as const, key: 'roadtrip_id' },
    activities: { type: 'has_many' as const, foreignKey: 'step_id' },
    accommodations: { type: 'has_many' as const, foreignKey: 'step_id' },
    files: { type: 'has_many' as const, foreignKey: 'step_id' },
    stories: { type: 'has_many' as const, foreignKey: 'step_id' },
  };

  @field('user_id') userId!: string;
  @field('roadtrip_id') roadtripId!: string;
  @field('type') type?: string;
  @field('name') name?: string;
  @field('address') address?: string;
  @field('latitude') latitude?: number;
  @field('longitude') longitude?: number;
  @field('arrival_date_time') arrivalDateTime?: number;
  @field('departure_date_time') departureDateTime?: number;
  @field('travel_time_previous_step') travelTimePreviousStep?: number;
  @field('distance_previous_step') distancePreviousStep?: number;
  @field('is_arrival_time_consistent') isArrivalTimeConsistent?: boolean;
  @field('travel_time_note') travelTimeNote?: string;
  @field('notes') notes?: string;
  @field('thumbnail') thumbnail?: string;
  @field('story') story?: string;

  @relation('roadtrips', 'roadtrip_id') roadtrip: any;
  @children('activities') activities: any;
  @children('accommodations') accommodations: any;
  @children('files') files: any;
  @children('stories') stories: any;

  get location(): Location {
    return { 
      latitude: this.latitude || 0, 
      longitude: this.longitude || 0,
      address: this.address 
    };
  }

  set location(value: Location) {
    // Les propriétés latitude/longitude/address sont gérées séparément
    // Cette méthode est conservée pour compatibilité avec l'interface
  }

  toInterface(): IStep {
    try {
      // Vérification des propriétés critiques
      if (!this.type) {
        throw new Error(`Step ${this.id} has no type`);
      }
      
      // Conversion du type backend vers type frontend
      const convertedType: StepType = this.type === 'Stage' ? 'overnight' : (this.type === 'Stop' ? 'stop' : 'activity');
      
      return {
        _id: this.id,
        roadtripId: this.roadtripId,
        title: this.name || '',
        description: this.notes || '',
        type: convertedType,
        orderIndex: 0, // Pas d'ordre dans le backend
        location: this.location,
        startDate: this.arrivalDateTime ? new Date(this.arrivalDateTime) : undefined,
        endDate: this.departureDateTime ? new Date(this.departureDateTime) : undefined,
        duration: this.travelTimePreviousStep,
        distance: this.distancePreviousStep,
        thumbnail: this.thumbnail,
        syncStatus: 'synced' as any, // Pas de sync status dans le backend
        lastSyncAt: this.updatedAt,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    } catch (err) {
      console.error('Erreur Step.toInterface() pour step:', this.id, err instanceof Error ? err.message : err);
      throw err;
    }
  }
}
