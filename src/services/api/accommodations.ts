/**
 * Service API pour la gestion des accommodations
 */
import { AxiosResponse } from 'axios';
import apiClient from './client';

export interface UpdateAccommodationRequest {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  arrivalDateTime?: string;
  departureDateTime?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  reservationNumber?: string | null;
  price?: number | null;
  currency?: string;
  nights?: number | null;
  notes?: string | null;
  thumbnail?: any;
}

export interface AccommodationResponse {
  success: boolean;
  data: any;
  message?: string;
}

/**
 * Met à jour un accommodation spécifique
 */
export const updateAccommodation = async (
  accommodationId: string,
  accommodationData: UpdateAccommodationRequest
): Promise<any> => {
  try {
    console.log('🏨 updateAccommodation - Début appel API:', {
      accommodationId,
      accommodationData
    });

    // Préparer les données pour l'API - nettoyer les champs null/undefined
    const cleanedData = Object.entries(accommodationData).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    console.log('🏨 updateAccommodation - Données nettoyées pour API:', cleanedData);

    const response: AxiosResponse<any> = await apiClient.put(
      `/accommodations/${accommodationId}`,
      cleanedData
    );

    console.log('🏨 updateAccommodation - Réponse API:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : 'N/A',
      dataStructure: response.data ? {
        hasSuccess: 'success' in response.data,
        hasData: 'data' in response.data,
        directObject: response.data._id ? 'Direct accommodation object' : 'Unknown structure'
      } : 'No data'
    });

    // Gérer deux formats de réponse possibles :
    // 1. Format wrapper: { success: true, data: {...} }
    // 2. Format direct: { _id: "...", name: "...", ... }
    
    let resultData;
    
    if (response.data && typeof response.data === 'object') {
      if (response.data.success && response.data.data) {
        // Format wrapper
        resultData = response.data.data;
        console.log('🏨 updateAccommodation - Format wrapper détecté');
      } else if (response.data._id) {
        // Format direct - l'accommodation est directement dans response.data
        resultData = response.data;
        console.log('🏨 updateAccommodation - Format direct détecté');
      } else {
        throw new Error('Structure de réponse API non reconnue');
      }
    } else {
      throw new Error('Réponse API vide ou invalide');
    }

    console.log('✅ updateAccommodation - Succès, retour des données:', {
      _id: resultData._id,
      name: resultData.name,
      type: resultData.type || 'N/A'
    });
    
    return resultData;

  } catch (error: any) {
    console.error('❌ updateAccommodation - Erreur:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data
    });
    throw error;
  }
};

/**
 * Récupère un accommodation spécifique
 */
export const getAccommodation = async (accommodationId: string): Promise<any> => {
  try {
    console.log('🏨 getAccommodation - Début appel API:', { accommodationId });

    const response: AxiosResponse<AccommodationResponse> = await apiClient.get(
      `/accommodations/${accommodationId}`
    );

    console.log('🏨 getAccommodation - Réponse API:', {
      status: response.status,
      hasData: !!response.data?.data
    });

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data?.message || 'Accommodation non trouvé');
    }

  } catch (error: any) {
    console.error('❌ getAccommodation - Erreur:', {
      message: error.message,
      status: error.response?.status,
      accommodationId
    });
    throw error;
  }
};
