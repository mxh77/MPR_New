/**
 * Navigation principale de l'application
 */
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { useAuth, useTheme } from '../../contexts';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { LoadingScreen } from '../../screens/LoadingScreen';

// Types pour la navigation root
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Loading: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Navigateur principal de l'application
 */
export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, isDark } = useTheme();

  // Configuration du thème de navigation
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };

  // Affichage du loading pendant la vérification d'auth
  if (isLoading) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LoadingScreen />
      </>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
