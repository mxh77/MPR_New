/**
 * Hook pour la gestion des détails d'une étape avec support offline-first
 * Conforme aux instructions Copilot pour éviter les appels multiples
 */
import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../services/database';
import { getStepById } from '../services/api/steps';
import type { Step } from '../types';
import type { ApiStep } from '../services/api/roadtrips';
import StepModel from '../services/database/models/Step';

interface UseStepDetailResult {
  step: Step | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  fetchStepDetail: () => Promise<void>;
  refreshStepDetail: (forceSync?: boolean) => Promise<void>;
}

/**
 * Validation ObjectId MongoDB
 */
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Convertit une ApiStep en Step avec toutes les données additionnelles
 */
const convertApiStepToStep = (apiStep: ApiStep): Step => {
  // Debug userId distant
  console.log('🔍 convertApiStepToStep - userId distant:', {
    userId: apiStep.userId,
    stepId: apiStep._id,
    stepName: apiStep.name
  });

  const step = {
    _id: apiStep._id,
    roadtripId: apiStep.roadtripId,
    title: apiStep.name,
    description: apiStep.notes,
    type: apiStep.type,
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

  // Attacher les données additionnelles de l'API
  (step as any).activities = apiStep.activities || [];
  (step as any).accommodations = apiStep.accommodations || [];
  (step as any).travelTimePreviousStep = apiStep.travelTimePreviousStep;
  (step as any).distancePreviousStep = apiStep.distancePreviousStep;
  (step as any).travelTimeNote = apiStep.travelTimeNote;

  console.log('🔄 useStepDetail - Step converti:', {
    title: step.title,
    type: step.type,
    activitiesCount: apiStep.activities?.length || 0,
    accommodationsCount: apiStep.accommodations?.length || 0,
    thumbnail: apiStep.thumbnail ? 'présente' : 'absente'
  });

  return step;
};

/**
 * Convertit un StepModel WatermelonDB en Step
 */
const convertStepModelToStep = (stepModel: StepModel): Step => {
  // Debug userId local
  console.log('🔍 convertStepModelToStep - userId local:', {
    userId: stepModel.userId,
    stepId: stepModel.id,
    stepName: stepModel.name
  });

  // Parse des données JSON stockées
  let activities = [];
  let accommodations = [];
  let thumbnail = null;

  try {
    if (stepModel.activitiesJson) {
      // Vérifier si c'est déjà un objet ou si c'est une string JSON
      if (typeof stepModel.activitiesJson === 'string') {
        activities = JSON.parse(stepModel.activitiesJson);
      } else {
        activities = stepModel.activitiesJson;
      }
    } else {
      activities = [];
    }
  } catch (e) {
    console.warn('Erreur parsing activities:', e, 'Valeur:', stepModel.activitiesJson);
    activities = [];
  }

  try {
    if (stepModel.accommodationsJson) {
      // Vérifier si c'est déjà un objet ou si c'est une string JSON
      if (typeof stepModel.accommodationsJson === 'string') {
        accommodations = JSON.parse(stepModel.accommodationsJson);
      } else {
        accommodations = stepModel.accommodationsJson;
      }
    } else {
      accommodations = [];
    }
  } catch (e) {
    console.warn('Erreur parsing accommodations:', e, 'Valeur:', stepModel.accommodationsJson);
    accommodations = [];
  }

  try {
    console.log('🔍 convertStepModelToStep - thumbnail avant parsing:', {
      stepId: stepModel.id,
      stepName: stepModel.name,
      thumbnailRaw: stepModel.thumbnail,
      thumbnailType: typeof stepModel.thumbnail,
      thumbnailLength: stepModel.thumbnail?.length
    });
    
    thumbnail = stepModel.thumbnail ? JSON.parse(stepModel.thumbnail) : null;
    
    console.log('🔍 convertStepModelToStep - thumbnail après parsing:', {
      stepId: stepModel.id,
      thumbnail,
      thumbnailType: typeof thumbnail,
      hasUrl: thumbnail?.url
    });
  } catch (e) {
    console.warn('Erreur parsing thumbnail:', e);
    // Si c'est une string, la garder telle quelle
    thumbnail = typeof stepModel.thumbnail === 'string' ? stepModel.thumbnail : null;
    
    console.log('🔍 convertStepModelToStep - thumbnail fallback:', {
      stepId: stepModel.id,
      thumbnail,
      thumbnailType: typeof thumbnail
    });
  }

  const step = {
    _id: stepModel.id,
    roadtripId: stepModel.roadtripId,
    title: stepModel.name,
    description: stepModel.notes || undefined,
    type: stepModel.type as any,
    location: {
      latitude: stepModel.latitude,
      longitude: stepModel.longitude,
      address: stepModel.address || '',
    },
    startDate: stepModel.arrivalDateTime ? new Date(stepModel.arrivalDateTime) : undefined,
    endDate: stepModel.departureDateTime ? new Date(stepModel.departureDateTime) : undefined,
    duration: undefined,
    distance: stepModel.distancePreviousStep || undefined,
    thumbnail,
    syncStatus: (stepModel.customSyncStatus || 'synced') as any,
    lastSyncAt: stepModel.lastSyncAt ? new Date(stepModel.lastSyncAt) : new Date(),
    createdAt: stepModel.createdAt ? new Date(stepModel.createdAt) : new Date(),
    updatedAt: stepModel.updatedAt ? new Date(stepModel.updatedAt) : new Date(),
  } as Step;

  // Attacher les données additionnelles
  (step as any).activities = activities;
  (step as any).accommodations = accommodations;
  (step as any).travelTimePreviousStep = stepModel.travelTimePreviousStep || undefined;
  (step as any).distancePreviousStep = stepModel.distancePreviousStep || undefined;
  (step as any).travelTimeNote = stepModel.travelTimeNote || undefined;

  return step;
};

/**
 * Sauvegarde les détails d'une étape en local
 */
const saveStepDetailToLocal = async (apiStep: ApiStep): Promise<void> => {
  // Debug userId avant sauvegarde
  console.log('💾 saveStepDetailToLocal - userId API:', {
    userId: apiStep.userId,
    stepId: apiStep._id,
    stepIdType: typeof apiStep._id,
    stepIdLength: apiStep._id?.length,
    stepName: apiStep.name,
    roadtripId: apiStep.roadtripId
  });

  await database.write(async () => {
    const stepsCollection = database.get<StepModel>('steps');
    
    try {
      // Chercher l'étape existante
      const existingStep = await stepsCollection.find(apiStep._id);
      
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
        // custom_sync_status: 'synced',
        last_sync_at: Date.now(),
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      // Mettre à jour l'étape existante
      await existingStep.update((step: StepModel) => {
        Object.keys(rawData).forEach(key => {
          step._setRaw(key, (rawData as any)[key]);
        });
      });

      console.log('✅ useStepDetail - Étape mise à jour en local:', apiStep.name);
      
    } catch (notFoundError) {
      // L'étape n'existe pas, la créer
      console.log('📝 useStepDetail - Création nouvelle étape en local:', apiStep.name);
      
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
        // custom_sync_status: 'synced',
        last_sync_at: Date.now(),
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      await stepsCollection.create((step: StepModel) => {
        // CRITIQUE: Préserver l'ObjectId MongoDB
        const mongoIdString = String(apiStep._id);
        console.log('💾 saveStepDetailToLocal - Création avec ID:', {
          originalId: apiStep._id,
          originalIdType: typeof apiStep._id,
          mongoIdString,
          mongoIdStringType: typeof mongoIdString,
          mongoIdStringLength: mongoIdString.length
        });
        
        step._raw.id = mongoIdString;
        Object.keys(rawData).forEach(key => {
          step._setRaw(key, (rawData as any)[key]);
        });
      });
    }
  });
};

/**
 * Charge les détails d'une étape depuis le local
 */
const loadStepDetailFromLocal = async (stepId: string): Promise<Step | null> => {
  try {
    console.log('📱 loadStepDetailFromLocal - Recherche pour stepId:', {
      stepId,
      stepIdType: typeof stepId,
      stepIdLength: stepId?.length,
      isValidObjectId: /^[0-9a-fA-F]{24}$/.test(stepId)
    });

    const stepsCollection = database.get<StepModel>('steps');
    
    // D'abord essayer avec find()
    let stepModel;
    try {
      stepModel = await stepsCollection.find(stepId);
      console.log('📱 loadStepDetailFromLocal - Trouvé avec find():', stepModel.id);
    } catch (findError) {
      console.log('📱 loadStepDetailFromLocal - find() échoué, essai avec query()');
      
      // Si find() échoue, essayer avec query()
      const foundSteps = await stepsCollection
        .query(Q.where('id', stepId))
        .fetch();
      
      if (foundSteps.length > 0) {
        stepModel = foundSteps[0];
        console.log('📱 loadStepDetailFromLocal - Trouvé avec query():', stepModel.id);
      } else {
        console.log('📱 loadStepDetailFromLocal - Aucun step trouvé avec ce stepId');
        return null;
      }
    }
    
    // Debug userId récupéré du local
    console.log('📱 loadStepDetailFromLocal - userId local récupéré:', {
      userId: stepModel.userId,
      stepId: stepModel.id,
      stepName: stepModel.name
    });
    
    return convertStepModelToStep(stepModel);
  } catch (error) {
    console.log('📱 useStepDetail - Étape non trouvée en local:', stepId, 'Erreur:', error);
    return null;
  }
};

/**
 * Détermine si une synchronisation est nécessaire
 */
const shouldSynchronizeStepDetail = async (stepId: string): Promise<boolean> => {
  try {
    const localStep = await loadStepDetailFromLocal(stepId);
    
    // Si pas de données locales, synchroniser
    if (!localStep) {
      console.log('📍 useStepDetail - Pas de données locales → Sync nécessaire');
      return true;
    }

    // Vérifier la fraîcheur (5 minutes)
    const lastSyncTime = localStep.lastSyncAt?.getTime() || 0;
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    if (lastSyncTime < fiveMinutesAgo) {
      console.log('📍 useStepDetail - Données anciennes (>5min) → Sync nécessaire');
      return true;
    }

    // Vérifier s'il y a des éléments en attente
    if (localStep.syncStatus === 'pending' || localStep.syncStatus === 'error') {
      console.log('📍 useStepDetail - Éléments en attente → Sync nécessaire');
      return true;
    }

    console.log('📍 useStepDetail - Données à jour → Pas de sync');
    return false;

  } catch (err) {
    console.warn('📍 useStepDetail - Erreur, sync par sécurité:', err);
    return true;
  }
};

/**
 * Hook principal pour les détails d'une étape
 */
export const useStepDetail = (stepId: string): UseStepDetailResult => {
  const [step, setStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🔧 useStepDetail - Hook initialisé pour stepId:', {
    stepId,
    stepIdType: typeof stepId,
    stepIdLength: stepId?.length,
    isValidObjectId: stepId ? /^[0-9a-fA-F]{24}$/.test(stepId) : false
  });

  /**
   * Fonction principale de chargement des détails
   * Stratégie offline-first : local d'abord, puis sync si nécessaire
   */
  const fetchStepDetail = useCallback(async () => {
    if (!stepId || loading) return;

    console.log('🎯 useStepDetail - fetchStepDetail déclenchée');
    setLoading(true);
    setError(null);

    try {
      // 1. Charger d'abord les données locales
      const localStep = await loadStepDetailFromLocal(stepId);
      if (localStep) {
        setStep(localStep);
        console.log('✅ useStepDetail - Données locales chargées:', localStep.title);
      }

      // 2. Synchroniser en arrière-plan si nécessaire
      const needsSync = await shouldSynchronizeStepDetail(stepId);
      if (needsSync && !syncing) {
        setSyncing(true);
        setError(null);

        // Validation ObjectId obligatoire
        if (!isValidObjectId(stepId)) {
          const errorMsg = `ID invalide pour API MongoDB: ${stepId}`;
          console.error('❌ useStepDetail -', errorMsg);
          setError(errorMsg);
          setSyncing(false);
          return;
        }

        console.log('🔄 useStepDetail - Synchronisation API pour:', stepId);
        
        // Appel API
        const apiStep = await getStepById(stepId);
        
        console.log('📡 useStepDetail - Réponse API reçue:', {
          name: apiStep.name,
          type: apiStep.type,
          userId: apiStep.userId,
          roadtripId: apiStep.roadtripId,
          activitiesCount: apiStep.activities?.length || 0,
          accommodationsCount: apiStep.accommodations?.length || 0
        });

        // Sauvegarder en local
        await saveStepDetailToLocal(apiStep);

        // Convertir et mettre à jour l'état
        const convertedStep = convertApiStepToStep(apiStep);
        setStep(convertedStep);

        console.log('✅ useStepDetail - Synchronisation terminée');
        setSyncing(false);
      }

    } catch (err: any) {
      console.error('❌ useStepDetail - Erreur fetchStepDetail:', err);
      
      // En cas d'erreur, garder les données locales si disponibles
      if (!step) {
        setError(err.message || 'Erreur de chargement');
      } else {
        setError('Données en mode hors ligne');
      }
      setSyncing(false);
    } finally {
      setLoading(false);
    }
  }, [stepId, loading, syncing]); // Dépendances minimales

  /**
   * Fonction de rafraîchissement avec sync forcée
   */
  const refreshStepDetail = useCallback(async (forceSync: boolean = false) => {
    console.log('🔄 useStepDetail - refreshStepDetail, forceSync:', forceSync);
    
    if (!stepId) return;

    try {
      // Charger local d'abord pour une réponse immédiate
      const localStep = await loadStepDetailFromLocal(stepId);
      if (localStep) {
        setStep(localStep);
        console.log('✅ useStepDetail - Données locales chargées:', localStep.title);
      }
      
      // Puis synchroniser si nécessaire ou forcée
      if (forceSync || await shouldSynchronizeStepDetail(stepId)) {
        if (!syncing) {
          setSyncing(true);
          setError(null);

          // Validation ObjectId obligatoire
          if (!isValidObjectId(stepId)) {
            const errorMsg = `ID invalide pour API MongoDB: ${stepId}`;
            console.error('❌ useStepDetail -', errorMsg);
            setError(errorMsg);
            setSyncing(false);
            return;
          }

          console.log('🔄 useStepDetail - Synchronisation API pour:', stepId);
          
          // Appel API
          const apiStep = await getStepById(stepId);
          
          console.log('📡 useStepDetail - Réponse API reçue (refresh):', {
            name: apiStep.name,
            type: apiStep.type,
            userId: apiStep.userId,
            roadtripId: apiStep.roadtripId,
            activitiesCount: apiStep.activities?.length || 0,
            accommodationsCount: apiStep.accommodations?.length || 0
          });
          // Sauvegarder en local
          await saveStepDetailToLocal(apiStep);

          // Convertir et mettre à jour l'état
          const convertedStep = convertApiStepToStep(apiStep);
          setStep(convertedStep);

          console.log('✅ useStepDetail - Synchronisation terminée');
          setSyncing(false);
        }
      }
    } catch (err: any) {
      console.error('❌ useStepDetail - Erreur refreshStepDetail:', err);
      setError(err.message || 'Erreur de synchronisation');
      setSyncing(false);
    }
  }, [stepId, syncing]); // Dépendances minimales

  // Debug des états (réduit pour éviter les re-renders excessifs)
  // console.log('🔧 useStepDetail - États actuels:', {
  //   stepId,
  //   hasStep: !!step,
  //   loading,
  //   syncing,
  //   error: !!error,
  //   stepName: step?.title
  // });

  return {
    step,
    loading,
    syncing,
    error,
    fetchStepDetail,
    refreshStepDetail,
  };
};

export default useStepDetail;
