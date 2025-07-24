/**
 * Navigateur pour l'onglet Roadtrips
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RoadtripsListScreenWithApi } from '../../screens/roadtrips/RoadtripsListScreenWithApi';
import { RoadtripDetailScreen } from '../../screens/roadtrips/RoadtripDetailScreen';
import { CreateRoadtripScreen } from '../../screens/roadtrips/CreateRoadtripScreen';
import { StepsListScreen } from '../../screens';
import StepDetailScreen from '../../screens/steps/StepDetailScreen';
import EditStepScreen from '../../screens/steps/EditStepScreen';
import CreateStepScreen from '../../screens/steps/CreateStepScreen';
import EditAccommodationScreen from '../../screens/accommodations/EditAccommodationScreen';
import EditActivityScreen from '../../screens/activities/EditActivityScreen';

// Types pour la navigation roadtrips
export type RoadtripsStackParamList = {
  RoadtripsList: undefined;
  RoadtripDetail: {
    roadtripId: string;
  };
  CreateRoadtrip: undefined;
  StepList: {
    roadtripId: string;
  };
  StepDetail: {
    stepId: string;
    roadtripId: string;
  };
  EditStep: {
    stepId: string;
    roadtripId: string;
  };
  CreateStep: {
    roadtripId: string;
  };
  EditAccommodation: {
    stepId: string;
    accommodationId: string;
  };
  EditActivity: {
    stepId: string;
    activityId: string;
  };
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
      <RoadtripsStack.Screen name="RoadtripsList" component={RoadtripsListScreenWithApi} />
      <RoadtripsStack.Screen name="RoadtripDetail" component={RoadtripDetailScreen} />
      <RoadtripsStack.Screen name="CreateRoadtrip" component={CreateRoadtripScreen} />
      <RoadtripsStack.Screen name="StepList" component={StepsListScreen} />
      <RoadtripsStack.Screen name="StepDetail" component={StepDetailScreen} />
      <RoadtripsStack.Screen name="EditStep" component={EditStepScreen} />
      <RoadtripsStack.Screen name="CreateStep" component={CreateStepScreen} />
      <RoadtripsStack.Screen name="EditAccommodation" component={EditAccommodationScreen} />
      <RoadtripsStack.Screen name="EditActivity" component={EditActivityScreen} />
    </RoadtripsStack.Navigator>
  );
};

export default RoadtripsNavigator;
