/**
 * Application Mon Petit Roadtrip
 * Architecture offline-first avec WatermelonDB, JWT Auth et React Navigation
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contextes et navigation
import { DatabaseProvider, AuthProvider, ThemeProvider } from './src/contexts';
import { AppNavigator } from './src/components/navigation/AppNavigator';

// Configuration des warnings à ignorer (optionnel)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Warning: Failed prop type',
]);

/**
 * Composant racine de l'application
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DatabaseProvider>
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </DatabaseProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
