/**
 * Écran de profil utilisateur
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useTheme } from '../../contexts';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme, toggleTheme, mode, isDark } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Thème de l\'application',
      'Choisissez le thème que vous préférez',
      [
        { text: 'Clair', onPress: () => setTheme('light') },
        { text: 'Sombre', onPress: () => setTheme('dark') },
        { text: 'Automatique', onPress: () => setTheme('auto') },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const getThemeLabel = () => {
    switch (mode) {
      case 'light':
        return 'Clair';
      case 'dark':
        return 'Sombre';
      case 'auto':
        return `Automatique (${isDark ? 'Sombre' : 'Clair'})`;
      default:
        return 'Automatique';
    }
  };

  const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const ProfileItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress,
    showArrow = true,
    danger = false 
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.profileItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={danger ? theme.colors.danger : theme.colors.primary} 
        />
        <View style={styles.profileItemText}>
          <Text style={[styles.profileItemTitle, danger && { color: theme.colors.danger }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.profileItemSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {showArrow && onPress && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={theme.colors.textSecondary} 
        />
      )}
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.white,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
    },
    section: {
      marginTop: 24,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    profileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginBottom: 8,
    },
    profileItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    profileItemText: {
      marginLeft: 16,
      flex: 1,
    },
    profileItemTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    profileItemSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        {/* En-tête profil */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(user?.firstName, user?.lastName)}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.email || 'Utilisateur'
            }
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.content}>
          {/* Section Compte */}
          <ProfileSection title="Compte">
            <ProfileItem
              icon="person-outline"
              title="Informations personnelles"
              subtitle="Nom, email, téléphone"
              onPress={() => {/* TODO: Navigation vers édition profil */}}
            />
            <ProfileItem
              icon="lock-closed-outline"
              title="Mot de passe"
              subtitle="Modifier votre mot de passe"
              onPress={() => {/* TODO: Navigation vers changement mot de passe */}}
            />
            <ProfileItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Gérer vos préférences"
              onPress={() => {/* TODO: Navigation vers paramètres notifications */}}
            />
          </ProfileSection>

          {/* Section Préférences */}
          <ProfileSection title="Préférences">
            <ProfileItem
              icon="moon-outline"
              title="Thème"
              subtitle={getThemeLabel()}
              onPress={handleThemeChange}
            />
            <ProfileItem
              icon="language-outline"
              title="Langue"
              subtitle="Français"
              onPress={() => {/* TODO: Sélection langue */}}
            />
            <ProfileItem
              icon="cloud-outline"
              title="Synchronisation"
              subtitle="Gérer la sync des données"
              onPress={() => {/* TODO: Paramètres sync */}}
            />
          </ProfileSection>

          {/* Section Support */}
          <ProfileSection title="Support">
            <ProfileItem
              icon="help-circle-outline"
              title="Aide & FAQ"
              onPress={() => {/* TODO: Navigation vers aide */}}
            />
            <ProfileItem
              icon="mail-outline"
              title="Nous contacter"
              onPress={() => {/* TODO: Contact support */}}
            />
            <ProfileItem
              icon="star-outline"
              title="Évaluer l'app"
              onPress={() => {/* TODO: Store rating */}}
            />
          </ProfileSection>

          {/* Section Déconnexion */}
          <ProfileSection title="">
            <ProfileItem
              icon="log-out-outline"
              title="Déconnexion"
              onPress={handleLogout}
              showArrow={false}
              danger={true}
            />
          </ProfileSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
