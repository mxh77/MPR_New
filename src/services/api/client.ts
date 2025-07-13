/**
 * Client API Axios avec intercepteurs pour l'authentification et retry logic
 */
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ENV_CONFIG, API_CONFIG } from '../../config';

/**
 * Utilitaire pour récupérer le token sans import circulaire
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync('auth_token');
  } catch {
    return null;
  }
};

/**
 * Utilitaire pour actualiser le token sans import circulaire
 */
const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    if (!refreshToken) return null;

    const response = await axios.post(`${ENV_CONFIG.API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { token: newToken, refreshToken: newRefreshToken } = response.data;
    
    await SecureStore.setItemAsync('auth_token', newToken);
    if (newRefreshToken) {
      await SecureStore.setItemAsync('refresh_token', newRefreshToken);
    }

    return newToken;
  } catch {
    // Nettoyage en cas d'erreur
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user_data');
    return null;
  }
};

/**
 * Configuration du client API de base
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: ENV_CONFIG.API_BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // Support des cookies pour l'authentification
    withCredentials: true,
  });

  // Intercepteur de requête pour le logging (cookies gérés automatiquement)
  client.interceptors.request.use(
    async (config) => {
      if (ENV_CONFIG.DEBUG_API_CALLS) {
        console.log('API Request:', {
          method: config.method,
          url: config.url,
          headers: config.headers,
          data: config.data,
        });
      }

      return config;
    },
    (error) => {
      if (ENV_CONFIG.DEBUG_API_CALLS) {
        console.error('API Request Error:', error);
      }
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse pour gérer les erreurs et le refresh token
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      if (ENV_CONFIG.DEBUG_API_CALLS) {
        console.log('API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      if (ENV_CONFIG.DEBUG_API_CALLS) {
        console.error('API Response Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });
      }

      // Gestion de l'authentification expirée
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshAuthToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          } else {
            // Token refresh failed, user needs to login again
            return Promise.reject(new Error('Session expired'));
          }
        } catch (refreshError) {
          // Redirection vers l'écran de connexion sera gérée par le contexte d'auth
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Client API avec retry logic
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = createApiClient();
  }

  /**
   * Exécute une requête avec retry automatique
   */
  private async executeWithRetry<T>(
    operation: () => Promise<AxiosResponse<T>>,
    retries: number = API_CONFIG.RETRY_ATTEMPTS
  ): Promise<AxiosResponse<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Ne pas retry sur les erreurs 4xx (sauf 401 qui est géré par l'intercepteur)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw error;
        }

        if (attempt < retries) {
          // Backoff exponentiel
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          if (ENV_CONFIG.DEBUG_API_CALLS) {
            console.warn(`API retry ${attempt}/${retries} after ${delay}ms`);
          }
        }
      }
    }

    throw lastError!;
  }

  /**
   * GET request avec retry
   */
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.client.get<T>(url, config));
  }

  /**
   * POST request avec retry
   */
  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.client.post<T>(url, data, config));
  }

  /**
   * PUT request avec retry
   */
  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.client.put<T>(url, data, config));
  }

  /**
   * DELETE request avec retry
   */
  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.client.delete<T>(url, config));
  }

  /**
   * PATCH request avec retry
   */
  async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.client.patch<T>(url, data, config));
  }

  /**
   * Upload de fichier avec timeout étendu
   */
  async uploadFile<T = any>(url: string, formData: FormData, config?: any): Promise<AxiosResponse<T>> {
    const uploadConfig = {
      ...config,
      timeout: API_CONFIG.UPLOAD_TIMEOUT,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    };

    return this.executeWithRetry(() => this.client.post<T>(url, formData, uploadConfig));
  }
}

export const apiClient = new ApiClient();
export default apiClient;
