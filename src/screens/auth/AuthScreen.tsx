/**
 * Nouvel écran de connexion avec API complète
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useAuth } from '../../contexts';

export const AuthScreen: React.FC = () => {
  const { theme } = useTheme();
  const { login, register, isLoading, error, clearError } = useAuth();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre email');
      return false;
    }
    
    if (!formData.password.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre mot de passe');
      return false;
    }

    if (isRegisterMode) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        Alert.alert('Erreur', 'Veuillez saisir vos nom et prénom');
        return false;
      }
      
      if (!formData.username.trim()) {
        Alert.alert('Erreur', 'Veuillez saisir un pseudo');
        return false;
      }
      
      if (formData.username.length < 3) {
        Alert.alert('Erreur', 'Le pseudo doit contenir au moins 3 caractères');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return false;
      }
      
      if (formData.password.length < 6) {
        Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isRegisterMode) {
        await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          username: formData.username,
        });
        Alert.alert('Succès', 'Inscription réussie ! Vous êtes maintenant connecté.');
      } else {
        await login(formData.email, formData.password);
        Alert.alert('Succès', 'Connexion réussie !');
      }
    } catch (err) {
      console.error('Auth error:', err);
      // L'erreur est déjà gérée par le contexte
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    form: {
      gap: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 12,
    },
    passwordToggle: {
      padding: 4,
    },
    nameRow: {
      flexDirection: 'row',
      gap: 12,
    },
    nameInput: {
      flex: 1,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.textSecondary,
    },
    buttonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    switchModeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
      gap: 8,
    },
    switchModeText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    switchModeButton: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    errorContainer: {
      backgroundColor: theme.colors.warning + '20',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: theme.colors.warning,
      fontSize: 14,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="map" size={32} color={theme.colors.white} />
            </View>
            <Text style={styles.title}>
              {isRegisterMode ? 'Créer un compte' : 'Connexion'}
            </Text>
            <Text style={styles.subtitle}>
              {isRegisterMode 
                ? 'Rejoignez Mon Petit Roadtrip et planifiez vos aventures'
                : 'Connectez-vous pour accéder à vos roadtrips'
              }
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Name Fields (Register only) */}
            {isRegisterMode && (
              <>
                <View style={styles.nameRow}>
                  <View style={[styles.inputContainer, styles.nameInput]}>
                    <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Prénom"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={formData.firstName}
                      onChangeText={(value) => handleInputChange('firstName', value)}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={[styles.inputContainer, styles.nameInput]}>
                    <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nom"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={formData.lastName}
                      onChangeText={(value) => handleInputChange('lastName', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                
                {/* Username */}
                <View style={styles.inputContainer}>
                  <Ionicons name="at" size={20} color={theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Pseudo (username)"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.username}
                    onChangeText={(value) => handleInputChange('username', value)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </>
            )}

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password (Register only) */}
            {isRegisterMode && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showPassword}
                />
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegisterMode ? 'Créer le compte' : 'Se connecter'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Switch Mode */}
          <View style={styles.switchModeContainer}>
            <Text style={styles.switchModeText}>
              {isRegisterMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
            </Text>
            <TouchableOpacity onPress={() => setIsRegisterMode(!isRegisterMode)}>
              <Text style={styles.switchModeButton}>
                {isRegisterMode ? 'Se connecter' : 'Créer un compte'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreen;
