/**
 * Navigateur pour l'onglet Roadtrips
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RoadtripsListScreen } from '../../screens/roadtrips/RoadtripsListScreen';

// Types pour la navigation roadtrips
export type RoadtripsStackParamList = {
  RoadtripsList: undefined;
};

const RoadtripsStack = createNativeStackNavigator<RoadtripsStackParamList>();

/**
 * Navigateur pour les écrans des roadtrips
 */
export const RoadtripsNavigator: React.FC = () => {
  return (
    <RoadtripsStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <RoadtripsStack.Screen name="RoadtripsList" component={RoadtripsListScreen} />
    </RoadtripsStack.Navigator>
  );
};

export default RoadtripsNavigator;
