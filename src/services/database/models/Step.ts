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
  @field('type') type!: StepType;
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
  @field('activities') activitiesJson?: string; // JSON string des activités
  @field('accommodations') accommodationsJson?: string; // JSON string des hébergements

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
      
      // Conversion du type backend vers type frontend - maintenant aligné  
      const convertedType: StepType = this.type; // Pas de conversion, on garde les types API
      
      // Désérialisation des activités et accommodations depuis JSON
      let activities = [];
      let accommodations = [];
      let thumbnailProcessed = this.thumbnail;
      
      if (this.activitiesJson) {
        try {
          activities = JSON.parse(this.activitiesJson);
        } catch (e) {
          console.warn('Erreur désérialisation activités:', e);
        }
      }
      
      if (this.accommodationsJson) {
        try {
          accommodations = JSON.parse(this.accommodationsJson);
        } catch (e) {
          console.warn('Erreur désérialisation accommodations:', e);
        }
      }
      
      // Désérialisation de la thumbnail si c'est un JSON
      if (this.thumbnail && this.thumbnail.startsWith('{')) {
        try {
          thumbnailProcessed = JSON.parse(this.thumbnail);
        } catch (e) {
          // Si la désérialisation échoue, garder la string
          thumbnailProcessed = this.thumbnail;
        }
      }
      
      const stepInterface = {
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
        thumbnail: thumbnailProcessed, // Thumbnail désérialisée
        syncStatus: 'synced' as any, // Pas de sync status dans le backend
        lastSyncAt: this.updatedAt,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      } as IStep;
      
      // Attacher les activités et accommodations comme dans l'API
      (stepInterface as any).activities = activities;
      (stepInterface as any).accommodations = accommodations;
      
      return stepInterface;
    } catch (err) {
      console.error('Erreur Step.toInterface() pour step:', this.id, err instanceof Error ? err.message : err);
      throw err;
    }
  }
}
