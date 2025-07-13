/**
 * Écran de liste des roadtrips
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts';
import { useRoadtrips } from '../../hooks';
import { testConnection, testEnvironment, testApiEndpoints } from '../../services/api/test';

export const RoadtripsListScreen: React.FC = () => {
  const { theme } = useTheme();
  const { roadtrips, loading, error, createRoadtrip, fetchRoadtrips } = useRoadtrips();
  const [isCreating, setIsCreating] = useState(false);

  // Auto-load roadtrips on mount
  React.useEffect(() => {
    fetchRoadtrips();
    testEnvironment();
  }, []);

  const handleCreateTestRoadtrip = async () => {
    setIsCreating(true);
    try {
      const testRoadtrip = {
        title: 'Test Roadtrip',
        description: 'Roadtrip de test créé avec WatermelonDB',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
        participants: 1
      };

      const result = await createRoadtrip(testRoadtrip);
      if (result) {
        Alert.alert('Succès', 'Roadtrip de test créé avec WatermelonDB !');
      } else {
        Alert.alert('Erreur', 'Impossible de créer le roadtrip');
      }
    } catch (err) {
      console.error('Erreur création test:', err);
      Alert.alert('Erreur', 'Erreur lors de la création du roadtrip de test');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTestAPI = async () => {
    try {
      console.log('🧪 Test de connexion API...');
      const result = await testConnection();
      
      if (result.status === 'ok') {
        Alert.alert('✅ Connexion OK', `Backend accessible: ${result.message}`);
      } else {
        Alert.alert('❌ Connexion échouée', result.message);
      }
    } catch (err) {
      console.error('Erreur test API:', err);
      Alert.alert('❌ Erreur', 'Impossible de tester la connexion');
    }
  };

  const handleTestEndpoints = async () => {
    try {
      console.log('🔍 Test des endpoints API...');
      const results = await testApiEndpoints();
      
      let message = 'Résultats des tests:\n\n';
      Object.entries(results).forEach(([endpoint, result]) => {
        const status = result.status === 200 ? '✅' : '❌';
        const type = result.isJson ? 'JSON' : 'HTML';
        message += `${status} ${endpoint}: ${result.status} (${type})\n`;
      });
      
      Alert.alert('🔍 Tests Endpoints', message);
    } catch (err) {
      console.error('Erreur test endpoints:', err);
      Alert.alert('❌ Erreur', 'Impossible de tester les endpoints');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return theme.colors.success;
      case 'Planifié':
        return theme.colors.warning;
      case 'Terminé':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderRoadtrip = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      
      <Text style={styles.cardDescription}>{item.description}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>
            {new Date(item.startDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="people" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>{item.participants} participant(s)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      backgroundColor: theme.colors.warning + '20',
      padding: 16,
      marginHorizontal: 20,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: theme.colors.warning,
      fontSize: 14,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    list: {
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginRight: 12,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.white,
    },
    cardDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Roadtrips</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleTestAPI}
          >
            <Ionicons name="cloud" size={20} color={theme.colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleTestEndpoints}
          >
            <Ionicons name="search" size={20} color={theme.colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleCreateTestRoadtrip}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size={20} color={theme.colors.white} />
            ) : (
              <Ionicons name="add" size={24} color={theme.colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur: {error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des roadtrips...</Text>
        </View>
      ) : roadtrips.length > 0 ? (
        <FlatList
          data={roadtrips}
          renderItem={renderRoadtrip}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>Aucun roadtrip pour le moment</Text>
          <Text style={styles.emptySubtext}>
            Créez votre premier roadtrip pour commencer à planifier vos aventures !
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default RoadtripsListScreen;
