/**
 * Onglet Activités du détail d'étape
 * Affiche la liste des activités de l'étape
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../contexts';
import type { Step } from '../../types';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';
import {
  getImageUri,
  isValidImageUri,
  formatItemDate,
  hasValidCoordinates,
  handleOpenWebsite,
  handleOpenMaps,
  getActivityTypeLabel
} from '../../utils/stepDetailHelpers';
import { SafeImage } from '../../components/common/SafeImage';
import { stepDetailStyles } from '../../styles/stepDetailStyles';
import { BadgeContainer } from '../../components/common';

type StepDetailScreenNavigationProp = NativeStackNavigationProp<RoadtripsStackParamList, 'StepDetail'>;

interface StepActivitiesScreenProps {
  step: Step | null;
}

export const StepActivitiesScreen: React.FC<StepActivitiesScreenProps> = ({
  step
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<StepDetailScreenNavigationProp>();

  // Sécurité : vérifier que step existe et que activities est un array
  const activities = step && Array.isArray((step as any)?.activities)
    ? (step as any).activities
    : [];

  console.log('🚶 Activities Debug:', {
    stepExists: !!step,
    activitiesCount: activities.length,
    activitiesType: typeof activities
  });

  /**
   * Navigation vers l'édition d'une activité 
   */
  const handleEditActivity = useCallback((activity: any) => {
    if (!activity?._id || !step?._id) {
      Alert.alert('Erreur', 'Impossible d\'éditer cette activité');
      return;
    }

    console.log('📝 Navigation vers édition activité:', {
      stepId: step._id,
      activityId: activity._id,
      name: activity.name
    });

    navigation.navigate('EditActivity', {
      stepId: step._id,
      activityId: activity._id
    });
  }, [step, navigation]);

  /**
   * Supprimer une activité avec confirmation
   */
  const handleDeleteActivity = useCallback((activity: any) => {
    if (!activity?._id || !step?._id) {
      Alert.alert('Erreur', 'Impossible de supprimer cette activité');
      return;
    }

    Alert.alert(
      'Supprimer l\'activité',
      `Êtes-vous sûr de vouloir supprimer "${activity.name || 'cette activité'}" ?\n\nCette action est irréversible.`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              //TODO: Implémenter la suppression via hook
              console.log('🗑️ Suppression activité:', {
                stepId: step._id,
                activityId: activity._id,
                name: activity.name
              });

              // Placeholder pour l'implémentation de la suppression
              Alert.alert('À implémenter', 'Suppression d\'activité - fonctionnalité à venir');
            } catch (error) {
              console.error('Erreur suppression activité:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'activité');
            }
          }
        }
      ]
    );
  }, [step]);

  if (activities.length === 0) {
    return (
      <View style={stepDetailStyles.emptyState}>
        <Ionicons name="walk-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={[stepDetailStyles.emptyText, { color: theme.colors.textSecondary }]}>
          Aucune activité
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={stepDetailStyles.tabContent}>
      {activities
        .filter((activity: any) => activity && activity._id) // Filtrer les activités valides
        .sort((a: any, b: any) => {
          // Tri par date de début (startDateTime) croissante
          const aDateTime = a.startDateTime || a.arrivalDateTime;
          const bDateTime = b.startDateTime || b.arrivalDateTime;

          if (!aDateTime && !bDateTime) return 0;
          if (!aDateTime) return 1; // Mettre les activités sans date à la fin
          if (!bDateTime) return -1;

          return new Date(aDateTime).getTime() - new Date(bDateTime).getTime();
        })
        .map((activity: any, index: number) => (
          <View key={index} style={[stepDetailStyles.itemCard, { backgroundColor: theme.colors.surface }]}>
            {/* Bouton supprimer en haut à droite de la carte */}
            <TouchableOpacity
              style={stepDetailStyles.cardDeleteButton}
              onPress={() => handleDeleteActivity(activity)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash" size={18} color="white" />
            </TouchableOpacity>

            {/* Nom de l'activité */}
            <Text style={[stepDetailStyles.title, { color: theme.colors.text }]}>
              {activity.name || `Activité ${index + 1}`}
            </Text>

            {/* Thumbnail avec menu d'actions - Structure identique à l'onglet Infos */}
            {(() => {
              const imageUri = getImageUri(activity.thumbnail);
              const hasAddress = Boolean(activity.address?.trim());

              if (imageUri && typeof imageUri === 'string' && imageUri.length > 0) {
                return (
                  <View style={stepDetailStyles.thumbnailContainer}>
                    <TouchableOpacity
                      style={stepDetailStyles.stepThumbnail}
                      onPress={() => handleEditActivity(activity)}
                      activeOpacity={0.8}
                    >
                      {isValidImageUri(imageUri) ? (
                        <SafeImage
                          thumbnail={activity.thumbnail}
                          style={stepDetailStyles.stepThumbnail}
                          placeholderIcon="walk-outline"
                          theme={theme}
                        />
                      ) : (
                        <View style={[stepDetailStyles.stepThumbnail, stepDetailStyles.placeholderImage, { backgroundColor: '#f0f0f0' }]}>
                          <Ionicons name="walk-outline" size={32} color={theme.colors.textSecondary} />
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
                      onPress={() => handleEditActivity(activity)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="walk-outline" size={32} color={theme.colors.textSecondary} />
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

            {/* Type d'activité */}
            {activity.type && (
              <Text style={[stepDetailStyles.itemType, { color: theme.colors.primary }]}>
                {getActivityTypeLabel(activity.type)}
              </Text>
            )}

            {activity.address && (
              <Text style={[stepDetailStyles.itemAddress, { color: theme.colors.textSecondary }]}>
                {activity.address}
              </Text>
            )}

            {/* Dates d'activité - Style identique aux dates de l'onglet Infos */}
            {(activity.startDateTime || activity.arrivalDateTime) && (
              <View style={stepDetailStyles.dateRow}>
                <Ionicons name="log-in" size={16} color="#28a745" />
                <Text style={[stepDetailStyles.dateLabel, { color: theme.colors.textSecondary }]}>
                  Début:
                </Text>
                <Text style={[stepDetailStyles.dateValue, { color: theme.colors.text }]}>
                  {formatItemDate(activity.startDateTime || activity.arrivalDateTime)}
                </Text>
              </View>
            )}

            {(activity.endDateTime || activity.departureDateTime) && (
              <View style={stepDetailStyles.dateRow}>
                <Ionicons name="log-out" size={16} color="#dc3545" />
                <Text style={[stepDetailStyles.dateLabel, { color: theme.colors.textSecondary }]}>
                  Fin:
                </Text>
                <Text style={[stepDetailStyles.dateValue, { color: theme.colors.text }]}>
                  {formatItemDate(activity.endDateTime || activity.departureDateTime)}
                </Text>
              </View>
            )}

            {/* Notes/Description */}
            {activity.notes && (
              <View style={stepDetailStyles.descriptionSection}>
                <Text style={[stepDetailStyles.sectionTitle, { color: theme.colors.text }]}>
                  Notes
                </Text>
                <Text style={[stepDetailStyles.description, { color: theme.colors.text }]}>
                  {activity.notes}
                </Text>
              </View>
            )}

            {/* Boutons d'action - Uniquement si au moins un bouton est disponible */}
            {(activity.website || hasValidCoordinates(activity)) && (
              <View style={stepDetailStyles.activityActionButtons}>
                {/* Bouton Site Web - Si disponible */}
                {activity.website && (
                  <TouchableOpacity
                    style={stepDetailStyles.activityActionIcon}
                    onPress={() => handleOpenWebsite(activity.website, activity.name)}
                  >
                    <Ionicons name="globe-outline" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}

                {/* Bouton Google Maps - Si coordonnées disponibles */}
                {hasValidCoordinates(activity) && (
                  <TouchableOpacity
                    style={stepDetailStyles.activityActionIcon}
                    onPress={() => handleOpenMaps(activity)}
                  >
                    <Ionicons name="map-outline" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}
    </ScrollView>
  );
};
