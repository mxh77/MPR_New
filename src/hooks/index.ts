/**
 * Index des hooks personnalisés
 */
export { useNetworkStatus } from './useNetworkStatus';
export { useSync } from './useSyncExpoGo';  // Gardons la version simplifiée pour l'instant
export { useForm } from './useForm';
export { useRoadtripForm } from './useRoadtripForm';
export { useRoadtrips } from './useRoadtripsExpoGo';  // Version simplifiée temporaire
export { default as useRoadtripsWithApi } from './useRoadtripsWithApi'; // Version avec API
export { default as useRoadtripDetail } from './useRoadtripDetail'; // Hook pour détail roadtrip
export { useSteps } from './useSteps'; // Hook pour les étapes
export { useAccommodationDetail } from './useAccommodationDetail'; // Hook pour accommodation detail
export { useAccommodationUpdate } from './useAccommodationUpdate'; // Hook pour accommodation update

// Types
export type { NetworkState } from './useNetworkStatus';
export type { SyncState } from './useSyncExpoGo';
export type { FormField, FormState, FormValidation } from './useForm';
