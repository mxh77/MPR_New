/**
 * Écran de mot de passe oublié avec nouveaux composants
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../components/navigation/AuthNavigator';

import { useTheme } from '../../contexts';
import { useForm } from '../../hooks';
import { Button, Input, Card } from '../../components/common';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  // Utilisation du hook useForm avec validation
  const { formState, updateField, validateForm, isFormValid } = useForm(
    { email: '' },
    { email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } }
  );

  const [isLoading, setIsLoading] = React.useState(false);
  const [isEmailSent, setIsEmailSent] = React.useState(false);

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implémenter la logique de réinitialisation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulation
      setIsEmailSent(true);
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
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
      lineHeight: 22,
    },
    formContainer: {
      marginBottom: 24,
    },
    successContainer: {
      alignItems: 'center',
      padding: 24,
    },
    successText: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
    },
  });

  if (isEmailSent) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <Text style={styles.title}>Email envoyé !</Text>
          <Card style={styles.successContainer}>
            <Text style={styles.successText}>
              Un email de réinitialisation a été envoyé à {formState.email?.value}.{'\n\n'}
              Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
            </Text>
            <Button
              title="Retour à la connexion"
              onPress={() => navigation.navigate('Login')}
              fullWidth
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Mot de passe oublié</Text>
          <Text style={styles.subtitle}>
            Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>

          <View style={styles.formContainer}>
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
          </View>

          <Button
            title="Envoyer l'email"
            onPress={handleResetPassword}
            loading={isLoading}
            disabled={!isFormValid || isLoading}
            fullWidth
            size="large"
          />

          <Button
            title="Retour à la connexion"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            fullWidth
            style={{ marginTop: 16 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;