/**
 * Onglet Hébergements du détail d'étape
 * Affiche la liste des hébergements de l'étape
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
  handleOpenMaps 
} from '../../utils/stepDetailHelpers';
import { SafeImage } from '../../components/common/SafeImage';
import { stepDetailStyles } from '../../styles/stepDetailStyles';
import { BadgeContainer } from '../../components/common';

type StepDetailScreenNavigationProp = NativeStackNavigationProp<RoadtripsStackParamList, 'StepDetail'>;

interface StepAccommodationScreenProps {
  step: Step | null;
}

export const StepAccommodationScreen: React.FC<StepAccommodationScreenProps> = ({
  step
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<StepDetailScreenNavigationProp>();

  // Sécurité : vérifier que step existe et que accommodations est un array
  const accommodations = step && Array.isArray((step as any)?.accommodations)
    ? (step as any).accommodations
    : [];

  console.log('🏨 Accommodations Debug:', {
    stepExists: !!step,
    accommodationsCount: accommodations.length,
    accommodationsType: typeof accommodations
  });

  /**
   * Navigation vers l'édition d'un accommodation
   */
  const handleEditAccommodation = useCallback((accommodation: any) => {
    if (!accommodation?._id || !step?._id) {
      Alert.alert('Erreur', 'Impossible d\'éditer cet hébergement');
      return;
    }

    console.log('📝 Navigation vers édition accommodation:', {
      stepId: step._id,
      accommodationId: accommodation._id,
      name: accommodation.name
    });

    navigation.navigate('EditAccommodation', {
      stepId: step._id,
      accommodationId: accommodation._id
    });
  }, [step, navigation]);

  /**
   * Supprimer un accommodation avec confirmation
   */
  const handleDeleteAccommodation = useCallback((accommodation: any) => {
    if (!accommodation?._id || !step?._id) {
      Alert.alert('Erreur', 'Impossible de supprimer cet hébergement');
      return;
    }

    Alert.alert(
      'Supprimer l\'hébergement',
      `Êtes-vous sûr de vouloir supprimer "${accommodation.name || 'cet hébergement'}" ?\n\nCette action est irréversible.`,
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
              // TODO: Implémenter la suppression via hook
              console.log('🗑️ Suppression accommodation:', {
                stepId: step._id,
                accommodationId: accommodation._id,
                name: accommodation.name
              });

              // Placeholder pour l'implémentation de la suppression
              Alert.alert('À implémenter', 'Suppression d\'hébergement - fonctionnalité à venir');
            } catch (error) {
              console.error('Erreur suppression accommodation:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'hébergement');
            }
          }
        }
      ]
    );
  }, [step]);

  if (accommodations.length === 0) {
    return (
      <View style={stepDetailStyles.emptyState}>
        <Ionicons name="bed-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={[stepDetailStyles.emptyText, { color: theme.colors.textSecondary }]}>
          Aucun hébergement
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={stepDetailStyles.tabContent}>
      {accommodations
        .filter((accommodation: any) => accommodation && accommodation._id) // Filtrer les accommodations valides
        .sort((a: any, b: any) => {
          // Tri par date de début (startDateTime) croissante
          const aDateTime = a.startDateTime || a.arrivalDateTime;
          const bDateTime = b.startDateTime || b.arrivalDateTime;
          
          if (!aDateTime && !bDateTime) return 0;
          if (!aDateTime) return 1; // Mettre les hébergements sans date à la fin
          if (!bDateTime) return -1;
          
          return new Date(aDateTime).getTime() - new Date(bDateTime).getTime();
        })
        .map((accommodation: any, index: number) => (
          <View key={accommodation._id || index} style={[stepDetailStyles.infoCard, { backgroundColor: theme.colors.surface }]}>

            {/* Nom de l'accommodation au-dessus du thumbnail - Style identique à l'onglet Infos */}
            <Text style={[stepDetailStyles.title, { color: theme.colors.text }]}>
              {accommodation.name || `Hébergement ${index + 1}`}
            </Text>

            {/* Thumbnail avec menu d'actions - Structure identique à l'onglet Infos */}
            {(() => {
              const imageUri = getImageUri(accommodation.thumbnail);
              const hasAddress = Boolean(accommodation.address?.trim());

              if (imageUri && typeof imageUri === 'string' && imageUri.length > 0) {
                return (
                  <View style={stepDetailStyles.thumbnailContainer}>
                    <TouchableOpacity
                      style={stepDetailStyles.stepThumbnail}
                      onPress={() => handleEditAccommodation(accommodation)}
                      activeOpacity={0.8}
                    >
                      {isValidImageUri(imageUri) ? (
                        <SafeImage
                          thumbnail={accommodation.thumbnail}
                          style={stepDetailStyles.stepThumbnail}
                          placeholderIcon="bed-outline"
                          theme={theme}
                        />
                      ) : (
                        <View style={[stepDetailStyles.stepThumbnail, stepDetailStyles.placeholderImage, { backgroundColor: '#f0f0f0' }]}>
                          <Ionicons name="bed-outline" size={32} color={theme.colors.textSecondary} />
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
                    {/* Bouton supprimer avec confirmation */}
                    <TouchableOpacity
                      style={stepDetailStyles.thumbnailDeleteButton}
                      onPress={() => handleDeleteAccommodation(accommodation)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                );
              } else {
                return (
                  <View style={stepDetailStyles.thumbnailContainer}>
                    <TouchableOpacity
                      style={[stepDetailStyles.stepThumbnailPlaceholder, stepDetailStyles.placeholderImage]}
                      onPress={() => handleEditAccommodation(accommodation)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="bed-outline" size={32} color={theme.colors.textSecondary} />
                      <Text style={[stepDetailStyles.placeholderText, { color: theme.colors.textSecondary }]}>
                        Appuyer pour ajouter une photo
                      </Text>
                    </TouchableOpacity>
                    {/* Badge pour adresse manquante */}
                    <BadgeContainer
                      hasAddress={hasAddress}
                      position="top-right"
                    />
                    {/* Bouton supprimer pour placeholder */}
                    <TouchableOpacity
                      style={stepDetailStyles.thumbnailDeleteButtonPlaceholder}
                      onPress={() => handleDeleteAccommodation(accommodation)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                );
              }
            })()}

            {/* Adresse - Style identique à l'onglet Infos */}
            {accommodation.address && (
              <View style={stepDetailStyles.addressRow}>
                <Ionicons name="location" size={16} color={theme.colors.primary} />
                <Text style={[stepDetailStyles.address, { color: theme.colors.textSecondary }]}>
                  {accommodation.address}
                </Text>
              </View>
            )}

            {/* Dates de séjour - Style identique aux dates de l'onglet Infos */}
            {(accommodation.startDateTime || accommodation.arrivalDateTime) && (
              <View style={stepDetailStyles.dateRow}>
                <Ionicons name="log-in" size={16} color="#28a745" />
                <Text style={[stepDetailStyles.dateLabel, { color: theme.colors.textSecondary }]}>
                  Check-in:
                </Text>
                <Text style={[stepDetailStyles.dateValue, { color: theme.colors.text }]}>
                  {formatItemDate(accommodation.startDateTime || accommodation.arrivalDateTime)}
                </Text>
              </View>
            )}

            {(accommodation.endDateTime || accommodation.departureDateTime) && (
              <View style={stepDetailStyles.dateRow}>
                <Ionicons name="log-out" size={16} color="#dc3545" />
                <Text style={[stepDetailStyles.dateLabel, { color: theme.colors.textSecondary }]}>
                  Check-out:
                </Text>
                <Text style={[stepDetailStyles.dateValue, { color: theme.colors.text }]}>
                  {formatItemDate(accommodation.endDateTime || accommodation.departureDateTime)}
                </Text>
              </View>
            )}

            {/* Notes/Description */}
            {accommodation.notes && (
              <View style={stepDetailStyles.descriptionSection}>
                <Text style={[stepDetailStyles.sectionTitle, { color: theme.colors.text }]}>
                  Notes
                </Text>
                <Text style={[stepDetailStyles.description, { color: theme.colors.text }]}>
                  {accommodation.notes}
                </Text>
              </View>
            )}

            {/* Boutons d'action - Uniquement si au moins un bouton est disponible */}
            {(accommodation.website || hasValidCoordinates(accommodation)) && (
              <View style={stepDetailStyles.activityActionButtons}>
                {/* Bouton Site Web - Si disponible */}
                {accommodation.website && (
                  <TouchableOpacity
                    style={stepDetailStyles.activityActionIcon}
                    onPress={() => handleOpenWebsite(accommodation.website, accommodation.name)}
                  >
                    <Ionicons name="globe-outline" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}

                {/* Bouton Google Maps - Si coordonnées disponibles */}
                {hasValidCoordinates(accommodation) && (
                  <TouchableOpacity
                    style={stepDetailStyles.activityActionIcon}
                    onPress={() => handleOpenMaps(accommodation)}
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
