/**
 * Constantes de l'application
 */
import ENV_CONFIG from './env';

export const GOOGLE_API_KEY = ENV_CONFIG.GOOGLE_API_KEY;

export const APP_CONSTANTS = {
  // Délais
  DEBOUNCE_DELAY: 300,
  REQUEST_TIMEOUT: 30000,
  
  // Limites
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PHOTOS_PER_ITEM: 10,
  
  // URLs
  PRIVACY_POLICY_URL: 'https://monpetitroadtrip.com/privacy',
  TERMS_OF_SERVICE_URL: 'https://monpetitroadtrip.com/terms',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  
  // Cache
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
} as const;

export default {
  GOOGLE_API_KEY,
  ...APP_CONSTANTS,
};
