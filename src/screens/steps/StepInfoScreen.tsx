/**
 * Onglet Informations du détail d'étape
 * Affiche les informations principales de l'étape
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../contexts';
import type { Step } from '../../types';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';
import { formatDateWithoutTimezone } from '../../utils';
import { getImageUri, isValidImageUri } from '../../utils/stepDetailHelpers';
import { stepDetailStyles } from '../../styles/stepDetailStyles';
import { BadgeContainer } from '../../components/common';

type StepDetailScreenNavigationProp = NativeStackNavigationProp<RoadtripsStackParamList, 'StepDetail'>;

interface StepInfoScreenProps {
  step: Step | null;
  syncing: boolean;
  roadtripId: string;
  onRefresh: () => void;
}

export const StepInfoScreen: React.FC<StepInfoScreenProps> = ({
  step,
  syncing,
  roadtripId,
  onRefresh
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<StepDetailScreenNavigationProp>();

  /**
   * Navigation vers l'édition
   */
  const handleEdit = useCallback(() => {
    if (!step?._id) {
      Alert.alert('Erreur', 'Impossible d\'éditer cette étape');
      return;
    }

    console.log('📝 StepInfoScreen - Navigation vers édition:', {
      stepId: step._id,
      roadtripId,
      stepName: step.title
    });

    navigation.navigate('EditStep', {
      stepId: step._id,
      roadtripId
    });
  }, [step, roadtripId, navigation]);

  if (!step) {
    return (
      <View style={stepDetailStyles.emptyState}>
        <Ionicons name="information-circle-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={[stepDetailStyles.emptyText, { color: theme.colors.textSecondary }]}>
          Aucune information disponible
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={stepDetailStyles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={syncing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Informations principales */}
      <View style={[stepDetailStyles.infoCard, { backgroundColor: theme.colors.surface }]}>
        {/* Titre simple sans actions */}
        <Text style={[stepDetailStyles.title, { color: theme.colors.text }]}>
          {step.title || 'Titre non défini'}
        </Text>

        {/* Thumbnail de l'étape avec menu d'actions */}
        {(() => {
          const imageUri = getImageUri(step.thumbnail);
          const hasAddress = Boolean(step.location?.address?.trim());

          if (imageUri && typeof imageUri === 'string' && imageUri.length > 0) {
            return (
              <View style={stepDetailStyles.thumbnailContainer}>
                <TouchableOpacity
                  style={stepDetailStyles.stepThumbnail}
                  onPress={handleEdit}
                  activeOpacity={0.8}
                >
                  {isValidImageUri(imageUri) ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={stepDetailStyles.stepThumbnail}
                      resizeMode="cover"
                      onError={(error) => {
                        console.warn('🖼️ Erreur chargement thumbnail étape:', error.nativeEvent.error, 'URI:', imageUri);
                      }}
                    />
                  ) : (
                    <View style={[stepDetailStyles.stepThumbnail, stepDetailStyles.placeholderImage, { backgroundColor: '#f0f0f0' }]}>
                      <Ionicons name="image-outline" size={32} color={theme.colors.textSecondary} />
                      <Text style={[stepDetailStyles.placeholderText, { color: theme.colors.textSecondary }]}>
                        Image non valide
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {/* Badge pour adresse manquante */}
                <BadgeContainer
                  hasAddress={hasAddress}
                  position="top-right"
                />
              </View>
            );
          } else {
            return (
              <View style={stepDetailStyles.thumbnailContainer}>
                <TouchableOpacity
                  style={[stepDetailStyles.stepThumbnailPlaceholder, stepDetailStyles.placeholderImage]}
                  onPress={handleEdit}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={32} color={theme.colors.textSecondary} />
                  <Text style={[stepDetailStyles.placeholderText, { color: theme.colors.textSecondary }]}>
                    Appuyer pour ajouter une photo
                  </Text>
                </TouchableOpacity>
                {/* Badge pour adresse manquante */}
                <BadgeContainer
                  hasAddress={hasAddress}
                  position="top-right"
                />
              </View>
            );
          }
        })()}

        {step.location?.address && (
          <View style={stepDetailStyles.addressRow}>
            <Ionicons name="location" size={16} color={theme.colors.primary} />
            <Text style={[stepDetailStyles.address, { color: theme.colors.textSecondary }]}>
              {step.location.address}
            </Text>
          </View>
        )}

        {/* Dates */}
        {step.startDate && (
          <View style={stepDetailStyles.dateRow}>
            <Ionicons name="play-circle" size={16} color="#28a745" />
            <Text style={[stepDetailStyles.dateLabel, { color: theme.colors.textSecondary }]}>
              Arrivée:
            </Text>
            <Text style={[stepDetailStyles.dateValue, { color: theme.colors.text }]}>
              {(() => {
                const date = step.startDate;
                return date ? formatDateWithoutTimezone(date) : 'Date invalide';
              })()}
            </Text>
          </View>
        )}

        {step.endDate && (
          <View style={stepDetailStyles.dateRow}>
            <Ionicons name="stop-circle" size={16} color="#dc3545" />
            <Text style={[stepDetailStyles.dateLabel, { color: theme.colors.textSecondary }]}>
              Départ:
            </Text>
            <Text style={[stepDetailStyles.dateValue, { color: theme.colors.text }]}>
              {(() => {
                const date = step.endDate;
                return date ? formatDateWithoutTimezone(date) : 'Date invalide';
              })()}
            </Text>
          </View>
        )}

        {/* Description */}
        {step.description && (
          <View style={stepDetailStyles.descriptionSection}>
            <Text style={[stepDetailStyles.sectionTitle, { color: theme.colors.text }]}>
              Description
            </Text>
            <Text style={[stepDetailStyles.description, { color: theme.colors.text }]}>
              {step.description}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
