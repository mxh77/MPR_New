/**
 * Hook pour la gestion des étapes avec support offline-first
 */
import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../services/database';
import { getStepsByRoadtrip, createStep, updateStep, deleteStep, reorderSteps } from '../services/api/steps';
import type { CreateStepRequest, UpdateStepRequest } from '../services/api/steps';
import type { Step } from '../types';
import type { ApiStep } from '../services/api/roadtrips';
import StepModel from '../services/database/models/Step';

interface UseStepsResult {
  steps: Step[];
  loading: boolean;
  error: string | null;
  refreshSteps: () => Promise<void>;
  createStepOptimistic: (stepData: CreateStepRequest) => Promise<Step>;
  updateStepOptimistic: (stepId: string, stepData: UpdateStepRequest) => Promise<void>;
  deleteStepOptimistic: (stepId: string) => Promise<void>;
  reorderStepsOptimistic: (stepIds: string[]) => Promise<void>;
}

/**
 * Convertit une ApiStep en Step avec préservation des activités et accommodations
 */
const convertApiStepToStep = (apiStep: ApiStep): Step => {
  const step = {
    _id: apiStep._id,
    roadtripId: apiStep.roadtripId,
    title: apiStep.name,
    description: apiStep.notes,
    type: apiStep.type === 'Stage' ? 'overnight' : 'stop',
    orderIndex: 0, // sera mis à jour par le serveur
    location: {
      latitude: apiStep.latitude,
      longitude: apiStep.longitude,
      address: apiStep.address,
    },
    startDate: new Date(apiStep.arrivalDateTime),
    endDate: new Date(apiStep.departureDateTime),
    duration: undefined,
    distance: apiStep.distancePreviousStep,
    thumbnail: apiStep.thumbnail,
    syncStatus: 'synced' as const,
    lastSyncAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Step;

  // Attacher les données additionnelles de l'API (activities, accommodations, etc.)
  (step as any).activities = apiStep.activities || [];
  (step as any).accommodations = apiStep.accommodations || [];
  (step as any).travelTimePreviousStep = apiStep.travelTimePreviousStep;
  (step as any).distancePreviousStep = apiStep.distancePreviousStep;
  (step as any).travelTimeNote = apiStep.travelTimeNote;

  console.log('🔄 convertApiStepToStep - Step converti:', {
    title: step.title,
    type: step.type,
    activitiesCount: apiStep.activities?.length || 0,
    accommodationsCount: apiStep.accommodations?.length || 0,
    thumbnail: apiStep.thumbnail
  });

  return step;
};

/**
 * Convertit un CreateStepRequest en Step local
 */
const convertCreateRequestToStep = (stepData: CreateStepRequest, tempId: string): Step => {
  return {
    _id: tempId,
    roadtripId: stepData.roadtripId,
    title: stepData.name,
    description: stepData.notes,
    type: stepData.type === 'Stage' ? 'overnight' : 'stop',
    orderIndex: 999, // sera réorganisé
    location: {
      latitude: stepData.latitude,
      longitude: stepData.longitude,
      address: stepData.address,
    },
    startDate: new Date(stepData.arrivalDateTime),
    endDate: new Date(stepData.departureDateTime),
    duration: undefined,
    distance: undefined,
    thumbnail: undefined,
    syncStatus: 'pending',
    lastSyncAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const useSteps = (roadtripId: string): UseStepsResult => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log de l'ID du roadtrip dans le hook
  console.log('useSteps - roadtripId reçu:', roadtripId);
  console.log('useSteps - type:', typeof roadtripId);
  console.log('useSteps - length:', roadtripId?.length);

  // Validation de l'ID
  if (!roadtripId || roadtripId.trim() === '') {
    console.error('useSteps - roadtripId invalide:', roadtripId);
    return {
      steps: [],
      loading: false,
      error: 'ID du roadtrip invalide',
      refreshSteps: async () => {},
      createStepOptimistic: async () => ({} as Step),
      updateStepOptimistic: async () => {},
      deleteStepOptimistic: async () => {},
      reorderStepsOptimistic: async () => {},
    };
  }

  /**
   * Charge les étapes depuis la base locale
   */
  const loadLocalSteps = useCallback(async () => {
    try {
      console.log('📍 Chargement steps locaux pour roadtripId:', roadtripId);
      
      const stepsCollection = database.get<StepModel>('steps');
      const localSteps = await stepsCollection
        .query(Q.where('roadtrip_id', roadtripId))
        .fetch();

      console.log('📍 Steps trouvés en local:', localSteps.length);

      const stepsData = localSteps
        .map((step, index) => {
          try {
            const stepInterface = step.toInterface();
            return stepInterface;
          } catch (err) {
            console.error(`❌ Erreur conversion step ${index + 1}:`, err instanceof Error ? err.message : err);
            return null;
          }
        })
        .filter((step): step is Step => step !== null)
        .sort((a, b) => {
          // Tri par date d'arrivée, puis par orderIndex en cas d'égalité
          if (a.startDate && b.startDate) {
            return a.startDate.getTime() - b.startDate.getTime();
          }
          if (a.startDate && !b.startDate) return -1;
          if (!a.startDate && b.startDate) return 1;
          return a.orderIndex - b.orderIndex;
        });

      console.log('📍 Steps finaux après conversion:', stepsData.length);
      setSteps(stepsData);
    } catch (err) {
      console.error('❌ Erreur chargement étapes locales:', err instanceof Error ? err.message : err);
      setError('Erreur lors du chargement des étapes');
    }
  }, [roadtripId]);

  /**
   * Synchronise avec l'API et met à jour la base locale
   */
  const refreshSteps = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('refreshSteps - Début synchronisation pour roadtripId:', roadtripId);
      
      // Récupération depuis l'API
      const apiSteps = await getStepsByRoadtrip(roadtripId);
      
      console.log('refreshSteps - Étapes récupérées:', apiSteps.length);
      console.log('refreshSteps - Première étape (exemple):', apiSteps[0]);
      
      // Conversion directe des données API en Steps avec toutes les données
      const convertedSteps = apiSteps
        .map(convertApiStepToStep)
        .sort((a, b) => {
          // Tri par date d'arrivée
          if (a.startDate && b.startDate) {
            return a.startDate.getTime() - b.startDate.getTime();
          }
          if (a.startDate && !b.startDate) return -1;
          if (!a.startDate && b.startDate) return 1;
          return a.orderIndex - b.orderIndex;
        });

      console.log('refreshSteps - Steps convertis:', convertedSteps.length);
      setSteps(convertedSteps);

      // Mise à jour de la base locale en arrière-plan (optionnel)
      try {
        await database.write(async () => {
          const stepsCollection = database.get<StepModel>('steps');
          
          // Supprime les étapes existantes pour ce roadtrip
          const existingSteps = await stepsCollection
            .query(Q.where('roadtrip_id', roadtripId))
            .fetch();

          for (const step of existingSteps) {
            await step.markAsDeleted();
          }

          // Ajoute les nouvelles étapes (version simplifiée)
          for (const apiStep of apiSteps) {
            if (!apiStep._id || !apiStep.type) continue;
            
            try {
              await stepsCollection.create((step: StepModel) => {
                step._setRaw('user_id', apiStep.userId);
                step._setRaw('roadtrip_id', apiStep.roadtripId);
                step._setRaw('type', apiStep.type === 'Stage' ? 'overnight' : 'stop');
                step._setRaw('name', apiStep.name || '');
                step._setRaw('address', apiStep.address || '');
                step._setRaw('latitude', apiStep.latitude || 0);
                step._setRaw('longitude', apiStep.longitude || 0);
                step._setRaw('arrival_date_time', new Date(apiStep.arrivalDateTime).getTime());
                step._setRaw('departure_date_time', new Date(apiStep.departureDateTime).getTime());
                step._setRaw('travel_time_previous_step', apiStep.travelTimePreviousStep || 0);
                step._setRaw('distance_previous_step', apiStep.distancePreviousStep || 0);
                step._setRaw('is_arrival_time_consistent', true);
                step._setRaw('travel_time_note', 'OK');
                step._setRaw('notes', apiStep.notes || '');
                step._setRaw('thumbnail', apiStep.thumbnail || '');
                step._setRaw('story', '');
              });
            } catch (stepErr) {
              console.warn('Erreur création step en base locale:', stepErr);
              // Continue même si la sauvegarde locale échoue
            }
          }
        });
      } catch (dbErr) {
        console.warn('Erreur sauvegarde locale (non critique):', dbErr);
        // La sauvegarde locale est optionnelle, on continue
      }

    } catch (err) {
      console.error('Erreur lors de la synchronisation des étapes:', err);
      
      // Si c'est une erreur 404, c'est normal (pas encore d'étapes)
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        setError(null);
        setSteps([]);
        console.log('Aucune étape trouvée pour ce roadtrip (normal)');
      } else {
        setError('Erreur lors de la synchronisation');
        
        // En cas d'erreur, charge quand même les données locales
        await loadLocalSteps();
      }
    } finally {
      setLoading(false);
    }
  }, [roadtripId, loadLocalSteps]);

  /**
   * Crée une étape (optimiste)
   */
  const createStepOptimistic = useCallback(async (stepData: CreateStepRequest): Promise<Step> => {
    const tempId = `temp_${Date.now()}`;
    const newStep = convertCreateRequestToStep(stepData, tempId);

    // Mise à jour optimiste
    setSteps(prev => [...prev, newStep].sort((a, b) => a.orderIndex - b.orderIndex));

    // Sauvegarde locale
    await database.write(async () => {
      const stepsCollection = database.get<StepModel>('steps');
      await stepsCollection.create((step: StepModel) => {
        step._setRaw('user_id', 'temp_user'); // Sera mis à jour lors de la sync
        step._setRaw('roadtrip_id', stepData.roadtripId);
        step._setRaw('name', stepData.name);
        step._setRaw('notes', stepData.notes || '');
        step._setRaw('type', stepData.type);
        step._setRaw('address', stepData.address);
        step._setRaw('latitude', stepData.latitude);
        step._setRaw('longitude', stepData.longitude);
        step._setRaw('arrival_date_time', new Date(stepData.arrivalDateTime).getTime());
        step._setRaw('departure_date_time', new Date(stepData.departureDateTime).getTime());
        step._setRaw('travel_time_previous_step', 0);
        step._setRaw('distance_previous_step', 0);
        step._setRaw('is_arrival_time_consistent', true);
        step._setRaw('travel_time_note', 'OK');
        step._setRaw('thumbnail', '');
        step._setRaw('story', '');
      });
    });

    // Synchronisation en arrière-plan
    try {
      const apiStep = await createStep(stepData);
      await loadLocalSteps();
    } catch (err) {
      console.error('Erreur lors de la création de l\'étape:', err);
      // L'étape reste en local avec le statut 'pending'
    }

    return newStep;
  }, [loadLocalSteps]);

  /**
   * Met à jour une étape (optimiste)
   */
  const updateStepOptimistic = useCallback(async (stepId: string, stepData: UpdateStepRequest) => {
    // Mise à jour optimiste
    setSteps(prev => prev.map(step => {
      if (step._id === stepId) {
        const updatedStep: Step = { 
          ...step,
          title: stepData.name || step.title,
          description: stepData.notes !== undefined ? stepData.notes : step.description,
          updatedAt: new Date(),
          syncStatus: 'pending'
        };
        
        if (stepData.arrivalDateTime) {
          updatedStep.startDate = new Date(stepData.arrivalDateTime);
        }
        if (stepData.departureDateTime) {
          updatedStep.endDate = new Date(stepData.departureDateTime);
        }
        
        return updatedStep;
      }
      return step;
    }));

    // Sauvegarde locale
    await database.write(async () => {
      const stepsCollection = database.get<StepModel>('steps');
      const step = await stepsCollection.find(stepId);
      
      await step.update((s: StepModel) => {
        if (stepData.name) s._setRaw('name', stepData.name);
        if (stepData.notes !== undefined) s._setRaw('notes', stepData.notes);
        if (stepData.arrivalDateTime) s._setRaw('arrival_date_time', new Date(stepData.arrivalDateTime).getTime());
        if (stepData.departureDateTime) s._setRaw('departure_date_time', new Date(stepData.departureDateTime).getTime());
      });
    });

    // Synchronisation en arrière-plan
    try {
      await updateStep(stepId, stepData);
      await loadLocalSteps();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'étape:', err);
    }
  }, [loadLocalSteps]);

  /**
   * Supprime une étape (optimiste)
   */
  const deleteStepOptimistic = useCallback(async (stepId: string) => {
    // Mise à jour optimiste
    setSteps(prev => prev.filter(step => step._id !== stepId));

    // Marquage pour suppression en local
    await database.write(async () => {
      const stepsCollection = database.get<StepModel>('steps');
      const step = await stepsCollection.find(stepId);
      await step.markAsDeleted();
    });

    // Synchronisation en arrière-plan
    try {
      await deleteStep(stepId);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'étape:', err);
      // Recharge pour récupérer l'état cohérent
      await loadLocalSteps();
    }
  }, [loadLocalSteps]);

  /**
   * Réorganise les étapes (optimiste)
   */
  const reorderStepsOptimistic = useCallback(async (stepIds: string[]) => {
    // Mise à jour optimiste
    const reorderedSteps = stepIds.map((id, index) => {
      const step = steps.find(s => s._id === id);
      return step ? { ...step, orderIndex: index } : null;
    }).filter(Boolean) as Step[];

    setSteps(reorderedSteps);

    // Synchronisation en arrière-plan
    try {
      await reorderSteps(roadtripId, stepIds);
    } catch (err) {
      console.error('Erreur lors de la réorganisation des étapes:', err);
      await loadLocalSteps();
    }
  }, [steps, roadtripId, loadLocalSteps]);

  // Chargement initial + synchronisation
  useEffect(() => {
    // Charge d'abord les données locales
    loadLocalSteps();
    
    // Puis synchronise avec l'API
    refreshSteps();
  }, [loadLocalSteps, refreshSteps]);

  return {
    steps,
    loading,
    error,
    refreshSteps,
    createStepOptimistic,
    updateStepOptimistic,
    deleteStepOptimistic,
    reorderStepsOptimistic,
  };
};
