/**
 * Hook pour la gestion des roadtrips
 * Version compatible Expo Go avec AsyncStorage
 */
import { useState, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';

interface RoadtripData {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  participants: number;
  createdAt: string;
  updatedAt: string;
}

export const useRoadtrips = () => {
  const { isReady } = useDatabase();
  const [roadtrips, setRoadtrips] = useState<RoadtripData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadtrips = useCallback(async () => {
    if (!isReady) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implémenter avec AsyncStorage
      console.log('📍 Chargement des roadtrips depuis AsyncStorage...');
      
      // Mock data pour tester l'interface
      const mockRoadtrips: RoadtripData[] = [
        {
          id: '1',
          title: 'Road Trip Provence',
          description: 'Découverte des villages perchés de Provence',
          startDate: '2024-06-15',
          endDate: '2024-06-22',
          participants: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      
      setRoadtrips(mockRoadtrips);
    } catch (err) {
      console.error('❌ Erreur lors du chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  const createRoadtrip = useCallback(async (roadtripData: Omit<RoadtripData, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isReady) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📍 Création roadtrip:', roadtripData.title);
      
      // TODO: Implémenter avec AsyncStorage
      const newRoadtrip: RoadtripData = {
        ...roadtripData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setRoadtrips(prev => [...prev, newRoadtrip]);
      return newRoadtrip;
    } catch (err) {
      console.error('❌ Erreur lors de la création:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  const updateRoadtrip = useCallback(async (roadtripId: string, updates: Partial<RoadtripData>) => {
    if (!isReady) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📍 Mise à jour roadtrip:', roadtripId);
      
      // TODO: Implémenter avec AsyncStorage
      setRoadtrips(prev => 
        prev.map(roadtrip => 
          roadtrip.id === roadtripId 
            ? { ...roadtrip, ...updates, updatedAt: new Date().toISOString() }
            : roadtrip
        )
      );
      
      return roadtrips.find(r => r.id === roadtripId) || null;
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isReady, roadtrips]);

  const deleteRoadtrip = useCallback(async (roadtripId: string) => {
    if (!isReady) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📍 Suppression roadtrip:', roadtripId);
      
      // TODO: Implémenter avec AsyncStorage
      setRoadtrips(prev => prev.filter(roadtrip => roadtrip.id !== roadtripId));
      
      return true;
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isReady]);

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
