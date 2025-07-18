/**
 * Hook pour récupérer les détails d'une activité spécifique
 * Pattern offline-first conforme aux instructions Copilot
 */
import { useState, useCallback, useRef } from 'react';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '../contexts/DatabaseContext';
import Activity from '../services/database/models/Activity';
import { getActivity } from '../services/api/activities';

export const useActivityDetail = (stepId: string, activityId: string) => {
  const { database, isReady } = useDatabase();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<number>(0);

  // Référence pour éviter les appels multiples
  const isFetchingRef = useRef(false);

  /**
   * Vérifier si la synchronisation est nécessaire
   */
  const shouldSynchronize = useCallback((): boolean => {
    if (!activity) return true;
    
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const shouldSync = lastSync < fiveMinutesAgo;
    
    console.log('🚶 useActivityDetail - shouldSynchronize:', {
      activityId,
      lastSync: new Date(lastSync).toISOString(),
      shouldSync,
      hasActivity: !!activity
    });
    
    return shouldSync;
  }, [activity, lastSync, activityId]);

  /**
   * Charger les données locales depuis WatermelonDB
   */
  const loadLocalActivity = useCallback(async (): Promise<Activity | null> => {
    if (!isReady || !database) {
      console.log('🚶 useActivityDetail - Base non prête');
      return null;
    }

    try {
      console.log('🚶 useActivityDetail - Chargement local activity:', { stepId, activityId });
      
      const activitiesCollection = database.get<Activity>('activities');
      const localActivity = await activitiesCollection.find(activityId);
      
      console.log('🚶 useActivityDetail - Activity local trouvé:', {
        id: localActivity.id,
        title: localActivity.title,
        type: localActivity.type
      });
      
      setActivity(localActivity);
      setError(null);
      return localActivity;
      
    } catch (error) {
      console.log('🚶 useActivityDetail - Aucune activity locale trouvée:', error);
      setActivity(null);
      return null;
    }
  }, [isReady, database, stepId, activityId]);

  /**
   * Synchroniser avec l'API et mettre à jour la base locale
   */
  const syncWithAPI = useCallback(async (): Promise<void> => {
    if (!isReady || !database || syncing) {
      console.log('🚶 useActivityDetail - Sync ignoré:', { isReady, hasDatabase: !!database, syncing });
      return;
    }

    try {
      setSyncing(true);
      console.log('🚶 useActivityDetail - Sync API démarré:', { activityId });

      // Appel API
      const apiActivity = await getActivity(activityId);
      console.log('🚶 useActivityDetail - Données API reçues:', {
        id: apiActivity._id,
        name: apiActivity.name,
        type: apiActivity.type
      });

      // Mettre à jour WatermelonDB
      await database.write(async () => {
        const activitiesCollection = database.get<Activity>('activities');
        
        try {
          // Chercher activity existante
          const existingActivity = await activitiesCollection.find(activityId);
          
          // Mettre à jour activity existante
          await existingActivity.update((activity: Activity) => {
            // Mapping des champs API vers WatermelonDB
            activity._setRaw('step_id', apiActivity.stepId || stepId);
            activity._setRaw('title', apiActivity.name || ''); // name -> title
            activity._setRaw('description', apiActivity.notes || ''); // notes -> description
            activity._setRaw('type', apiActivity.type || 'Randonnée');
            activity._setRaw('start_time', apiActivity.startDateTime ? new Date(apiActivity.startDateTime).getTime() : null);
            activity._setRaw('end_time', apiActivity.endDateTime ? new Date(apiActivity.endDateTime).getTime() : null);
            activity._setRaw('duration', apiActivity.duration || null);
            activity._setRaw('cost', apiActivity.price || null); // price -> cost
            activity._setRaw('notes', apiActivity.notes || '');
            activity._setRaw('url', apiActivity.website || ''); // website -> url
            activity._setRaw('phone', apiActivity.phone || '');
            
            // Gestion de la localisation
            if (apiActivity.latitude && apiActivity.longitude) {
              const location = {
                latitude: apiActivity.latitude,
                longitude: apiActivity.longitude,
                address: apiActivity.address || ''
              };
              activity._setRaw('location', JSON.stringify(location));
            }
            
            // Gestion du thumbnail
            const photos = apiActivity.thumbnail ? [apiActivity.thumbnail] : [];
            activity._setRaw('photos', JSON.stringify(photos));
            
            // Marquage de synchronisation
            activity._setRaw('sync_status', 'synced');
            activity._setRaw('last_sync_at', Date.now());
            activity._setRaw('updated_at', Date.now());
          });
          
          console.log('🚶 useActivityDetail - Activity mise à jour dans WatermelonDB');
          
        } catch (notFound) {
          // Créer nouvelle activity si pas trouvée
          console.log('🚶 useActivityDetail - Création nouvelle activity dans WatermelonDB');
          
          await activitiesCollection.create((activity: Activity) => {
            // CRITIQUE: Préserver l'ObjectId MongoDB
            activity._setRaw('id', apiActivity._id);
            
            // Mapping des champs API vers WatermelonDB
            activity._setRaw('step_id', apiActivity.stepId || stepId);
            activity._setRaw('title', apiActivity.name || ''); // name -> title
            activity._setRaw('description', apiActivity.notes || ''); // notes -> description
            activity._setRaw('type', apiActivity.type || 'Randonnée');
            activity._setRaw('start_time', apiActivity.startDateTime ? new Date(apiActivity.startDateTime).getTime() : null);
            activity._setRaw('end_time', apiActivity.endDateTime ? new Date(apiActivity.endDateTime).getTime() : null);
            activity._setRaw('duration', apiActivity.duration || null);
            activity._setRaw('cost', apiActivity.price || null); // price -> cost
            activity._setRaw('notes', apiActivity.notes || '');
            activity._setRaw('url', apiActivity.website || ''); // website -> url
            activity._setRaw('phone', apiActivity.phone || '');
            
            // Gestion de la localisation
            if (apiActivity.latitude && apiActivity.longitude) {
              const location = {
                latitude: apiActivity.latitude,
                longitude: apiActivity.longitude,
                address: apiActivity.address || ''
              };
              activity._setRaw('location', JSON.stringify(location));
            }
            
            // Gestion du thumbnail
            const photos = apiActivity.thumbnail ? [apiActivity.thumbnail] : [];
            activity._setRaw('photos', JSON.stringify(photos));
            
            // Marquage de synchronisation
            activity._setRaw('sync_status', 'synced');
            activity._setRaw('last_sync_at', Date.now());
            activity._setRaw('updated_at', Date.now());
          });
        }
      });

      // Recharger les données locales
      await loadLocalActivity();
      setLastSync(Date.now());
      
      console.log('🚶 useActivityDetail - Sync terminé avec succès');

    } catch (error: any) {
      console.error('🚶 useActivityDetail - Erreur sync API:', error);
      
      // En cas d'erreur API, garder les données locales
      await loadLocalActivity();
      
      // Seulement définir l'erreur si ce n'est pas une 404 (normal si activity pas encore créée)
      if (error.response?.status !== 404) {
        setError(error.message || 'Erreur de synchronisation');
      }
    } finally {
      setSyncing(false);
    }
  }, [isReady, database, syncing, activityId, stepId, loadLocalActivity]);

  /**
   * Fonction principale de récupération avec stratégie offline-first
   */
  const fetchActivityDetail = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current || !isReady || !database) {
      console.log('🚶 useActivityDetail - Fetch ignoré:', { 
        isFetching: isFetchingRef.current, 
        isReady, 
        hasDatabase: !!database 
      });
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      console.log('🚶 useActivityDetail - Fetch démarré:', { stepId, activityId });

      // 1. Charger d'abord les données locales (offline-first)
      const localActivity = await loadLocalActivity();

      // 2. Synchroniser avec l'API si nécessaire
      if (shouldSynchronize()) {
        await syncWithAPI();
      } else {
        console.log('🚶 useActivityDetail - Sync ignoré (données récentes)');
      }

    } catch (error: any) {
      console.error('🚶 useActivityDetail - Erreur fetch:', error);
      setError(error.message || 'Erreur lors du chargement de l\'activité');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isReady, database, stepId, activityId, loadLocalActivity, shouldSynchronize, syncWithAPI]);

  /**
   * Rafraîchissement forcé
   */
  const refreshActivityDetail = useCallback(async (forceSync: boolean = false): Promise<void> => {
    if (forceSync) {
      setLastSync(0); // Forcer la synchronisation
    }
    await fetchActivityDetail();
  }, [fetchActivityDetail]);

  return {
    activity,
    loading,
    syncing,
    error,
    fetchActivityDetail,
    refreshActivityDetail,
    loadLocalActivity,
    syncWithAPI
  };
};
