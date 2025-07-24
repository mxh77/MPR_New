/**
 * Hook pour la modification d'une activité avec support offline-first
 * Conforme aux instructions Copilot pour pattern 2-phases
 */
import { useState, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../services/database';
import { updateActivity } from '../services/api/activities';
import { useDataRefresh } from '../contexts';
import StepModel from '../services/database/models/Step';

interface UseActivityUpdateResult {
    updating: boolean;
    error: string | null;
    updateActivityData: (stepId: string, activityId: string, data: any) => Promise<any | null>;
}

/**
 * Validation ObjectId MongoDB
 */
const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Met à jour une activité dans le step local
 */
const updateActivityInLocal = async (stepId: string, activityId: string, activityData: any): Promise<any> => {
    return await database.write(async () => {
        const stepsCollection = database.get<StepModel>('steps');

        try {
            let existingStep: StepModel;

            try {
                existingStep = await stepsCollection.find(stepId);
            } catch (directFindError) {
                console.log('⚠️ useActivityUpdate_new - ID direct non trouvé, recherche par query...');
                const stepsFound = await stepsCollection
                    .query(Q.where('id', stepId))
                    .fetch();

                if (stepsFound.length === 0) {
                    throw new Error(`Step avec ID ${stepId} non trouvé en local`);
                }

                existingStep = stepsFound[0];
            }

            // DEBUG: Examiner le contenu complet du step
            console.log('🔍 useActivityUpdate_new - Contenu complet du step:', {
                stepId: existingStep.id,
                stepName: (existingStep as any).name,
                activitiesJson: (existingStep as any)._raw.activities,
                activitiesJsonType: typeof (existingStep as any)._raw.activities,
                activitiesRelation: (existingStep as any).activities,
                activitiesRelationType: typeof (existingStep as any).activities,
                allFields: Object.keys(existingStep._raw || {}).filter(key =>
                    key.includes('accommodat') || key.includes('activit')
                )
            });      // Récupérer les activités actuelles
            let activities = [];
            try {
                // ✅ CORRECTION: Utiliser la même méthode que useActivityDetail
                const activitiesRaw = (existingStep as any)._raw.activities;
                console.log('🔍 useActivityUpdate_new - Activités brutes:', {
                    type: typeof activitiesRaw,
                    isString: typeof activitiesRaw === 'string',
                    isArray: Array.isArray(activitiesRaw),
                    value: activitiesRaw,
                    valueLength: activitiesRaw?.length,
                    valueKeys: typeof activitiesRaw === 'object' ? Object.keys(activitiesRaw || {}) : 'N/A'
                });

                if (typeof activitiesRaw === 'string') {
                    activities = JSON.parse(activitiesRaw);
                } else if (Array.isArray(activitiesRaw)) {
                    activities = activitiesRaw;
                } else if (activitiesRaw && typeof activitiesRaw === 'object') {
                    // Cas où c'est un objet - le convertir en array
                    console.log('⚠️ useActivityUpdate_new - Activités est un objet, conversion en array');
                    activities = Object.values(activitiesRaw);
                } else {
                    console.log('⚠️ useActivityUpdate_new - Activités null/undefined, initialisation array vide');
                    activities = [];
                }
            } catch (parseError) {
                console.warn('⚠️ useActivityUpdate_new - Erreur parsing activités:', parseError);
                activities = [];
            }

            // Trouver et mettre à jour l'activité - CONVERSION STRING OBLIGATOIRE
            const activityIndex = activities.findIndex((act: any) => {
                const actId = act._id?.toString() || act._id;
                return actId === activityId;
            });

            console.log('🔍 useActivityUpdate_new - Recherche activité:', {
                activityId,
                activitiesCount: activities.length,
                foundIndex: activityIndex,
                availableIds: activities.map((act: any) => ({
                    id: act._id?.toString() || act._id,
                    name: act.name
                }))
            });

            if (activityIndex === -1) {
                console.warn('⚠️ useActivityUpdate_new - Activité non trouvée, tentative de création...');

                // Créer l'activité si elle n'existe pas
                const newActivity = {
                    _id: activityId,
                    ...activityData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                activities.push(newActivity);

                console.log('✅ useActivityUpdate_new - Activité créée:', {
                    activityId,
                    name: activityData.name,
                    totalActivities: activities.length
                });

                // L'index est maintenant le dernier élément
                const newActivityIndex = activities.length - 1;
            } else {
                // Mettre à jour l'activité existante
                console.log('🔧 useActivityUpdate_new - Mise à jour activité existante:', {
                    activityIndex,
                    originalData: activities[activityIndex],
                    newData: activityData
                });

                activities[activityIndex] = {
                    ...activities[activityIndex],
                    ...activityData,
                    _id: activityId, // Préserver l'ID MongoDB
                    updatedAt: new Date().toISOString()
                };

                console.log('🔧 useActivityUpdate_new - Activité mise à jour:', activities[activityIndex]);
            }

            const finalActivityIndex = activityIndex === -1 ? activities.length - 1 : activityIndex;

            // PATTERN COPILOT: Préparer TOUTES les données AVANT la closure
            const preparedData = {
                activitiesJsonValue: JSON.stringify(activities),
                syncStatusValue: 'pending',
                lastSyncAtValue: Date.now(), // Timestamp number pour WatermelonDB
                updatedAtValue: Date.now(),  // Timestamp number pour WatermelonDB
            };

            console.log('🔧 useActivityUpdate_new - Données préparées avant closure:', preparedData);

            // Mettre à jour le step avec les nouvelles activités
            console.log('🔧 useActivityUpdate_new - Début mise à jour step en base');
            await existingStep.update((step: StepModel) => {
                console.log('🔧 useActivityUpdate_new - Dans closure update');

                // PATTERN DEBUG: _setRaw explicite champ par champ pour debugging
                console.log('🔧 useActivityUpdate_new - _setRaw activitiesJson...');
                step._setRaw('activities', preparedData.activitiesJsonValue);

                console.log('🔧 useActivityUpdate_new - _setRaw sync_status...');
                step._setRaw('sync_status', preparedData.syncStatusValue);

                console.log('🔧 useActivityUpdate_new - _setRaw last_sync_at...');
                step._setRaw('last_sync_at', preparedData.lastSyncAtValue);

                console.log('🔧 useActivityUpdate_new - _setRaw updated_at...');
                step._setRaw('updated_at', preparedData.updatedAtValue);

                console.log('🔧 useActivityUpdate_new - Fin closure update');
            });
            console.log('🔧 useActivityUpdate_new - Fin mise à jour step en base');

            console.log('✅ useActivityUpdate_new - Activité mise à jour en local:', activityData.name);

            return activities[finalActivityIndex];

        } catch (error) {
            console.error('❌ useActivityUpdate_new - Échec mise à jour locale:', error);
            throw error;
        }
    });
};

/**
 * Synchronise l'activité spécifique avec l'API
 */
const syncActivityWithAPI = async (activityId: string, activityData: any, stepId: string): Promise<void> => {
    try {
        console.log('🔄 useActivityUpdate_new - Début sync API pour activité:', activityId);

        // Préparer les données pour l'API activité
        const updateData = {
            name: activityData.name,
            type: activityData.type,
            address: activityData.address,
            latitude: activityData.latitude,
            longitude: activityData.longitude,
            startDateTime: activityData.startDateTime,
            endDateTime: activityData.endDateTime,
            duration: activityData.duration,
            typeDuration: activityData.typeDuration,
            phone: activityData.phone,
            email: activityData.email,
            website: activityData.website,
            reservationNumber: activityData.reservationNumber,
            price: activityData.price,
            currency: activityData.currency,
            trailDistance: activityData.trailDistance,
            trailElevation: activityData.trailElevation,
            trailType: activityData.trailType,
            notes: activityData.notes,
            thumbnailUri: activityData.thumbnail, // Passer l'URI comme thumbnailUri pour l'upload
            removeThumbnail: activityData.removeThumbnail, // Flag pour suppression thumbnail
        };

        console.log('🔄 useActivityUpdate_new - Données à envoyer à l\'API activité:', {
            activityId,
            updateDataKeys: Object.keys(updateData),
            hasName: !!updateData.name,
            hasCoordinates: !!(updateData.latitude && updateData.longitude)
        });

        // Appel API pour mettre à jour l'activité spécifique
        const updatedActivity = await updateActivity(activityId, updateData);

        if (updatedActivity) {
            console.log('✅ useActivityUpdate_new - Réponse API activité reçue:', {
                activityId: updatedActivity._id,
                name: updatedActivity.name,
                hasThumbnail: !!updatedActivity.thumbnail,
                thumbnailUrl: updatedActivity.thumbnail?.url
            });

            // ✅ IMPORTANT: Mettre à jour les données locales avec la réponse API
            const stepsCollection = database.get<StepModel>('steps');
            
            // ✅ CORRECTION: Utiliser le stepId fourni pour cibler directement le step
            const step = await stepsCollection.find(stepId);
            const activitiesRaw = (step as any)._raw.activities;
            
            if (activitiesRaw) {
                try {
                    const activities = JSON.parse(activitiesRaw);
                    const activityIndex = activities.findIndex((act: any) =>
                        (act._id?.toString() || act._id) === activityId
                    );

                    if (activityIndex !== -1) {
                        // ✅ LOGIC INTELLIGENTE: Préserver les données locales récentes
                        const localActivity = activities[activityIndex];
                        
                        console.log('🔄 useActivityUpdate_new - DEBUG données avant merge:', {
                            activityId,
                            localActivity: {
                                thumbnail: localActivity.thumbnail,
                                updatedAt: localActivity.updatedAt,
                                name: localActivity.name
                            },
                            apiActivity: {
                                thumbnail: updatedActivity.thumbnail,
                                updatedAt: updatedActivity.updatedAt,
                                name: updatedActivity.name
                            }
                        });
                        
                        const localUpdatedAt = new Date(localActivity.updatedAt || 0);
                        const apiUpdatedAt = new Date(updatedActivity.updatedAt || 0);
                        
                        console.log('🔄 useActivityUpdate_new - Comparaison timestamps:', {
                            activityId,
                            localTimestamp: localUpdatedAt.toISOString(),
                            apiTimestamp: apiUpdatedAt.toISOString(),
                            localIsNewer: localUpdatedAt > apiUpdatedAt,
                            localThumbnail: localActivity.thumbnail,
                            apiThumbnail: updatedActivity.thumbnail
                        });

                        // ✅ NOUVELLE LOGIQUE: Si thumbnail local existe et est récent, le préserver
                        let finalThumbnail = null;
                        let shouldUpdate = false;
                        
                        // Vérifier si thumbnail local est un fichier (commence par "file://")
                        const hasLocalFileThumbnail = localActivity.thumbnail && 
                            typeof localActivity.thumbnail === 'string' && 
                            localActivity.thumbnail.startsWith('file://');
                            
                        // Vérifier si thumbnail API est un ID MongoDB ou objet
                        const hasApiThumbnail = updatedActivity.thumbnail && (
                            typeof updatedActivity.thumbnail === 'string' || 
                            typeof updatedActivity.thumbnail === 'object'
                        );

                        if (hasLocalFileThumbnail) {
                            console.log('🔄 useActivityUpdate_new - Thumbnail local fichier détecté, UTILISER LE THUMBNAIL API');
                            // Si local a un fichier, l'API a traité l'upload → utiliser le résultat API
                            finalThumbnail = updatedActivity.thumbnail;
                            shouldUpdate = true;
                        } else if (hasApiThumbnail) {
                            console.log('🔄 useActivityUpdate_new - Utilisation thumbnail API uniquement');
                            finalThumbnail = updatedActivity.thumbnail;
                            shouldUpdate = true;
                        } else {
                            console.log('🔄 useActivityUpdate_new - Préservation thumbnail local');
                            finalThumbnail = localActivity.thumbnail;
                            shouldUpdate = true;
                        }

                        if (shouldUpdate) {
                            // Merger intelligemment les données
                            const mergedActivity = {
                                ...localActivity, // Base locale
                                ...updatedActivity, // Données API
                                _id: activityId, // Préserver l'ID MongoDB
                                thumbnail: finalThumbnail, // Thumbnail calculé intelligemment
                                updatedAt: new Date().toISOString() // Nouveau timestamp
                            };
                            
                            activities[activityIndex] = mergedActivity;

                            console.log('🔄 useActivityUpdate_new - Activité mergée intelligemment:', {
                                activityId,
                                finalThumbnail: mergedActivity.thumbnail,
                                finalTimestamp: mergedActivity.updatedAt
                            });

                            await database.write(async () => {
                                await step.update((s: StepModel) => {
                                    s._setRaw('activities', JSON.stringify(activities));
                                    s._setRaw('sync_status', 'synced');
                                    s._setRaw('last_sync_at', Date.now());
                                });
                            });
                        } else {
                            console.log('🔄 useActivityUpdate_new - Pas de mise à jour nécessaire');
                        }
                    }
                } catch (parseError) {
                    console.warn('⚠️ Erreur parsing activités pour merge API:', parseError);
                }
            }

            console.log('✅ useActivityUpdate_new - Sync API réussie pour activité:', activityId);
        }

    } catch (error) {
        console.error('❌ useActivityUpdate_new - Erreur sync API activité:', error);

        // Marquer comme erreur de sync le step qui contient cette activité
        const stepsCollection = database.get<StepModel>('steps');
        try {
            const steps = await stepsCollection.query().fetch();

            for (const step of steps) {
                // ✅ CORRECTION: Utiliser _raw.activities comme partout ailleurs
                const activitiesRaw = (step as any)._raw.activities;
                if (activitiesRaw) {
                    try {
                        const activities = JSON.parse(activitiesRaw);
                        const hasActivity = activities.some((act: any) =>
                            (act._id?.toString() || act._id) === activityId
                        );

                        if (hasActivity) {
                            await database.write(async () => {
                                await step.update((s: StepModel) => {
                                    s._setRaw('sync_status', 'error');
                                    s._setRaw('last_sync_at', Date.now());
                                });
                            });
                            break;
                        }
                    } catch (parseError) {
                        console.warn('⚠️ Erreur parsing activités pour marquage erreur:', step.id);
                    }
                }
            }
        } catch (markError) {
            console.error('❌ useActivityUpdate_new - Erreur marquage sync error:', markError);
        }

        // Ne pas propager l'erreur pour conserver l'expérience offline-first
        console.warn('⚠️ useActivityUpdate_new - Sync API échouée, données locales conservées');
    }
};

/**
 * Hook principal pour la mise à jour d'une activité
 */
export const useActivityUpdate_new = (): UseActivityUpdateResult => {
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { notifyStepUpdate } = useDataRefresh();

    /**
     * Fonction principale de mise à jour - OFFLINE-FIRST
     * Stratégie 2-phases: Sauvegarde locale immédiate, puis synchronisation API en arrière-plan
     */
    const updateActivityData = useCallback(async (
        stepId: string,
        activityId: string,
        data: any
    ): Promise<any | null> => {
        console.log('🚶 useActivityUpdate_new - Début mise à jour:', {
            stepId,
            activityId,
            name: data.name
        });

        // Validation des IDs
        if (!isValidObjectId(stepId)) {
            const errorMsg = `ID de step invalide: ${stepId}`;
            console.error('❌ useActivityUpdate_new -', errorMsg);
            setError(errorMsg);
            return null;
        }

        if (!isValidObjectId(activityId)) {
            const errorMsg = `ID d'activité invalide: ${activityId}`;
            console.error('❌ useActivityUpdate_new -', errorMsg);
            setError(errorMsg);
            return null;
        }

        if (updating) {
            console.log('⚠️ useActivityUpdate_new - Mise à jour déjà en cours, ignoré');
            return null;
        }

        setUpdating(true);
        setError(null);

        try {
            // PHASE 1: Sauvegarde locale IMMÉDIATE (bloquante)
            console.log('💾 PHASE 1: Sauvegarde locale immédiate');
            const updatedActivity = await updateActivityInLocal(stepId, activityId, data);

            console.log('✅ PHASE 1 terminée - Activité sauvegardée localement');

            // ✅ NOTIFICATION: Informer le système qu'un step a été mis à jour
            console.log('🔔 useActivityUpdate_new - Notification de mise à jour step:', stepId);
            notifyStepUpdate(stepId);

            // PHASE 2: Synchronisation API en arrière-plan (non-bloquante)
            console.log('🔄 PHASE 2: Sync API en arrière-plan');
            Promise.resolve().then(async () => {
                await syncActivityWithAPI(activityId, data, stepId);
            });

            // Retour immédiat après sauvegarde locale
            console.log('⚡ Retour immédiat après sauvegarde locale');
            return updatedActivity;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            console.error('❌ useActivityUpdate_new - Erreur:', errorMessage);
            setError(errorMessage);
            return null;
        } finally {
            setUpdating(false);
        }
    }, [updating, notifyStepUpdate]);

    return {
        updating,
        error,
        updateActivityData,
    };
};

// Export principal pour cohérence avec useAccommodationUpdate
export const useActivityUpdate = useActivityUpdate_new;
