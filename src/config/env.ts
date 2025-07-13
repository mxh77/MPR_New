/**
 * Configuration des variables d'environnement avec Expo
 */
import Constants from 'expo-constants';

// Chargement des variables d'environnement
const ENV = {
  // URLs Backend
  BACKEND_URL_PROD: process.env.EXPO_PUBLIC_BACKEND_URL_PROD || 'https://mon-petit-roadtrip.vercel.app',
  BACKEND_URL_DEV: process.env.EXPO_PUBLIC_BACKEND_URL_DEV || 'http://192.168.1.2:3000',
  
  // API Keys  
  GOOGLE_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '',
  
  // Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Debug flags
  DEBUG_SYNC: process.env.EXPO_PUBLIC_DEBUG_SYNC === 'true',
  DEBUG_API_CALLS: process.env.EXPO_PUBLIC_DEBUG_API_CALLS === 'true',
  DEBUG_WATERMELON: process.env.EXPO_PUBLIC_DEBUG_WATERMELON === 'true',
};

export default ENV;
