/**
 * Écran de détail d'une étape avec support offline-first
 * Affichage complet des informations, activités et hébergements
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Animated,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

import { useTheme, useDataRefresh } from '../../contexts';
import { useStepDetail } from '../../hooks/useStepDetail';
import type { Step } from '../../types';
import type { ApiStep } from '../../services/api/roadtrips';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';
import { formatDateWithoutTimezone, parseISODate } from '../../utils';
import { GoogleMap } from '../../components/common';

const { width, height } = Dimensions.get('window');

type StepDetailScreenNavigationProp = NativeStackNavigationProp<RoadtripsStackParamList, 'StepDetail'>;

interface RouteParams {
  stepId: string;
  roadtripId: string;
}

interface TabRoute {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

const StepDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const { lastStepUpdate } = useDataRefresh();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StepDetailScreenNavigationProp>();
  const route = useRoute();
  const { stepId, roadtripId } = route.params as RouteParams;

  // Hook offline-first pour les détails de l'étape
  const {
    step,
    loading,
    syncing,
    error,
    fetchStepDetail,
    refreshStepDetail
  } = useStepDetail(stepId);

  // Référence stable pour fetchStepDetail
  const fetchStepDetailRef = useRef(fetchStepDetail);
  fetchStepDetailRef.current = fetchStepDetail;

  // États pour les onglets
  const [tabIndex, setTabIndex] = useState(0);
  const [routes, setRoutes] = useState<TabRoute[]>([
    { key: 'info', title: 'Infos', icon: 'information-circle' },
  ]);

  console.log('🔍 StepDetailScreen - stepId reçu:', {
    stepId,
    stepIdType: typeof stepId,
    stepIdLength: stepId?.length,
    isValidObjectId: /^[0-9a-fA-F]{24}$/.test(stepId),
    roadtripId,
    roadtripIdType: typeof roadtripId
  });
  // Debug réduit pour éviter les re-renders excessifs
  // console.log('🔧 StepDetailScreen - États:', { 
  //   hasStep: !!step, 
  //   loading, 
  //   syncing, 
  //   error: !!error,
  //   stepName: step?.title 
  // });

  /**
   * Fonction pour extraire l'URI de l'image depuis l'objet thumbnail
   */
  const getImageUri = (thumbnail: any): string | null => {
    console.log('🖼️ StepDetailScreen - getImageUri - thumbnail reçu:', {
      type: typeof thumbnail,
      value: thumbnail,
      hasUrl: thumbnail?.url,
      hasUri: thumbnail?.uri,
      isString: typeof thumbnail === 'string'
    });

    // 🔍 DEBUG: Vérifier si l'URL est déjà corrompue à la réception
    if (thumbnail?.url) {
      console.log('🔍 DEBUG URL AVANT nettoyage:', {
        originalUrl: thumbnail.url,
        hasGGoogleAccessId: thumbnail.url.includes('GGoogleAccessId'),
        hasCorrectGoogleAccessId: thumbnail.url.includes('GoogleAccessId') && !thumbnail.url.includes('GGoogleAccessId')
      });
    }

    if (!thumbnail) {
      console.log('🖼️ StepDetailScreen - getImageUri - thumbnail null/undefined');
      return null;
    }

    // Si c'est déjà une chaîne valide
    if (typeof thumbnail === 'string' && thumbnail.trim().length > 0) {
      const uri = thumbnail.trim();
      console.log('🖼️ StepDetailScreen - getImageUri - string:', uri);
      return uri;
    }

    // Si c'est un objet avec une propriété url (PRIORITÉ selon API)
    if (typeof thumbnail === 'object' && thumbnail !== null) {
      // PRIORITÉ 1: thumbnail.url (selon API)
      if (thumbnail.url && typeof thumbnail.url === 'string' && thumbnail.url.trim().length > 0) {
        // SÉCURITÉ: Nettoyer l'URL pour éviter les corruptions
        const cleanUrl = thumbnail.url.trim()
          .replace(/^https?:\/\/storrage\./, 'https://storage.')  // Corriger "storrage" → "storage"
          .replace(/^htttps:\/\//, 'https://')                    // Corriger "htttps" → "https"
          // CORRECTION: Ne PAS appliquer le nettoyage GGoogleAccessId car l'URL est déjà propre
          // .replace(/GGoogleAccessId/g, 'GoogleAccessId');         // DÉSACTIVÉ - causait la corruption
        
        console.log('🖼️ StepDetailScreen - getImageUri - object.url (API):', cleanUrl);
        return cleanUrl;
      }

      // PRIORITÉ 2: thumbnail.uri (fallback)
      if (thumbnail.uri && typeof thumbnail.uri === 'string' && thumbnail.uri.trim().length > 0) {
        const uri = thumbnail.uri.trim();
        console.log('🖼️ StepDetailScreen - getImageUri - object.uri (fallback):', uri);
        return uri;
      }

      // PRIORITÉ 3: Si l'objet a d'autres propriétés, les logger pour debug
      console.warn('🖼️ StepDetailScreen - getImageUri - Objet thumbnail sans url/uri:', {
        keys: Object.keys(thumbnail),
        thumbnail
      });
    }

    console.log('🖼️ StepDetailScreen - getImageUri - Aucun format reconnu pour:', thumbnail);
    return null;
  };

  /**
   * Validation stricte de l'URI pour éviter les erreurs de casting
   */
  const isValidImageUri = (uri: any): uri is string => {
    if (typeof uri !== 'string' || uri.length === 0) {
      console.warn('🖼️ URI invalide - pas une string ou vide:', {
        uri,
        type: typeof uri,
        isString: typeof uri === 'string',
        hasLength: uri?.length > 0
      });
      return false;
    }

    // Vérifier que l'URI commence bien par un protocole valide
    const hasValidProtocol = uri.startsWith('http://') || uri.startsWith('https://') || 
                             uri.startsWith('file://') || uri.startsWith('data:');

    if (!hasValidProtocol) {
      console.warn('🖼️ URI invalide - protocole invalide:', {
        uri,
        startsWithHttp: uri.startsWith('http'),
        startsWithHttps: uri.startsWith('https'),
        startsWithFile: uri.startsWith('file'),
        startsWithData: uri.startsWith('data')
      });
      return false;
    }

    // Vérifier qu'il n'y a pas de caractères corrompus typiques
    const hasCorruption = uri.includes('storrage.') ||      // "storrage" au lieu de "storage"
                          uri.includes('htttps://') ||      // "htttps" au lieu de "https"
                          uri.includes('GGoogleAccessId');  // "GGoogleAccessId" au lieu de "GoogleAccessId"

    if (hasCorruption) {
      console.warn('🖼️ URI détectée comme corrompue:', {
        uri,
        hasStorrage: uri.includes('storrage.'),
        hasTripleT: uri.includes('htttps://'),
        hasDoubleG: uri.includes('GGoogleAccessId')
      });
      return false;
    }

    return true;
  };

  /**
   * Composant sécurisé pour le rendu d'images
   */
  const SafeImage: React.FC<{
    thumbnail: any;
    style: any;
    placeholderIcon: keyof typeof Ionicons.glyphMap;
    onError?: (error: any) => void;
  }> = ({ thumbnail, style, placeholderIcon, onError }) => {
    // Sécurité : si pas de thumbnail, retourner directement le placeholder
    if (!thumbnail) {
      console.log('🖼️ SafeImage - Pas de thumbnail, utilisation du placeholder');
      return (
        <View style={[style, styles.placeholderImage]}>
          <Ionicons name={placeholderIcon} size={32} color={theme.colors.textSecondary} />
        </View>
      );
    }

    const imageUri = getImageUri(thumbnail);

    console.log('🖼️ SafeImage - Debug:', {
      thumbnail: typeof thumbnail,
      imageUri: typeof imageUri,
      imageUriValue: imageUri,
      isValidImageUri: imageUri ? isValidImageUri(imageUri) : false
    });

    // Triple validation pour éviter l'erreur de casting
    if (imageUri &&
      typeof imageUri === 'string' &&
      imageUri.length > 0 &&
      isValidImageUri(imageUri) &&
      typeof imageUri !== 'object') { // Sécurité supplémentaire
      return (
        <Image
          source={{ uri: imageUri }}
          style={style}
          resizeMode="cover"
          onError={(error) => {
            console.warn('🖼️ SafeImage - Erreur chargement:', error.nativeEvent.error, 'URI:', imageUri);
            if (onError) onError(error);
          }}
        />
      );
    } else {
      console.log('🖼️ SafeImage - Utilisation du placeholder car URI invalide');
      return (
        <View style={[style, styles.placeholderImage]}>
          <Ionicons name={placeholderIcon} size={32} color={theme.colors.textSecondary} />
        </View>
      );
    }
  };

  /**
   * Effet pour configurer les onglets selon le contenu de l'étape
   */
  useEffect(() => {
    if (!step) return;

    // Configurer les onglets selon le type d'étape et le contenu
    const newRoutes: TabRoute[] = [
      { key: 'info', title: 'Infos', icon: 'information-circle' },
    ];

    // Ajouter l'onglet Hébergements si c'est une étape Stage avec des accommodations
    const accommodations = (step as any)?.accommodations;
    if (step.type === 'Stage' && Array.isArray(accommodations) && accommodations.length > 0) {
      newRoutes.push({
        key: 'accommodations',
        title: 'Hébergements',
        icon: 'bed',
        badge: accommodations.length
      });
    }

    // Ajouter l'onglet Activités si il y en a
    const activities = (step as any)?.activities;
    if (Array.isArray(activities) && activities.length > 0) {
      newRoutes.push({
        key: 'activities',
        title: 'Activités',
        icon: 'walk',
        badge: activities.length
      });
    }

    setRoutes(newRoutes);
  }, [step]);

  /**
   * Chargement initial avec useFocusEffect pour rechargement au focus
   * ✅ OPTIMISÉ: Rafraîchit seulement au chargement initial
   */
  useFocusEffect(
    useCallback(() => {
      console.log('🔧 StepDetailScreen - useFocusEffect déclenché:', {
        hasStep: !!step,
        loading,
        syncing,
        stepName: step?.title
      });

      // Chargement initial uniquement si pas de step du tout
      if (!step && !loading && !syncing) {
        console.log('🔧 StepDetailScreen - useFocusEffect: Chargement initial des détails');
        fetchStepDetailRef.current();
      }
    }, [step, loading, syncing]) // Dépendances minimales
  );

  /**
   * Effet pour écouter les notifications de mise à jour
   * ✅ SÉCURISÉ: Utilise un timestamp pour éviter les boucles infinies
   */
  useEffect(() => {
    if (lastStepUpdate > 0 && step && !loading && !syncing) {
      console.log('🔔 StepDetailScreen - Notification de mise à jour reçue, rafraîchissement');
      refreshStepDetail(true);
    }
  }, [lastStepUpdate]); // Dépendance uniquement sur le timestamp

  /**
   * Navigation vers l'édition
   */
  const handleEdit = useCallback(() => {
    if (!step?._id) {
      Alert.alert('Erreur', 'Impossible d\'éditer cette étape');
      return;
    }

    console.log('📝 StepDetailScreen - Navigation vers édition:', {
      stepId: step._id,
      roadtripId,
      stepName: step.title
    });

    navigation.navigate('EditStep', {
      stepId: step._id,
      roadtripId
    });
  }, [step, roadtripId, navigation]);

  /**
   * Suppression de l'étape
   */
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Supprimer l\'étape',
      `Êtes-vous sûr de vouloir supprimer "${step?.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert('À implémenter', 'Suppression d\'étape - fonctionnalité à venir');
          }
        }
      ]
    );
  }, [step]);

  /**
   * Menu contextuel pour les actions sur l'étape
   */
  const showActionMenu = useCallback(() => {
    const options = ['Modifier', 'Supprimer', 'Annuler'];
    const destructiveButtonIndex = 1; // Index du bouton "Supprimer"
    const cancelButtonIndex = 2; // Index du bouton "Annuler"

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
          title: step?.title || 'Actions',
          message: 'Que souhaitez-vous faire ?',
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0: // Modifier
              handleEdit();
              break;
            case 1: // Supprimer
              handleDelete();
              break;
            // case 2 est Annuler, ne fait rien
          }
        }
      );
    } else {
      // Pour Android, utiliser Alert avec plusieurs boutons
      Alert.alert(
        step?.title || 'Actions',
        'Que souhaitez-vous faire ?',
        [
          { text: 'Modifier', onPress: handleEdit },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: handleDelete
          },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    }
  }, [step, handleEdit, handleDelete]);

  // SUPPRIMÉ: useEffect double qui causait la boucle infinie
  // Le useFocusEffect gère déjà le chargement initial

  // Mise à jour du loading state - supprimé car géré par le hook

  /**
   * Rendu de l'onglet Informations
   */
  const renderInfoTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={syncing}
          onRefresh={refreshStepDetail}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Informations principales */}
      <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
        {/* Titre simple sans actions */}
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {step?.title || 'Titre non défini'}
        </Text>

        {/* Thumbnail de l'étape avec menu d'actions */}
        {(() => {
          if (!step) return null;

          const imageUri = getImageUri(step?.thumbnail);

          if (imageUri && typeof imageUri === 'string' && imageUri.length > 0) {
            return (
              <View style={styles.thumbnailContainer}>
                {isValidImageUri(imageUri) ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.stepThumbnail}
                    resizeMode="cover"
                    onError={(error) => {
                      console.warn('🖼️ Erreur chargement thumbnail étape:', error.nativeEvent.error, 'URI:', imageUri);
                    }}
                  />
                ) : (
                  <View style={[styles.stepThumbnail, styles.placeholderImage, { backgroundColor: '#f0f0f0' }]}>
                    <Ionicons name="image-outline" size={32} color={theme.colors.textSecondary} />
                    <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                      Image non valide
                    </Text>
                  </View>
                )}
                {/* Menu d'actions (3 points) */}
                <TouchableOpacity
                  style={styles.thumbnailMenuButton}
                  onPress={showActionMenu}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color="white" />
                </TouchableOpacity>
              </View>
            );
          } else {
            return (
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  style={[styles.stepThumbnailPlaceholder, styles.placeholderImage]}
                  onPress={handleEdit}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={32} color={theme.colors.textSecondary} />
                  <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                    Appuyer pour ajouter une photo
                  </Text>
                </TouchableOpacity>
                {/* Menu d'actions pour placeholder */}
                <TouchableOpacity
                  style={styles.thumbnailMenuButtonPlaceholder}
                  onPress={showActionMenu}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            );
          }
        })()}

        {step?.location?.address && (
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={theme.colors.primary} />
            <Text style={[styles.address, { color: theme.colors.textSecondary }]}>
              {step.location.address}
            </Text>
          </View>
        )}

        {/* Dates */}
        {step?.startDate && (
          <View style={styles.dateRow}>
            <Ionicons name="play-circle" size={16} color="#28a745" />
            <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
              Arrivée:
            </Text>
            <Text style={[styles.dateValue, { color: theme.colors.text }]}>
              {(() => {
                const date = step.startDate;
                return date ? formatDateWithoutTimezone(date) : 'Date invalide';
              })()}
            </Text>
          </View>
        )}

        {step?.endDate && (
          <View style={styles.dateRow}>
            <Ionicons name="stop-circle" size={16} color="#dc3545" />
            <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
              Départ:
            </Text>
            <Text style={[styles.dateValue, { color: theme.colors.text }]}>
              {(() => {
                const date = step.endDate;
                return date ? formatDateWithoutTimezone(date) : 'Date invalide';
              })()}
            </Text>
          </View>
        )}

        {/* Description */}
        {step?.description && (
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Description
            </Text>
            <Text style={[styles.description, { color: theme.colors.text }]}>
              {step.description}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  /**
   * Rendu de l'onglet Hébergements
   */
  const renderAccommodationsTab = () => {
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
    const handleEditAccommodation = (accommodation: any) => {
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
    };

    /**
     * Supprimer un accommodation avec confirmation
     */
    const handleDeleteAccommodation = (accommodation: any) => {
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
    };


    /**
     * Ouvrir une URL externe (site web)
     */
    const handleOpenWebsite = (url: string, name: string) => {
      if (!url) {
        Alert.alert('Information', 'Aucun site web défini pour cet hébergement');
        return;
      }

      // TODO: Implémenter ouverture URL avec Linking
      console.log('🌐 Ouvrir site web:', { url, name });
      Alert.alert('Site web', `Ouverture du site web de ${name}\n${url}`);
    };

    /**
     * Ouvrir dans Google Maps
     */
    const handleOpenMaps = (accommodation: any) => {
      if (!accommodation.latitude || !accommodation.longitude || accommodation.latitude === 0 || accommodation.longitude === 0) {
        Alert.alert('Information', 'Aucune localisation définie pour cet hébergement');
        return;
      }

      const url = `https://www.google.com/maps/search/?api=1&query=${accommodation.latitude},${accommodation.longitude}`;
      // TODO: Implémenter ouverture URL avec Linking
      console.log('🗺️ Ouvrir Google Maps:', { url, name: accommodation.name });
      Alert.alert('Google Maps', `Ouverture dans Google Maps\n${accommodation.name}`);
    };

    return (
      <ScrollView style={styles.tabContent}>
        {accommodations.length > 0 ? (
          accommodations
            .filter((accommodation: any) => accommodation && accommodation._id) // Filtrer les accommodations valides
            .map((accommodation: any, index: number) => (

              <View key={accommodation._id || index} style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>

                {/* Nom de l'accommodation au-dessus du thumbnail - Style identique à l'onglet Infos */}
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {accommodation.name || `Hébergement ${index + 1}`}
                </Text>

                {/* Thumbnail avec menu d'actions - Structure identique à l'onglet Infos */}
                {(() => {
                  const imageUri = getImageUri(accommodation.thumbnail);

                  if (imageUri && typeof imageUri === 'string' && imageUri.length > 0) {
                    return (
                      <View style={styles.thumbnailContainer}>
                        <TouchableOpacity
                          style={styles.stepThumbnail}
                          onPress={() => handleEditAccommodation(accommodation)}
                          activeOpacity={0.8}
                        >
                          {isValidImageUri(imageUri) ? (
                            <SafeImage
                              thumbnail={accommodation.thumbnail}
                              style={styles.stepThumbnail}
                              placeholderIcon="bed-outline"
                            />
                          ) : (
                            <View style={[styles.stepThumbnail, styles.placeholderImage, { backgroundColor: '#f0f0f0' }]}>
                              <Ionicons name="bed-outline" size={32} color={theme.colors.textSecondary} />
                              <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                                Image non valide
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        {/* Bouton supprimer avec confirmation */}
                        <TouchableOpacity
                          style={styles.thumbnailMenuButton}
                          onPress={() => handleDeleteAccommodation(accommodation)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash" size={18} color="white" />
                        </TouchableOpacity>
                      </View>
                    );
                  } else {
                    return (
                      <View style={styles.thumbnailContainer}>
                        <TouchableOpacity
                          style={[styles.stepThumbnailPlaceholder, styles.placeholderImage]}
                          onPress={() => handleEditAccommodation(accommodation)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="bed-outline" size={32} color={theme.colors.textSecondary} />
                          <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                            Appuyer pour ajouter une photo
                          </Text>
                        </TouchableOpacity>
                        {/* Bouton supprimer pour placeholder */}
                        <TouchableOpacity
                          style={styles.thumbnailMenuButtonPlaceholder}
                          onPress={() => handleDeleteAccommodation(accommodation)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash" size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    );
                  }
                })()}

                {/* Adresse - Style identique à l'onglet Infos */}
                {accommodation.address && (
                  <View style={styles.addressRow}>
                    <Ionicons name="location" size={16} color={theme.colors.primary} />
                    <Text style={[styles.address, { color: theme.colors.textSecondary }]}>
                      {accommodation.address}
                    </Text>
                  </View>
                )}

                {/* Dates de séjour - Style identique aux dates de l'onglet Infos */}
                {(accommodation.startDateTime || accommodation.arrivalDateTime) && (
                  <View style={styles.dateRow}>
                    <Ionicons name="log-in" size={16} color="#28a745" />
                    <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                      Check-in:
                    </Text>
                    <Text style={[styles.dateValue, { color: theme.colors.text }]}>
                      {(() => {
                        const dateString = accommodation.startDateTime || accommodation.arrivalDateTime;
                        const date = parseISODate(dateString);
                        const formatted = date ? formatDateWithoutTimezone(date) : 'N/A';
                        return formatted || 'N/A';
                      })()}
                    </Text>
                  </View>
                )}

                {(accommodation.endDateTime || accommodation.departureDateTime) && (
                  <View style={styles.dateRow}>
                    <Ionicons name="log-out" size={16} color="#dc3545" />
                    <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                      Check-out:
                    </Text>
                    <Text style={[styles.dateValue, { color: theme.colors.text }]}>
                      {(() => {
                        const dateString = accommodation.endDateTime || accommodation.departureDateTime;
                        const date = parseISODate(dateString);
                        const formatted = date ? formatDateWithoutTimezone(date) : 'N/A';
                        return formatted || 'N/A';
                      })()}
                    </Text>
                  </View>
                )}

                {/* Notes/Description */}
                {accommodation.notes && (
                  <View style={styles.descriptionSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Notes
                    </Text>
                    <Text style={[styles.description, { color: theme.colors.text }]}>
                      {accommodation.notes}
                    </Text>
                  </View>
                )}

                {/* Boutons d'action discrets - Icônes seulement */}
                {(accommodation.url || (accommodation.latitude && accommodation.longitude && accommodation.latitude !== 0 && accommodation.longitude !== 0)) && (
                  <View style={styles.accommodationActionButtons}>
                    {accommodation.url && (
                      <TouchableOpacity
                        style={styles.accommodationActionIcon}
                        onPress={() => handleOpenWebsite(accommodation.url, accommodation.name)}
                      >
                        <Ionicons name="globe-outline" size={24} color={theme.colors.primary} />
                      </TouchableOpacity>
                    )}

                    {accommodation.latitude && accommodation.longitude && accommodation.latitude !== 0 && accommodation.longitude !== 0 && (
                      <TouchableOpacity
                        style={styles.accommodationActionIcon}
                        onPress={() => handleOpenMaps(accommodation)}
                      >
                        <Ionicons name="map-outline" size={24} color={theme.colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bed-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Aucun hébergement
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  /**
  * Rendu de l'onglet Activités
  */
  const renderActivitiesTab = () => {
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
    const handleEditActivity = (activity: any) => {
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
    };

    /**
     * Supprimer une activité avec confirmation
     */
    const handleDeleteActivity = (activity: any) => {
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
    }

    /**
     * Ouvrir une URL externe (site web) pour une activité
     */
    const handleOpenWebsite = (url: string, name: string) => {
      if (!url) {
        Alert.alert('Information', 'Aucun site web défini pour cette activité');
        return;
      }

      // TODO: Implémenter ouverture URL avec Linking
      console.log('🌐 Ouvrir site web activité:', { url, name });
      Alert.alert('Site web', `Ouverture du site web de ${name}\n${url}`);
    };

    /**
     * Ouvrir dans Google Maps pour une activité
     */
    const handleOpenMaps = (activity: any) => {
      if (!activity.latitude || !activity.longitude || activity.latitude === 0 || activity.longitude === 0) {
        Alert.alert('Information', 'Aucune localisation définie pour cette activité');
        return;
      }

      const url = `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`;
      // TODO: Implémenter ouverture URL avec Linking
      console.log('🗺️ Ouvrir Google Maps activité:', { url, name: activity.name });
      Alert.alert('Google Maps', `Ouverture dans Google Maps\n${activity.name}`);
    };

    return (
      <ScrollView style={styles.tabContent}>
        {activities.length > 0 ? (
          activities
            .filter((activity: any) => activity && activity._id) // Filtrer les activités valides
            .map((activity: any, index: number) => (
              <View key={activity._id || index} style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>

                {/* Nom de l'accommodation au-dessus du thumbnail - Style identique à l'onglet Infos */}
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {activity.name || `Activité ${index + 1}`}
                </Text>

                {/* Thumbnail avec menu d'actions - Structure identique à l'onglet Infos */}
                {(() => {
                  const imageUri = getImageUri(activity.thumbnail);

                  if (imageUri && typeof imageUri === 'string' && imageUri.length > 0) {
                    return (
                      <View style={styles.thumbnailContainer}>
                        <TouchableOpacity
                          style={styles.stepThumbnail}
                          onPress={() => handleEditActivity(activity)}
                          activeOpacity={0.8}
                        >
                          {isValidImageUri(imageUri) ? (
                            <SafeImage
                              thumbnail={activity.thumbnail}
                              style={styles.stepThumbnail}
                              placeholderIcon="walk-outline"
                            />
                          ) : (
                            <View style={[styles.stepThumbnail, styles.placeholderImage, { backgroundColor: '#f0f0f0' }]}>
                              <Ionicons name="walk-outline" size={32} color={theme.colors.textSecondary} />
                              <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                                Image non valide
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        {/* Bouton supprimer avec confirmation */}
                        <TouchableOpacity
                          style={styles.thumbnailMenuButton}
                          onPress={() => handleDeleteActivity(activity)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash" size={18} color="white" />
                        </TouchableOpacity>
                      </View>
                    );
                  } else {
                    return (
                      <View style={styles.thumbnailContainer}>
                        <TouchableOpacity
                          style={[styles.stepThumbnailPlaceholder, styles.placeholderImage]}
                          onPress={() => handleEditActivity(activity)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="walk-outline" size={32} color={theme.colors.textSecondary} />
                          <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                            Appuyer pour ajouter une photo
                          </Text>
                        </TouchableOpacity>
                        {/* Bouton supprimer pour placeholder */}
                        <TouchableOpacity
                          style={styles.thumbnailMenuButtonPlaceholder}
                          onPress={() => handleDeleteActivity(activity)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash" size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    );
                  }
                })()}

                {/* Type d'activité */}
                {activity.type && (
                  <Text style={[styles.itemType, { color: theme.colors.primary }]}>
                    {(() => {
                      const typeMap: { [key: string]: string } = {
                        'hiking': '🥾 Randonnée',
                        'visit': '🏛️ Visite',
                        'restaurant': '🍽️ Restaurant',
                        'accommodation': '🏨 Hébergement',
                        'transport': '🚗 Transport'
                      };
                      return typeMap[activity.type] || activity.type;
                    })()}
                  </Text>
                )}

                {activity.address && (
                  <Text style={[styles.itemAddress, { color: theme.colors.textSecondary }]}>
                    {activity.address}
                  </Text>
                )}

                {/* Dates d'activité - Style identique aux dates de l'onglet Infos */}
                {(activity.startDateTime || activity.arrivalDateTime) && (
                  <View style={styles.dateRow}>
                    <Ionicons name="log-in" size={16} color="#28a745" />
                    <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                      Début:
                    </Text>
                    <Text style={[styles.dateValue, { color: theme.colors.text }]}>
                      {(() => {
                        const dateString = activity.startDateTime || activity.arrivalDateTime;
                        const date = parseISODate(dateString);
                        const formatted = date ? formatDateWithoutTimezone(date) : 'N/A';
                        return formatted || 'N/A';
                      })()}
                    </Text>
                  </View>
                )}

                {(activity.endDateTime || activity.departureDateTime) && (
                  <View style={styles.dateRow}>
                    <Ionicons name="log-out" size={16} color="#dc3545" />
                    <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                      Fin:
                    </Text>
                    <Text style={[styles.dateValue, { color: theme.colors.text }]}>
                      {(() => {
                        const dateString = activity.endDateTime || activity.departureDateTime;
                        const date = parseISODate(dateString);
                        const formatted = date ? formatDateWithoutTimezone(date) : 'N/A';
                        return formatted || 'N/A';
                      })()}
                    </Text>
                  </View>
                )}

                {/* Notes/Description */}
                {activity.notes && (
                  <View style={styles.descriptionSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Notes
                    </Text>
                    <Text style={[styles.description, { color: theme.colors.text }]}>
                      {activity.notes}
                    </Text>
                  </View>
                )}


                {/* Boutons d'action discrets - Icônes seulement */}
                {(activity.url || (activity.latitude && activity.longitude && activity.latitude !== 0 && activity.longitude !== 0)) && (
                  <View style={styles.activityActionButtons}>
                    {activity.url && (
                      <TouchableOpacity
                        style={styles.activityActionIcon}
                        onPress={() => handleOpenWebsite(activity.url, activity.name)}
                      >
                        <Ionicons name="globe-outline" size={24} color={theme.colors.primary} />
                      </TouchableOpacity>
                    )}

                    {activity.latitude && activity.longitude && activity.latitude !== 0 && activity.longitude !== 0 && (
                      <TouchableOpacity
                        style={styles.activityActionIcon}
                        onPress={() => handleOpenMaps(activity)}
                      >
                        <Ionicons name="map-outline" size={24} color={theme.colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="walk-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Aucune activité
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  /**
   * Configuration des scènes pour TabView
   */
  const renderScene = SceneMap({
    info: renderInfoTab,
    accommodations: renderAccommodationsTab,
    activities: renderActivitiesTab,
  });

  /**
   * Rendu personnalisé de la barre d'onglets
   */
  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]}
      style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}
      labelStyle={[styles.tabLabel, { color: theme.colors.text }]}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.textSecondary}
      renderIcon={({ route, focused, color }: { route: TabRoute; focused: boolean; color: string }) => (
        <View style={styles.tabIconContainer}>
          <Ionicons
            name={route.icon}
            size={20}
            color={color}
          />
          {route.badge && route.badge > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: theme.colors.danger }]}>
              <Text style={styles.tabBadgeText}>{route.badge}</Text>
            </View>
          )}
        </View>
      )}
      renderLabel={({ route, focused, color }: { route: TabRoute; focused: boolean; color: string }) => (
        <Text style={[styles.tabLabel, { color, fontSize: focused ? 12 : 11 }]}>
          {route.title}
        </Text>
      )}
    />
  );

  /**
   * Rendu du header personnalisé
   */
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.colors.primary }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Text style={[styles.headerTitleText, { color: theme.colors.white }]} numberOfLines={1}>
            {step?.title || 'Détail de l\'étape'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.white }]}>
            {step?.type === 'Stage' ? 'Étape' : 'Arrêt'}
          </Text>
        </View>
      </View>
    </View>
  );

  // États de chargement et d'erreur
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Chargement des détails...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={theme.colors.danger} />
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => refreshStepDetail()}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.white }]}>
              Réessayer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}

      {/* Carte commune au-dessus des onglets */}
      {step?.location?.latitude && step?.location?.longitude && (
        <View style={styles.globalMapContainer}>
          {(() => {
            const accommodations = step ? (step as any)?.accommodations || [] : [];
            const activities = step ? (step as any)?.activities || [] : [];

            const markers = [
              // Marqueur principal pour l'étape (drapeau bleu)
              {
                id: 'main-step',
                latitude: step.location.latitude,
                longitude: step.location.longitude,
                title: step.title || 'Étape',
                description: step.location.address,
                type: 'step' as const,
              },
              // Marqueurs pour les hébergements (lit vert)
              ...accommodations
                .filter((acc: any) => acc.latitude && acc.longitude && acc.latitude !== 0 && acc.longitude !== 0)
                .map((acc: any, index: number) => ({
                  id: `accommodation-${index}`,
                  latitude: acc.latitude!,
                  longitude: acc.longitude!,
                  title: acc.name || `Hébergement ${index + 1}`,
                  description: acc.address,
                  type: 'accommodation' as const,
                })),
              // Marqueurs pour les activités (icônes selon type)
              ...activities
                .filter((act: any) => act.latitude && act.longitude && act.latitude !== 0 && act.longitude !== 0)
                .map((act: any, index: number) => {
                  // Déterminer le type d'activité pour l'icône appropriée
                  let activityType = 'activity'; // par défaut
                  if (act.type) {
                    // Mapper les types d'activités aux types de marqueurs
                    console.log('🗺️ Mapping type activité:', {
                      originalType: act.type,
                      normalizedType: act.type.toLowerCase()
                    });

                    switch (act.type.toLowerCase()) {
                      case 'hiking':
                      case 'randonnée':
                      case 'randonnee':
                        activityType = 'hiking';
                        break;
                      case 'transport':
                      case 'voiture':
                      case 'car':
                        activityType = 'transport';
                        break;
                      case 'visit':
                      case 'visite':
                      case 'museum':
                      case 'monument':
                        activityType = 'visit';
                        break;
                      case 'restaurant':
                      case 'food':
                      case 'repas':
                        activityType = 'restaurant';
                        break;
                      case 'courses':
                      case 'shopping':
                        activityType = 'courses';
                        break;
                      default:
                        activityType = 'activity';
                    }

                    console.log('🗺️ Type mapping result:', {
                      originalType: act.type,
                      mappedType: activityType
                    });
                  }

                  return {
                    id: `activity-${index}`,
                    latitude: act.latitude!,
                    longitude: act.longitude!,
                    title: act.name || `Activité ${index + 1}`,
                    description: act.address,
                    // Pas de couleur fixe - laisser GoogleMap déterminer selon le type
                    type: activityType as any,
                  };
                }),
            ];

            console.log('🗺️ StepDetailScreen - Markers pour carte:', {
              totalMarkers: markers.length,
              mainStep: 1,
              accommodations: accommodations.filter((acc: any) => acc.latitude && acc.longitude && acc.latitude !== 0 && acc.longitude !== 0).length,
              activities: activities.filter((act: any) => act.latitude && act.longitude && act.latitude !== 0 && act.longitude !== 0).length,
              allMarkers: markers.map(m => ({ id: m.id, title: m.title, lat: m.latitude, lng: m.longitude }))
            });

            return (
              <GoogleMap
                // title="Vue d'ensemble"
                latitude={step.location.latitude}
                longitude={step.location.longitude}
                // address={step.location.address}
                height={250}
                markers={markers}
                showControls={true}
                enableFitBounds={true}
                style={styles.globalMap}
                onFullScreen={() => {
                  // TODO: Implémenter la vue carte plein écran
                  console.log('🗺️ Ouverture carte plein écran');
                }}
              />
            );
          })()}
        </View>
      )}

      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setTabIndex}
        initialLayout={{ width }}
        style={styles.tabView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
    marginLeft: 12,
  },

  // États de chargement/erreur
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // TabView
  tabView: {
    flex: 1,
  },
  tabBar: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabIndicator: {
    height: 3,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'none',
    marginTop: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Contenu des onglets
  tabContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // Image principale
  mainImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Carte d'informations
  infoCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  thumbnailContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  stepThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  stepThumbnailPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  thumbnailMenuButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailMenuButtonPlaceholder: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  address: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    minWidth: 60,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  descriptionSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },

  // Cartes d'éléments (activités/hébergements)
  itemCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  itemAddress: {
    fontSize: 14,
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLeft: {
    fontSize: 14,
    flex: 1,
    textAlign: 'left',
  },
  dateRight: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // État vide
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },

  // Carte globale
  globalMapContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  globalMap: {
    marginBottom: 0,
  },

  // Boutons d'action pour cards
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cardActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardActionButtonPrimary: {
    backgroundColor: '#2196F3',
  },
  cardActionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  cardActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cardActionButtonTextSecondary: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },

  // Styles spécifiques pour accommodations - Boutons d'action discrets uniquement
  accommodationActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  accommodationActionIcon: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },

  //Styles spécifiques pour activities - Boutons d'action discrets uniquement
  activityActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  activityActionIcon: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
});

export default StepDetailScreen;
