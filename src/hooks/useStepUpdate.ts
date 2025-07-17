/**
 * Hook pour la modification d'une étape avec support offline-first
 * Conforme aux instructions Copilot pour éviter les appels multiples
 */
import { useState, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../services/database';
import { updateStep } from '../services/api/steps';
import type { UpdateStepRequest } from '../services/api/steps';
import type { ApiStep } from '../services/api/roadtrips';
import StepModel from '../services/database/models/Step';

interface UseStepUpdateResult {
  updating: boolean;
  error: string | null;
  updateStepData: (stepId: string, data: UpdateStepRequest) => Promise<ApiStep | null>;
}

/**
 * Validation ObjectId MongoDB
 */
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Met à jour les données d'une étape en local
 */
const updateStepInLocal = async (stepId: string, apiStep: ApiStep): Promise<void> => {
  await database.write(async () => {
    const stepsCollection = database.get<StepModel>('steps');
    
    try {
      // Essayer de trouver l'étape par ID direct
      let existingStep: StepModel;
      
      try {
        existingStep = await stepsCollection.find(stepId);
      } catch (directFindError) {
        // Si l'ID direct ne fonctionne pas, chercher par requête
        console.log('⚠️ useStepUpdate - ID direct non trouvé, recherche par query...');
        const stepsFound = await stepsCollection
          .query(Q.where('id', stepId))
          .fetch();
        
        if (stepsFound.length === 0) {
          throw new Error(`Étape avec ID ${stepId} non trouvée en local`);
        }
        
        existingStep = stepsFound[0];
      }
      
      // Préparer les données avant la closure
      const rawData = {
        user_id: apiStep.userId || 'unknown',
        roadtrip_id: apiStep.roadtripId,
        name: apiStep.name,
        notes: apiStep.notes || '',
        type: apiStep.type,
        latitude: apiStep.latitude,
        longitude: apiStep.longitude,
        address: apiStep.address || '',
        arrival_date_time: new Date(apiStep.arrivalDateTime).getTime(),
        departure_date_time: new Date(apiStep.departureDateTime).getTime(),
        travel_time_previous_step: apiStep.travelTimePreviousStep || 0,
        distance_previous_step: apiStep.distancePreviousStep || 0,
        travel_time_note: apiStep.travelTimeNote || '',
        activities: JSON.stringify(apiStep.activities || []),
        accommodations: JSON.stringify(apiStep.accommodations || []),
        thumbnail: JSON.stringify(apiStep.thumbnail || null),
        last_sync_at: Date.now(),
        updated_at: Date.now(),
      };

      // Mettre à jour l'étape existante
      await existingStep.update((step: StepModel) => {
        Object.keys(rawData).forEach(key => {
          step._setRaw(key, (rawData as any)[key]);
        });
      });

      console.log('✅ useStepUpdate - Étape mise à jour en local:', apiStep.name);
      
    } catch (error) {
      console.error('❌ useStepUpdate - Échec mise à jour locale:', error);
      throw error;
    }
  });
};

/**
 * Hook principal pour la mise à jour d'une étape
 */
export const useStepUpdate = (): UseStepUpdateResult => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction principale de mise à jour - OFFLINE-FIRST
   * Stratégie: Sauvegarde locale immédiate, puis synchronisation API en arrière-plan
   */
  const updateStepData = useCallback(async (stepId: string, data: UpdateStepRequest): Promise<ApiStep | null> => {
    if (!stepId || updating) {
      console.warn('⚠️ useStepUpdate - stepId manquant ou mise à jour en cours');
      return null;
    }

    console.log('� useStepUpdate - OFFLINE-FIRST: Sauvegarde locale immédiate:', {
      stepId,
      data: Object.keys(data)
    });

    setUpdating(true);
    setError(null);

    try {
      // Validation ObjectId obligatoire
      if (!isValidObjectId(stepId)) {
        const errorMsg = `ID invalide pour API MongoDB: ${stepId}`;
        console.error('❌ useStepUpdate -', errorMsg);
        setError(errorMsg);
        return null;
      }

      // PHASE 1: Sauvegarde locale IMMÉDIATE
      console.log('⚡ useStepUpdate - PHASE 1: Sauvegarde locale immédiate');
      
      await database.write(async () => {
        const stepsCollection = database.get<StepModel>('steps');
        
        try {
          let existingStep: StepModel;
          
          try {
            existingStep = await stepsCollection.find(stepId);
          } catch (directFindError) {
            const stepsFound = await stepsCollection
              .query(Q.where('id', stepId))
              .fetch();
            
            if (stepsFound.length === 0) {
              throw new Error(`Étape avec ID ${stepId} non trouvée en local`);
            }
            
            existingStep = stepsFound[0];
          }

          // Mettre à jour les champs modifiés localement
          await existingStep.update((step) => {
            if (data.name !== undefined) step._setRaw('name', data.name);
            if (data.notes !== undefined) step._setRaw('notes', data.notes);
            if (data.address !== undefined) step._setRaw('address', data.address);
            if (data.latitude !== undefined) step._setRaw('latitude', data.latitude);
            if (data.longitude !== undefined) step._setRaw('longitude', data.longitude);
            
            // Gestion des dates
            if (data.arrivalDateTime !== undefined) {
              const arrivalDate = data.arrivalDateTime ? new Date(data.arrivalDateTime) : null;
              step._setRaw('arrival_date_time', arrivalDate?.getTime() || null);
            }
            
            if (data.departureDateTime !== undefined) {
              const departureDate = data.departureDateTime ? new Date(data.departureDateTime) : null;
              step._setRaw('departure_date_time', departureDate?.getTime() || null);
            }
            
            // Marquer comme nécessitant une synchronisation
            step._setRaw('sync_status', 'pending');
            step._setRaw('last_sync_at', null);
            step._setRaw('updated_at', Date.now());
          });

          console.log('✅ useStepUpdate - Sauvegarde locale immédiate réussie');

        } catch (localError: any) {
          console.error('❌ useStepUpdate - Erreur sauvegarde locale:', localError);
          throw localError;
        }
      });

      // Créer un objet de retour temporaire pour satisfaire l'interface
      const localUpdateResult: ApiStep = {
        _id: stepId,
        name: data.name || '',
        address: data.address || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        arrivalDateTime: data.arrivalDateTime || '',
        departureDateTime: data.departureDateTime || '',
        userId: 'current-user', // Sera mis à jour lors de la sync API
        roadtripId: 'current-roadtrip', // Sera mis à jour lors de la sync API
        type: 'Stage' as const, // Type par défaut
        notes: data.notes || '',
        photos: [],
        documents: [],
        accommodations: [],
        activities: [],
        thumbnail: undefined,
      };

      // PHASE 2: Synchronisation API en arrière-plan (non bloquante)
      console.log('🔄 useStepUpdate - PHASE 2: Lancement synchronisation API en arrière-plan');
      
      // Lancer la synchronisation API sans attendre (Promise non await)
      Promise.resolve().then(async () => {
        try {
          console.log('📡 useStepUpdate - Appel API en arrière-plan');
          const updatedApiStep = await updateStep(stepId, data);
          
          if (updatedApiStep) {
            // Mettre à jour en local avec les données complètes de l'API
            await updateStepInLocal(stepId, updatedApiStep);
            console.log('✅ useStepUpdate - Synchronisation API terminée en arrière-plan');
          }
        } catch (apiError: any) {
          console.warn('⚠️ useStepUpdate - Erreur API en arrière-plan (données locales conservées):', apiError.message);
          // En cas d'erreur API, les données locales sont conservées
          // La synchronisation sera réessayée plus tard
        }
      });

      // Retourner immédiatement après la sauvegarde locale
      console.log('⚡ useStepUpdate - Retour immédiat après sauvegarde locale');
      
      return localUpdateResult;

    } catch (err: any) {
      console.error('❌ useStepUpdate - Erreur sauvegarde locale critique:', err);
      setError(err.message || 'Erreur lors de la sauvegarde locale');
      return null;
    } finally {
      setUpdating(false);
    }
  }, [updating]);

  return {
    updating,
    error,
    updateStepData,
  };
};

export default useStepUpdate;
