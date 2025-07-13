/**
 * Service de test pour vérifier la connexion API
 */
import { apiClient } from './client';
import { ENV_CONFIG } from '../../config';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  message: string;
  timestamp: string;
  version?: string;
}

/**
 * Test de connexion au backend
 */
export const testConnection = async (): Promise<HealthCheckResponse> => {
  try {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('🌐 Test de connexion au backend:', ENV_CONFIG.API_BASE_URL);
    }

    const response = await apiClient.get<HealthCheckResponse>('/health');
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('✅ Connexion backend réussie:', response.data);
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Erreur de connexion';
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.error('❌ Erreur connexion backend:', error);
    }

    return {
      status: 'error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Test des endpoints API REST
 */
export const testApiEndpoints = async (): Promise<{ [key: string]: any }> => {
  const results: { [key: string]: any } = {};
  
  const endpoints = [
    '/api/health',
    '/api/roadtrips',
    '/api/auth/me',
    '/roadtrips',
    '/health',
    '/api/version'
  ];

  console.log('🔍 Test des endpoints API...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Test endpoint: ${endpoint}`);
      const response = await apiClient.get(endpoint);
      results[endpoint] = {
        status: response.status,
        contentType: response.headers['content-type'],
        isJson: response.headers['content-type']?.includes('json'),
        dataPreview: typeof response.data === 'string' ? 
          response.data.substring(0, 100) + '...' : 
          response.data
      };
      console.log(`✅ ${endpoint}: ${response.status} (${response.headers['content-type']})`);
    } catch (error: any) {
      results[endpoint] = {
        status: error.response?.status || 'ERROR',
        error: error.message
      };
      console.log(`❌ ${endpoint}: ${error.response?.status || 'ERROR'} - ${error.message}`);
    }
  }
  
  return results;
};

/**
 * Test des variables d'environnement
 */
export const testEnvironment = (): void => {
  console.log('🔧 Configuration environnement:');
  console.log('- API Base URL:', ENV_CONFIG.API_BASE_URL);
  console.log('- Google API Key:', ENV_CONFIG.GOOGLE_API_KEY ? '✅ Configuré' : '❌ Manquant');
  console.log('- Mode Debug:', ENV_CONFIG.DEBUG ? '✅' : '❌');
  console.log('- Debug API:', ENV_CONFIG.DEBUG_API_CALLS ? '✅' : '❌');
  console.log('- Debug Sync:', ENV_CONFIG.DEBUG_SYNC ? '✅' : '❌');
  console.log('- Debug WatermelonDB:', ENV_CONFIG.DEBUG_WATERMELON ? '✅' : '❌');
};
