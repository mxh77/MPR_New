/**
 * Contexte d'authentification avec JWT et gestion d'état
 */
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService } from '../services';
import { loginUser, registerUser, checkAuthStatus, forgotPassword, type AuthUser } from '../services/api/auth';
import { ENV_CONFIG } from '../config';
import type { User, RegisterData } from '../types';

// Types pour le contexte d'authentification
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

// Actions du reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'FORGOT_PASSWORD_SUCCESS' }
  | { type: 'RESTORE_SESSION'; payload: { user: User; token: string } };

// État initial
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true, // true au démarrage pour la restauration de session
  isAuthenticated: false,
  error: null,
};

// Reducer d'authentification
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        user: null,
        token: null,
        isAuthenticated: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        isLoading: false,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'FORGOT_PASSWORD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case 'RESTORE_SESSION':
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null,
      };

    default:
      return state;
  }
};

// Création du contexte
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Props du provider
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider d'authentification
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restauration de la session au démarrage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [user, token] = await Promise.all([
          authService.getUser(),
          authService.getToken(),
        ]);

        if (user && token) {
          dispatch({
            type: 'RESTORE_SESSION',
            payload: { user, token },
          });
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    restoreSession();
  }, []);

  // Fonction de connexion
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      // Appel API réel - maintenant retourne directement AuthUser
      const authUser = await loginUser({ email, password });
      
      // Convertir AuthUser vers User
      const user = convertAuthUserToUser(authUser);
      
      // Pour le token, on peut utiliser un token factice ou récupérer depuis les cookies
      // En mode cookie, pas besoin de stocker le token côté client
      const token = 'cookie-based-auth'; // Token factice car l'auth est basée sur cookies
      
      // Sauvegarder l'utilisateur
      await authService.saveUser(user);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user,
          token,
        },
      });
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: error instanceof Error ? error.message : 'Erreur de connexion',
      });
      throw error;
    }
  };

  // Fonction d'inscription
  const register = async (data: RegisterData): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      // Appel API réel - maintenant retourne directement AuthUser
      const authUser = await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      
      // Convertir AuthUser vers User avec les noms spécifiés
      const user = convertAuthUserToUser(authUser, data.firstName, data.lastName);
      
      // Pour le token, on utilise un token factice car l'auth est basée sur cookies
      const token = 'cookie-based-auth'; // Token factice car l'auth est basée sur cookies
      
      // Sauvegarder l'utilisateur
      await authService.saveUser(user);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user,
          token,
        },
      });
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: error instanceof Error ? error.message : 'Erreur lors de l\'inscription',
      });
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Fonction de mot de passe oublié
  const forgotPasswordHandler = async (email: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      await forgotPassword(email);
      
      // Réinitialiser le state après succès - arrêter le loading
      dispatch({ type: 'FORGOT_PASSWORD_SUCCESS' });
      
      if (ENV_CONFIG.DEBUG_API_CALLS) {
        console.log('✅ Forgot password email sent successfully');
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email',
      });
      throw error;
    }
  };

  // Effacer l'erreur
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Fonction utilitaire pour convertir AuthUser vers User
  const convertAuthUserToUser = (authUser: AuthUser, firstName?: string, lastName?: string): User => {
    const nameParts = authUser.name.split(' ');
    return {
      _id: authUser._id,
      email: authUser.email,
      firstName: firstName || nameParts[0] || authUser.name,
      lastName: lastName || nameParts.slice(1).join(' ') || '',
      avatar: undefined,
      preferences: {
        theme: 'auto',
        language: 'fr',
        notifications: true,
        geolocation: true,
        offlineMode: true,
      },
      createdAt: new Date(authUser.createdAt),
      updatedAt: new Date(authUser.updatedAt),
    };
  };

  const contextValue: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    forgotPassword: forgotPasswordHandler,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte d'authentification
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
