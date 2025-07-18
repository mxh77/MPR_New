/**
 * Hook pour la mise à jour d'activités
 * Pattern offline-first conforme aux instructions Copilot
 */
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useDatabase } from '../contexts/DatabaseContext';
import { updateActivity, UpdateActivityWithFileRequest } from '../services/api/activities';
import Activity from '../services/database/models/Activity';

export const useActivityUpdate = () => {
  const { database, isReady } = useDatabase();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction principale de mise à jour avec pattern offline-first
   */
  const updateActivityData = useCallback(async (
    activityId: string,
    stepId: string,
    activityData: UpdateActivityWithFileRequest
  ): Promise<boolean> => {
    if (!isReady || !database) {
      console.error('🚶 useActivityUpdate - Base de données non prête');
      setError('Base de données non disponible');
      return false;
    }

    try {
      setUpdating(true);
      setError(null);

      console.log('🚶 useActivityUpdate - Début mise à jour:', {
        activityId,
        fields: Object.keys(activityData)
      });

      // CRITIQUE: Convertir l'activityId MongoDB (objet) en string pour les recherches locales
      const activityIdString = activityId?.toString() || activityId;
      console.log('🚶 useActivityUpdate - Conversion ID:', {
        originalId: activityId,
        stringId: activityIdString,
        isString: typeof activityIdString === 'string'
      });

      // SÉCURITÉ: Vérifier que activityData existe et est valide
      if (!activityData || typeof activityData !== 'object') {
        throw new Error('activityData est invalide ou manquant');
      }

      console.log('🚶 useActivityUpdate - Données activity:', {
        name: activityData.name,
        type: activityData.type,
        hasType: 'type' in activityData,
        typeValue: activityData.type,
        typeType: typeof activityData.type
      });

      // PHASE 1: Sauvegarde locale IMMÉDIATE (pattern offline-first)
      console.log('💾 PHASE 1: Sauvegarde locale immédiate');
      await database.write(async () => {
        const activitiesCollection = database.get<Activity>('activities');
        
        try {
          // Chercher activity existante avec ID converti en string
          const activity = await activitiesCollection.find(activityIdString);
          
          // Mettre à jour activity existante avec les VRAIS champs du modèle
          await activity.update((record: any) => {
            // Champs directs du modèle Activity
            if (activityData?.name !== undefined) {
              record._setRaw('title', activityData.name); // API name → modèle title
            }
            if (activityData?.type !== undefined && activityData.type !== null) {
              record._setRaw('type', activityData.type);
            }
            if (activityData?.notes !== undefined) {
              record._setRaw('notes', activityData.notes);
            }
            if (activityData?.startDateTime !== undefined) {
              record._setRaw('start_time', activityData.startDateTime ? new Date(activityData.startDateTime).getTime() : null);
            }
            if (activityData?.endDateTime !== undefined) {
              record._setRaw('end_time', activityData.endDateTime ? new Date(activityData.endDateTime).getTime() : null);
            }
            if (activityData?.duration !== undefined) {
              record._setRaw('duration', activityData.duration);
            }
            if (activityData?.price !== undefined) {
              record._setRaw('cost', activityData.price); // API price → modèle cost (champ existant)
            }
            if (activityData?.phone !== undefined) {
              record._setRaw('phone', activityData.phone);
            }
            if (activityData?.website !== undefined) {
              record._setRaw('url', activityData.website); // API website → modèle url
            }
            
            // Géolocalisation avec protections
            if (activityData?.latitude !== undefined && activityData?.longitude !== undefined) {
              const location = {
                latitude: activityData.latitude,
                longitude: activityData.longitude,
                address: activityData.address || ''
              };
              record._setRaw('location', JSON.stringify(location));
            }
            
            // Gestion du thumbnail/photos avec protections
            if (activityData?.thumbnailUri !== undefined) {
              const photos = activityData.thumbnailUri ? [activityData.thumbnailUri] : [];
              record._setRaw('photos', JSON.stringify(photos));
            }
            
            // Marquer pour sync
            record._setRaw('sync_status', 'pending');
            record._setRaw('last_sync_at', null);
            record._setRaw('updated_at', Date.now());
          });
          
          console.log('🚶 useActivityUpdate - Activity mise à jour localement');
          
        } catch (notFound) {
          // Créer nouvelle activity si pas trouvée
          console.log('🚶 useActivityUpdate - Création nouvelle activity localement');
          
          await activitiesCollection.create((record: Activity) => {
            // CRITIQUE: Préserver l'ObjectId MongoDB en string
            record._setRaw('id', activityIdString);
            
            // Champs obligatoires avec protections défensives - VRAIS champs du modèle
            record._setRaw('step_id', stepId);
            record._setRaw('title', activityData?.name || ''); // API name → modèle title
            record._setRaw('type', activityData?.type || 'Randonnée');
            record._setRaw('photos', JSON.stringify([])); // Champ obligatoire
            
            // Champs optionnels - VRAIS champs du modèle Activity
            if (activityData?.notes !== undefined) {
              record._setRaw('notes', activityData.notes);
            }
            if (activityData?.startDateTime !== undefined) {
              record._setRaw('start_time', activityData.startDateTime ? new Date(activityData.startDateTime).getTime() : null);
            }
            if (activityData?.endDateTime !== undefined) {
              record._setRaw('end_time', activityData.endDateTime ? new Date(activityData.endDateTime).getTime() : null);
            }
            if (activityData?.duration !== undefined) {
              record._setRaw('duration', activityData.duration);
            }
            if (activityData?.price !== undefined) {
              record._setRaw('cost', activityData.price); // API price → modèle cost
            }
            if (activityData?.phone !== undefined) {
              record._setRaw('phone', activityData.phone);
            }
            if (activityData?.website !== undefined) {
              record._setRaw('url', activityData.website); // API website → modèle url
            }
            
            // Géolocalisation avec protections
            if (activityData?.latitude !== undefined && activityData?.longitude !== undefined) {
              const location = {
                latitude: activityData.latitude,
                longitude: activityData.longitude,
                address: activityData.address || ''
              };
              record._setRaw('location', JSON.stringify(location));
            }
            
            // Gestion du thumbnail/photos avec protections
            if (activityData?.thumbnailUri !== undefined) {
              const photos = activityData.thumbnailUri ? [activityData.thumbnailUri] : [];
              record._setRaw('photos', JSON.stringify(photos));
            }
            
            // Marquer pour sync
            record._setRaw('sync_status', 'pending');
            record._setRaw('last_sync_at', null);
            record._setRaw('updated_at', Date.now());
          });
        }
      });

      console.log('✅ Sauvegarde locale réussie');

      // PHASE 2: Synchronisation API en arrière-plan (non-bloquante)
      console.log('🔄 PHASE 2: Sync API en arrière-plan');
      Promise.resolve().then(async () => {
        try {
          const apiResult = await updateActivity(activityId, activityData);
          console.log('✅ Sync API réussie:', apiResult);
          
          // Mettre à jour le statut de sync avec ID converti
          await database.write(async () => {
            const activitiesCollection = database.get<Activity>('activities');
            const activity = await activitiesCollection.find(activityIdString);
            
            await activity.update((record: any) => {
              record._setRaw('sync_status', 'synced');
              record._setRaw('last_sync_at', Date.now());
            });
          });
          
        } catch (apiError) {
          console.warn('⚠️ Sync API échouée, données locales conservées:', apiError);
          
          // En cas d'erreur API, marquer comme en attente avec ID converti
          await database.write(async () => {
            const activitiesCollection = database.get<Activity>('activities');
            const activity = await activitiesCollection.find(activityIdString);
            
            await activity.update((record: any) => {
              record._setRaw('sync_status', 'error');
            });
          });
        }
      });

      // Retour immédiat après sauvegarde locale
      console.log('⚡ Retour immédiat après sauvegarde locale');
      return true;

    } catch (error: any) {
      console.error('❌ useActivityUpdate - Erreur:', error);
      setError(error.message || 'Erreur lors de la mise à jour');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [isReady, database]);

  /**
   * Wrapper avec gestion d'erreur et alert
   */
  const updateActivityWithAlert = useCallback(async (
    activityId: string,
    stepId: string,
    activityData: UpdateActivityWithFileRequest,
    onSuccess?: () => void
  ): Promise<void> => {
    const success = await updateActivityData(activityId, stepId, activityData);
    
    if (success) {
      Alert.alert(
        'Succès',
        'L\'activité a été mise à jour',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } else {
      Alert.alert(
        'Erreur',
        error || 'Impossible de mettre à jour l\'activité',
        [{ text: 'OK' }]
      );
    }
  }, [updateActivityData, error]);

  return {
    updating,
    error,
    updateActivityData,
    updateActivityWithAlert
  };
};
