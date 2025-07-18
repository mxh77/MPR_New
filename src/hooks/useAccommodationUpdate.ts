/**
 * Hook pour la modification d'un accommodation avec support offline-first
 * Conforme aux instructions Copilot pour pattern 2-phases
 */
import { useState, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../services/database';
import { updateAccommodation } from '../services/api/accommodations';
import StepModel from '../services/database/models/Step';

interface UseAccommodationUpdateResult {
  updating: boolean;
  error: string | null;
  updateAccommodationData: (stepId: string, accommodationId: string, data: any) => Promise<any | null>;
}

/**
 * Validation ObjectId MongoDB
 */
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Met à jour un accommodation dans le step local
 */
const updateAccommodationInLocal = async (stepId: string, accommodationId: string, accommodationData: any): Promise<any> => {
  return await database.write(async () => {
    const stepsCollection = database.get<StepModel>('steps');

    try {
      let existingStep: StepModel;

      try {
        existingStep = await stepsCollection.find(stepId);
      } catch (directFindError) {
        console.log('⚠️ useAccommodationUpdate - ID direct non trouvé, recherche par query...');
        const stepsFound = await stepsCollection
          .query(Q.where('id', stepId))
          .fetch();

        if (stepsFound.length === 0) {
          throw new Error(`Step avec ID ${stepId} non trouvé en local`);
        }

        existingStep = stepsFound[0];
      }

      // DEBUG: Examiner le contenu complet du step
      console.log('🔍 useAccommodationUpdate - Contenu complet du step:', {
        stepId: existingStep.id,
        stepName: (existingStep as any).name,
        accommodationsJson: (existingStep as any).accommodationsJson,
        accommodationsJsonType: typeof (existingStep as any).accommodationsJson,
        accommodationsRelation: (existingStep as any).accommodations,
        accommodationsRelationType: typeof (existingStep as any).accommodations,
        allFields: Object.keys(existingStep._raw || {}).filter(key =>
          key.includes('accommodat') || key.includes('activit')
        )
      });      // Récupérer les accommodations actuels
      let accommodations = [];
      try {
        // CORRECTION FINALE: Utiliser accommodationsJson (champ JSON) et non accommodations (relation)
        const accommodationsRaw = (existingStep as any).accommodationsJson;
        console.log('🔍 useAccommodationUpdate - Accommodations brutes:', {
          type: typeof accommodationsRaw,
          isString: typeof accommodationsRaw === 'string',
          isArray: Array.isArray(accommodationsRaw),
          value: accommodationsRaw,
          valueLength: accommodationsRaw?.length,
          valueKeys: typeof accommodationsRaw === 'object' ? Object.keys(accommodationsRaw || {}) : 'N/A'
        });

        if (typeof accommodationsRaw === 'string') {
          accommodations = JSON.parse(accommodationsRaw);
        } else if (Array.isArray(accommodationsRaw)) {
          accommodations = accommodationsRaw;
        } else if (accommodationsRaw && typeof accommodationsRaw === 'object') {
          // Cas où c'est un objet - le convertir en array
          console.log('⚠️ useAccommodationUpdate - Accommodations est un objet, conversion en array');
          accommodations = Object.values(accommodationsRaw);
        } else {
          console.log('⚠️ useAccommodationUpdate - Accommodations null/undefined, initialisation array vide');
          accommodations = [];
        }
      } catch (parseError) {
        console.warn('⚠️ useAccommodationUpdate - Erreur parsing accommodations:', parseError);
        accommodations = [];
      }

      // Trouver et mettre à jour l'accommodation - CONVERSION STRING OBLIGATOIRE
      const accommodationIndex = accommodations.findIndex((acc: any) => {
        const accId = acc._id?.toString() || acc._id;
        return accId === accommodationId;
      });

      console.log('🔍 useAccommodationUpdate - Recherche accommodation:', {
        accommodationId,
        accommodationsCount: accommodations.length,
        foundIndex: accommodationIndex,
        availableIds: accommodations.map((acc: any) => ({
          id: acc._id?.toString() || acc._id,
          name: acc.name
        }))
      });

      if (accommodationIndex === -1) {
        console.warn('⚠️ useAccommodationUpdate - Accommodation non trouvé, tentative de création...');

        // Créer l'accommodation s'il n'existe pas
        const newAccommodation = {
          _id: accommodationId,
          ...accommodationData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        accommodations.push(newAccommodation);

        console.log('✅ useAccommodationUpdate - Accommodation créé:', {
          accommodationId,
          name: accommodationData.name,
          totalAccommodations: accommodations.length
        });

        // L'index est maintenant le dernier élément
        const newAccommodationIndex = accommodations.length - 1;
      } else {
        // Mettre à jour l'accommodation existant
        console.log('🔧 useAccommodationUpdate - Mise à jour accommodation existant:', {
          accommodationIndex,
          originalData: accommodations[accommodationIndex],
          newData: accommodationData
        });

        accommodations[accommodationIndex] = {
          ...accommodations[accommodationIndex],
          ...accommodationData,
          _id: accommodationId, // Préserver l'ID MongoDB
          updatedAt: new Date().toISOString()
        };

        console.log('🔧 useAccommodationUpdate - Accommodation mis à jour:', accommodations[accommodationIndex]);
      }

      const finalAccommodationIndex = accommodationIndex === -1 ? accommodations.length - 1 : accommodationIndex;

      // PATTERN COPILOT: Préparer TOUTES les données AVANT la closure
      const preparedData = {
        accommodationsJsonValue: JSON.stringify(accommodations),
        syncStatusValue: 'pending',
        lastSyncAtValue: Date.now(), // Timestamp number pour WatermelonDB
        updatedAtValue: Date.now(),  // Timestamp number pour WatermelonDB
      };

      console.log('🔧 useAccommodationUpdate - Données préparées avant closure:', preparedData);

      // Mettre à jour le step avec les nouvelles accommodations
      console.log('🔧 useAccommodationUpdate - Début mise à jour step en base');
      await existingStep.update((step: StepModel) => {
        console.log('🔧 useAccommodationUpdate - Dans closure update');

        // PATTERN DEBUG: _setRaw explicite champ par champ pour debugging
        console.log('🔧 useAccommodationUpdate - _setRaw accommodationsJson...');
        step._setRaw('accommodations', preparedData.accommodationsJsonValue);

        console.log('🔧 useAccommodationUpdate - _setRaw sync_status...');
        step._setRaw('sync_status', preparedData.syncStatusValue);

        console.log('🔧 useAccommodationUpdate - _setRaw last_sync_at...');
        step._setRaw('last_sync_at', preparedData.lastSyncAtValue);

        console.log('🔧 useAccommodationUpdate - _setRaw updated_at...');
        step._setRaw('updated_at', preparedData.updatedAtValue);

        console.log('🔧 useAccommodationUpdate - Fin closure update');
      });
      console.log('🔧 useAccommodationUpdate - Fin mise à jour step en base');

      console.log('✅ useAccommodationUpdate - Accommodation mis à jour en local:', accommodationData.name);

      return accommodations[finalAccommodationIndex];

    } catch (error) {
      console.error('❌ useAccommodationUpdate - Échec mise à jour locale:', error);
      throw error;
    }
  });
};

/**
 * Synchronise l'accommodation spécifique avec l'API
 */
const syncAccommodationWithAPI = async (accommodationId: string, accommodationData: any): Promise<void> => {
  try {
    console.log('🔄 useAccommodationUpdate - Début sync API pour accommodation:', accommodationId);

    // Préparer les données pour l'API accommodation
    const updateData = {
      name: accommodationData.name,
      type: accommodationData.type,
      address: accommodationData.address,
      latitude: accommodationData.latitude,
      longitude: accommodationData.longitude,
      arrivalDateTime: accommodationData.arrivalDateTime,
      departureDateTime: accommodationData.departureDateTime,
      phone: accommodationData.phone,
      email: accommodationData.email,
      website: accommodationData.website,
      reservationNumber: accommodationData.reservationNumber,
      price: accommodationData.price,
      pricePerNight: accommodationData.pricePerNight,
      currency: accommodationData.currency,
      nights: accommodationData.nights,
      rating: accommodationData.rating,
      url: accommodationData.url,
      notes: accommodationData.notes,
      thumbnailUri: accommodationData.thumbnail, // Passer l'URI comme thumbnailUri pour l'upload
    };

    console.log('🔄 useAccommodationUpdate - Données à envoyer à l\'API accommodation:', {
      accommodationId,
      updateDataKeys: Object.keys(updateData),
      hasName: !!updateData.name,
      hasCoordinates: !!(updateData.latitude && updateData.longitude)
    });

    // Appel API pour mettre à jour l'accommodation spécifique
    const updatedAccommodation = await updateAccommodation(accommodationId, updateData);

    if (updatedAccommodation) {
      // Mettre à jour le statut de sync en local pour le step
      const stepsCollection = database.get<StepModel>('steps');
      const steps = await stepsCollection.query().fetch();

      // Trouver le step qui contient cet accommodation
      for (const step of steps) {
        const accommodationsRaw = (step as any).accommodationsJson;
        if (accommodationsRaw) {
          try {
            const accommodations = JSON.parse(accommodationsRaw);
            const hasAccommodation = accommodations.some((acc: any) =>
              (acc._id?.toString() || acc._id) === accommodationId
            );

            if (hasAccommodation) {
              await database.write(async () => {
                await step.update((s: StepModel) => {
                  s._setRaw('sync_status', 'synced');
                  s._setRaw('last_sync_at', Date.now());
                });
              });
              break;
            }
          } catch (parseError) {
            console.warn('⚠️ Erreur parsing accommodations pour step:', step.id);
          }
        }
      }

      console.log('✅ useAccommodationUpdate - Sync API réussie pour accommodation:', accommodationId);
    }

  } catch (error) {
    console.error('❌ useAccommodationUpdate - Erreur sync API accommodation:', error);

    // Marquer comme erreur de sync le step qui contient cet accommodation
    const stepsCollection = database.get<StepModel>('steps');
    try {
      const steps = await stepsCollection.query().fetch();

      for (const step of steps) {
        const accommodationsRaw = (step as any).accommodationsJson;
        if (accommodationsRaw) {
          try {
            const accommodations = JSON.parse(accommodationsRaw);
            const hasAccommodation = accommodations.some((acc: any) =>
              (acc._id?.toString() || acc._id) === accommodationId
            );

            if (hasAccommodation) {
              await database.write(async () => {
                await step.update((s: StepModel) => {
                  s._setRaw('sync_status', 'error');
                  s._setRaw('last_sync_at', Date.now());
                });
              });
              break;
            }
          } catch (parseError) {
            console.warn('⚠️ Erreur parsing accommodations pour marquage erreur:', step.id);
          }
        }
      }
    } catch (markError) {
      console.error('❌ useAccommodationUpdate - Erreur marquage sync error:', markError);
    }

    // Ne pas propager l'erreur pour conserver l'expérience offline-first
    console.warn('⚠️ useAccommodationUpdate - Sync API échouée, données locales conservées');
  }
};

/**
 * Hook principal pour la mise à jour d'un accommodation
 */
export const useAccommodationUpdate = (): UseAccommodationUpdateResult => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction principale de mise à jour - OFFLINE-FIRST
   * Stratégie 2-phases: Sauvegarde locale immédiate, puis synchronisation API en arrière-plan
   */
  const updateAccommodationData = useCallback(async (
    stepId: string,
    accommodationId: string,
    data: any
  ): Promise<any | null> => {
    console.log('🏨 useAccommodationUpdate - Début mise à jour:', {
      stepId,
      accommodationId,
      name: data.name
    });

    // Validation des IDs
    if (!isValidObjectId(stepId)) {
      const errorMsg = `ID de step invalide: ${stepId}`;
      console.error('❌ useAccommodationUpdate -', errorMsg);
      setError(errorMsg);
      return null;
    }

    if (!isValidObjectId(accommodationId)) {
      const errorMsg = `ID d'accommodation invalide: ${accommodationId}`;
      console.error('❌ useAccommodationUpdate -', errorMsg);
      setError(errorMsg);
      return null;
    }

    if (updating) {
      console.log('⚠️ useAccommodationUpdate - Mise à jour déjà en cours, ignoré');
      return null;
    }

    setUpdating(true);
    setError(null);

    try {
      // PHASE 1: Sauvegarde locale IMMÉDIATE (bloquante)
      console.log('💾 PHASE 1: Sauvegarde locale immédiate');
      const updatedAccommodation = await updateAccommodationInLocal(stepId, accommodationId, data);

      console.log('✅ PHASE 1 terminée - Accommodation sauvegardé localement');

      // PHASE 2: Synchronisation API en arrière-plan (non-bloquante)
      console.log('🔄 PHASE 2: Sync API en arrière-plan');
      Promise.resolve().then(async () => {
        await syncAccommodationWithAPI(accommodationId, data);
      });

      // Retour immédiat après sauvegarde locale
      console.log('⚡ Retour immédiat après sauvegarde locale');
      return updatedAccommodation;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ useAccommodationUpdate - Erreur:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setUpdating(false);
    }
  }, [updating]);

  return {
    updating,
    error,
    updateAccommodationData,
  };
};
