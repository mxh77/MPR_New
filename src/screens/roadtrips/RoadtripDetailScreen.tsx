/**
 * Écran de détail d'un roadtrip
 * Affichage complet des informations et navigation vers les étapes
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts';
import { useRoadtripDetail } from '../../hooks';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';
import { getImageUri, debugThumbnail } from '../../utils/thumbnailUtils';

const { width } = Dimensions.get('window');

type RoadtripDetailScreenRouteProp = RouteProp<RoadtripsStackParamList, 'RoadtripDetail'>;
type RoadtripDetailScreenNavigationProp = NativeStackNavigationProp<RoadtripsStackParamList, 'RoadtripDetail'>;

interface RoadtripDetailScreenProps {}

export const RoadtripDetailScreen: React.FC<RoadtripDetailScreenProps> = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<RoadtripDetailScreenNavigationProp>();
  const route = useRoute<RoadtripDetailScreenRouteProp>();
  
  const { roadtripId } = route.params;
  const { roadtrip, loading, error, reloadRoadtrip } = useRoadtripDetail(roadtripId);

  // Debug: Log de l'ID du roadtrip dans RoadtripDetailScreen
  console.log('RoadtripDetailScreen - roadtripId:', roadtripId);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getDuration = () => {
    if (!roadtrip) return '';
    const diffTime = Math.abs(roadtrip.endDate.getTime() - roadtrip.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  };

  const handleEditRoadtrip = () => {
    // TODO: Navigation vers l'écran d'édition
    Alert.alert('Fonctionnalité', 'Édition du roadtrip - À implémenter');
  };

  const handleViewSteps = () => {
    console.log('handleViewSteps - roadtripId local:', roadtripId);
    console.log('handleViewSteps - serverId:', roadtrip?.id);
    
    // Utilise le serverId du roadtrip car c'est ce que le backend attend
    const serverRoadtripId = roadtrip?.id;
    
    if (!serverRoadtripId) {
      Alert.alert(
        'Erreur',
        'Impossible de charger les étapes. Le roadtrip n\'est pas encore synchronisé avec le serveur.'
      );
      return;
    }
    
    console.log('handleViewSteps - serverId utilisé:', serverRoadtripId);
    navigation.navigate('StepList', { roadtripId: serverRoadtripId });
  };

  const handleShareRoadtrip = () => {
    // TODO: Partage du roadtrip
    Alert.alert('Fonctionnalité', 'Partage du roadtrip - À implémenter');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
    },
    heroSection: {
      height: 250,
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    heroPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: 20,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    infoSection: {
      padding: 20,
    },
    infoCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    infoIcon: {
      width: 24,
      alignItems: 'center',
    },
    infoText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    descriptionText: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
    },
    actionsSection: {
      padding: 20,
      gap: 12,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    secondaryButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement du roadtrip...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!roadtrip && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Erreur</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.danger} />
          <Text style={styles.loadingText}>
            {error || 'Roadtrip introuvable'}
          </Text>
          <TouchableOpacity 
            style={[styles.secondaryButton, { marginTop: 16 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>
          {roadtrip?.title || 'Chargement...'}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShareRoadtrip}>
            <Ionicons name="share-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleEditRoadtrip}>
            <Ionicons name="create-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {roadtrip ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            {(() => {
              // Debug du thumbnail reçu
              if (__DEV__) {
                debugThumbnail(roadtrip.thumbnail, `RoadtripDetail-${roadtrip.title}`);
              }
              
              // Extraction sécurisée de l'URL
              const thumbnailUri = getImageUri(roadtrip.thumbnail);
              
              if (thumbnailUri) {
                return (
                  <Image 
                    source={{ uri: thumbnailUri }} 
                    style={styles.heroImage}
                    onError={(error) => {
                      console.error('❌ Erreur chargement thumbnail roadtrip detail:', error);
                      if (__DEV__) {
                        debugThumbnail(roadtrip.thumbnail, `RoadtripDetail-ERROR-${roadtrip.title}`);
                      }
                    }}
                  />
                );
              } else {
                return (
                  <View style={styles.heroPlaceholder}>
                    <Ionicons name="image-outline" size={64} color={theme.colors.textSecondary} />
                  </View>
                );
              }
            })()}
            
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>{roadtrip.title}</Text>
              <Text style={styles.heroSubtitle}>
                {roadtrip.startLocation} → {roadtrip.endLocation}
              </Text>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            {/* Dates et durée */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Informations générales</Text>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Début</Text>
                  <Text style={styles.infoText}>{formatDate(roadtrip.startDate)}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Fin</Text>
                  <Text style={styles.infoText}>{formatDate(roadtrip.endDate)}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Durée</Text>
                  <Text style={styles.infoText}>{getDuration()}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="list-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Étapes</Text>
                  <Text style={styles.infoText}>{roadtrip.totalSteps} étape{roadtrip.totalSteps > 1 ? 's' : ''}</Text>
                </View>
              </View>
            </View>

            {/* Description */}
            {roadtrip.description && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Description</Text>
                <Text style={styles.descriptionText}>{roadtrip.description}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleViewSteps}>
              <Ionicons name="list" size={20} color={theme.colors.white} />
              <Text style={styles.primaryButtonText}>Voir les étapes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleEditRoadtrip}>
              <Ionicons name="create-outline" size={20} color={theme.colors.text} />
              <Text style={styles.secondaryButtonText}>Modifier le roadtrip</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
};

export default RoadtripDetailScreen;
