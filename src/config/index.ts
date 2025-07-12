/**
 * Configuration de l'application Mon Petit Roadtrip
 */

// Configuration d'environnement
export const ENV_CONFIG = {
  DEBUG: __DEV__,
  API_BASE_URL: __DEV__ 
    ? process.env.API_BASE_URL_DEBUG || 'http://localhost:3000'
    : process.env.API_BASE_URL_RELEASE || 'https://api.monpetitroadtrip.com',
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'),
  
  // Features flags
  ENABLE_CHATBOT: process.env.ENABLE_CHATBOT === 'true',
  ENABLE_OFFLINE_MODE: process.env.ENABLE_OFFLINE_MODE !== 'false', // true par défaut
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS !== 'false',
  ENABLE_GEOLOCATION: process.env.ENABLE_GEOLOCATION !== 'false',
  
  // Debug options
  DEBUG_SYNC: process.env.DEBUG_SYNC === 'true',
  DEBUG_API_CALLS: process.env.DEBUG_API_CALLS === 'true',
  DEBUG_WATERMELON: process.env.DEBUG_WATERMELON === 'true',
} as const;

// Configuration Algolia
export const ALGOLIA_CONFIG = {
  APP_ID: process.env.ALGOLIA_APP_ID || '',
  API_KEY: process.env.ALGOLIA_API_KEY || '',
  INDEX_NAME: process.env.ALGOLIA_INDEX_NAME || 'trails',
} as const;

// Configuration WatermelonDB
export const DATABASE_CONFIG = {
  name: 'monpetitroadtrip.db',
  version: 1,
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
