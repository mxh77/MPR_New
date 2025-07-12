/**
 * Écran de connexion avec nouveaux composants
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../components/navigation/AuthNavigator';

import { useAuth, useTheme } from '../../contexts';
import { useForm } from '../../hooks';
import { Button, Input } from '../../components/common';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  // Utilisation du hook useForm avec validation
  const { formState, updateField, validateForm, isFormValid } = useForm(
    { email: '', password: '' },
    {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: (value) => {
          if (!value.includes('@')) return 'Email invalide';
          return undefined;
        },
      },
      password: {
        required: true,
        minLength: 6,
      },
    }
  );

  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsLoading(true);
    try {
      await login(formState.email.value, formState.password.value);
    } catch (error) {
      Alert.alert('Erreur de connexion', 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
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
      fontSize: 32,
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
    formContainer: {
      marginBottom: 24,
    },
    linkText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center',
      marginTop: 16,
    },
    forgotPasswordText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 24,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Bienvenue !</Text>
          <Text style={styles.subtitle}>Connectez-vous pour continuer votre aventure</Text>

          <View style={styles.formContainer}>
            <Input
              label="Email"
              placeholder="votre@email.com"
              leftIcon="mail"
              value={formState.email.value}
              onChangeText={(text) => updateField('email', text)}
              error={formState.email.error}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              required
            />

            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              leftIcon="lock-closed"
              value={formState.password.value}
              onChangeText={(text) => updateField('password', text)}
              error={formState.password.error}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              required
            />
          </View>

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!isFormValid || isLoading}
            fullWidth
            size="large"
          />

          <Button
            title="Créer un compte"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            fullWidth
            style={{ marginTop: 16 }}
          />

          <Text
            style={styles.forgotPasswordText}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            Mot de passe oublié ?
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
