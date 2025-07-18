/**
 * Hook pour la récupération du détail d'une activité
 * Pattern offline-first conforme aux instructions Copilot
 * Architecture reprise de useAccommodationDetail.ts
 */
import { useState, useCallback, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../services/database';
import StepModel from '../services/database/models/Step';

interface UseActivityDetailResult {
  activity: any | null;
  loading: boolean;
  error: string | null;
  refreshActivityDetail: (forceSync?: boolean) => Promise<void>;
}

/**
 * Validation ObjectId MongoDB
 */
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Hook principal pour les détails d'une activité
 */
export const useActivityDetail_new = (stepId: string, activityId: string): UseActivityDetailResult => {
  const [activity, setActivity] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction principale de rafraîchissement - Dépendances optimisées
   */
  const refreshActivityDetail = useCallback(async (forceSync: boolean = false) => {
    if (loading) {
      console.log('🚶 useActivityDetail_new - Chargement déjà en cours, ignoré');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚶 useActivityDetail_new - Début refreshActivityDetail:', {
        stepId,
        activityId,
        forceSync
      });

      // Intégrer directement la logique au lieu de dépendre de loadActivityFromLocal
      if (!isValidObjectId(stepId)) {
        throw new Error(`ID de step invalide: ${stepId}`);
      }

      if (!isValidObjectId(activityId)) {
        throw new Error(`ID d'activité invalide: ${activityId}`);
      }

      console.log('🚶 useActivityDetail_new - Chargement local:', {
        stepId,
        activityId
      });

      const stepsCollection = database.get<StepModel>('steps');
      const step = await stepsCollection.find(stepId);

      if (!step) {
        throw new Error(`Step non trouvé: ${stepId}`);
      }

      // Parser les activités depuis le JSON stocké
      let activities = [];
      try {
        // CORRECTION FINALE: Utiliser activitiesJson (champ JSON) et non activities (relation)
        const activitiesRaw = (step as any).activitiesJson;
        console.log('🔍 useActivityDetail_new - Activités brutes:', {
          type: typeof activitiesRaw,
          value: activitiesRaw,
          isString: typeof activitiesRaw === 'string',
          isArray: Array.isArray(activitiesRaw),
          length: activitiesRaw?.length || 'N/A'
        });
        
        if (typeof activitiesRaw === 'string') {
          activities = JSON.parse(activitiesRaw);
        } else if (Array.isArray(activitiesRaw)) {
          activities = activitiesRaw;
        }
        
        console.log('🔍 useActivityDetail_new - Activités parsées:', {
          count: activities.length,
          activities: activities.map((act: any) => ({
            id: act._id,
            name: act.name,
            idType: typeof act._id
          }))
        });
      } catch (parseError) {
        console.warn('⚠️ useActivityDetail_new - Erreur parsing activités:', parseError);
        activities = [];
      }

      // Trouver l'activité spécifique - CONVERSION STRING OBLIGATOIRE
      // Les ObjectIds MongoDB sont des objets, il faut les convertir en string pour comparaison
      console.log('🔍 useActivityDetail_new - Recherche activité avec ID:', activityId);
      
      if (activities.length === 0) {
        throw new Error(`Aucune activité trouvée dans le step: ${stepId}`);
      }
      
      const targetActivity = activities.find((act: any) => {
        const actId = act._id?.toString() || act._id;
        console.log('🔍 useActivityDetail_new - Comparaison ID:', {
          actId,
          activityId,
          match: actId === activityId,
          actIdType: typeof act._id,
          actIdValue: act._id
        });
        return actId === activityId;
      });

      if (!targetActivity) {
        console.error('❌ useActivityDetail_new - Activité non trouvée. IDs disponibles:', 
          activities.map((act: any) => ({ id: act._id?.toString() || act._id, name: act.name })));
        throw new Error(`Activité non trouvée: ${activityId}`);
      }

      console.log('✅ useActivityDetail_new - Activité trouvée:', {
        name: targetActivity.name,
        id: targetActivity._id
      });

      setActivity(targetActivity);
      console.log('✅ useActivityDetail_new - Activité chargée depuis le cache local');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ useActivityDetail_new - Erreur:', errorMessage);
      setError(errorMessage);
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [stepId, activityId, loading]); // Dépendances minimales seulement

  /**
   * ❌ DÉSACTIVÉ: Chargement initial automatique pour éviter les doubles appels
   * Le useFocusEffect de l'écran gère le chargement initial
   */
  // useEffect(() => {
  //   if (stepId && activityId && !activity && !loading) {
  //     console.log('🚶 useActivityDetail_new - Chargement initial automatique');
  //     refreshActivityDetail();
  //   }
  // }, [stepId, activityId, activity, loading, refreshActivityDetail]);

  return {
    activity,
    loading,
    error,
    refreshActivityDetail,
  };
};
