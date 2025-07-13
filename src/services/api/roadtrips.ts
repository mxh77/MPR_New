/**
 * Service API pour la gestion des roadtrips
 * Implémente les endpoints basés sur l'OpenAPI spec
 */
import { apiClient } from './client';
import { Roadtrip } from '../../types';

export interface ApiRoadtrip {
  _id: string;
  userId: string;
  name: string;
  startLocation: string;
  startDateTime: string;
  endLocation: string;
  endDateTime: string;
  currency: string;
  notes?: string;
  photos: string[];
  documents: string[];
  thumbnail?: string;
  steps: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ApiRoadtripDetailed {
  _id: string;
  userId: string;
  name: string;
  startLocation: string;
  startDateTime: string;
  endLocation: string;
  endDateTime: string;
  currency: string;
  notes?: string;
  photos: string[];
  documents: string[];
  thumbnail?: string;
  steps: ApiStep[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ApiStep {
  _id: string;
  userId: string;
  roadtripId: string;
  type: 'Stage' | 'Stop';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  arrivalDateTime: string;
  departureDateTime: string;
  travelTimePreviousStep?: number;
  distancePreviousStep?: number;
  isArrivalTimeConsistent?: boolean;
  travelTimeNote?: 'ERROR' | 'WARNING' | 'OK';
  notes?: string;
  photos: string[];
  documents: string[];
  thumbnail?: string;
  accommodations: string[];
  activities: string[];
  story?: string;
}

export interface CreateRoadtripRequest {
  name: string;
  startLocation: string;
  startDateTime: string;
  endLocation: string;
  endDateTime: string;
  currency?: string;
  notes?: string;
}

export interface UpdateRoadtripRequest extends Partial<CreateRoadtripRequest> {}

export interface PaginatedResponse<T> {
  success: boolean;
  roadtrips?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Service Roadtrips API
 */
class RoadtripsApiService {
  
  /**
   * Récupérer la liste des roadtrips de l'utilisateur
   */
  async getRoadtrips(page: number = 1, limit: number = 10): Promise<PaginatedResponse<ApiRoadtrip>> {
    const response = await apiClient.get<PaginatedResponse<ApiRoadtrip>>('/roadtrips', {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * Récupérer un roadtrip par son ID avec détails complets
   */
  async getRoadtripById(roadtripId: string): Promise<ApiRoadtripDetailed> {
    const response = await apiClient.get<ApiRoadtripDetailed>(`/roadtrips/${roadtripId}`);
    return response.data;
  }

  /**
   * Créer un nouveau roadtrip
   */
  async createRoadtrip(roadtripData: CreateRoadtripRequest, files?: File[]): Promise<ApiRoadtrip> {
    if (files && files.length > 0) {
      // Upload avec fichiers
      const formData = new FormData();
      formData.append('data', JSON.stringify(roadtripData));
      
      files.forEach((file, index) => {
        formData.append('files', file);
      });

      const response = await apiClient.uploadFile<ApiRoadtrip>('/roadtrips', formData);
      return response.data;
    } else {
      // Création simple sans fichiers (fallback pour compatibilité)
      const formData = new FormData();
      formData.append('data', JSON.stringify(roadtripData));
      
      const response = await apiClient.uploadFile<ApiRoadtrip>('/roadtrips', formData);
      return response.data;
    }
  }

  /**
   * Modifier un roadtrip existant
   */
  async updateRoadtrip(roadtripId: string, updates: UpdateRoadtripRequest, files?: File[]): Promise<ApiRoadtripDetailed> {
    if (files && files.length > 0) {
      // Upload avec fichiers
      const formData = new FormData();
      formData.append('data', JSON.stringify(updates));
      
      files.forEach((file, index) => {
        formData.append('files', file);
      });

      const response = await apiClient.uploadFile<ApiRoadtripDetailed>(`/roadtrips/${roadtripId}`, formData);
      return response.data;
    } else {
      // Mise à jour simple sans fichiers
      const formData = new FormData();
      formData.append('data', JSON.stringify(updates));
      
      const response = await apiClient.uploadFile<ApiRoadtripDetailed>(`/roadtrips/${roadtripId}`, formData);
      return response.data;
    }
  }

  /**
   * Supprimer un roadtrip
   */
  async deleteRoadtrip(roadtripId: string): Promise<{ msg: string }> {
    const response = await apiClient.delete<{ msg: string }>(`/roadtrips/${roadtripId}`);
    return response.data;
  }

  /**
   * Supprimer un fichier spécifique d'un roadtrip
   */
  async deleteRoadtripFile(roadtripId: string, fileId: string): Promise<void> {
    await apiClient.delete(`/roadtrips/${roadtripId}/files/${fileId}`);
  }

  /**
   * Générer un roadtrip complet via IA
   */
  async generateRoadtripWithAI(prompt: string, budget?: number, travelers?: number): Promise<{ jobId: string; status: string }> {
    const response = await apiClient.post<{ jobId: string; status: string }>('/roadtrips/ai', {
      prompt,
      budget,
      travelers
    });
    return response.data;
  }

  /**
   * Convertir un roadtrip API en format local
   */
  convertApiRoadtripToLocal(apiRoadtrip: ApiRoadtrip): Roadtrip {
    return {
      _id: apiRoadtrip._id,
      serverId: apiRoadtrip._id,
      title: apiRoadtrip.name,
      description: apiRoadtrip.notes || '',
      startDate: new Date(apiRoadtrip.startDateTime),
      endDate: new Date(apiRoadtrip.endDateTime),
      startLocation: apiRoadtrip.startLocation,
      endLocation: apiRoadtrip.endLocation,
      currency: apiRoadtrip.currency,
      userId: apiRoadtrip.userId,
      isPublic: false, // Valeur par défaut, l'API ne semble pas avoir ce champ
      thumbnail: apiRoadtrip.thumbnail,
      totalSteps: apiRoadtrip.steps.length,
      totalDistance: undefined, // Sera calculé côté client
      estimatedDuration: undefined, // Sera calculé côté client
      tags: [], // Valeur par défaut, l'API ne semble pas avoir ce champ
      photos: apiRoadtrip.photos,
      documents: apiRoadtrip.documents,
      syncStatus: 'synced',
      lastSyncAt: new Date(),
      createdAt: new Date(apiRoadtrip.createdAt),
      updatedAt: new Date(apiRoadtrip.updatedAt),
    };
  }

  /**
   * Convertir un roadtrip local en format API
   */
  convertLocalRoadtripToApi(localRoadtrip: Partial<Roadtrip>): CreateRoadtripRequest {
    return {
      name: localRoadtrip.title || '',
      startLocation: localRoadtrip.startLocation || '',
      startDateTime: localRoadtrip.startDate ? localRoadtrip.startDate.toISOString() : new Date().toISOString(),
      endLocation: localRoadtrip.endLocation || '',
      endDateTime: localRoadtrip.endDate ? localRoadtrip.endDate.toISOString() : new Date().toISOString(),
      currency: localRoadtrip.currency || 'EUR',
      notes: localRoadtrip.description,
    };
  }
}

export const roadtripsApiService = new RoadtripsApiService();
export default roadtripsApiService;
