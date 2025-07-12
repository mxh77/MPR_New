/**
 * Contexte d'authentification avec JWT et gestion d'état
 */
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService } from '../services';
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
  clearError: () => void;
}

// Actions du reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
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
      const result = await authService.login(email, password);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: result.user,
          token: result.token,
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
      const result = await authService.register(data);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: error instanceof Error ? error.message : 'Erreur d\'inscription',
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

  // Effacer l'erreur
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
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
