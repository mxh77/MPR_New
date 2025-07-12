/**
 * Navigateur pour l'onglet Profil
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../../screens/profile/ProfileScreen';

// Types pour la navigation profile
export type ProfileStackParamList = {
  Profile: undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

/**
 * Navigateur pour les écrans du profil
 */
export const ProfileNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
};

export default ProfileNavigator;
