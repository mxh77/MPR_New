/**
 * Écran d'inscription avec nouveaux composants
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../components/navigation/AuthNavigator';

import { useAuth, useTheme } from '../../contexts';
import { useForm } from '../../hooks';
import { Button, Input } from '../../components/common';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const { register } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  // Utilisation du hook useForm avec validation
  const { formState, updateField, validateForm, isFormValid } = useForm(
    {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    {
      firstName: { required: true },
      lastName: { required: true },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      password: { required: true, minLength: 6 },
      confirmPassword: { 
        required: true,
        custom: (value: string) => {
          if (value !== formState.password?.value) {
            return 'Les mots de passe ne correspondent pas';
          }
          return undefined;
        }
      },
    }
  );

  const [isLoading, setIsLoading] = React.useState(false);

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: formState.email.value,
        password: formState.password.value,
        firstName: formState.firstName.value,
        lastName: formState.lastName.value,
      });
    } catch (error) {
      console.error('Erreur inscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 32,
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
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez la communauté Mon Petit Roadtrip</Text>

          <View style={styles.formContainer}>
            <Input
              label="Prénom"
              placeholder="Votre prénom"
              leftIcon="person"
              value={formState.firstName?.value || ''}
              onChangeText={(text) => updateField('firstName', text)}
              error={formState.firstName?.error}
              autoCapitalize="words"
              autoCorrect={false}
              required
            />

            <Input
              label="Nom"
              placeholder="Votre nom"
              leftIcon="person"
              value={formState.lastName?.value || ''}
              onChangeText={(text) => updateField('lastName', text)}
              error={formState.lastName?.error}
              autoCapitalize="words"
              autoCorrect={false}
              required
            />

            <Input
              label="Email"
              placeholder="votre@email.com"
              leftIcon="mail"
              value={formState.email?.value || ''}
              onChangeText={(text) => updateField('email', text)}
              error={formState.email?.error}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              required
            />

            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              leftIcon="lock-closed"
              value={formState.password?.value || ''}
              onChangeText={(text) => updateField('password', text)}
              error={formState.password?.error}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              required
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Confirmez votre mot de passe"
              leftIcon="lock-closed"
              value={formState.confirmPassword?.value || ''}
              onChangeText={(text) => updateField('confirmPassword', text)}
              error={formState.confirmPassword?.error}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              required
            />
          </View>

          <Button
            title="S'inscrire"
            onPress={handleRegister}
            loading={isLoading}
            disabled={!isFormValid || isLoading}
            fullWidth
            size="large"
          />

          <Button
            title="Déjà un compte ? Se connecter"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            fullWidth
            style={{ marginTop: 16 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
