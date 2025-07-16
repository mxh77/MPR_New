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
  username: string;
  email: string;
  password: string;
}

export interface AuthStatusResponse {
  isAuthenticated: boolean;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
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

    // ✅ CORRECTION: Si la réponse status contient les données utilisateur (depuis cookie)
    if (statusResponse.data.user) {
      const userData = statusResponse.data.user;
      const authUser: AuthUser = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (ENV_CONFIG.DEBUG_API_CALLS) {
        console.log('✅ Login successful with cookie user data:', {
          id: authUser._id,
          name: authUser.name,
          email: authUser.email
        });
      }
      
      return authUser;
    }

    // ✅ Sinon, essayer de récupérer via /auth/me
    try {
      const userProfileResponse = await apiClient.get<{ user: AuthUser }>('/auth/me');
      const authUser = userProfileResponse.data.user;
      
      if (ENV_CONFIG.DEBUG_API_CALLS) {
        console.log('✅ Login successful with MongoDB user:', {
          id: authUser._id,
          name: authUser.name,
          email: authUser.email
        });
      }
      
      return authUser;
    } catch (userError) {
      console.warn('⚠️ Impossible de récupérer le profil utilisateur, utilisation de données basiques');
      
      // Fallback: Créer un utilisateur basique basé sur l'email
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
    }
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
export const registerUser = async (userData: RegisterRequest): Promise<AuthUser> => {
  try {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('📝 Register attempt:', { username: userData.username, email: userData.email });
    }

    // Étape 1: Register (définit le cookie)
    const registerResponse = await apiClient.post('/auth/register', userData);
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('✅ Register response:', registerResponse.data);
    }

    // Étape 2: Vérifier l'authentification
    const statusResponse = await apiClient.get<AuthStatusResponse>('/auth/status');
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('📊 Auth status response after register:', statusResponse.data);
    }
    
    if (!statusResponse.data.isAuthenticated) {
      throw new Error('Échec de l\'authentification après inscription');
    }

    // Créer un utilisateur basique basé sur les données d'inscription
    const basicUser: AuthUser = {
      _id: 'user_' + Date.now(),
      name: userData.username,
      email: userData.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('✅ Registration successful with basic user:', basicUser.name);
    }
    
    return basicUser;
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
      console.log('✅ Auth status:', {
        isAuthenticated: response.data.isAuthenticated,
        hasUserData: !!response.data.user,
        userId: response.data.user?._id
      });
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

/**
 * Récupérer les données de l'utilisateur actuel
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('🔍 Getting current user...');
    }

    const response = await apiClient.get<{ user: AuthUser }>('/auth/me');
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('✅ Current user retrieved:', {
        id: response.data.user._id,
        name: response.data.user.name,
        email: response.data.user.email
      });
    }

    return response.data.user;
  } catch (error: any) {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('ℹ️ Current user retrieval failed (normal if not logged in)');
    }
    
    return null;
  }
};

/**
 * Demande de réinitialisation de mot de passe
 */
export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  try {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('📧 Forgot password request for:', email);
    }

    const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', {
      email
    });
    
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.log('✅ Forgot password response:', response.data.message);
    }

    return response.data;
  } catch (error: any) {
    if (ENV_CONFIG.DEBUG_API_CALLS) {
      console.error('❌ Forgot password error:', error.response?.data || error.message);
    }
    
    throw new Error(
      error.response?.data?.message || 
      'Erreur lors de la demande de réinitialisation'
    );
  }
};
