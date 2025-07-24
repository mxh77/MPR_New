/**
 * Service API pour la gestion des activités
 */
import { AxiosResponse } from 'axios';
import apiClient from './client';

export interface UpdateActivityRequest {
  name?: string;
  type?: 'Randonnée' | 'Courses' | 'Visite' | 'Transport' | 'Restaurant' | 'Autre';
  address?: string;
  latitude?: number;
  longitude?: number;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  startDateTime?: string;
  endDateTime?: string;
  duration?: number | null;
  typeDuration?: 'M' | 'H' | 'J';
  reservationNumber?: string | null;
  price?: number | null;
  currency?: 'USD' | 'CAD' | 'EUR';
  trailDistance?: number | null;
  trailElevation?: number | null;
  trailType?: string | null;
  notes?: string | null;
}

export interface UpdateActivityWithFileRequest extends UpdateActivityRequest {
  thumbnailUri?: string; // URI locale du fichier à uploader
}

export interface ActivityResponse {
  success: boolean;
  data: any;
  message?: string;
}

/**
 * Met à jour une activité spécifique
 */
export const updateActivity = async (
  activityId: string,
  activityData: UpdateActivityWithFileRequest
): Promise<any> => {
  try {
    console.log('🚶 updateActivity - Début appel API:', {
      activityId,
      activityData: {
        ...activityData,
        thumbnailUri: activityData.thumbnailUri ? 'URI fourni' : 'Pas de thumbnail'
      }
    });

    // PATTERN STEPS: Utiliser le même pattern que les steps et accommodations
    // Extraire l'URI du thumbnail de manière sécurisée
    const { thumbnailUri, ...dataFields } = activityData;
    
    // Si thumbnail est présent et c'est un URI local, utiliser FormData comme les steps
    if (thumbnailUri && thumbnailUri.startsWith('file://')) {
      console.log('🚶 updateActivity - Upload avec thumbnail fichier (pattern steps)');
      
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
      
      // Ajouter les autres données de l'activité directement (pattern steps)
      Object.keys(dataFields).forEach(key => {
        const value = dataFields[key as keyof typeof dataFields];
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      console.log('🚶 updateActivity - FormData préparée (pattern steps):', {
        hasThumnail: true,
        dataFieldsCount: Object.keys(dataFields).length,
        dataFields: Object.keys(dataFields)
      });

      const response: AxiosResponse<any> = await apiClient.put(
        `/activities/${activityId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('✅ updateActivity - Upload avec fichier réussi (pattern steps)');
      return response.data;
      
    } else {
      // Pas de fichier, utilisation JSON classique (pattern steps)
      console.log('🚶 updateActivity - Mise à jour JSON classique (pattern steps)');
      
      // Nettoyer les champs null/undefined SAUF pour thumbnail qui doit être traité spécialement
      const cleanedData = Object.entries(dataFields).reduce((acc, [key, value]) => {
        if (key === 'thumbnailUri') {
          // Cas spécial pour thumbnail : null/undefined signifie suppression
          if (value === null) {
            acc['removeThumbnail'] = true; // Indiquer à l'API qu'il faut supprimer le thumbnail
            console.log('🗑️ updateActivity - Demande de suppression thumbnail');
          } else if (value !== undefined) {
            acc[key] = value; // Thumbnail fourni normalement
          }
          // Si undefined, ne rien faire (pas de changement de thumbnail)
        } else {
          // Pour les autres champs, comportement normal
          if (value !== null && value !== undefined) {
            acc[key] = value;
          }
        }
        return acc;
      }, {} as any);
      
      console.log('🚶 updateActivity - Données JSON préparées:', {
        dataFieldsCount: Object.keys(cleanedData).length,
        dataFields: Object.keys(cleanedData)
      });

      const response: AxiosResponse<any> = await apiClient.put(
        `/activities/${activityId}`,
        cleanedData
      );
      
      console.log('✅ updateActivity - Mise à jour JSON réussie (pattern steps)');
      return response.data;
    }

  } catch (error: any) {
    console.error('❌ updateActivity - Erreur complète:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      activityId,
      errorType: error.code || 'Unknown',
      networkError: error.message === 'Network Error',
      timeoutError: error.code === 'ECONNABORTED'
    });
    
    // Ajouter plus de contexte pour l'erreur
    if (error.message === 'Network Error') {
      console.error('🚨 NETWORK ERROR DÉTECTÉ - Causes possibles:');
      console.error('  1. Serveur backend inaccessible');
      console.error('  2. Endpoint /activities/{id} non implémenté');
      console.error('  3. Problème CORS');
      console.error('  4. Timeout de connexion');
      console.error('  5. Problème de format multipart/form-data');
    }
    
    throw error;
  }
};

/**
 * Récupère une activité spécifique
 */
export const getActivity = async (activityId: string): Promise<any> => {
  try {
    console.log('🚶 getActivity - Début appel API:', { activityId });

    const response: AxiosResponse<ActivityResponse> = await apiClient.get(
      `/activities/${activityId}`
    );

    console.log('🚶 getActivity - Réponse API:', {
      status: response.status,
      hasData: !!response.data?.data
    });

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data?.message || 'Activité non trouvée');
    }

  } catch (error: any) {
    console.error('❌ getActivity - Erreur:', {
      message: error.message,
      status: error.response?.status,
      activityId
    });
    throw error;
  }
};
