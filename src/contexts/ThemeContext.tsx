/**
 * Contexte de thème avec support clair/sombre
 */
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from '../constants/colors';

// Types pour le contexte de thème
type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  isDark: boolean;
}

interface ThemeContextValue extends ThemeState {
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// Actions du reducer
type ThemeAction =
  | { type: 'SET_THEME'; payload: ThemeMode }
  | { type: 'SET_SYSTEM_THEME'; payload: ColorSchemeName }
  | { type: 'RESTORE_THEME'; payload: ThemeMode };

// Clé de stockage pour la préférence de thème
const THEME_STORAGE_KEY = 'user_theme_preference';

// Fonction pour déterminer le thème actuel
const getEffectiveTheme = (mode: ThemeMode, systemTheme: ColorSchemeName): Theme => {
  if (mode === 'auto') {
    return systemTheme === 'dark' ? darkTheme as Theme : lightTheme;
  }
  return mode === 'dark' ? darkTheme as Theme : lightTheme;
};

// Fonction pour déterminer si un thème est sombre
const getIsDark = (mode: ThemeMode, systemTheme: ColorSchemeName): boolean => {
  if (mode === 'auto') {
    return systemTheme === 'dark';
  }
  return mode === 'dark';
};

// État initial
const createInitialState = (): ThemeState => {
  const systemTheme = Appearance.getColorScheme();
  return {
    mode: 'auto',
    theme: getEffectiveTheme('auto', systemTheme),
    isDark: getIsDark('auto', systemTheme),
  };
};

// Reducer de thème
const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'SET_THEME': {
      const systemTheme = Appearance.getColorScheme();
      const newTheme = getEffectiveTheme(action.payload, systemTheme);
      
      return {
        ...state,
        mode: action.payload,
        theme: newTheme,
        isDark: getIsDark(action.payload, systemTheme),
      };
    }

    case 'SET_SYSTEM_THEME': {
      const newTheme = getEffectiveTheme(state.mode, action.payload);
      
      return {
        ...state,
        theme: newTheme,
        isDark: getIsDark(state.mode, action.payload),
      };
    }

    case 'RESTORE_THEME': {
      const systemTheme = Appearance.getColorScheme();
      const newTheme = getEffectiveTheme(action.payload, systemTheme);
      
      return {
        ...state,
        mode: action.payload,
        theme: newTheme,
        isDark: getIsDark(action.payload, systemTheme),
      };
    }

    default:
      return state;
  }
};

// Création du contexte
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Props du provider
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider de thème
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, createInitialState());

  // Restauration de la préférence de thème au démarrage
  useEffect(() => {
    const restoreTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
          dispatch({ type: 'RESTORE_THEME', payload: savedTheme as ThemeMode });
        }
      } catch (error) {
        console.error('Failed to restore theme preference:', error);
      }
    };

    restoreTheme();
  }, []);

  // Écoute des changements de thème système
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      dispatch({ type: 'SET_SYSTEM_THEME', payload: colorScheme });
    });

    return () => subscription.remove();
  }, []);

  // Fonction pour changer le thème
  const setTheme = async (mode: ThemeMode): Promise<void> => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      dispatch({ type: 'SET_THEME', payload: mode });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Applique quand même le thème même si le stockage échoue
      dispatch({ type: 'SET_THEME', payload: mode });
    }
  };

  // Fonction pour basculer entre clair et sombre
  const toggleTheme = (): void => {
    const newMode = state.isDark ? 'light' : 'dark';
    setTheme(newMode);
  };

  const contextValue: ThemeContextValue = {
    ...state,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte de thème
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
