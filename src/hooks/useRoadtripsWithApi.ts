/**
 * Hook amélioré pour la gestion des roadtrips avec intégration API
 * Architecture offline-first avec synchronisation backend
 */
import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';
import { Roadtrip } from '../services/database/models';
import { roadtripsApiService, ApiRoadtrip, extractThumbnailUrl } from '../services/api/roadtrips';
import { Q } from '@nozbe/watermelondb';

interface RoadtripData {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  startLocation?: string;
  endLocation?: string;
  currency?: string;
  userId: string;
  isPublic: boolean;
  thumbnail?: string;
  totalSteps: number;
  totalDistance?: number;
  estimatedDuration?: number;
  tags: string[];
  photos?: string[];
  documents?: string[];
  syncStatus?: 'pending' | 'synced' | 'error';
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateRoadtripData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  startLocation?: string;
  endLocation?: string;
  currency?: string;
  participants?: number;
}

export const useRoadtripsWithApi = () => {
  const { database, isReady } = useDatabase();
  const { user } = useAuth();
  const { isConnected: isOnline } = useNetworkStatus();
  const [roadtrips, setRoadtrips] = useState<RoadtripData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  /**
   * Convertir un record WatermelonDB en RoadtripData
   */
  const convertRecordToData = (record: Roadtrip): RoadtripData => ({
    id: record.id,
    title: record.title,
    description: record.description,
    startDate: new Date(record.startDate),
    endDate: new Date(record.endDate),
    startLocation: record.startLocation,
    endLocation: record.endLocation,
    currency: record.currency,
    userId: record.userId,
    isPublic: record.isPublic,
    thumbnail: record.thumbnail,
    totalSteps: record.totalSteps,
    totalDistance: record.totalDistance,
    estimatedDuration: record.estimatedDuration,
    tags: record.tags,
    photos: record.photos,
    documents: record.documents,
    syncStatus: record.customSyncStatus as 'pending' | 'synced' | 'error',
    lastSyncAt: record.lastSyncAt ? new Date(record.lastSyncAt) : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });

  /**
   * Charger les roadtrips depuis WatermelonDB (toujours en premier)
   */
  const fetchLocalRoadtrips = useCallback(async () => {
    if (!isReady || !database || !user) return;

    try {
      console.log('📍 Chargement des roadtrips locaux...');

      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      const roadtripRecords = await roadtripsCollection
        .query(Q.where('user_id', user._id))
        .fetch();

      const roadtripsData = roadtripRecords.map(convertRecordToData);
      setRoadtrips(roadtripsData);

      console.log(`✅ ${roadtripsData.length} roadtrips locaux chargés`);
      
      // ✅ DEBUG: Détailler les roadtrips chargés
      console.log('📊 === ROADTRIPS CHARGÉS DEPUIS LE CACHE ===');
      if (roadtripsData.length === 0) {
        console.log('   Aucun roadtrip trouvé dans le cache local');
      } else {
        roadtripsData.forEach((roadtrip, index) => {
          console.log(`   [${index + 1}] ID: "${roadtrip.id}" | Titre: "${roadtrip.title}"`);
          console.log(`        - SyncStatus: ${roadtrip.syncStatus}`);
          console.log(`        - UserId: "${roadtrip.userId}" (longueur: ${roadtrip.userId?.length})`);
          console.log(`        - User actuel: "${user._id}" | Match? ${roadtrip.userId === user._id ? '✅ OUI' : '❌ NON'}`);
          console.log(`        - Dates: ${roadtrip.startDate.toLocaleDateString()} → ${roadtrip.endDate.toLocaleDateString()}`);
        });
      }
      console.log('📊 === FIN ROADTRIPS CHARGÉS ===');
    } catch (err) {
      console.error('❌ Erreur chargement local:', err);
      setError(err instanceof Error ? err.message : 'Erreur chargement local');
    }
  }, [isReady, database, user]);

  // ✅ FONCTION: Résoudre les conflits d'IDs avant sync
  const resolveIdConflicts = useCallback(async () => {
    if (!database || !user) return;

    console.log('🔧 Résolution des conflits d\'IDs...');
    
    try {
      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      
      // ✅ DEBUG CRITIQUE: Vérifier TOUS les roadtrips dans la base (pas seulement user_id)
      console.log('🔍 === VÉRIFICATION COMPLÈTE BASE SQLITE ===');
      const allRoadtripsInDb = await roadtripsCollection.query().fetch();
      console.log(`📊 TOTAL roadtrips dans la base SQLite: ${allRoadtripsInDb.length}`);
      
      allRoadtripsInDb.forEach((roadtrip, index) => {
        console.log(`   [${index + 1}] ID: "${roadtrip.id}" | User: "${roadtrip.userId}" | Nom: "${roadtrip.title}"`);
        console.log(`        - Est notre user? ${roadtrip.userId === user._id ? '✅ OUI' : '❌ NON'}`);
        console.log(`        - UserId longueur: ${roadtrip.userId?.length} | Notre user longueur: ${user._id?.length}`);
      });
      console.log('🔍 === FIN VÉRIFICATION COMPLÈTE ===');

      // Maintenant récupérer seulement ceux de notre user
      const allRoadtrips = await roadtripsCollection
        .query(Q.where('user_id', user._id))
        .fetch();

      // Détecter les roadtrips avec IDs courts (générés par WatermelonDB)
      const conflictedRoadtrips = allRoadtrips.filter(roadtrip => {
        const isShortId = roadtrip.id.length < 20; // IDs WatermelonDB sont courts
        const isNotMongoId = !/^[0-9a-fA-F]{24}$/.test(roadtrip.id);
        return isShortId || isNotMongoId;
      });

      // ✅ DEBUG: Détailler TOUS les roadtrips trouvés avant résolution
      console.log('🔍 === ANALYSE COMPLÈTE DES IDS AVANT RÉSOLUTION ===');
      allRoadtrips.forEach((roadtrip, index) => {
        const isShortId = roadtrip.id.length < 20;
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(roadtrip.id);
        const willBeDeleted = isShortId || !isMongoId;
        console.log(`   [${index + 1}] ID: "${roadtrip.id}" | Nom: "${roadtrip.title}"`);
        console.log(`        - Longueur: ${roadtrip.id.length} chars`);
        console.log(`        - Est MongoDB ObjectId? ${isMongoId}`);
        console.log(`        - Sera supprimé? ${willBeDeleted ? '🗑️ OUI' : '✅ NON'}`);
      });
      console.log('🔍 === FIN ANALYSE IDS ===');

      if (conflictedRoadtrips.length > 0) {
        console.log(`🔧 ${conflictedRoadtrips.length} roadtrips avec IDs non-MongoDB détectés`);
        
        // Supprimer les roadtrips avec IDs incompatibles pour éviter les conflits
        await database.write(async () => {
          for (const roadtrip of conflictedRoadtrips) {
            console.log(`🗑️ Suppression roadtrip avec ID incompatible: ${roadtrip.id} (${roadtrip.title})`);
            await roadtrip.markAsDeleted();
          }
        });
        
        console.log(`✅ ${conflictedRoadtrips.length} roadtrips avec IDs incompatibles supprimés`);
      } else {
        console.log('✅ Tous les IDs sont compatibles MongoDB');
      }
    } catch (err) {
      console.error('❌ Erreur résolution conflits:', err);
    }
  }, [database, user]);

  /**
   * Synchroniser avec l'API (si en ligne)
   */
  const syncWithApi = useCallback(async () => {
    if (!isOnline || !user || syncing || !database) return;

    try {
      setSyncing(true);
      console.log('🔄 Synchronisation avec l\'API...');

      // Résoudre les conflits d'IDs avant de commencer la synchronisation
      await resolveIdConflicts();

      // Récupérer les roadtrips depuis l'API
      const apiResponse = await roadtripsApiService.getRoadtrips(1, 50);
      const apiRoadtrips = apiResponse.roadtrips || [];

      console.log(`📥 ${apiRoadtrips.length} roadtrips reçus de l'API`);

      const roadtripsCollection = database.get<Roadtrip>('roadtrips');

      // Récupérer tous les roadtrips locaux existants d'abord
      const existingLocalRoadtrips = await roadtripsCollection
        .query(Q.where('user_id', user._id))
        .fetch();

      console.log(`📍 ${existingLocalRoadtrips.length} roadtrips déjà en local`);
      
      // ✅ DEBUG: Afficher TOUTES les données en cache
      console.log('📋 === DONNÉES EN CACHE LOCAL ===');
      if (existingLocalRoadtrips.length === 0) {
        console.log('   Aucun roadtrip en cache local');
      } else {
        existingLocalRoadtrips.forEach((roadtrip, index) => {
          console.log(`   [${index + 1}] ID: "${roadtrip.id}" | Nom: "${roadtrip.title}"`);
          console.log(`        - Longueur ID: ${roadtrip.id.length} chars`);
          console.log(`        - Type ID: ${/^[0-9a-fA-F]{24}$/.test(roadtrip.id) ? 'MongoDB ObjectId' : 'ID WatermelonDB'}`);
          console.log(`        - SyncStatus: ${roadtrip.customSyncStatus}`);
          console.log(`        - UserId: ${roadtrip.userId}`);
        });
      }
      console.log('📋 === FIN DONNÉES CACHE ===');

      let hasChanges = false;

      // Pour chaque roadtrip de l'API
      for (const apiRoadtrip of apiRoadtrips) {
        try {
          // ✅ CORRECTION: Convertir ObjectId MongoDB en string
          const mongoIdString = String(apiRoadtrip._id);
          console.log(`🔍 Synchronisation roadtrip: ${apiRoadtrip.name} (ID: ${mongoIdString})`)
            ;
          // Debug: afficher la structure de la thumbnail
          console.log(`🖼️ Thumbnail pour ${apiRoadtrip.name}:`, apiRoadtrip.thumbnail);
          const thumbnailUrl = extractThumbnailUrl(apiRoadtrip.thumbnail);
          console.log(`🖼️ URL extraite:`, thumbnailUrl);
          
          // ✅ DEBUG: Vérifier la structure du userId
          console.log(`👤 UserId API pour ${apiRoadtrip.name}:`, {
            userId: apiRoadtrip.userId,
            type: typeof apiRoadtrip.userId,
            isObject: typeof apiRoadtrip.userId === 'object',
            stringValue: String(apiRoadtrip.userId)
          });

          // ✅ CORRECTION: Vérifier l'existence par ID ET analyser les conflits potentiels
          console.log(`📋 Vérification existence local pour ID: ${mongoIdString}`);
          const existingRecord = existingLocalRoadtrips.find(
            local => local.id === mongoIdString
          );
          
          // Debug : analyser tous les IDs locaux pour détecter les conflits
          console.log('🔍 Analyse des IDs locaux existants:');
          existingLocalRoadtrips.forEach((r, index) => {
            console.log(`  [${index}] ID: "${r.id}" (${r.id.length} chars) | Titre: "${r.title}"`);
            console.log(`       Correspond à mongoId? ${r.id === mongoIdString}`);
          });
          console.log(`🔍 MongoDB ID recherché: "${mongoIdString}" (${mongoIdString.length} chars)`);
          console.log(`🔍 Roadtrip "${apiRoadtrip.name}" existe déjà?`, !!existingRecord);

          if (existingRecord) {
            console.log(`📋 Roadtrip ${apiRoadtrip.name} existe déjà (ID: ${existingRecord.id})`);
            // Pas de mise à jour pour l'instant - éviter les boucles
          } else {
            // ✅ DEBUG CRITIQUE: Vérifier la base juste avant création
            console.log(`🔍 === VÉRIFICATION PRÉ-CRÉATION POUR ${apiRoadtrip.name} ===`);
            const preCreateCheck = await roadtripsCollection.query().fetch();
            const existingWithSameId = preCreateCheck.find(r => r.id === mongoIdString);
            console.log(`🔍 Roadtrips total dans base: ${preCreateCheck.length}`);
            console.log(`🔍 Roadtrip avec même ID déjà présent? ${existingWithSameId ? `OUI (${existingWithSameId.title})` : 'NON'}`);
            if (existingWithSameId) {
              console.log(`🔍 User du roadtrip existant: "${existingWithSameId.userId}" vs notre user: "${user._id}"`);
            }
            console.log(`🔍 === FIN VÉRIFICATION PRÉ-CRÉATION ===`);
            
            // Créer nouveau roadtrip local
            console.log(`➕ Création nouveau roadtrip: ${apiRoadtrip.name}`);
            await database.write(async () => {
              await roadtripsCollection.create(roadtrip => {
                // ✅ CRITIQUE: Utiliser l'ObjectId MongoDB comme ID primaire ET server_id
                roadtrip._raw.id = mongoIdString; // Force l'ID primaire
                roadtrip._setRaw('title', apiRoadtrip.name);
                roadtrip._setRaw('description', apiRoadtrip.notes || '');
                roadtrip._setRaw('start_date', new Date(apiRoadtrip.startDateTime).getTime());
                roadtrip._setRaw('end_date', new Date(apiRoadtrip.endDateTime).getTime());
                roadtrip._setRaw('start_location', apiRoadtrip.startLocation || '');
                roadtrip._setRaw('end_location', apiRoadtrip.endLocation || '');
                roadtrip._setRaw('currency', apiRoadtrip.currency || 'EUR');
                // ✅ CRITIQUE: Convertir userId MongoDB (ObjectId) en string
                const userIdString = apiRoadtrip.userId ? String(apiRoadtrip.userId) : user._id;
                console.log(`👤 DEBUG userId: API="${apiRoadtrip.userId}" → String="${userIdString}" | Notre user="${user._id}"`);
                roadtrip._setRaw('user_id', userIdString);
                roadtrip._setRaw('is_public', false);
                roadtrip._setRaw('thumbnail', thumbnailUrl || '');
                roadtrip._setRaw('photos', JSON.stringify(apiRoadtrip.photos || []));
                roadtrip._setRaw('documents', JSON.stringify(apiRoadtrip.documents || []));
                roadtrip._setRaw('total_steps', apiRoadtrip.steps ? apiRoadtrip.steps.length : 0);
                roadtrip._setRaw('total_distance', 0);
                roadtrip._setRaw('estimated_duration', 0);
                roadtrip._setRaw('tags', JSON.stringify([]));
                roadtrip._setRaw('sync_status', 'synced');
                roadtrip._setRaw('last_sync_at', Date.now());
                roadtrip._setRaw('created_at', Date.now());
                roadtrip._setRaw('updated_at', Date.now());
              });
            });
            hasChanges = true;
            console.log(`✅ Nouveau roadtrip créé: ${apiRoadtrip.name}`);
          }
        } catch (itemError) {
          console.error(`❌ Erreur sync roadtrip ${String(apiRoadtrip._id)}:`, itemError);
          console.error('❌ Données problématiques:', {
            mongoId: String(apiRoadtrip._id),
            apiRoadtrip: {
              name: apiRoadtrip.name,
              startDateTime: apiRoadtrip.startDateTime,
              endDateTime: apiRoadtrip.endDateTime,
              thumbnail: apiRoadtrip.thumbnail
            }
          });
        }
      }

      // Recharger seulement si des changements ont été faits
      if (hasChanges) {
        const roadtripRecords = await roadtripsCollection
          .query(Q.where('user_id', user._id))
          .fetch();

        const roadtripsData = roadtripRecords.map(convertRecordToData);
        setRoadtrips(roadtripsData);
        console.log(`✅ ${roadtripsData.length} roadtrips mis à jour localement`);
      } else {
        console.log('📋 Aucun changement détecté, synchronisation terminée');
      }

      console.log('✅ Synchronisation terminée');
    } catch (err) {
      console.error('❌ Erreur synchronisation API:', err);
      // Ne pas bloquer l'interface pour les erreurs de sync
    } finally {
      setSyncing(false);
    }
  }, [isOnline, user, syncing, database]);

  /**
   * Charger les roadtrips (local + sync si online et first load)
   */
  const fetchRoadtrips = useCallback(async (forceSync: boolean = false) => {
    if (!isReady || !database || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Toujours charger le local en premier (offline-first)
      await fetchLocalRoadtrips();

      // Synchroniser avec l'API seulement si demandé explicitement ou premier chargement
      if (isOnline && !syncing && (forceSync || roadtrips.length === 0)) {
        // ✅ CORRECTION: Récupérer le count actuel depuis la base pour éviter le state lag
        const collection = database.get<Roadtrip>('roadtrips');
        const currentCount = await collection.query(Q.where('user_id', user._id)).fetchCount();

        if (forceSync || currentCount === 0) {
          console.log('🔄 Déclenchement sync API... (count local:', currentCount, ')');
          syncWithApi();
        } else {
          console.log('📱 Données présentes en local, pas de sync automatique');
        }
      }
    } catch (err) {
      console.error('❌ Erreur fetchRoadtrips:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [isReady, database, user, isOnline, fetchLocalRoadtrips, syncing, roadtrips.length]);

  /**
   * Créer un nouveau roadtrip (optimiste)
   */
  const createRoadtrip = useCallback(async (roadtripData: CreateRoadtripData) => {
    if (!isReady || !database || !user) return null;

    try {
      setLoading(true);
      setError(null);

      console.log('📍 Création roadtrip:', roadtripData.title);
      
      // ✅ DEBUG: Vérifier la structure de l'utilisateur local
      console.log(`👤 User local:`, {
        id: user._id,
        type: typeof user._id,
        length: user._id?.length,
        isMongoId: /^[0-9a-fA-F]{24}$/.test(user._id || '')
      });

      const roadtripsCollection = database.get<Roadtrip>('roadtrips');

      // Création optimiste locale
      const newRoadtrip = await database.write(async () => {
        return await roadtripsCollection.create(roadtrip => {
          roadtrip.title = roadtripData.title;
          roadtrip.description = roadtripData.description;
          roadtrip.startDate = roadtripData.startDate.getTime();
          roadtrip.endDate = roadtripData.endDate.getTime();
          roadtrip.startLocation = roadtripData.startLocation;
          roadtrip.endLocation = roadtripData.endLocation;
          roadtrip.currency = roadtripData.currency || 'EUR';
          roadtrip.userId = user._id;
          roadtrip.isPublic = false;
          roadtrip.totalSteps = 0;
          roadtrip.totalDistance = 0;
          roadtrip.estimatedDuration = 0;
          roadtrip.tags = [];
          roadtrip.photos = [];
          roadtrip.documents = [];
          roadtrip.customSyncStatus = isOnline ? 'pending' : 'pending';
        });
      });

      // Mise à jour de l'état local immédiatement
      const newRoadtripData = convertRecordToData(newRoadtrip);
      setRoadtrips(prev => [...prev, newRoadtripData]);

      // Synchronisation avec l'API en arrière-plan si en ligne
      if (isOnline) {
        try {
          const createRequest = {
            name: newRoadtripData.title,
            notes: newRoadtripData.description || '',
            startDateTime: newRoadtripData.startDate.toISOString(),
            endDateTime: newRoadtripData.endDate.toISOString(),
            startLocation: newRoadtripData.startLocation || '',
            endLocation: newRoadtripData.endLocation || '',
            currency: newRoadtripData.currency || 'EUR',
          };
          const apiRoadtrip = await roadtripsApiService.createRoadtrip(createRequest);

          // Mettre à jour avec l'ID serveur
          await database.write(async () => {
            await newRoadtrip.update(roadtrip => {
              roadtrip.customSyncStatus = 'synced';
              roadtrip.lastSyncAt = new Date();
            });
          });

          console.log('✅ Roadtrip synchronisé avec l\'API');
        } catch (syncError) {
          console.warn('⚠️ Erreur sync création (reste en local):', syncError);

          // Marquer comme erreur de sync mais garder en local
          await database.write(async () => {
            await newRoadtrip.update(roadtrip => {
              roadtrip.customSyncStatus = 'error';
            });
          });
        }
      }

      return newRoadtripData;
    } catch (err) {
      console.error('❌ Erreur lors de la création:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isReady, database, user, isOnline]);

  /**
   * Supprimer un roadtrip
   */
  const deleteRoadtrip = useCallback(async (roadtripId: string) => {
    if (!isReady || !database) return false;

    try {
      setLoading(true);
      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      const roadtripRecord = await roadtripsCollection.find(roadtripId);

      // Suppression optimiste locale
      await database.write(async () => {
        await roadtripRecord.markAsDeleted();
      });

      // Mise à jour immédiate de l'état
      setRoadtrips(prev => prev.filter(r => r.id !== roadtripId));

      // ✅ CORRECTION: Utiliser l'ID primaire (qui est maintenant l'ObjectId MongoDB string)
      if (isOnline && roadtripId) {
        try {
          await roadtripsApiService.deleteRoadtrip(roadtripId);
          console.log('✅ Roadtrip supprimé de l\'API avec ID:', roadtripId);
        } catch (syncError) {
          console.warn('⚠️ Erreur suppression API (supprimé localement):', syncError);
        }
      }

      return true;
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      setError(err instanceof Error ? err.message : 'Erreur suppression');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isReady, database, isOnline]);

  // Auto-load au montage seulement
  useEffect(() => {
    if (isReady && database && user && roadtrips.length === 0 && !loading) {
      console.log('🚀 Chargement initial des roadtrips...');
      fetchRoadtrips();
    }
  }, [isReady, database, user]);

  // Désactiver le resync automatique - on sync seulement au pull-to-refresh
  // useEffect(() => {
  //   if (isOnline && roadtrips.length === 0 && !loading && !syncing) {
  //     syncWithApi();
  //   }
  // }, [isOnline]);

  return {
    roadtrips,
    loading,
    error,
    syncing,
    isOnline,

    // Actions
    fetchRoadtrips,
    createRoadtrip,
    deleteRoadtrip,
    syncWithApi,

    // Actions spécifiques
    refreshRoadtrips: () => fetchRoadtrips(true), // Force la synchronisation
    resolveIdConflicts, // ✅ NOUVEAU: Résoudre les conflits d'IDs

    // Stats
    totalRoadtrips: roadtrips.length,
    pendingSyncCount: roadtrips.filter(r => r.syncStatus === 'pending').length,
    errorSyncCount: roadtrips.filter(r => r.syncStatus === 'error').length,
  };
};

export default useRoadtripsWithApi;
