/**
 * Hook pour la récupération du détail d'un accommodation
 * Pattern offline-first conforme aux instructions Copilot
 * 
 */
import { useState, useCallback, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../services/database';
import StepModel from '../services/database/models/Step';
import { getStepById } from '../services/api';

interface UseAccommodationDetailResult {
  accommodation: any | null;
  loading: boolean;
  error: string | null;
  refreshAccommodationDetail: (forceSync?: boolean) => Promise<void>;
  clearAccommodationCache: () => void;
}

/**
 * Validation ObjectId MongoDB
 */
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Hook principal pour les détails d'un accommodation
 */
export const useAccommodationDetail = (stepId: string, accommodationId: string): UseAccommodationDetailResult => {
  const [accommodation, setAccommodation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction principale de rafraîchissement - Dépendances optimisées
   */
  const refreshAccommodationDetail = useCallback(async (forceSync: boolean = false) => {
    if (loading) {
      console.log('🏨 useAccommodationDetail - Chargement déjà en cours, ignoré');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🏨 useAccommodationDetail - Début refreshAccommodationDetail:', {
        stepId,
        accommodationId,
        forceSync
      });

      // Intégrer directement la logique au lieu de dépendre de loadAccommodationFromLocal
      if (!isValidObjectId(stepId)) {
        throw new Error(`ID de step invalide: ${stepId}`);
      }

      if (!isValidObjectId(accommodationId)) {
        throw new Error(`ID d'accommodation invalide: ${accommodationId}`);
      }

      console.log('🏨 useAccommodationDetail - Chargement local:', {
        stepId,
        accommodationId
      });

      // Si forceSync est true, synchroniser avec l'API d'abord
      if (forceSync) {
        console.log('🔄 useAccommodationDetail - Synchronisation forcée avec API');
        try {
          const apiStep = await getStepById(stepId);
          console.log('📡 useAccommodationDetail - Step API récupéré:', {
            stepId: apiStep._id,
            stepName: apiStep.name,
            accommodationsCount: apiStep.accommodations?.length || 0,
            accommodationsData: apiStep.accommodations
          });

          // Mettre à jour le step local avec les données API fraîches
          const stepsCollection = database.get<StepModel>('steps');
          await database.write(async () => {
            const localStep = await stepsCollection.find(stepId);
            await localStep.update((step: any) => {
              // Mettre à jour les accommodations JSON avec les données API
              const accommodationsJson = JSON.stringify(apiStep.accommodations || []);
              console.log('🔄 useAccommodationDetail - Mise à jour avec JSON API:', {
                accommodationsLength: accommodationsJson.length,
                accommodationsCount: apiStep.accommodations?.length || 0
              });
              
              step._setRaw('accommodationsJson', accommodationsJson);
              step._setRaw('sync_status', 'synced');
              step._setRaw('last_sync_at', Date.now());
              step._setRaw('updated_at', Date.now());
            });
          });
          console.log('✅ useAccommodationDetail - Step local mis à jour avec données API fraîches');
        } catch (apiError) {
          console.warn('⚠️ useAccommodationDetail - Erreur sync API, fallback sur données locales:', apiError);
          // En cas d'erreur API, on continue avec les données locales mais on nettoie le cache
          setAccommodation(null);
        }
      }

      const stepsCollection = database.get<StepModel>('steps');
      const step = await stepsCollection.find(stepId);

      if (!step) {
        throw new Error(`Step non trouvé: ${stepId}`);
      }

      // Parser les accommodations depuis le JSON stocké
      let accommodations = [];
      try {
        // CORRECTION FINALE: Utiliser accommodationsJson (champ JSON) et non accommodations (relation)
        const accommodationsRaw = (step as any).accommodationsJson;
        console.log('🔍 useAccommodationDetail - Accommodations brutes:', {
          type: typeof accommodationsRaw,
          value: accommodationsRaw,
          isString: typeof accommodationsRaw === 'string',
          isArray: Array.isArray(accommodationsRaw),
          length: accommodationsRaw?.length || 'N/A'
        });
        
        if (typeof accommodationsRaw === 'string') {
          accommodations = JSON.parse(accommodationsRaw);
        } else if (Array.isArray(accommodationsRaw)) {
          accommodations = accommodationsRaw;
        }
        
        console.log('🔍 useAccommodationDetail - Accommodations parsées:', {
          count: accommodations.length,
          accommodations: accommodations.map((acc: any) => ({
            id: acc._id,
            name: acc.name,
            idType: typeof acc._id
          }))
        });
      } catch (parseError) {
        console.warn('⚠️ useAccommodationDetail - Erreur parsing accommodations:', parseError);
        accommodations = [];
      }

      // Trouver l'accommodation spécifique - CONVERSION STRING OBLIGATOIRE
      // Les ObjectIds MongoDB sont des objets, il faut les convertir en string pour comparaison
      console.log('🔍 useAccommodationDetail - Recherche accommodation avec ID:', accommodationId);
      
      if (accommodations.length === 0) {
        throw new Error(`Aucune accommodation trouvée dans le step: ${stepId}`);
      }
      
      const targetAccommodation = accommodations.find((acc: any) => {
        const accId = acc._id?.toString() || acc._id;
        console.log('🔍 useAccommodationDetail - Comparaison ID:', {
          accId,
          accommodationId,
          match: accId === accommodationId,
          accIdType: typeof acc._id,
          accIdValue: acc._id
        });
        return accId === accommodationId;
      });

      if (!targetAccommodation) {
        console.error('❌ useAccommodationDetail - Accommodation non trouvé. IDs disponibles:', 
          accommodations.map((acc: any) => ({ id: acc._id?.toString() || acc._id, name: acc.name })));
        throw new Error(`Accommodation non trouvé: ${accommodationId}`);
      }

      console.log('✅ useAccommodationDetail - Accommodation trouvé:', {
        name: targetAccommodation.name,
        id: targetAccommodation._id,
        thumbnail: targetAccommodation.thumbnail,
        hasThumbnailProperty: 'thumbnail' in targetAccommodation,
        thumbnailType: typeof targetAccommodation.thumbnail
      });

      setAccommodation(targetAccommodation);
      console.log('✅ useAccommodationDetail - Accommodation chargé depuis le cache local');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ useAccommodationDetail - Erreur:', errorMessage);
      setError(errorMessage);
      setAccommodation(null);
    } finally {
      setLoading(false);
    }
  }, [stepId, accommodationId, loading]); // Dépendances minimales seulement

  /**
   * ❌ DÉSACTIVÉ: Chargement initial automatique pour éviter les doubles appels
   * Le useFocusEffect de l'écran gère le chargement initial
   */
  // useEffect(() => {
  //   if (stepId && accommodationId && !accommodation && !loading) {
  //     console.log('🏨 useAccommodationDetail - Chargement initial automatique');
  //     refreshAccommodationDetail();
  //   }
  // }, [stepId, accommodationId, accommodation, loading, refreshAccommodationDetail]);

  /**
   * Nettoyer le cache de l'accommodation (utile après suppression de thumbnail)
   */
  const clearAccommodationCache = useCallback(() => {
    console.log('🧹 useAccommodationDetail - Nettoyage du cache accommodation');
    setAccommodation(null);
    setError(null);
  }, []);

  return {
    accommodation,
    loading,
    error,
    refreshAccommodationDetail,
    clearAccommodationCache,
  };
};
