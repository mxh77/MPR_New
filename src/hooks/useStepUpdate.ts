/**
 * Hook pour la modification d'une étape avec support offline-first
 * Conforme aux instructions Copilot pour éviter les appels multiples
 */
import { useState, useCallback } from 'react';
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
      // Chercher l'étape existante
      const existingStep = await stepsCollection.find(stepId);
      
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
      
    } catch (notFoundError) {
      console.warn('⚠️ useStepUpdate - Étape non trouvée en local pour mise à jour:', stepId);
      // En cas d'erreur, on pourrait créer l'étape, mais c'est inhabituel
      throw new Error('Étape non trouvée en local');
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
   * Fonction principale de mise à jour
   * Stratégie: API d'abord, puis mise à jour locale
   */
  const updateStepData = useCallback(async (stepId: string, data: UpdateStepRequest): Promise<ApiStep | null> => {
    if (!stepId || updating) {
      console.warn('⚠️ useStepUpdate - stepId manquant ou mise à jour en cours');
      return null;
    }

    console.log('🔄 useStepUpdate - Début mise à jour:', {
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

      console.log('📡 useStepUpdate - Appel API updateStep');
      
      // Appel API pour mettre à jour
      const updatedApiStep = await updateStep(stepId, data);
      
      console.log('✅ useStepUpdate - Réponse API reçue:', {
        name: updatedApiStep.name,
        type: updatedApiStep.type,
        userId: updatedApiStep.userId
      });

      // Mettre à jour en local
      await updateStepInLocal(stepId, updatedApiStep);

      console.log('✅ useStepUpdate - Mise à jour terminée avec succès');
      
      return updatedApiStep;

    } catch (err: any) {
      console.error('❌ useStepUpdate - Erreur:', err);
      setError(err.message || 'Erreur lors de la mise à jour');
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
