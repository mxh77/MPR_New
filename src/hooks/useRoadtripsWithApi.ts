/**
 * Hook amélioré pour la gestion des roadtrips avec intégration API
 * Architecture offline-first avec synchronisation backend
 */
import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';
import { Roadtrip } from '../services/database/models';
import { roadtripsApiService, ApiRoadtrip } from '../services/api/roadtrips';
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
  serverId?: string;
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
    serverId: record.serverId,
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
   * Synchroniser avec l'API (si en ligne)
   */
  const syncWithApi = useCallback(async () => {
    if (!isOnline || !user || syncing) return;
    
    try {
      setSyncing(true);
      console.log('🔄 Synchronisation avec l\'API...');
      
      // Récupérer les roadtrips depuis l'API
      const apiResponse = await roadtripsApiService.getRoadtrips(1, 50);
      const apiRoadtrips = apiResponse.roadtrips || [];
      
      console.log(`📥 ${apiRoadtrips.length} roadtrips reçus de l'API`);
      
      if (!database) return;
      
      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      
      // Pour chaque roadtrip de l'API
      for (const apiRoadtrip of apiRoadtrips) {
        try {
          // Vérifier s'il existe déjà localement
          const existingRecords = await roadtripsCollection
            .query(Q.where('server_id', apiRoadtrip._id))
            .fetch();
          
          if (existingRecords.length > 0) {
            // Mettre à jour si nécessaire
            const existingRecord = existingRecords[0];
            const apiUpdatedAt = new Date(apiRoadtrip.updatedAt);
            
            if (apiUpdatedAt > existingRecord.updatedAt) {
              await database.write(async () => {
                await existingRecord.update(roadtrip => {
                  roadtrip.title = apiRoadtrip.name;
                  roadtrip.description = apiRoadtrip.notes;
                  roadtrip.startDate = new Date(apiRoadtrip.startDateTime).getTime();
                  roadtrip.endDate = new Date(apiRoadtrip.endDateTime).getTime();
                  roadtrip.startLocation = apiRoadtrip.startLocation;
                  roadtrip.endLocation = apiRoadtrip.endLocation;
                  roadtrip.currency = apiRoadtrip.currency;
                  roadtrip.thumbnail = apiRoadtrip.thumbnail;
                  roadtrip.photos = apiRoadtrip.photos;
                  roadtrip.documents = apiRoadtrip.documents;
                  roadtrip.totalSteps = apiRoadtrip.steps.length;
                  roadtrip.lastSyncAt = new Date();
                  roadtrip.customSyncStatus = 'synced';
                });
              });
              console.log(`🔄 Roadtrip mis à jour: ${apiRoadtrip.name}`);
            }
          } else {
            // Créer nouveau roadtrip local
            await database.write(async () => {
              await roadtripsCollection.create(roadtrip => {
                roadtrip.serverId = apiRoadtrip._id;
                roadtrip.title = apiRoadtrip.name;
                roadtrip.description = apiRoadtrip.notes;
                roadtrip.startDate = new Date(apiRoadtrip.startDateTime).getTime();
                roadtrip.endDate = new Date(apiRoadtrip.endDateTime).getTime();
                roadtrip.startLocation = apiRoadtrip.startLocation;
                roadtrip.endLocation = apiRoadtrip.endLocation;
                roadtrip.currency = apiRoadtrip.currency;
                roadtrip.userId = user._id;
                roadtrip.isPublic = false;
                roadtrip.thumbnail = apiRoadtrip.thumbnail;
                roadtrip.photos = apiRoadtrip.photos || [];
                roadtrip.documents = apiRoadtrip.documents || [];
                roadtrip.totalSteps = apiRoadtrip.steps.length;
                roadtrip.totalDistance = 0;
                roadtrip.estimatedDuration = 0;
                roadtrip.tags = [];
                roadtrip.customSyncStatus = 'synced';
                roadtrip.lastSyncAt = new Date();
              });
            });
            console.log(`➕ Nouveau roadtrip créé: ${apiRoadtrip.name}`);
          }
        } catch (itemError) {
          console.error(`❌ Erreur sync roadtrip ${apiRoadtrip._id}:`, itemError);
        }
      }
      
      // Recharger les données locales
      await fetchLocalRoadtrips();
      
      console.log('✅ Synchronisation terminée');
    } catch (err) {
      console.error('❌ Erreur synchronisation API:', err);
      // Ne pas bloquer l'interface pour les erreurs de sync
    } finally {
      setSyncing(false);
    }
  }, [isOnline, user, syncing, database, fetchLocalRoadtrips]);

  /**
   * Charger les roadtrips (local + sync si online)
   */
  const fetchRoadtrips = useCallback(async () => {
    if (!isReady || !database || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Toujours charger le local en premier (offline-first)
      await fetchLocalRoadtrips();
      
      // Synchroniser avec l'API si en ligne
      if (isOnline) {
        await syncWithApi();
      }
    } catch (err) {
      console.error('❌ Erreur fetchRoadtrips:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [isReady, database, user, isOnline, fetchLocalRoadtrips, syncWithApi]);

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
          const createRequest = roadtripsApiService.convertLocalRoadtripToApi(newRoadtripData);
          const apiRoadtrip = await roadtripsApiService.createRoadtrip(createRequest);
          
          // Mettre à jour avec l'ID serveur
          await database.write(async () => {
            await newRoadtrip.update(roadtrip => {
              roadtrip.serverId = apiRoadtrip._id;
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
      
      // Synchronisation avec l'API si en ligne et si le roadtrip a un serverId
      if (isOnline && roadtripRecord.serverId) {
        try {
          await roadtripsApiService.deleteRoadtrip(roadtripRecord.serverId);
          console.log('✅ Roadtrip supprimé de l\'API');
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

  // Auto-load au montage
  useEffect(() => {
    fetchRoadtrips();
  }, [fetchRoadtrips]);

  // Resync quand on repasse en ligne
  useEffect(() => {
    if (isOnline && roadtrips.length > 0) {
      syncWithApi();
    }
  }, [isOnline, syncWithApi]);

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
    
    // Stats
    totalRoadtrips: roadtrips.length,
    pendingSyncCount: roadtrips.filter(r => r.syncStatus === 'pending').length,
    errorSyncCount: roadtrips.filter(r => r.syncStatus === 'error').length,
  };
};

export default useRoadtripsWithApi;
