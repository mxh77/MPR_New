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
    console.log('🖼️ StepDetailScreen - getImageUri - thumbnail reçu:', typeof thumbnail, thumbnail);
    
    if (!thumbnail) {
      console.log('🖼️ StepDetailScreen - getImageUri - thumbnail null/undefined');
      return null;
    }
    
    // Si c'est déjà une chaîne valide
    if (typeof thumbnail === 'string' && thumbnail.trim().length > 0) {
      console.log('🖼️ StepDetailScreen - getImageUri - string:', thumbnail);
      return thumbnail.trim();
    }
    
    // Si c'est un objet avec une propriété url (structure API)
    if (typeof thumbnail === 'object' && thumbnail !== null) {
      if (thumbnail.url && typeof thumbnail.url === 'string' && thumbnail.url.trim().length > 0) {
        console.log('🖼️ StepDetailScreen - getImageUri - object.url:', thumbnail.url);
        return thumbnail.url.trim();
      }
      
      // Si c'est un objet avec une propriété uri
      if (thumbnail.uri && typeof thumbnail.uri === 'string' && thumbnail.uri.trim().length > 0) {
        console.log('🖼️ StepDetailScreen - getImageUri - object.uri:', thumbnail.uri);
        return thumbnail.uri.trim();
      }
    }
    
    console.log('🖼️ StepDetailScreen - getImageUri - Aucun format reconnu pour:', thumbnail);
    return null;
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
    const imageUri = getImageUri(thumbnail);
    
    if (imageUri && typeof imageUri === 'string' && imageUri.length > 0) {
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
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {step?.title || 'Titre non défini'}
        </Text>
        
        {/* Thumbnail de l'étape intégré dans la card */}
        {(() => {
          if (!step) return null;
          
          const imageUri = getImageUri(step?.thumbnail);
          
          if (imageUri && typeof imageUri === 'string' && imageUri.length > 0) {
            return (
              <Image
                source={{ uri: imageUri }}
                style={styles.stepThumbnail}
                resizeMode="cover"
                onError={(error) => {
                  console.warn('🖼️ Erreur chargement thumbnail étape:', error.nativeEvent.error);
                }}
              />
            );
          }
          return null;
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

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleEdit}
          >
            <Ionicons name="pencil" size={16} color={theme.colors.white} />
            <Text style={[styles.actionButtonText, { color: theme.colors.white }]}>
              Modifier
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.danger }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={16} color={theme.colors.white} />
            <Text style={[styles.actionButtonText, { color: theme.colors.white }]}>
              Supprimer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  /**
   * Rendu de l'onglet Hébergements
   */
  const renderAccommodationsTab = () => {
    const accommodations = step ? (step as any)?.accommodations || [] : [];
    
    return (
      <ScrollView style={styles.tabContent}>
        {accommodations.length > 0 ? (
          accommodations.map((accommodation: any, index: number) => (
            <View key={accommodation._id || index} style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
              {/* Thumbnail de l'hébergement */}
              <SafeImage 
                thumbnail={accommodation.thumbnail}
                style={styles.itemImage}
                placeholderIcon="bed-outline"
              />
              
              <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                {accommodation.name || `Hébergement ${index + 1}`}
              </Text>
              {accommodation.address && (
                <Text style={[styles.itemAddress, { color: theme.colors.textSecondary }]}>
                  {accommodation.address}
                </Text>
              )}
              
              {/* Affichage des dates - alignement horizontal */}
              {(accommodation.startDateTime || accommodation.arrivalDateTime || accommodation.endDateTime || accommodation.departureDateTime) && (
                <View style={styles.dateContainer}>
                  {(accommodation.startDateTime || accommodation.arrivalDateTime) && (
                    <Text style={[styles.dateLeft, { color: theme.colors.textSecondary }]}>
                      Début : {(() => {
                        const dateString = accommodation.startDateTime || accommodation.arrivalDateTime;
                        const date = parseISODate(dateString);
                        return date ? formatDateWithoutTimezone(date) : 'N/A';
                      })()}
                    </Text>
                  )}
                  {(accommodation.endDateTime || accommodation.departureDateTime) && (
                    <Text style={[styles.dateRight, { color: theme.colors.textSecondary }]}>
                      Fin : {(() => {
                        const dateString = accommodation.endDateTime || accommodation.departureDateTime;
                        const date = parseISODate(dateString);
                        return date ? formatDateWithoutTimezone(date) : 'N/A';
                      })()}
                    </Text>
                  )}
                </View>
              )}
              {accommodation.active !== undefined && (
                <View style={styles.statusRow}>
                  <Ionicons 
                    name={accommodation.active ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={accommodation.active ? "#28a745" : "#dc3545"} 
                  />
                  <Text style={{ color: accommodation.active ? "#28a745" : "#dc3545" }}>
                    {accommodation.active ? "Actif" : "Inactif"}
                  </Text>
                </View>
              )}
              
              {/* Boutons d'action */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.cardActionButton, styles.cardActionButtonPrimary]}
                  onPress={() => {
                    // TODO: Ouvrir site web de l'hébergement
                    console.log('Ouvrir site web:', accommodation.name);
                  }}
                >
                  <Text style={styles.cardActionButtonText}>Ouvrir Site Web</Text>
                </TouchableOpacity>
                
                {accommodation.latitude && accommodation.longitude && (
                  <TouchableOpacity 
                    style={[styles.cardActionButton, styles.cardActionButtonSecondary]}
                    onPress={() => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${accommodation.latitude},${accommodation.longitude}`;
                      // TODO: Ouvrir URL externe
                      console.log('Ouvrir Google Maps:', url);
                    }}
                  >
                    <Text style={styles.cardActionButtonTextSecondary}>Ouvrir dans Google Maps</Text>
                  </TouchableOpacity>
                )}
              </View>
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
    const activities = step ? (step as any)?.activities || [] : [];
    
    return (
      <ScrollView style={styles.tabContent}>
        {activities.length > 0 ? (
          // Tri : actives d'abord, puis par startDateTime croissant
          [...activities]
        .sort((a: any, b: any) => {
          // Actives d'abord
          if (a.active === b.active) {
            // Dates croissantes (nulls en dernier)
            const aDate = a.startDateTime ? new Date(a.startDateTime).getTime() : Infinity;
            const bDate = b.startDateTime ? new Date(b.startDateTime).getTime() : Infinity;
            return aDate - bDate;
          }
          return b.active ? 1 : -1;
        })
        .map((activity: any, index: number) => (
          <View key={activity._id || index} style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
            {/* Thumbnail de l'activité */}
            <SafeImage 
              thumbnail={activity.thumbnail}
              style={styles.itemImage}
              placeholderIcon="walk-outline"
            />
            
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
          {activity.name || `Activité ${index + 1}`}
            </Text>
            {activity.type && (
          <Text style={[styles.itemType, { color: theme.colors.primary }]}>
            {activity.type}
          </Text>
            )}
            {activity.address && (
          <Text style={[styles.itemAddress, { color: theme.colors.textSecondary }]}>
            {activity.address}
          </Text>
            )}
            
            {/* Affichage des dates - alignement horizontal */}
            {(activity.startDateTime || activity.endDateTime) && (
              <View style={styles.dateContainer}>
                {activity.startDateTime && (
                  <Text style={[styles.dateLeft, { color: theme.colors.textSecondary }]}>
                    Début : {(() => {
                      const date = parseISODate(activity.startDateTime);
                      return date ? formatDateWithoutTimezone(date) : 'N/A';
                    })()}
                  </Text>
                )}
                {activity.endDateTime && (
                  <Text style={[styles.dateRight, { color: theme.colors.textSecondary }]}>
                    Fin : {(() => {
                      const date = parseISODate(activity.endDateTime);
                      return date ? formatDateWithoutTimezone(date) : 'N/A';
                    })()}
                  </Text>
                )}
              </View>
            )}
            {activity.active !== undefined && (
          <View style={styles.statusRow}>
            <Ionicons
              name={activity.active ? "checkmark-circle" : "close-circle"}
              size={16}
              color={activity.active ? "#28a745" : "#dc3545"}
            />
            <Text style={{ color: activity.active ? "#28a745" : "#dc3545" }}>
              {activity.active ? "Actif" : "Inactif"}
            </Text>
          </View>
            )}
            
            {/* Boutons d'action */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.cardActionButton, styles.cardActionButtonPrimary]}
                onPress={() => {
                  // TODO: Ouvrir site web de l'activité
                  console.log('Ouvrir site web:', activity.name);
                }}
              >
                <Text style={styles.cardActionButtonText}>Ouvrir Site Web</Text>
              </TouchableOpacity>
              
              {activity.latitude && activity.longitude && (
                <TouchableOpacity 
                  style={[styles.cardActionButton, styles.cardActionButtonSecondary]}
                  onPress={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`;
                    // TODO: Ouvrir URL externe
                    console.log('Ouvrir Google Maps:', url);
                  }}
                >
                  <Text style={styles.cardActionButtonTextSecondary}>Ouvrir dans Google Maps</Text>
                </TouchableOpacity>
              )}
            </View>
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
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleEdit}
        >
          <Ionicons name="pencil" size={20} color={theme.colors.white} />
        </TouchableOpacity>
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
                color: '#2196F3', // Bleu pour l'étape principale
                type: 'step' as const,
              },
              // Marqueurs pour les hébergements (lit vert)
              ...accommodations
                .filter((acc: any) => acc.latitude && acc.longitude)
                .map((acc: any, index: number) => ({
                  id: `accommodation-${index}`,
                  latitude: acc.latitude!,
                  longitude: acc.longitude!,
                  title: acc.name || `Hébergement ${index + 1}`,
                  description: acc.address,
                  color: '#4CAF50', // Vert pour hébergements
                  type: 'accommodation' as const,
                })),
              // Marqueurs pour les activités (icônes selon type)
              ...activities
                .filter((act: any) => act.latitude && act.longitude)
                .map((act: any, index: number) => {
                  // Déterminer le type d'activité pour l'icône appropriée
                  let activityType = 'activity'; // par défaut
                  if (act.type) {
                    // Mapper les types d'activités aux types de marqueurs
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
                  }
                  
                  return {
                    id: `activity-${index}`,
                    latitude: act.latitude!,
                    longitude: act.longitude!,
                    title: act.name || `Activité ${index + 1}`,
                    description: act.address,
                    color: '#FF9800', // Orange pour activités
                    type: activityType as any,
                  };
                }),
            ];
            
            console.log('🗺️ StepDetailScreen - Markers pour carte:', {
              totalMarkers: markers.length,
              mainStep: 1,
              accommodations: accommodations.filter((acc: any) => acc.latitude && acc.longitude).length,
              activities: activities.filter((act: any) => act.latitude && act.longitude).length,
              allMarkers: markers.map(m => ({ id: m.id, title: m.title, lat: m.latitude, lng: m.longitude }))
            });
            
            return (
              <GoogleMap
                title="Vue d'ensemble"
                latitude={step.location.latitude}
                longitude={step.location.longitude}
                address={step.location.address}
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
  placeholderText: {
    fontSize: 14,
    marginTop: 8,
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
  stepThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
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
  actionsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
});

export default StepDetailScreen;
