/**
 * Écran de liste des roadtrips
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts';

export const RoadtripsListScreen: React.FC = () => {
  const { theme } = useTheme();

  // Données factices pour l'instant
  const roadtrips = [
    {
      id: '1',
      title: 'Tour des Alpes',
      description: 'Un roadtrip magique à travers les plus beaux sommets',
      status: 'En cours',
      duration: '7 jours',
      activitiesCount: 12,
    },
    {
      id: '2',
      title: 'Côte d\'Azur',
      description: 'Découverte des plus belles plages de la Méditerranée',
      status: 'Planifié',
      duration: '5 jours',
      activitiesCount: 8,
    },
    {
      id: '3',
      title: 'Châteaux de la Loire',
      description: 'Voyage culturel à travers l\'histoire de France',
      status: 'Terminé',
      duration: '4 jours',
      activitiesCount: 6,
    },
  ];

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

  const renderRoadtrip = ({ item }: { item: typeof roadtrips[0] }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.cardDescription}>{item.description}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>{item.duration}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="list" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>{item.activitiesCount} activités</Text>
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
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {roadtrips.length > 0 ? (
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
