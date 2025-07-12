/**
 * Écran d'accueil principal
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useTheme } from '../../contexts';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

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
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    actionButtonText: {
      color: theme.colors.white,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 4,
    },
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}{user?.firstName ? `, ${user.firstName}` : ''} !
          </Text>
          <Text style={styles.subtitle}>Prêt pour votre prochaine aventure ?</Text>
        </View>

        <View style={styles.content}>
          {/* Actions rapides */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="add-circle" size={24} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Nouveau{'\n'}Roadtrip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="search" size={24} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Rechercher{'\n'}Activités</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="map" size={24} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Explorer{'\n'}Cartes</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Activités récentes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activités récentes</Text>
            
            <TouchableOpacity style={styles.card}>
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
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
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
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
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
            </TouchableOpacity>
          </View>

          {/* Statistiques */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vos statistiques</Text>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons 
                  name="analytics" 
                  size={24} 
                  color={theme.colors.info} 
                  style={styles.cardIcon}
                />
                <Text style={styles.cardTitle}>Activités cette année</Text>
              </View>
              <Text style={styles.cardDescription}>
                🥾 12 randonnées • 🏨 8 hébergements • 🍽️ 15 restaurants • 🚗 5 roadtrips
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
