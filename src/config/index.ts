/**
 * Configuration de l'application Mon Petit Roadtrip
 */
import ENV from './env';

// Configuration d'environnement
export const ENV_CONFIG = {
  DEBUG: __DEV__,
  API_BASE_URL: __DEV__ 
    ? ENV.BACKEND_URL_DEV
    : ENV.BACKEND_URL_PROD,
  API_TIMEOUT: 30000,
  
  // API Keys
  GOOGLE_API_KEY: ENV.GOOGLE_API_KEY,
  
  // Features flags
  ENABLE_CHATBOT: false,
  ENABLE_OFFLINE_MODE: true, // true par défaut
  ENABLE_NOTIFICATIONS: true,
  ENABLE_GEOLOCATION: true,
  
  // Debug options
  DEBUG_SYNC: ENV.DEBUG_SYNC || __DEV__,
  DEBUG_API_CALLS: ENV.DEBUG_API_CALLS || __DEV__,
  DEBUG_WATERMELON: ENV.DEBUG_WATERMELON || __DEV__,
} as const;

// Configuration développement (UNIQUEMENT en mode debug)
export const DEV_CONFIG = {
  PREFILL_LOGIN: __DEV__, // Active le pré-remplissage en développement
  DEFAULT_EMAIL: 'maxime.heron@gmail.com',
  DEFAULT_PASSWORD: '1234',
} as const;

// Configuration Algolia
export const ALGOLIA_CONFIG = {
  APP_ID: process.env.ALGOLIA_APP_ID || '',
  API_KEY: process.env.ALGOLIA_API_KEY || '',
  INDEX_NAME: process.env.ALGOLIA_INDEX_NAME || 'trails',
} as const;

// Configuration WatermelonDB
export const DATABASE_CONFIG = {
  name: 'monpetitroadtrip_v3.db', // Nouveau nom pour forcer reset avec nouvelles colonnes
  version: 6, // Version alignée avec le schéma
  synchronize: true,
} as const;

// Configuration navigation
export const NAVIGATION_CONFIG = {
  headerShown: true,
  gestureEnabled: true,
  animationEnabled: true,
} as const;

// Configuration géolocalisation
export const LOCATION_CONFIG = {
  accuracy: 6, // Balanced
  distanceFilter: 10, // 10 mètres
  timeout: 15000, // 15 secondes
} as const;

// Configuration images
export const IMAGE_CONFIG = {
  quality: 0.8,
  maxWidth: 1024,
  maxHeight: 1024,
  allowsEditing: true,
} as const;

// Configuration notification
export const NOTIFICATION_CONFIG = {
  maxUnread: 99,
  pollInterval: 30000, // 30 secondes
  maxRetries: 3,
} as const;

// Configuration API
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 secondes
  UPLOAD_TIMEOUT: 120000, // 2 minutes
  RETRY_ATTEMPTS: 3,
} as const;
