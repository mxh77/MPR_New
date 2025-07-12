/**
 * Hook pour gérer les données des roadtrips
 */
import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts';
import { Roadtrip } from '../services/database/models';
import { syncService } from '../services';

export const useRoadtrips = () => {
  const { database } = useDatabase();
  const [roadtrips, setRoadtrips] = useState<Roadtrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les roadtrips
  const loadRoadtrips = useCallback(async () => {
    if (!database) return;

    try {
      setLoading(true);
      setError(null);

      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      const roadtripsList = await roadtripsCollection
        .query()
        .fetch();

      setRoadtrips(roadtripsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [database]);

  // Créer un nouveau roadtrip
  const createRoadtrip = useCallback(async (roadtripData: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    userId: string;
  }) => {
    if (!database) throw new Error('Database not available');

    try {
      const roadtripsCollection = database.get<Roadtrip>('roadtrips');
      
      const newRoadtrip = await database.write(async () => {
        return await roadtripsCollection.create(roadtrip => {
          roadtrip.title = roadtripData.title;
          roadtrip.description = roadtripData.description || '';
          roadtrip.startDate = roadtripData.startDate.getTime();
          roadtrip.endDate = roadtripData.endDate.getTime();
          roadtrip.userId = roadtripData.userId;
          roadtrip.isPublic = false;
          roadtrip.totalSteps = 0;
          roadtrip.tagsJson = JSON.stringify([]);
        });
      });

      // Ajouter à la queue de synchronisation
      await syncService.addToSyncQueue(
        'roadtrips',
        newRoadtrip.id,
        'create',
        newRoadtrip.toInterface()
      );

      // Recharger les roadtrips
      await loadRoadtrips();

      return newRoadtrip;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  }, [database, loadRoadtrips]);

  // Mettre à jour un roadtrip
  const updateRoadtrip = useCallback(async (
    roadtripId: string,
    updates: Partial<{
      title: string;
      description: string;
      startDate: Date;
      endDate: Date;
      isPublic: boolean;
    }>
  ) => {
    if (!database) throw new Error('Database not available');

    try {
      const roadtrip = await database.get<Roadtrip>('roadtrips').find(roadtripId);
      
      const updatedRoadtrip = await database.write(async () => {
        return await roadtrip.update(roadtripRecord => {
          if (updates.title !== undefined) roadtripRecord.title = updates.title;
          if (updates.description !== undefined) roadtripRecord.description = updates.description;
          if (updates.startDate !== undefined) roadtripRecord.startDate = updates.startDate.getTime();
          if (updates.endDate !== undefined) roadtripRecord.endDate = updates.endDate.getTime();
          if (updates.isPublic !== undefined) roadtripRecord.isPublic = updates.isPublic;
        });
      });

      // Ajouter à la queue de synchronisation
      await syncService.addToSyncQueue(
        'roadtrips',
        roadtripId,
        'update',
        updatedRoadtrip.toInterface()
      );

      // Recharger les roadtrips
      await loadRoadtrips();

      return updatedRoadtrip;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  }, [database, loadRoadtrips]);

  // Supprimer un roadtrip
  const deleteRoadtrip = useCallback(async (roadtripId: string) => {
    if (!database) throw new Error('Database not available');

    try {
      const roadtrip = await database.get<Roadtrip>('roadtrips').find(roadtripId);
      
      await database.write(async () => {
        await roadtrip.markAsDeleted();
      });

      // Ajouter à la queue de synchronisation
      await syncService.addToSyncQueue(
        'roadtrips',
        roadtripId,
        'delete'
      );

      // Recharger les roadtrips
      await loadRoadtrips();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  }, [database, loadRoadtrips]);

  // Charger les roadtrips au démarrage
  useEffect(() => {
    loadRoadtrips();
  }, [loadRoadtrips]);

  return {
    roadtrips,
    loading,
    error,
    loadRoadtrips,
    createRoadtrip,
    updateRoadtrip,
    deleteRoadtrip,
  };
};
