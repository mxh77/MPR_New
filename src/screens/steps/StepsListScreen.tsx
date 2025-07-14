/**
 * Écran de liste des étapes d'un roadtrip
 * Support offline-first avec synchronisation automatique
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../contexts';
import { useSteps } from '../../hooks/useSteps';
import type { Step, StepType } from '../../types';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';

const { width } = Dimensions.get('window');

interface StepsListScreenProps {
  roadtripId: string;
}

type StepsListScreenNavigationProp = NativeStackNavigationProp<RoadtripsStackParamList, 'StepList'>;

interface RouteParams {
  roadtripId: string;
}

const StepsListScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StepsListScreenNavigationProp>();
  const route = useRoute();
  const { roadtripId } = route.params as RouteParams;

  // Debug: Log de l'ID du roadtrip reçu
  console.log('StepsListScreen - roadtripId reçu:', roadtripId);
  console.log('StepsListScreen - type de roadtripId:', typeof roadtripId);
  console.log('StepsListScreen - route.params:', route.params);

  const {
    steps,
    loading,
    error,
    refreshSteps,
    createStepOptimistic,
    deleteStepOptimistic,
  } = useSteps(roadtripId);

  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Force la synchronisation lors d'un pull-to-refresh explicite
      await refreshSteps(true);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateStep = () => {
    Alert.alert(
      'Nouvelle étape',
      'Choisissez le type d\'étape à créer',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Arrêt',
          onPress: () => Alert.alert('À implémenter', 'Créer un arrêt - fonctionnalité à venir'),
        },
        {
          text: 'Étape',
          onPress: () => Alert.alert('À implémenter', 'Créer une étape - fonctionnalité à venir'),
        },
        {
          text: 'Activité',
          onPress: () => Alert.alert('À implémenter', 'Créer une activité - fonctionnalité à venir'),
        },
      ]
    );
  };

  const handleStepPress = (step: Step) => {
    navigation.navigate('StepDetail', { stepId: step._id, roadtripId });
  };

  const handleEditStep = (step: Step) => {
    Alert.alert('À implémenter', `Modifier "${step.title}" - fonctionnalité à venir`);
  };

  const handleDeleteStep = (step: Step) => {
    Alert.alert(
      'Supprimer l\'étape',
      `Êtes-vous sûr de vouloir supprimer "${step.title}" ?`,
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
              await deleteStepOptimistic(step._id);
            } catch (error) {
              Alert.alert(
                'Erreur',
                'Impossible de supprimer l\'étape. Veuillez réessayer.'
              );
            }
          },
        },
      ]
    );
  };

  // Fonction pour déterminer le type d'activité principal d'une étape (basée sur l'app existante)
  const getStepMainActivityType = (step: Step): string => {
    // Si c'est un Stop (arrêt transport), c'est toujours du Transport  
    if (step.type === 'Stop') return 'Transport';
    
    // Pour les étapes avec des activités (données de l'API)
    const stepWithActivities = step as any; // Cast temporaire pour accéder aux activités de l'API
    
    if (stepWithActivities.activities && stepWithActivities.activities.length > 0) {
      const activeActivity = stepWithActivities.activities.find((activity: any) => activity.active !== false);
      if (activeActivity && activeActivity.type) {
        console.log('🎯 getStepMainActivityType - Activité trouvée:', activeActivity.type);
        return activeActivity.type;
      }
    }
    
    // Par défaut, considérer comme une visite
    console.log('🎯 getStepMainActivityType - Par défaut: Visite');
    return 'Visite';
  };

  const getDisplayType = (step: Step): 'transport' | 'hiking' | 'visit' | 'accommodation' | 'overnight' | 'stop' => {
    const mainActivityType = getStepMainActivityType(step);
    
    // Mappage des types d'activités vers les types d'affichage
    switch (mainActivityType) {
      case 'Transport':
        return 'transport';
      case 'Randonnée':
      case 'Hiking':
        return 'hiking';
      case 'Visite':
      case 'Visit':
        return 'visit';
      case 'Hébergement':
      case 'Accommodation':
        return 'accommodation';
      default:
        // Si c'est un Stop, c'est du transport
        if (step.type === 'Stop') {
          return 'transport';
        }
        // Par défaut, une Stage est une étape overnight
        return 'overnight';
    }
  };

  const getStepTypeColor = (step: Step): string => {
    const displayType = getDisplayType(step);
    // Couleurs inspirées de l'app existante (getStepColor)
    switch (displayType) {
      case 'transport':
        return '#FF9800'; // Orange - comme dans l'existant
      case 'hiking':
        return '#4CAF50'; // Vert pour randonnée
      case 'visit':
        return '#2196F3'; // Bleu pour visite
      case 'accommodation':
        return '#9C27B0'; // Violet pour logement
      case 'overnight':
        return '#607D8B'; // Bleu-gris pour étapes génériques
      default:
        return '#6c757d'; // Gris par défaut
    }
  };

  const getStepTypeIcon = (step: Step): keyof typeof Ionicons.glyphMap => {
    const displayType = getDisplayType(step);
    // Icônes inspirées de l'app existante (getStepIcon)
    switch (displayType) {
      case 'transport':
        return 'car';
      case 'hiking':
        return 'walk';
      case 'visit':
        return 'eye';
      case 'accommodation':
        return 'bed';
      case 'overnight':
        return 'location';
      default:
        return 'location-outline';
    }
  };

  const getStepTypeLabel = (step: Step): string => {
    const displayType = getDisplayType(step);
    // Labels inspirés de l'app existante
    switch (displayType) {
      case 'transport':
        return 'TRANSPORT';
      case 'hiking':
        return 'RANDONNÉE';
      case 'visit':
        return 'VISITE';
      case 'accommodation':
        return 'LOGEMENT';
      case 'overnight':
        return 'ÉTAPE';
      default:
        return step.type?.toUpperCase() || 'INCONNU';
    }
  };

  const formatDuration = (startDate?: Date, endDate?: Date): string => {
    if (!startDate || !endDate) return '';
    
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 jour';
    if (diffDays > 1) return `${diffDays} jours`;
    
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (diffHours === 1) return '1 heure';
    if (diffHours > 1) return `${diffHours} heures`;
    
    return 'Quelques minutes';
  };

  const formatDistance = (distance?: number): string => {
    if (distance === undefined || distance === null || isNaN(distance)) {
      return '0 km';
    }
    return `${Math.round(distance)} km`;
  };

  // Fonction pour déterminer la couleur de fond basée sur travelTimeNote (comme dans l'app existante)
  const getTravelInfoBackgroundColor = (note?: string): string => {
    switch (note) {
      case 'ERROR':
        return '#ffcccc'; // Rouge clair
      case 'WARNING':
        return '#fff3cd'; // Jaune clair
      case 'OK':
        return '#d4edda'; // Vert clair
      default:
        return '#f0f0f0'; // Gris clair par défaut
    }
  };

  // Fonction pour déterminer la couleur de l'icône basée sur travelTimeNote
  const getTravelInfoIconColor = (note?: string): string => {
    switch (note) {
      case 'ERROR':
        return '#dc3545'; // Rouge
      case 'WARNING':
        return '#ffc107'; // Jaune/Orange
      case 'OK':
        return '#28a745'; // Vert
      default:
        return '#6c757d'; // Gris
    }
  };

  /**
   * Formate un temps en minutes au format XhYYm
   */
  const formatTimeAsHHMM = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Fonction pour extraire l'URI de l'image (basée sur l'app existante)
  const getImageUri = (thumbnail: any): string | null => {
    console.log('🖼️ getImageUri - thumbnail reçu:', typeof thumbnail, thumbnail);
    console.log('🖼️ getImageUri - thumbnail reçu:', typeof thumbnail);
    
    if (!thumbnail) {
      console.log('🖼️ getImageUri - thumbnail null/undefined');
      return null;
    }
    
    // Si c'est déjà une chaîne
    if (typeof thumbnail === 'string') {
      console.log('🖼️ getImageUri - string:', thumbnail);
      return thumbnail;
    }
    
    // Si c'est un objet avec une propriété url (structure API)
    if (typeof thumbnail === 'object' && thumbnail.url && typeof thumbnail.url === 'string') {
    //   console.log('🖼️ getImageUri - object.url:', thumbnail.url);
      console.log('🖼️ getImageUri - object.url:');
      return thumbnail.url;
    }
    
    // Si c'est un objet avec une propriété uri
    if (typeof thumbnail === 'object' && thumbnail.uri && typeof thumbnail.uri === 'string') {
    //   console.log('🖼️ getImageUri - object.uri:', thumbnail.uri);
      console.log('🖼️ getImageUri - object.uri:');
      return thumbnail.uri;
    }
    
    console.log('🖼️ getImageUri - Aucun format reconnu pour:', thumbnail);
    return null;
  };

  const renderTransportInfo = (currentStep: Step, nextStep?: Step) => {
    // Debug pour comprendre pourquoi les infos transport manquent entre les étapes
    console.log('🚛 renderTransportInfo - Étape actuelle:', {
      id: currentStep._id,
      title: currentStep.title,
      index: steps.findIndex(s => s._id === currentStep._id),
      distance: currentStep.distance,
      travelTimePreviousStep: (currentStep as any).travelTimePreviousStep,
      distancePreviousStep: (currentStep as any).distancePreviousStep
    });
    
    if (nextStep) {
      console.log('🚛 renderTransportInfo - Étape suivante:', {
        id: nextStep._id,
        title: nextStep.title,
        travelTimePreviousStep: (nextStep as any).travelTimePreviousStep,
        distancePreviousStep: (nextStep as any).distancePreviousStep
      });
    }

    // La logique de l'app existante utilise travelTimePreviousStep et distancePreviousStep de l'étape SUIVANTE
    if (!nextStep) return null;

    const nextStepWithAPI = nextStep as any;
    const distance = nextStepWithAPI.distancePreviousStep || nextStepWithAPI.distance;
    const travelTime = nextStepWithAPI.travelTimePreviousStep;
    const travelTimeNote = nextStepWithAPI.travelTimeNote;

    if (!distance && !travelTime) {
      console.log('🚛 renderTransportInfo - Pas d\'info transport entre', currentStep.title, 'et', nextStep.title);
      return null;
    }

    // Utiliser le temps de trajet de l'API si disponible, sinon calculer
    let displayTravelTime: string;
    
    if (travelTime && typeof travelTime === 'number') {
      // L'API renvoie le temps en minutes (nombre)
      displayTravelTime = formatTimeAsHHMM(travelTime);
    } else if (travelTime && typeof travelTime === 'string') {
      // Si c'est déjà une chaîne, vérifier le format
      if (travelTime.includes('h') && travelTime.includes('m')) {
        displayTravelTime = travelTime;
      } else {
        // Parser les formats existants comme "1h 30min" ou "30min"
        const hourMatch = travelTime.match(/(\d+)h/);
        const minMatch = travelTime.match(/(\d+)min/);
        
        const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
        const minutes = minMatch ? parseInt(minMatch[1]) : 0;
        const totalMinutes = hours * 60 + minutes;
        
        displayTravelTime = formatTimeAsHHMM(totalMinutes);
      }
    } else if (distance) {
      // Calculer à partir de la distance
      const distanceKm = distance;
      const estimatedTimeMinutes = distanceKm * 1.2; // ~1.2 minutes par km (50km/h moyenne)
      
      displayTravelTime = formatTimeAsHHMM(estimatedTimeMinutes);
    } else {
      // Pas d'info disponible
      return null;
    }

    // Couleurs basées sur travelTimeNote
    const backgroundColor = getTravelInfoBackgroundColor(travelTimeNote);
    const iconColor = getTravelInfoIconColor(travelTimeNote);
    
    return (
      <View style={styles.transportContainer}>
        <View style={[styles.transportCard, { backgroundColor }]}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: iconColor,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons name="car" size={16} color="white" />
          </View>
          
          <View style={styles.transportInfo}>
            {displayTravelTime && (
              <Text style={[styles.transportTime]}>
                {displayTravelTime}
              </Text>
            )}
            {distance && (
              <Text style={[styles.transportDistance]}>
                {formatDistance(distance)}
              </Text>
            )}
          </View>
          
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: 'rgba(0,0,0,0.1)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons name="arrow-down" size={12} color="#666666" />
          </View>
        </View>
      </View>
    );
  };

  const renderStepItem = ({ item, index }: { item: Step; index: number }) => {
    // Vérification de sécurité
    if (!item) {
      console.error('renderStepItem - item est undefined à l\'index:', index);
      return null;
    }
    
    if (!item.type) {
      console.error('renderStepItem - item.type est undefined pour step:', item._id);
      return null;
    }

    return (
    <>
      <TouchableOpacity
        style={[styles.stepCard]}
        onPress={() => handleStepPress(item)}
        activeOpacity={0.7}
      >
        {/* Header avec couleur dynamique comme dans l'app existante */}
        <View style={[
          styles.stepTypeBadge, 
          { 
            backgroundColor: getStepTypeColor(item),
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12
          }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Ionicons name={getStepTypeIcon(item)} size={20} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 2 }} numberOfLines={1}>
                {typeof item.title === 'string' ? item.title : String(item.title || 'Titre manquant')}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', fontWeight: '500' }}>
                {getStepTypeLabel(item)}
              </Text>
            </View>
          </View>
          
          <View style={{ 
            backgroundColor: 'rgba(255,255,255,0.3)', 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 16,
            minWidth: 50,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.white }}>
              {index + 1}
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '500', color: theme.colors.white, opacity: 0.8 }}>
              sur {steps.length}
            </Text>
          </View>
        </View>

        {/* Contenu principal avec fond blanc */}
        <View style={{ padding: 16, backgroundColor: '#ffffff' }}>
          {/* Image de l'étape */}
          {(() => {
            const imageUri = getImageUri(item.thumbnail);
            // console.log('🖼️ renderStepItem - URI calculée pour', item.title, ':', imageUri);
            console.log('🖼️ renderStepItem - URI calculée pour', item.title);
            
            // Vérification de sécurité supplémentaire pour s'assurer que l'URI est bien une chaîne
            if (imageUri && typeof imageUri === 'string' && imageUri.length > 0) {
              return (
                <Image
                  source={{ uri: imageUri }}
                  style={{ 
                    height: 120, 
                    borderRadius: 8, 
                    marginBottom: 12,
                    backgroundColor: '#F5F5F5' 
                  }}
                  resizeMode="cover"
                  onLoad={() => console.log('🖼️ Image chargée avec succès:')}
                  onError={(error) => {
                    console.warn('🖼️ Erreur de chargement d\'image:', error.nativeEvent.error, 'pour URI:', imageUri);
                  }}
                />
              );
            } else {
              return (
                <View style={{ 
                  height: 120, 
                  backgroundColor: '#F5F5F5', 
                  borderRadius: 8, 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  marginBottom: 12 
                }}>
                  <Ionicons name="image-outline" size={32} color={theme.colors.textSecondary} />
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 8 }}>
                    Pas d'image
                  </Text>
                </View>
              );
            }
          })()}

          {/* Informations de dates comme dans l'existant */}
          <View style={{ marginTop: 8 }}>
            {item.startDate && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="play" size={12} color="#28a745" style={{ marginRight: 8, width: 16 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6c757d', marginRight: 8, minWidth: 50 }}>
                  Arrivée:
                </Text>
                <Text style={{ fontSize: 12, color: '#495057', flex: 1 }}>
                  {new Intl.DateTimeFormat('fr-FR', { 
                    day: '2-digit', 
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(item.startDate)}
                </Text>
              </View>
            )}
            
            {item.endDate && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="stop" size={12} color="#dc3545" style={{ marginRight: 8, width: 16 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6c757d', marginRight: 8, minWidth: 50 }}>
                  Départ:
                </Text>
                <Text style={{ fontSize: 12, color: '#495057', flex: 1 }}>
                  {new Intl.DateTimeFormat('fr-FR', { 
                    day: '2-digit', 
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(item.endDate)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Information de transport vers l'étape suivante */}
      {index < steps.length - 1 && renderTransportInfo(item, steps[index + 1])}
    </>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="map-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Aucune étape
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Commencez par ajouter votre première étape à ce roadtrip
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateStep}
      >
        <Ionicons name="add" size={20} color={theme.colors.white} />
        <Text style={[styles.emptyButtonText, { color: theme.colors.white }]}>
          Ajouter une étape
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.colors.background + 'F0' }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Étapes du roadtrip
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {steps.length} étape{steps.length > 1 ? 's' : ''}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreateStep}
        >
          <Ionicons name="add" size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && steps.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Chargement des étapes...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.danger + '15' }]}>
          <Ionicons name="warning-outline" size={16} color={theme.colors.danger} />
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
            {error}
          </Text>
        </View>
      )}
      
      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderStepItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContent,
          steps.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 100,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  listContent: {
    paddingTop: 120,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  stepCard: {
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  stepImagePlaceholder: {
    height: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepDateInfo: {
    gap: 8,
  },
  stepDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDateLabel: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 60,
  },
  stepDateValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  stepTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  stepTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  stepAddress: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  stepAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  stepDuration: {
    fontSize: 12,
  },
  stepDistance: {
    fontSize: 12,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  stepDescription: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  syncStatusText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  transportContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  transportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    marginHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  transportInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  transportTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  transportDistance: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  stepTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
});

export default StepsListScreen;
