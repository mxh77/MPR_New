/**
 * Service d'authentification API
 */
import { apiClient } from './client';
import { ENV_CONFIG } from '../../config';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginResponse {
  msg: string;
  redirectTo: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthStatusResponse {
  isAuthenticated: boolean;
}

/**
 * Connexion utilisateur
 */
export const loginUser = async (credentials: LoginRequest): Promise<AuthUser> => {
  try {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('🔐 Login attempt:', { email: credentials.email });
    }

    // Étape 1: Login (définit le cookie)
    const loginResponse = await apiClient.post<LoginResponse>('/auth/login', credentials);
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('✅ Login response:', loginResponse.data);
    }

    // Étape 2: Vérifier l'authentification
    const statusResponse = await apiClient.get<AuthStatusResponse>('/auth/status');
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('📊 Auth status response:', statusResponse.data);
    }
    
    if (!statusResponse.data.isAuthenticated) {
      throw new Error('Échec de l\'authentification');
    }

    // Créer un utilisateur basique basé sur l'email
    const basicUser: AuthUser = {
      _id: 'user_' + Date.now(),
      name: credentials.email.split('@')[0], // Utilise la partie avant @ de l'email
      email: credentials.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('✅ Login successful with basic user:', basicUser.name);
    }
    
    return basicUser;
  } catch (error: any) {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.error('❌ Login failed:', error.response?.data?.msg || error.message);
    }
    throw new Error(error.response?.data?.msg || 'Erreur de connexion');
  }
};

/**
 * Inscription utilisateur
 */
export const registerUser = async (userData: RegisterRequest): Promise<AuthResponse> => {
  try {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('📝 Register attempt:', { name: userData.name, email: userData.email });
    }

    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('✅ Registration successful:', response.data.user.name);
    }

    return response.data;
  } catch (error: any) {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.error('❌ Registration failed:', error.response?.data?.msg || error.message);
    }
    throw new Error(error.response?.data?.msg || 'Erreur lors de l\'inscription');
  }
};

/**
 * Vérification du statut d'authentification
 */
export const checkAuthStatus = async (): Promise<AuthStatusResponse> => {
  try {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('🔍 Checking auth status...');
    }

    const response = await apiClient.get<AuthStatusResponse>('/auth/status');
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('✅ Auth status:', response.data.isAuthenticated ? 'Authenticated' : 'Not authenticated');
    }

    return response.data;
  } catch (error: any) {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('ℹ️ Auth status check failed (normal if not logged in)');
    }
    
    return {
      isAuthenticated: false
    };
  }
};
