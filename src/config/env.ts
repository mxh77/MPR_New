/**
 * Configuration des variables d'environnement avec Expo
 */
import Constants from 'expo-constants';

// Chargement des variables d'environnement
const ENV = {
  // URLs Backend
  BACKEND_URL_PROD: process.env.EXPO_PUBLIC_BACKEND_URL_PROD || 'https://mon-petit-roadtrip.vercel.app',
  BACKEND_URL_DEV: process.env.EXPO_PUBLIC_BACKEND_URL_DEV || 'http://192.168.1.2:3000',
  
  // API Keys - Séparées par environnement
  GOOGLE_API_KEY_DEV: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_DEV || '',
  GOOGLE_API_KEY_PROD: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_PROD || '',
  
  // Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Debug flags
  DEBUG_SYNC: process.env.EXPO_PUBLIC_DEBUG_SYNC === 'true',
  DEBUG_API_CALLS: process.env.EXPO_PUBLIC_DEBUG_API_CALLS === 'true',
  DEBUG_WATERMELON: process.env.EXPO_PUBLIC_DEBUG_WATERMELON === 'true',
};

// Détection automatique de l'environnement
const isDevelopment = __DEV__ || ENV.NODE_ENV === 'development';

// Configuration finale avec sélection automatique des clés
const CONFIG = {
  ...ENV,
  
  // Sélection automatique de la clé Google API selon l'environnement
  GOOGLE_API_KEY: isDevelopment ? ENV.GOOGLE_API_KEY_DEV : ENV.GOOGLE_API_KEY_PROD,
  
  // URL Backend selon l'environnement
  BACKEND_URL: isDevelopment ? ENV.BACKEND_URL_DEV : ENV.BACKEND_URL_PROD,
  
  // Debug info
  IS_DEVELOPMENT: isDevelopment,
  ENVIRONMENT: isDevelopment ? 'development' : 'production',
};

export default CONFIG;
