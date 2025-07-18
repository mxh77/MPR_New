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
}

export interface UpdateAccommodationWithFileRequest extends UpdateAccommodationRequest {
  thumbnailUri?: string; // URI locale du fichier à uploader
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
  accommodationData: UpdateAccommodationWithFileRequest
): Promise<any> => {
  try {
    console.log('🏨 updateAccommodation - Début appel API:', {
      accommodationId,
      accommodationData: {
        ...accommodationData,
        thumbnailUri: accommodationData.thumbnailUri ? 'URI fourni' : 'Pas de thumbnail'
      }
    });

    // NOUVELLE APPROCHE: Utiliser le même pattern que les steps
    // Extraire l'URI du thumbnail de manière sécurisée
    const { thumbnailUri, ...dataFields } = accommodationData;
    
    // Si thumbnail est présent et c'est un URI local, utiliser FormData comme les steps
    if (thumbnailUri && thumbnailUri.startsWith('file://')) {
      console.log('🏨 updateAccommodation - Upload avec thumbnail fichier (pattern steps)');
      
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
      
      // Ajouter les autres données de l'accommodation directement (pattern steps)
      Object.keys(dataFields).forEach(key => {
        const value = dataFields[key as keyof typeof dataFields];
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      console.log('🏨 updateAccommodation - FormData préparée (pattern steps):', {
        hasThumnail: true,
        dataFieldsCount: Object.keys(dataFields).length,
        dataFields: Object.keys(dataFields)
      });

      const response: AxiosResponse<any> = await apiClient.put(
        `/accommodations/${accommodationId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('✅ updateAccommodation - Upload avec fichier réussi (pattern steps)');
      return response.data;
      
    } else {
      // Pas de fichier, utilisation JSON classique (pattern steps)
      console.log('🏨 updateAccommodation - Mise à jour JSON classique (pattern steps)');
      
      // Nettoyer les champs null/undefined
      const cleanedData = Object.entries(dataFields).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      console.log('🏨 updateAccommodation - Données JSON préparées:', {
        dataFieldsCount: Object.keys(cleanedData).length,
        dataFields: Object.keys(cleanedData)
      });

      const response: AxiosResponse<any> = await apiClient.put(
        `/accommodations/${accommodationId}`,
        cleanedData
      );
      
      console.log('✅ updateAccommodation - Mise à jour JSON réussie (pattern steps)');
      return response.data;
    }

  } catch (error: any) {
    console.error('❌ updateAccommodation - Erreur complète:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      accommodationId,
      errorType: error.code || 'Unknown',
      networkError: error.message === 'Network Error',
      timeoutError: error.code === 'ECONNABORTED'
    });
    
    // Ajouter plus de contexte pour l'erreur
    if (error.message === 'Network Error') {
      console.error('🚨 NETWORK ERROR DÉTECTÉ - Causes possibles:');
      console.error('  1. Serveur backend inaccessible');
      console.error('  2. Endpoint /accommodations/{id} non implémenté');
      console.error('  3. Problème CORS');
      console.error('  4. Timeout de connexion');
      console.error('  5. Problème de format multipart/form-data');
    }
    
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
