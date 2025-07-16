/**
 * Hook amélioré pour la gestion des roadtrips avec intégration API
 * Architecture offline-first avec synchronisation backend
 * 
 * ✅ CORRECTIONS APPLIQUÉES:
 * - Suppression des exécutions en double de fetchLocalRoadtrips
 * - Optimisation de la logique de synchronisation 
 * - Réduction des logs de debug excessifs
 * - Évitement des synchronisations inutiles
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
    } catch (err) {
      console.error('❌ Erreur chargement local:', err);
      setError(err instanceof Error ? err.message : 'Erreur chargement local');
    }
  }, [isReady, database, user]);

  /**
   * Résoudre les conflits d'IDs avant sync (version optimisée)
   */
  const resolveIdConflicts = useCallback(async () => {
    if (!database || !user) return false;

    console.log('🔧 Résolution des conflits d\'IDs...');
    
    try {
      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      
      // Récupérer seulement les roadtrips de notre user
      const userRoadtrips = await roadtripsCollection
        .query(Q.where('user_id', user._id))
        .fetch();

      // Détecter les roadtrips avec IDs courts (générés par WatermelonDB)
      const conflictedRoadtrips = userRoadtrips.filter(roadtrip => {
        const isShortId = roadtrip.id.length < 20;
        const isNotMongoId = !/^[0-9a-fA-F]{24}$/.test(roadtrip.id);
        return isShortId || isNotMongoId;
      });

      if (conflictedRoadtrips.length > 0) {
        console.log(`🔧 ${conflictedRoadtrips.length} roadtrips avec IDs non-MongoDB détectés`);
        
        // Supprimer les roadtrips avec IDs incompatibles
        await database.write(async () => {
          for (const roadtrip of conflictedRoadtrips) {
            console.log(`🗑️ Suppression roadtrip avec ID incompatible: ${roadtrip.id} (${roadtrip.title})`);
            await roadtrip.markAsDeleted();
          }
        });
        
        console.log(`✅ ${conflictedRoadtrips.length} roadtrips avec IDs incompatibles supprimés`);
        return true; // Indique qu'il y a eu des changements
      } else {
        console.log('✅ Tous les IDs sont compatibles MongoDB');
        return false; // Aucun changement
      }
    } catch (err) {
      console.error('❌ Erreur résolution conflits:', err);
      return false;
    }
  }, [database, user]);

  /**
   * Synchroniser avec l'API (version optimisée sans logs excessifs)
   */
  const syncWithApi = useCallback(async () => {
    if (!isOnline || !user || syncing || !database) return;

    try {
      setSyncing(true);
      console.log('🔄 Synchronisation avec l\'API...');

      // Résoudre les conflits d'IDs avant synchronisation
      const hasConflicts = await resolveIdConflicts();
      
      // Si des conflits ont été résolus, recharger les données locales
      if (hasConflicts) {
        await fetchLocalRoadtrips();
      }

      // Récupérer les roadtrips depuis l'API
      const apiResponse = await roadtripsApiService.getRoadtrips(1, 50);
      const apiRoadtrips = apiResponse.roadtrips || [];

      console.log(`📥 ${apiRoadtrips.length} roadtrips reçus de l'API`);

      const roadtripsCollection = database.get<Roadtrip>('roadtrips');

      // Récupérer roadtrips locaux existants
      const existingLocalRoadtrips = await roadtripsCollection
        .query(Q.where('user_id', user._id))
        .fetch();

      console.log(`📍 ${existingLocalRoadtrips.length} roadtrips déjà en local`);

      let hasChanges = false;

      // Pour chaque roadtrip de l'API
      for (const apiRoadtrip of apiRoadtrips) {
        try {
          const mongoIdString = String(apiRoadtrip._id);
          const thumbnailUrl = extractThumbnailUrl(apiRoadtrip.thumbnail);
          
          // Vérifier l'existence par ID
          const existingRecord = existingLocalRoadtrips.find(
            local => local.id === mongoIdString
          );

          if (existingRecord) {
            console.log(`📋 Roadtrip ${apiRoadtrip.name} existe déjà`);
            // Pas de mise à jour pour éviter les boucles
          } else {
            // Créer nouveau roadtrip local
            console.log(`➕ Création nouveau roadtrip: ${apiRoadtrip.name}`);
            await database.write(async () => {
              await roadtripsCollection.create(roadtrip => {
                // ✅ CRITIQUE: Utiliser l'ObjectId MongoDB comme ID primaire
                roadtrip._raw.id = mongoIdString;
                roadtrip._setRaw('title', apiRoadtrip.name);
                roadtrip._setRaw('description', apiRoadtrip.notes || '');
                roadtrip._setRaw('start_date', new Date(apiRoadtrip.startDateTime).getTime());
                roadtrip._setRaw('end_date', new Date(apiRoadtrip.endDateTime).getTime());
                roadtrip._setRaw('start_location', apiRoadtrip.startLocation || '');
                roadtrip._setRaw('end_location', apiRoadtrip.endLocation || '');
                roadtrip._setRaw('currency', apiRoadtrip.currency || 'EUR');
                const userIdString = apiRoadtrip.userId ? String(apiRoadtrip.userId) : user._id;
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
        }
      }

      // Recharger seulement si des changements ont été faits
      if (hasChanges) {
        await fetchLocalRoadtrips();
        console.log(`✅ Données locales mises à jour après synchronisation`);
      } else {
        console.log('📋 Aucun changement détecté, synchronisation terminée');
      }

      console.log('✅ Synchronisation terminée');
    } catch (err) {
      console.error('❌ Erreur synchronisation API:', err);
    } finally {
      setSyncing(false);
    }
  }, [isOnline, user, syncing, database, resolveIdConflicts, fetchLocalRoadtrips]);

  /**
   * Charger les roadtrips (local + sync si nécessaire)
   */
  const fetchRoadtrips = useCallback(async (forceSync: boolean = false) => {
    if (!isReady || !database || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Toujours charger le local en premier (offline-first)
      await fetchLocalRoadtrips();

      // Vérifier si une synchronisation est nécessaire
      const collection = database.get<Roadtrip>('roadtrips');
      const currentCount = await collection.query(Q.where('user_id', user._id)).fetchCount();

      // Synchroniser avec l'API seulement si :
      // 1. Demandé explicitement (forceSync)
      // 2. Aucune donnée locale ET en ligne
      // 3. Pas déjà en cours de synchronisation
      const shouldSync = isOnline && !syncing && (forceSync || currentCount === 0);

      if (shouldSync) {
        console.log('🔄 Déclenchement sync API... (count local:', currentCount, ', forceSync:', forceSync, ')');
        // Ne pas attendre la synchronisation pour éviter de bloquer l'UI
        syncWithApi();
      } else {
        console.log('📱 Synchronisation ignorée:', {
          isOnline,
          syncing,
          forceSync,
          currentCount,
          reason: !isOnline ? 'hors ligne' : syncing ? 'déjà en cours' : !forceSync && currentCount > 0 ? 'données présentes' : 'inconnue'
        });
      }
    } catch (err) {
      console.error('❌ Erreur fetchRoadtrips:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [isReady, database, user, isOnline, fetchLocalRoadtrips, syncing, syncWithApi]);

  /**
   * Créer un nouveau roadtrip (optimiste)
   */
  const createRoadtrip = useCallback(async (roadtripData: CreateRoadtripData) => {
    if (!isReady || !database || !user) return null;

    try {
      setLoading(true);
      setError(null);

      console.log('📍 Création roadtrip:', roadtripData.title);
      
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

      // Synchronisation avec l'API
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

  // Auto-load au montage seulement (version optimisée)
  useEffect(() => {
    if (isReady && database && user && roadtrips.length === 0 && !loading && !syncing) {
      console.log('🚀 Chargement initial des roadtrips...');
      fetchRoadtrips();
    }
  }, [isReady, database, user]);

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
    resolveIdConflicts, // Résoudre les conflits d'IDs

    // Stats
    totalRoadtrips: roadtrips.length,
    pendingSyncCount: roadtrips.filter(r => r.syncStatus === 'pending').length,
    errorSyncCount: roadtrips.filter(r => r.syncStatus === 'error').length,
  };
};

export default useRoadtripsWithApi;
