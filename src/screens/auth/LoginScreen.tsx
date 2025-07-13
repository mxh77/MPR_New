/**
 * Écran de connexion simple avec authentification API
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../components/navigation/AuthNavigator';
import { useTheme, useAuth } from '../../contexts';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const { theme } = useTheme();
  const { login, register, isLoading, error, clearError } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      Alert.alert('Erreur', 'L\'email est requis');
      return false;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Erreur', 'L\'email n\'est pas valide');
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('Erreur', 'Le mot de passe est requis');
      return false;
    }

    if (isRegisterMode) {
      if (!formData.firstName.trim()) {
        Alert.alert('Erreur', 'Le prénom est requis');
        return false;
      }
      
      if (!formData.lastName.trim()) {
        Alert.alert('Erreur', 'Le nom est requis');
        return false;
      }
      
      if (!formData.username.trim()) {
        Alert.alert('Erreur', 'Le pseudo est requis');
        return false;
      }
      
      if (formData.username.length < 3) {
        Alert.alert('Erreur', 'Le pseudo doit contenir au moins 3 caractères');
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
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        Alert.alert('Succès', 'Inscription réussie !');
      } else {
        await login(formData.email, formData.password);
        Alert.alert('Succès', 'Connexion réussie !');
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 40,
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
      height: 56,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.disabled,
    },
    buttonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    switchText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
    },
    switchButton: {
      marginLeft: 4,
    },
    switchButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    errorContainer: {
      backgroundColor: theme.colors.warning + '20',
      borderRadius: 8,
      padding: 12,
      marginTop: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.warning,
    },
    errorText: {
      color: theme.colors.warning,
      fontSize: 14,
    },
    forgotPasswordButton: {
      alignItems: 'center',
      marginTop: 16,
    },
    forgotPasswordText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            {isRegisterMode ? 'Créer un compte' : 'Connexion'}
          </Text>
          <Text style={styles.subtitle}>
            {isRegisterMode 
              ? 'Rejoignez Mon Petit Roadtrip' 
              : 'Accédez à vos roadtrips'
            }
          </Text>

          <View style={styles.form}>
            {isRegisterMode && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.firstName}
                    onChangeText={(value) => updateField('firstName', value)}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.lastName}
                    onChangeText={(value) => updateField('lastName', value)}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="at-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Pseudo (username)"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.username}
                    onChangeText={(value) => updateField('username', value)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.white} size="small" />
              ) : (
                <>
                  <Ionicons 
                    name={isRegisterMode ? "person-add" : "log-in"} 
                    size={20} 
                    color={theme.colors.white} 
                  />
                  <Text style={styles.buttonText}>
                    {isRegisterMode ? 'S\'inscrire' : 'Se connecter'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!isRegisterMode && (
              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isRegisterMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
            </Text>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsRegisterMode(!isRegisterMode)}
            >
              <Text style={styles.switchButtonText}>
                {isRegisterMode ? 'Se connecter' : 'S\'inscrire'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
