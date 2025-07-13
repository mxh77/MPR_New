/**
 * Écran de liste des roadtrips amélioré
 * Intégration API + WatermelonDB avec interface moderne
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts';
import { useRoadtripsWithApi } from '../../hooks';
import { RoadtripMenu } from '../../components/common/RoadtripMenu';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 colonnes avec marges

type RoadtripsListNavigationProp = NativeStackNavigationProp<RoadtripsStackParamList, 'RoadtripsList'>;

// Styles pour les cartes (définis ici pour éviter les conflits de nommage)
const cardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginRight: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  cardMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },
  stepsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepsText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

interface RoadtripCardProps {
  item: any;
  onPress: () => void;
  onMenuPress: () => void;
  theme: any;
}

const RoadtripCard: React.FC<RoadtripCardProps> = ({ item, onPress, onMenuPress, theme }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getDuration = () => {
    const diffTime = Math.abs(item.endDate - item.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  };

  const getSyncIcon = () => {
    switch (item.syncStatus) {
      case 'synced':
        return <Ionicons name="cloud-done" size={16} color={theme.colors.success} />;
      case 'pending':
        return <Ionicons name="cloud-upload" size={16} color={theme.colors.warning} />;
      case 'error':
        return <Ionicons name="cloud-offline" size={16} color={theme.colors.danger} />;
      default:
        return <Ionicons name="cloud" size={16} color={theme.colors.textSecondary} />;
    }
  };

  return (
    <TouchableOpacity 
      style={[cardStyles.card, { backgroundColor: theme.colors.card }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image/Thumbnail */}
      <View style={[cardStyles.cardImage, { backgroundColor: theme.colors.background }]}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={cardStyles.thumbnailImage} />
        ) : (
          <View style={cardStyles.placeholderImage}>
            <Ionicons name="map" size={32} color={theme.colors.textSecondary} />
          </View>
        )}
        
        {/* Sync Status Badge */}
        <View style={[cardStyles.syncBadge, { backgroundColor: theme.colors.background + 'CC' }]}>
          {getSyncIcon()}
        </View>

        {/* Menu Button */}
        <TouchableOpacity 
          style={[cardStyles.menuButton, { backgroundColor: theme.colors.background + 'CC' }]}
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.8}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={cardStyles.cardContent}>
        <Text style={[cardStyles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={cardStyles.cardMeta}>
          <View style={cardStyles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[cardStyles.metaText, { color: theme.colors.textSecondary }]}>
              {formatDate(item.startDate)}
            </Text>
          </View>
          
          <View style={cardStyles.metaItem}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[cardStyles.metaText, { color: theme.colors.textSecondary }]}>
              {getDuration()}
            </Text>
          </View>
        </View>

        {/* Location info */}
        {(item.startLocation || item.endLocation) && (
          <View style={cardStyles.locationInfo}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[cardStyles.locationText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.startLocation && item.endLocation 
                ? `${item.startLocation} → ${item.endLocation}`
                : item.startLocation || item.endLocation
              }
            </Text>
          </View>
        )}

        {/* Steps count */}
        <View style={cardStyles.stepsInfo}>
          <Ionicons name="list-outline" size={14} color={theme.colors.primary} />
          <Text style={[cardStyles.stepsText, { color: theme.colors.primary }]}>
            {item.totalSteps} étape{item.totalSteps > 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const RoadtripsListScreenWithApi: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<RoadtripsListNavigationProp>();  const {
    roadtrips,
    loading,
    error,
    syncing,
    isOnline,
    fetchRoadtrips,
    createRoadtrip,
    deleteRoadtrip,
    syncWithApi,
    refreshRoadtrips, // Nouvelle fonction
    totalRoadtrips,
    pendingSyncCount,
    errorSyncCount
  } = useRoadtripsWithApi();
  
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRoadtrip, setSelectedRoadtrip] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Refresh à chaque focus de l'écran (sans force sync)
  useFocusEffect(
    useCallback(() => {
      if (roadtrips.length === 0) {
        fetchRoadtrips();
      }
    }, [fetchRoadtrips, roadtrips.length])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshRoadtrips(); // Utilise la fonction qui force la sync
    setRefreshing(false);
  }, [refreshRoadtrips]);

  const handleCreateTestRoadtrip = async () => {
    try {
      const testRoadtrip = {
        title: `Roadtrip ${new Date().toLocaleDateString()}`,
        description: 'Roadtrip créé avec la nouvelle API',
        startDate: new Date(),
        endDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
        startLocation: 'Paris, France',
        endLocation: 'Nice, France',
        currency: 'EUR',
      };

      const result = await createRoadtrip(testRoadtrip);
      if (result) {
        Alert.alert('✅ Succès', 'Roadtrip créé avec succès !');
      } else {
        Alert.alert('❌ Erreur', 'Impossible de créer le roadtrip');
      }
    } catch (err) {
      console.error('Erreur création:', err);
      Alert.alert('❌ Erreur', 'Erreur lors de la création du roadtrip');
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert('🔌 Hors ligne', 'Connexion internet requise pour la synchronisation');
      return;
    }
    
    await syncWithApi();
    Alert.alert('✅ Synchronisation', 'Synchronisation terminée');
  };

  const handleRoadtripMenu = (roadtrip: any) => {
    setSelectedRoadtrip(roadtrip);
    setMenuVisible(true);
  };

  const handleMenuAction = async (actionId: string) => {
    if (!selectedRoadtrip) return;

    try {
      setActionLoading(actionId);

      switch (actionId) {
        case 'view':
          navigation.navigate('RoadtripDetail', { roadtripId: selectedRoadtrip.id });
          break;
        
        case 'edit':
          Alert.alert('Fonctionnalité', 'Édition du roadtrip - À implémenter');
          break;
        
        case 'duplicate':
          const duplicatedRoadtrip = {
            title: `${selectedRoadtrip.title} (Copie)`,
            description: selectedRoadtrip.description,
            startDate: new Date(selectedRoadtrip.startDate),
            endDate: new Date(selectedRoadtrip.endDate),
            startLocation: selectedRoadtrip.startLocation,
            endLocation: selectedRoadtrip.endLocation,
            currency: selectedRoadtrip.currency,
          };
          
          const result = await createRoadtrip(duplicatedRoadtrip);
          if (result) {
            Alert.alert('✅ Succès', 'Roadtrip dupliqué avec succès !');
          } else {
            Alert.alert('❌ Erreur', 'Impossible de dupliquer le roadtrip');
          }
          break;
        
        case 'share':
          Alert.alert('Fonctionnalité', 'Partage du roadtrip - À implémenter');
          break;
        
        case 'delete':
          const success = await deleteRoadtrip(selectedRoadtrip.id);
          if (success) {
            Alert.alert('✅ Succès', 'Roadtrip supprimé avec succès');
          } else {
            Alert.alert('❌ Erreur', 'Impossible de supprimer le roadtrip');
          }
          break;
      }
    } catch (error) {
      console.error('Erreur action menu:', error);
      Alert.alert('❌ Erreur', 'Une erreur est survenue');
    } finally {
      setActionLoading(null);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Mes Roadtrips</Text>
        <View style={styles.headerActions}>
          {/* Sync button */}
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.card }]} 
            onPress={handleSyncNow}
            disabled={syncing || !isOnline}
          >
            {syncing ? (
              <ActivityIndicator size={20} color={theme.colors.primary} />
            ) : (
              <Ionicons 
                name={isOnline ? "sync" : "sync-outline"} 
                size={20} 
                color={isOnline ? theme.colors.primary : theme.colors.textSecondary} 
              />
            )}
          </TouchableOpacity>

          {/* Add button */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton, { backgroundColor: theme.colors.primary }]} 
            onPress={handleCreateTestRoadtrip}
          >
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statusItem}>
          <Ionicons 
            name={isOnline ? "wifi" : "wifi-outline"} 
            size={16} 
            color={isOnline ? theme.colors.success : theme.colors.danger} 
          />
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </Text>
        </View>

        {pendingSyncCount > 0 && (
          <View style={styles.statusItem}>
            <Ionicons name="cloud-upload" size={16} color={theme.colors.warning} />
            <Text style={[styles.statusText, { color: theme.colors.warning }]}>
              {pendingSyncCount} en attente
            </Text>
          </View>
        )}

        {errorSyncCount > 0 && (
          <View style={styles.statusItem}>
            <Ionicons name="warning" size={16} color={theme.colors.danger} />
            <Text style={[styles.statusText, { color: theme.colors.danger }]}>
              {errorSyncCount} erreur{errorSyncCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <View style={styles.statusItem}>
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            {totalRoadtrips} roadtrip{totalRoadtrips > 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="map-outline" size={80} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Aucun roadtrip
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Créez votre premier roadtrip pour commencer à planifier vos aventures !
      </Text>
      <TouchableOpacity 
        style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateTestRoadtrip}
      >
        <Ionicons name="add" size={20} color={theme.colors.white} />
        <Text style={[styles.emptyButtonText, { color: theme.colors.white }]}>
          Créer un roadtrip
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRoadtrip = ({ item }: { item: any }) => (
    <RoadtripCard
      item={item}
      theme={theme}
      onPress={() => {
        console.log('Navigation vers roadtrip:', item.id);
        navigation.navigate('RoadtripDetail', { roadtripId: item.id });
      }}
      onMenuPress={() => handleRoadtripMenu(item)}
    />
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    primaryButton: {
      // Styles spécifiques au bouton principal
    },
    statusBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 16,
    },
    statusItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    errorContainer: {
      backgroundColor: theme.colors.danger + '20',
      padding: 16,
      marginHorizontal: 20,
      borderRadius: 12,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 14,
      flex: 1,
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
    list: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    card: {
      width: CARD_WIDTH,
      marginRight: 20,
      marginBottom: 20,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    cardImage: {
      width: '100%',
      height: 120,
      position: 'relative',
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    placeholderImage: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    syncBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardContent: {
      padding: 16,
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
    },
    cardMeta: {
      gap: 4,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 12,
      fontWeight: '500',
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    locationText: {
      fontSize: 12,
      flex: 1,
    },
    stepsInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    stepsText: {
      fontSize: 12,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      gap: 16,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      gap: 8,
      marginTop: 8,
    },
    emptyButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={20} color={theme.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading && roadtrips.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des roadtrips...</Text>
        </View>
      ) : roadtrips.length > 0 ? (
        <FlatList
          data={roadtrips}
          renderItem={renderRoadtrip}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      ) : (
        renderEmpty()
      )}

      {/* Menu contextuel */}
      <RoadtripMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onAction={handleMenuAction}
        roadtripTitle={selectedRoadtrip?.title || ''}
        loadingAction={actionLoading}
      />
    </SafeAreaView>
  );
};

export default RoadtripsListScreenWithApi;
