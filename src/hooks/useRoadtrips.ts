/**
 * Hook pour la gestion des roadtrips avec WatermelonDB
 */
import { useState, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { Roadtrip } from '../services/database/models';
import { Q } from '@nozbe/watermelondb';

interface RoadtripData {
  id: string;
  title: string;
  description?: string;
  startDate: number;
  endDate: number;
  userId: string;
  isPublic: boolean;
  thumbnail?: string;
  totalSteps: number;
  totalDistance?: number;
  estimatedDuration?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const useRoadtrips = () => {
  const { database, isReady } = useDatabase();
  const [roadtrips, setRoadtrips] = useState<RoadtripData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadtrips = useCallback(async () => {
    if (!isReady || !database) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📍 Chargement des roadtrips depuis WatermelonDB...');
      
      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      const roadtripRecords = await roadtripsCollection.query().fetch();
      
      const roadtripsData: RoadtripData[] = roadtripRecords.map(record => ({
        id: record.id,
        title: record.title,
        description: record.description,
        startDate: record.startDate,
        endDate: record.endDate,
        userId: record.userId,
        isPublic: record.isPublic,
        thumbnail: record.thumbnail,
        totalSteps: record.totalSteps,
        totalDistance: record.totalDistance,
        estimatedDuration: record.estimatedDuration,
        tags: record.tags,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      }));
      
      setRoadtrips(roadtripsData);
      console.log(`✅ ${roadtripsData.length} roadtrips chargés`);
    } catch (err) {
      console.error('❌ Erreur lors du chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [isReady, database]);

  const createRoadtrip = useCallback(async (roadtripData: Omit<RoadtripData, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isReady || !database) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📍 Création roadtrip:', roadtripData.title);
      
      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      const newRoadtrip = await database.write(async () => {
        return await roadtripsCollection.create(roadtrip => {
          roadtrip.title = roadtripData.title;
          roadtrip.description = roadtripData.description;
          roadtrip.startDate = roadtripData.startDate;
          roadtrip.endDate = roadtripData.endDate;
          roadtrip.userId = roadtripData.userId;
          roadtrip.isPublic = roadtripData.isPublic;
          roadtrip.thumbnail = roadtripData.thumbnail;
          roadtrip.totalSteps = roadtripData.totalSteps;
          roadtrip.totalDistance = roadtripData.totalDistance;
          roadtrip.estimatedDuration = roadtripData.estimatedDuration;
          roadtrip.tags = roadtripData.tags;
        });
      });
      
      const newRoadtripData: RoadtripData = {
        id: newRoadtrip.id,
        title: newRoadtrip.title,
        description: newRoadtrip.description,
        startDate: newRoadtrip.startDate,
        endDate: newRoadtrip.endDate,
        userId: newRoadtrip.userId,
        isPublic: newRoadtrip.isPublic,
        thumbnail: newRoadtrip.thumbnail,
        totalSteps: newRoadtrip.totalSteps,
        totalDistance: newRoadtrip.totalDistance,
        estimatedDuration: newRoadtrip.estimatedDuration,
        tags: newRoadtrip.tags,
        createdAt: newRoadtrip.createdAt.toISOString(),
        updatedAt: newRoadtrip.updatedAt.toISOString(),
      };
      
      setRoadtrips(prev => [...prev, newRoadtripData]);
      console.log('✅ Roadtrip créé:', newRoadtripData.id);
      return newRoadtripData;
    } catch (err) {
      console.error('❌ Erreur lors de la création:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isReady, database]);

  const updateRoadtrip = useCallback(async (roadtripId: string, updates: Partial<RoadtripData>) => {
    if (!isReady || !database) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📍 Mise à jour roadtrip:', roadtripId);
      
      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      const roadtripRecord = await roadtripsCollection.find(roadtripId);
      
      const updatedRoadtrip = await database.write(async () => {
        return await roadtripRecord.update(roadtrip => {
          if (updates.title !== undefined) roadtrip.title = updates.title;
          if (updates.description !== undefined) roadtrip.description = updates.description;
          if (updates.startDate !== undefined) roadtrip.startDate = updates.startDate;
          if (updates.endDate !== undefined) roadtrip.endDate = updates.endDate;
          if (updates.userId !== undefined) roadtrip.userId = updates.userId;
          if (updates.isPublic !== undefined) roadtrip.isPublic = updates.isPublic;
          if (updates.thumbnail !== undefined) roadtrip.thumbnail = updates.thumbnail;
          if (updates.totalSteps !== undefined) roadtrip.totalSteps = updates.totalSteps;
          if (updates.totalDistance !== undefined) roadtrip.totalDistance = updates.totalDistance;
          if (updates.estimatedDuration !== undefined) roadtrip.estimatedDuration = updates.estimatedDuration;
          if (updates.tags !== undefined) roadtrip.tags = updates.tags;
        });
      });
      
      const updatedData: RoadtripData = {
        id: updatedRoadtrip.id,
        title: updatedRoadtrip.title,
        description: updatedRoadtrip.description,
        startDate: updatedRoadtrip.startDate,
        endDate: updatedRoadtrip.endDate,
        userId: updatedRoadtrip.userId,
        isPublic: updatedRoadtrip.isPublic,
        thumbnail: updatedRoadtrip.thumbnail,
        totalSteps: updatedRoadtrip.totalSteps,
        totalDistance: updatedRoadtrip.totalDistance,
        estimatedDuration: updatedRoadtrip.estimatedDuration,
        tags: updatedRoadtrip.tags,
        createdAt: updatedRoadtrip.createdAt.toISOString(),
        updatedAt: updatedRoadtrip.updatedAt.toISOString(),
      };
      
      setRoadtrips(prev => 
        prev.map(roadtrip => 
          roadtrip.id === roadtripId ? updatedData : roadtrip
        )
      );
      
      console.log('✅ Roadtrip mis à jour:', roadtripId);
      return updatedData;
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isReady, database]);

  const deleteRoadtrip = useCallback(async (roadtripId: string) => {
    if (!isReady || !database) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📍 Suppression roadtrip:', roadtripId);
      
      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      const roadtripRecord = await roadtripsCollection.find(roadtripId);
      
      await database.write(async () => {
        await roadtripRecord.markAsDeleted();
      });
      
      setRoadtrips(prev => prev.filter(roadtrip => roadtrip.id !== roadtripId));
      console.log('✅ Roadtrip supprimé:', roadtripId);
      return true;
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isReady, database]);

  return {
    roadtrips,
    loading,
    error,
    fetchRoadtrips,
    createRoadtrip,
    updateRoadtrip,
    deleteRoadtrip,
  };
};
