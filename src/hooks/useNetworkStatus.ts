/**
 * Hook pour gérer l'état de connexion réseau
 */
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
  isLoading: boolean;
}

export const useNetworkStatus = (): NetworkState => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: false,
    isInternetReachable: false,
    type: null,
    isLoading: true,
  });

  useEffect(() => {
    // État initial
    NetInfo.fetch().then(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        isLoading: false,
      });
    });

    // Écoute des changements
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        isLoading: false,
      });
    });

    return () => unsubscribe();
  }, []);

  return networkState;
};
