/**
 * Écran d'accueil principal avec nouveaux composants
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useTheme } from '../../contexts';
import { useNetworkStatus } from '../../hooks';
import { Button, Card } from '../../components/common';
import { resetDatabase } from '../../services/database/devUtils';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isConnected } = useNetworkStatus();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const handleCreateRoadtrip = () => {
    // TODO: Navigation vers création roadtrip
    console.log('Créer un nouveau roadtrip');
  };

  const handleSearchActivities = () => {
    // TODO: Navigation vers recherche
    console.log('Rechercher des activités');
  };

  const handleExploreMap = () => {
    // TODO: Navigation vers carte
    console.log('Explorer la carte');
  };

  const handleResetDatabase = async () => {
    try {
      await resetDatabase();
      alert('✅ Base de données réinitialisée avec succès !');
    } catch (error) {
      console.error('Erreur reset DB:', error);
      alert('❌ Erreur lors de la réinitialisation');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
    },
    greeting: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: 4,
    },
    networkStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      padding: 12,
      backgroundColor: isConnected ? theme.colors.success : theme.colors.danger,
      borderRadius: 8,
    },
    networkText: {
      color: theme.colors.white,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 8,
    },
    activityCard: {
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardIcon: {
      marginRight: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    cardDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    debugButton: {
      backgroundColor: theme.colors.danger,
      borderRadius: 8,
    },
    debugButtonText: {
      color: theme.colors.white,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}{user?.firstName ? `, ${user.firstName}` : ''} !
          </Text>
          <Text style={styles.subtitle}>Prêt pour votre prochaine aventure ?</Text>
          
          {/* Indicateur de connexion */}
          <View style={styles.networkStatus}>
            <Ionicons 
              name={isConnected ? "cellular" : "cellular-outline"} 
              size={16} 
              color={theme.colors.white} 
            />
            <Text style={styles.networkText}>
              {isConnected ? 'En ligne' : 'Mode hors ligne'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Actions rapides */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.quickActions}>
              <Button
                title="Nouveau Roadtrip"
                onPress={handleCreateRoadtrip}
                style={styles.actionButton}
                size="small"
              />
              <Button
                title="Rechercher"
                onPress={handleSearchActivities}
                variant="outline"
                style={styles.actionButton}
                size="small"
              />
              <Button
                title="Explorer"
                onPress={handleExploreMap}
                variant="outline"
                style={styles.actionButton}
                size="small"
              />
            </View>
          </View>

          {/* Activités récentes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activités récentes</Text>
            
            <Card style={styles.activityCard} onPress={() => console.log('Randonnée')}>
              <View style={styles.cardHeader}>
                <Ionicons 
                  name="walk" 
                  size={24} 
                  color={theme.colors.hiking} 
                  style={styles.cardIcon}
                />
                <Text style={styles.cardTitle}>Randonnée du Mont-Blanc</Text>
              </View>
              <Text style={styles.cardDescription}>
                Une magnifique randonnée avec vue panoramique sur les Alpes. 
                Durée: 4h30 - Difficulté: Modérée
              </Text>
            </Card>

            <Card style={styles.activityCard} onPress={() => console.log('Hébergement')}>
              <View style={styles.cardHeader}>
                <Ionicons 
                  name="bed" 
                  size={24} 
                  color={theme.colors.accommodation} 
                  style={styles.cardIcon}
                />
                <Text style={styles.cardTitle}>Chalet des Aiguilles</Text>
              </View>
              <Text style={styles.cardDescription}>
                Hébergement cosy en montagne avec petit-déjeuner inclus.
                Réservation pour 2 nuits.
              </Text>
            </Card>

            <Card style={styles.activityCard} onPress={() => console.log('Restaurant')}>
              <View style={styles.cardHeader}>
                <Ionicons 
                  name="restaurant" 
                  size={24} 
                  color={theme.colors.restaurant} 
                  style={styles.cardIcon}
                />
                <Text style={styles.cardTitle}>Restaurant La Bergerie</Text>
              </View>
              <Text style={styles.cardDescription}>
                Spécialités savoyardes dans un cadre authentique.
                Réservation prévue pour demain 19h30.
              </Text>
            </Card>
          </View>

          {/* Statistiques */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vos statistiques</Text>
            
            <Card>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Roadtrips</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>47</Text>
                  <Text style={styles.statLabel}>Activités</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>1,240</Text>
                  <Text style={styles.statLabel}>km parcourus</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* BOUTON DEBUG - À SUPPRIMER EN PRODUCTION */}
          {__DEV__ && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔧 Debug</Text>
              <Button
                title="🗑️ Reset Base de Données"
                onPress={handleResetDatabase}
                style={styles.debugButton}
                textStyle={styles.debugButtonText}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
