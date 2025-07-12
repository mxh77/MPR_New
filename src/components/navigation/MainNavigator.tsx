/**
 * Navigateur principal avec onglets
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts';

import HomeNavigator from './HomeNavigator';
import RoadtripsNavigator from './RoadtripsNavigator';
import ProfileNavigator from './ProfileNavigator';

// Types pour la navigation main avec tabs
export type MainTabParamList = {
  HomeTab: undefined;
  RoadtripsTab: undefined;
  ProfileTab: undefined;
};

const MainTabs = createBottomTabNavigator<MainTabParamList>();

/**
 * Navigateur principal avec onglets inférieurs
 */
export const MainNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <MainTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'RoadtripsTab':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <MainTabs.Screen 
        name="HomeTab" 
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Accueil',
        }}
      />
      <MainTabs.Screen 
        name="RoadtripsTab" 
        component={RoadtripsNavigator}
        options={{
          tabBarLabel: 'Roadtrips',
        }}
      />
      <MainTabs.Screen 
        name="ProfileTab" 
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profil',
        }}
      />
    </MainTabs.Navigator>
  );
};

export default MainNavigator;
