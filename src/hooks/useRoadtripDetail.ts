/**
 * Hook pour charger les détails d'un roadtrip spécifique
 */
import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { Roadtrip } from '../services/database/models';
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

export const useRoadtripDetail = (roadtripId: string) => {
  const { database, isReady } = useDatabase();
  const [roadtrip, setRoadtrip] = useState<RoadtripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
   * Charger les détails du roadtrip
   */
  const loadRoadtrip = useCallback(async () => {
    if (!isReady || !database || !roadtripId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('📍 Chargement roadtrip:', roadtripId);

      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      const roadtripRecord = await roadtripsCollection.find(roadtripId);

      if (roadtripRecord) {
        const roadtripData = convertRecordToData(roadtripRecord);
        setRoadtrip(roadtripData);
        console.log('✅ Roadtrip chargé:', roadtripData.title);
      } else {
        setError('Roadtrip introuvable');
        console.log('❌ Roadtrip non trouvé:', roadtripId);
      }
    } catch (err) {
      console.error('❌ Erreur chargement roadtrip:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [isReady, database, roadtripId]);

  /**
   * Recharger le roadtrip
   */
  const reloadRoadtrip = useCallback(() => {
    loadRoadtrip();
  }, [loadRoadtrip]);

  // Charger au montage et quand les dépendances changent
  useEffect(() => {
    loadRoadtrip();
  }, [loadRoadtrip]);

  return {
    roadtrip,
    loading,
    error,
    reloadRoadtrip,
  };
};

export default useRoadtripDetail;
