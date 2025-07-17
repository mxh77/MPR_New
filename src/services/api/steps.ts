/**
 * Service API pour la gestion des étapes
 */
import { AxiosResponse } from 'axios';
import apiClient from './client';
import type { ApiStep } from './roadtrips';

export interface CreateStepRequest {
  roadtripId: string;
  type: 'Stage' | 'Stop';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  arrivalDateTime: string;
  departureDateTime: string;
  notes?: string;
  thumbnail?: string;
}

export interface UpdateStepRequest extends Partial<Omit<CreateStepRequest, 'roadtripId'>> {}

export interface StepsResponse {
  success: boolean;
  data: ApiStep[];
  message?: string;
}

export interface StepResponse {
  success: boolean;
  data: ApiStep;
  message?: string;
}

/**
 * Récupère toutes les étapes d'un roadtrip
 */
export const getStepsByRoadtrip = async (roadtripId: string): Promise<ApiStep[]> => {
  try {
    console.log('getStepsByRoadtrip - roadtripId:', roadtripId);
    console.log('getStepsByRoadtrip - URL complète:', `/roadtrips/${roadtripId}/steps`);
    
    const response: AxiosResponse<ApiStep[]> = await apiClient.get(`/roadtrips/${roadtripId}/steps`);
    
    console.log('getStepsByRoadtrip - Réponse reçue:', response.data.length, 'étapes');
    
    // L'API retourne directement un tableau d'étapes
    return response.data;
  } catch (error: any) {
    console.error('Erreur getStepsByRoadtrip:', error);
    
    // Si c'est une erreur 404, retourne un tableau vide au lieu de lever une erreur
    if (error.response?.status === 404) {
      console.log('Aucune étape trouvée (404) - retour tableau vide');
      return [];
    }
    
    throw new Error('Erreur lors de la récupération des étapes');
  }
};

/**
 * Récupère une étape par son ID
 */
export const getStepById = async (stepId: string): Promise<ApiStep> => {
  try {
    const response: AxiosResponse<ApiStep> = await apiClient.get(`/steps/${stepId}`);
    
    // L'API renvoie directement l'objet step, pas dans une structure wrapper
    return response.data;
  } catch (error) {
    console.error('Erreur getStepById:', error);
    throw new Error('Erreur lors de la récupération de l\'étape');
  }
};

/**
 * Crée une nouvelle étape
 */
export const createStep = async (stepData: CreateStepRequest): Promise<ApiStep> => {
  try {
    const response: AxiosResponse<StepResponse> = await apiClient.post('/steps', stepData);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Erreur lors de la création de l\'étape');
    }
  } catch (error) {
    console.error('Erreur createStep:', error);
    throw error;
  }
};

/**
 * Fonction utilitaire pour extraire l'URI d'un thumbnail
 */
const getThumbnailUri = (thumbnail: any): string | null => {
  if (!thumbnail) return null;
  if (typeof thumbnail === 'string') return thumbnail;
  if (typeof thumbnail === 'object' && thumbnail.url) return thumbnail.url;
  if (typeof thumbnail === 'object' && thumbnail.uri) return thumbnail.uri;
  return null;
};

/**
 * Met à jour une étape avec support des fichiers
 */
export const updateStep = async (stepId: string, stepData: UpdateStepRequest): Promise<ApiStep> => {
  try {
    console.log('🔧 updateStep - Début appel API:', { stepId, stepData });
    
    // Extraire l'URI du thumbnail de manière sécurisée
    const thumbnailUri = getThumbnailUri(stepData.thumbnail);
    
    // Si thumbnail est présent et c'est un URI local, utiliser FormData
    if (thumbnailUri && thumbnailUri.startsWith('file://')) {
      console.log('📁 updateStep - Upload avec thumbnail fichier');
      
      const formData = new FormData();
      
      // Ajouter le fichier thumbnail
      const filename = thumbnailUri.split('/').pop() || 'thumbnail.jpg';
      const fileType = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';
      
      formData.append('thumbnail', {
        uri: thumbnailUri,
        type: mimeType,
        name: filename,
      } as any);
      
      // Ajouter les autres données du step
      Object.keys(stepData).forEach(key => {
        if (key !== 'thumbnail' && stepData[key as keyof UpdateStepRequest] !== undefined) {
          formData.append(key, String(stepData[key as keyof UpdateStepRequest]));
        }
      });
      
      const response: AxiosResponse<ApiStep> = await apiClient.put(`/steps/${stepId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ updateStep - Upload avec fichier réussi');
      return response.data;
      
    } else {
      // Pas de fichier, utilisation JSON classique
      console.log('📝 updateStep - Mise à jour JSON classique');
      
      // Préparer les données en convertissant thumbnail en string si nécessaire
      const apiStepData = { ...stepData };
      if (apiStepData.thumbnail) {
        const thumbnailString = getThumbnailUri(apiStepData.thumbnail);
        apiStepData.thumbnail = thumbnailString || undefined;
      }
      
      console.log('📝 updateStep - Données préparées pour API:', {
        thumbnail: apiStepData.thumbnail,
        thumbnailType: typeof apiStepData.thumbnail
      });
      
      const response: AxiosResponse<ApiStep> = await apiClient.put(`/steps/${stepId}`, apiStepData);
      
      console.log('🔧 updateStep - Réponse brute reçue:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataKeys: Object.keys(response.data || {}),
        stepName: response.data?.name
      });
      
      if (response.data && response.data._id) {
        console.log('✅ updateStep - Succès, retour des données:', {
          _id: response.data._id,
          name: response.data.name,
          type: response.data.type
        });
        return response.data;
      } else {
        const errorMsg = 'Réponse API invalide - pas de données step';
        console.error('❌ updateStep - Échec API:', errorMsg, response.data);
        throw new Error(errorMsg);
      }
    }
  } catch (error) {
    console.error('❌ updateStep - Erreur réseau/parsing:', error);
    throw error;
  }
};

/**
 * Supprime une étape
 */
export const deleteStep = async (stepId: string): Promise<boolean> => {
  try {
    const response: AxiosResponse<{ success: boolean; message?: string }> = await apiClient.delete(`/steps/${stepId}`);
    
    if (response.data.success) {
      return true;
    } else {
      throw new Error(response.data.message || 'Erreur lors de la suppression de l\'étape');
    }
  } catch (error) {
    console.error('Erreur deleteStep:', error);
    throw error;
  }
};

/**
 * Réorganise l'ordre des étapes
 */
export const reorderSteps = async (roadtripId: string, stepIds: string[]): Promise<boolean> => {
  try {
    const response: AxiosResponse<{ success: boolean; message?: string }> = await apiClient.put(
      `/roadtrips/${roadtripId}/steps/reorder`,
      { stepIds }
    );
    
    if (response.data.success) {
      return true;
    } else {
      throw new Error(response.data.message || 'Erreur lors de la réorganisation des étapes');
    }
  } catch (error) {
    console.error('Erreur reorderSteps:', error);
    throw error;
  }
};
