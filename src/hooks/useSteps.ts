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
  refreshSteps: (forceSync?: boolean) => Promise<void>;
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
    type: apiStep.type, // Pas de conversion, types alignés maintenant
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
    originalApiStepId: apiStep._id,
    originalApiStepIdType: typeof apiStep._id,
    convertedStepId: step._id,
    convertedStepIdType: typeof step._id,
    title: step.title,
    // type: step.type,
    // activitiesCount: apiStep.activities?.length || 0,
    // accommodationsCount: apiStep.accommodations?.length || 0,
    // thumbnail: apiStep.thumbnail,
    // thumbnailFromAPI: apiStep.thumbnail ? 'présente' : 'absente'
  });

  return step;
};

/**
 * Détermine si une synchronisation avec l'API est nécessaire
 * Stratégie offline-first : privilégier les données locales
 */
const shouldSynchronizeSteps = async (roadtripId: string): Promise<boolean> => {
  try {
    // Vérifier s'il y a des données en local
    const stepsCollection = database.get<StepModel>('steps');
    const localSteps = await stepsCollection
      .query(Q.where('roadtrip_id', roadtripId))
      .fetch();

    // Si pas de données locales, synchroniser obligatoirement
    if (localSteps.length === 0) {
      console.log('📍 shouldSynchronizeSteps - Pas de données locales → Sync nécessaire');
      return true;
    }

    // Vérifier la fraîcheur des données (dernière sync il y a plus de 5 minutes)
    const lastStep = localSteps[0];
    const lastSyncTime = lastStep.lastSyncAt?.getTime() || 0;
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    if (lastSyncTime < fiveMinutesAgo) {
      console.log('📍 shouldSynchronizeSteps - Données anciennes (>5min) → Sync nécessaire');
      return true;
    }

    // Vérifier s'il y a des éléments en attente de synchronisation
    const pendingSteps = localSteps.filter(step =>
      step.customSyncStatus === 'pending' || step.customSyncStatus === 'error'
    );

    if (pendingSteps.length > 0) {
      console.log('📍 shouldSynchronizeSteps - Éléments en attente → Sync nécessaire');
      return true;
    }

    console.log('📍 shouldSynchronizeSteps - Données à jour → Pas de sync');
    return false;

  } catch (err) {
    console.warn('📍 shouldSynchronizeSteps - Erreur, sync par sécurité:', err);
    return true; // En cas d'erreur, synchroniser par sécurité
  }
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
    type: stepData.type, // Pas de conversion, types alignés
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
      refreshSteps: async () => { },
      createStepOptimistic: async () => ({} as Step),
      updateStepOptimistic: async () => { },
      deleteStepOptimistic: async () => { },
      reorderStepsOptimistic: async () => { },
    };
  }

  /**
   * Charge les étapes depuis la base locale
   */
  const loadLocalSteps = useCallback(async () => {
    try {
      console.log('�️ CACHE - Chargement steps locaux pour roadtripId:', roadtripId);

      const stepsCollection = database.get<StepModel>('steps');
      const localSteps = await stepsCollection
        .query(Q.where('roadtrip_id', roadtripId))
        .fetch();

      console.log('�️ CACHE - Steps trouvés en local:', localSteps.length);

      const stepsData = localSteps
        .map((step, index) => {
          try {
            const stepInterface = step.toInterface();

            // Attacher les données API additionnelles depuis WatermelonDB
            (stepInterface as any).travelTimePreviousStep = step.travelTimePreviousStep;
            (stepInterface as any).distancePreviousStep = step.distancePreviousStep;
            (stepInterface as any).travelTimeNote = step.travelTimeNote || 'OK';

            console.log('🗄️ CACHE - Step récupéré du cache:', {
              stepId: stepInterface._id,
              stepIdType: typeof stepInterface._id,
              stepIdLength: stepInterface._id?.length,
              stepModelId: step.id,
              stepModelIdType: typeof step.id,
              title: stepInterface.title,
              // thumbnail: stepInterface.thumbnail ? 'présente' : 'absente',
              // thumbnailValue: stepInterface.thumbnail,
              // travelTimeNote: (stepInterface as any).travelTimeNote,
              // activitiesCount: (stepInterface as any).activities?.length || 0
            });
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

      console.log('�️ CACHE - Steps finaux après conversion:', stepsData.length);
      console.log('🗄️ CACHE - ✅ DONNÉES LOCALES UTILISÉES (cache-first)');
      setSteps(stepsData);
    } catch (err) {
      console.error('❌ Erreur chargement étapes locales:', err instanceof Error ? err.message : err);
      setError('Erreur lors du chargement des étapes');
    }
  }, [roadtripId]);

  /**
   * Synchronise avec l'API et met à jour la base locale
   * Version optimisée : ne force la synchronisation que si nécessaire
   */
  const refreshSteps = useCallback(async (forceSync: boolean = false) => {
    // Si pas de synchronisation forcée, vérifier si c'est nécessaire
    if (!forceSync) {
      const shouldSync = await shouldSynchronizeSteps(roadtripId);
      if (!shouldSync) {
        console.log('📍 refreshSteps - Données à jour, pas de sync nécessaire');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🌐 API - Début synchronisation pour roadtripId:', roadtripId);

      // Récupération depuis l'API
      const apiSteps = await getStepsByRoadtrip(roadtripId);

      console.log('🌐 API - Étapes récupérées:', apiSteps.length);
      console.log('🌐 API - ✅ DONNÉES API UTILISÉES (synchronisation)');
      console.log('🌐 API - Première étape (exemple):', apiSteps[0]._id);

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

      console.log('🌐 API - Steps convertis:', convertedSteps.length);
      setSteps(convertedSteps);

      // Mise à jour de la base locale en arrière-plan (réactivé avec fix closure)
      try {
        await database.write(async () => {
          const stepsCollection = database.get<StepModel>('steps');

          // Récupérer les étapes existantes pour ce roadtrip
          const existingSteps = await stepsCollection
            .query(Q.where('roadtrip_id', roadtripId))
            .fetch();

          console.log('🗄️ WatermelonDB - Steps existants trouvés:', existingSteps.length);

          // Créer un Map des steps existants par ID pour éviter les doublons
          const existingStepsMap = new Map(existingSteps.map(step => [step.id, step]));

          // Timestamp de synchronisation pour marquer les données comme fraîches
          const syncTimestamp = Date.now();

          // Traiter chaque step de l'API
          for (const apiStep of apiSteps) {
            if (!apiStep || !apiStep._id || !apiStep.type) {
              console.warn('Step ignoré - données incomplètes:', apiStep?._id || 'ID manquant');
              continue;
            }

            const mongoIdString = String(apiStep._id);
            
            // Vérifier si le step existe déjà
            const existingStep = existingStepsMap.get(mongoIdString);
            
            if (existingStep) {
              console.log('🔄 WatermelonDB - Mise à jour step existant:', apiStep.name);
              
              // Mettre à jour le step existant
              await existingStep.update((step: StepModel) => {
                step._setRaw('name', apiStep.name || '');
                step._setRaw('address', apiStep.address || '');
                step._setRaw('latitude', apiStep.latitude || 0);
                step._setRaw('longitude', apiStep.longitude || 0);
                step._setRaw('arrival_date_time', apiStep.arrivalDateTime ? new Date(apiStep.arrivalDateTime).getTime() : Date.now());
                step._setRaw('departure_date_time', apiStep.departureDateTime ? new Date(apiStep.departureDateTime).getTime() : Date.now());
                step._setRaw('travel_time_previous_step', apiStep.travelTimePreviousStep || 0);
                step._setRaw('distance_previous_step', apiStep.distancePreviousStep || 0);
                step._setRaw('travel_time_note', apiStep.travelTimeNote || 'OK');
                step._setRaw('notes', apiStep.notes || '');
                step._setRaw('activities', JSON.stringify(apiStep.activities || []));
                step._setRaw('accommodations', JSON.stringify(apiStep.accommodations || []));
                step._setRaw('last_sync_at', syncTimestamp);
                step._setRaw('updated_at', syncTimestamp);
                
                // Gestion de la thumbnail
                if (apiStep.thumbnail) {
                  if (typeof apiStep.thumbnail === 'string') {
                    step._setRaw('thumbnail', apiStep.thumbnail);
                  } else if (typeof apiStep.thumbnail === 'object' && (apiStep.thumbnail as any).url) {
                    step._setRaw('thumbnail', JSON.stringify(apiStep.thumbnail));
                  } else {
                    step._setRaw('thumbnail', JSON.stringify(apiStep.thumbnail));
                  }
                } else {
                  step._setRaw('thumbnail', '');
                }
              });
              
              // Retirer de la liste des existants (pour éviter la suppression)
              existingStepsMap.delete(mongoIdString);
              
            } else {
              console.log('➕ WatermelonDB - Création nouveau step:', apiStep.name);

              try {
                // Log pour vérifier le type de l'API
                console.log('🔧 WatermelonDB - Type API reçu:', apiStep.type, 'pour step:', apiStep.name);
                console.log('🔧 WatermelonDB - Thumbnail API:', apiStep.thumbnail ? 'présente' : 'absente');

                // Sérialisation correcte de la thumbnail (objet → string)
                let thumbnailString = '';
                if (apiStep.thumbnail) {
                  if (typeof apiStep.thumbnail === 'string') {
                    thumbnailString = apiStep.thumbnail;
                  } else if (typeof apiStep.thumbnail === 'object' && (apiStep.thumbnail as any).url) {
                    thumbnailString = JSON.stringify(apiStep.thumbnail);
                  } else {
                    thumbnailString = JSON.stringify(apiStep.thumbnail);
                  }
                }

                // Préparation complète des données AVANT la closure (version minimale)
                const rawData = {
                  user_id: apiStep.userId || 'unknown',
                  roadtrip_id: apiStep.roadtripId || roadtripId,
                  type: apiStep.type, // Utilise le type de l'API (Stage ou Stop)
                  name: apiStep.name || '',
                  address: apiStep.address || '',
                  latitude: apiStep.latitude || 0,
                  longitude: apiStep.longitude || 0,
                  arrival_date_time: apiStep.arrivalDateTime ? new Date(apiStep.arrivalDateTime).getTime() : Date.now(),
                  departure_date_time: apiStep.departureDateTime ? new Date(apiStep.departureDateTime).getTime() : Date.now(),
                  travel_time_previous_step: apiStep.travelTimePreviousStep || 0,
                  distance_previous_step: apiStep.distancePreviousStep || 0,
                  is_arrival_time_consistent: true,
                  travel_time_note: apiStep.travelTimeNote || 'OK', // Utilise la valeur de l'API
                  notes: apiStep.notes || '',
                  thumbnail: thumbnailString, // Thumbnail sérialisée
                  story: '',
                  activities: JSON.stringify(apiStep.activities || []), // Sérialise les activités
                  accommodations: JSON.stringify(apiStep.accommodations || []), // Sérialise les accommodations
                  // Champs BaseModel gérés manuellement
                  sync_status: 'synced',
                  last_sync_at: syncTimestamp,
                  created_at: syncTimestamp,
                  updated_at: syncTimestamp,
                  // Note: sync_status et last_sync_at gérés par BaseModel
                };

                // Création avec ObjectId MongoDB comme ID primaire
                await stepsCollection.create((step: StepModel) => {
                  // CRITIQUE: Utiliser l'ObjectId MongoDB comme ID primaire
                  step._raw.id = mongoIdString;
                  step._setRaw('user_id', rawData.user_id);
                  step._setRaw('roadtrip_id', rawData.roadtrip_id);
                  step._setRaw('type', rawData.type);
                  step._setRaw('name', rawData.name);
                  step._setRaw('address', rawData.address);
                  step._setRaw('latitude', rawData.latitude);
                  step._setRaw('longitude', rawData.longitude);
                  step._setRaw('arrival_date_time', rawData.arrival_date_time);
                  step._setRaw('departure_date_time', rawData.departure_date_time);
                  step._setRaw('travel_time_previous_step', rawData.travel_time_previous_step);
                  step._setRaw('distance_previous_step', rawData.distance_previous_step);
                  step._setRaw('is_arrival_time_consistent', rawData.is_arrival_time_consistent);
                  step._setRaw('travel_time_note', rawData.travel_time_note);
                  step._setRaw('notes', rawData.notes);
                  step._setRaw('thumbnail', rawData.thumbnail);
                  step._setRaw('story', rawData.story);
                  step._setRaw('activities', rawData.activities);
                  step._setRaw('accommodations', rawData.accommodations);
                  step._setRaw('sync_status', rawData.sync_status);
                  step._setRaw('last_sync_at', rawData.last_sync_at);
                  step._setRaw('created_at', rawData.created_at);
                  step._setRaw('updated_at', rawData.updated_at);
                });

                console.log('✅ Step sauvegardé en local:', {
                  id: mongoIdString,
                  userId: rawData.user_id,
                  name: rawData.name
                });
              } catch (stepErr) {
                console.error('❌ Erreur création step en base locale:', stepErr);
                // Continue même si la sauvegarde locale échoue
              }
            }
          }

          // Supprimer les steps qui ne sont plus dans l'API
          for (const [stepId, step] of existingStepsMap) {
            console.log('🗑️ WatermelonDB - Suppression step obsolète:', step.name);
            await step.markAsDeleted();
          }

          console.log('✅ Synchronisation locale terminée avec timestamp:', new Date(syncTimestamp).toISOString());
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
        step._setRaw('sync_status', 'pending');
        step._setRaw('last_sync_at', Date.now());
        step._setRaw('created_at', Date.now());
        step._setRaw('updated_at', Date.now());
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

  // Chargement initial avec stratégie offline-first
  useEffect(() => {
    const initializeSteps = async () => {
      // Toujours charger d'abord les données locales (offline-first)
      await loadLocalSteps();

      // Vérifier la fraîcheur des données et la connectivité
      const shouldSync = await shouldSynchronizeSteps(roadtripId);

      if (shouldSync) {
        console.log('📍 ⚡ DÉCISION: Données pas à jour ou connectivité OK - Synchronisation API');
        refreshSteps(false); // Ne bloque pas l'UI, se fait en arrière-plan
      } else {
        console.log('📍 ✅ DÉCISION: Données locales à jour - Pas de synchronisation API');
      }
    };

    initializeSteps();
  }, [roadtripId]); // Dépendance uniquement sur roadtripId

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
