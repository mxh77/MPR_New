/**
 * Écran de détail d'une étape avec support offline-first - VERSION REFACTORISÉE
 * Squelette global avec navigation par onglets vers les composants spécialisés
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

import { useTheme, useDataRefresh } from '../../contexts';
import { useStepDetail } from '../../hooks/useStepDetail';
import { useSteps } from '../../hooks/useSteps';
import type { Step } from '../../types';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';
import { GoogleMap } from '../../components/common';
import { mapActivityTypeForMarker, hasValidCoordinates } from '../../utils/stepDetailHelpers';

// Import des composants d'onglets
import { StepInfoScreen } from './StepInfoScreen';
import { StepAccommodationScreen } from './StepAccommodationScreen';
import { StepActivitiesScreen } from './StepActivitiesScreen';

const { width } = Dimensions.get('window');

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
  const { lastStepUpdate, notifyStepUpdate } = useDataRefresh();
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

  // Hook pour la suppression d'étapes
  const { deleteStepOptimistic } = useSteps(roadtripId);

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
      console.log('🔔 StepDetailScreen - Notification de mise à jour reçue, rafraîchissement LOCAL uniquement');
      // ✅ CORRECTION: Ne pas forcer la sync API après update local pour éviter d'écraser les nouvelles données
      refreshStepDetail(false); // false = reload local seulement, pas de sync API
    }
  }, [lastStepUpdate]); // Dépendance uniquement sur le timestamp

  /**
   * Gestionnaire de suppression d'étape avec confirmation
   */
  const handleDeleteStep = useCallback(async () => {
    if (!step) return;

    Alert.alert(
      'Supprimer l\'étape',
      `Êtes-vous sûr de vouloir supprimer l'étape "${step.title}" ?\n\nCette action est irréversible.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Suppression de l\'étape:', step._id);
              
              // Suppression optimiste
              await deleteStepOptimistic(step._id);
              
              // Notifier la mise à jour pour rafraîchir les autres écrans
              notifyStepUpdate(step._id);
              
              // Retourner à l'écran précédent
              navigation.goBack();
              
              console.log('✅ Étape supprimée avec succès');
            } catch (error) {
              console.error('❌ Erreur lors de la suppression:', error);
              Alert.alert(
                'Erreur',
                'Impossible de supprimer l\'étape. Veuillez réessayer.'
              );
            }
          },
        },
      ]
    );
  }, [step, deleteStepOptimistic, notifyStepUpdate, navigation]);

  /**
   * Configuration des scènes pour TabView
   */
  const renderScene = SceneMap({
    info: () => (
      <StepInfoScreen
        step={step}
        syncing={syncing}
        roadtripId={roadtripId}
        onRefresh={() => refreshStepDetail()}
      />
    ),
    accommodations: () => (
      <StepAccommodationScreen
        step={step}
      />
    ),
    activities: () => (
      <StepActivitiesScreen
        step={step}
      />
    ),
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

        {/* Bouton de suppression */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteStep}
          disabled={!step}
        >
          <Ionicons 
            name="trash-outline" 
            size={24} 
            color={!step ? 'rgba(255,255,255,0.5)' : theme.colors.white} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Rendu de la carte globale avec tous les marqueurs
   */
  const renderGlobalMap = () => {
    if (!step?.location?.latitude || !step?.location?.longitude) return null;

    const accommodations = step ? (step as any)?.accommodations || [] : [];
    const activities = step ? (step as any)?.activities || [] : [];

    const markers = [
      // Marqueur principal pour l'étape (drapeau bleu) - seulement pour les arrêts
      ...(step.type === 'Stop' ? [{
        id: 'main-step',
        latitude: step.location.latitude,
        longitude: step.location.longitude,
        title: step.title || 'Arrêt',
        description: step.location.address,
        type: 'step' as const,
      }] : []),
      // Marqueurs pour les hébergements (lit vert)
      ...accommodations
        .filter((acc: any) => hasValidCoordinates(acc))
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
        .filter((act: any) => hasValidCoordinates(act))
        .map((act: any, index: number) => {
          const activityType = mapActivityTypeForMarker(act.type);

          console.log('🗺️ Type mapping result:', {
            originalType: act.type,
            mappedType: activityType
          });

          return {
            id: `activity-${index}`,
            latitude: act.latitude!,
            longitude: act.longitude!,
            title: act.name || `Activité ${index + 1}`,
            description: act.address,
            type: activityType as any,
          };
        }),
    ];

    console.log('🗺️ StepDetailScreen - Markers pour carte:', {
      totalMarkers: markers.length,
      mainStep: 1,
      accommodations: accommodations.filter((acc: any) => hasValidCoordinates(acc)).length,
      activities: activities.filter((act: any) => hasValidCoordinates(act)).length,
      allMarkers: markers.map(m => ({ id: m.id, title: m.title, lat: m.latitude, lng: m.longitude }))
    });

    return (
      <View style={styles.globalMapContainer}>
        <GoogleMap
          latitude={step.location.latitude}
          longitude={step.location.longitude}
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
      </View>
    );
  };

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
      {renderGlobalMap()}

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
  deleteButton: {
    padding: 8,
    marginLeft: 12,
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

  // Carte globale
  globalMapContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  globalMap: {
    marginBottom: 0,
  },
});

export default StepDetailScreen;
