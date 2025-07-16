/**
 * Écran de debug pour WatermelonDB
 * Aide à diagnostiquer le problème "No driver with tag 2 available"
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useTheme } from '../../contexts';

export const DatabaseDebugScreen: React.FC = () => {
  const { theme } = useTheme();
  const { database, isReady, error, retryInitialization } = useDatabase();

  const testDatabase = async () => {
    if (!database) {
      Alert.alert('Erreur', 'Base de données non disponible');
      return;
    }

    try {
      console.log('🧪 Test de la base de données...');
      
      // Test 1: Vérifier les tables
      const roadtrips = await database.get('roadtrips').query().fetch();
      const steps = await database.get('steps').query().fetch();
      
      Alert.alert(
        'Test réussi ✅',
        `Roadtrips: ${roadtrips.length}\nSteps: ${steps.length}`
      );
      
    } catch (testError) {
      console.error('❌ Erreur test database:', testError);
      Alert.alert(
        'Erreur test ❌',
        `${testError instanceof Error ? testError.message : 'Erreur inconnue'}`
      );
    }
  };

  const resetDatabase = async () => {
    if (!database) {
      Alert.alert('Erreur', 'Base de données non disponible');
      return;
    }

    Alert.alert(
      'Confirmer reset',
      'Êtes-vous sûr de vouloir réinitialiser la base ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await database.unsafeResetDatabase();
              });
              Alert.alert('Succès', 'Base réinitialisée');
            } catch (resetError) {
              Alert.alert('Erreur', `Reset échoué: ${resetError}`);
            }
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
    },
    statusCard: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    statusText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    statusValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 14,
      fontStyle: 'italic',
    },
    successText: {
      color: theme.colors.success,
      fontSize: 14,
      fontWeight: '500',
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    buttonDanger: {
      backgroundColor: theme.colors.danger,
    },
    buttonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    retryButton: {
      backgroundColor: theme.colors.warning,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Debug WatermelonDB</Text>

        {/* Status de la base */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>État de la base de données</Text>
          
          <Text style={styles.statusText}>Status:</Text>
          <Text style={[styles.statusValue, isReady ? styles.successText : styles.errorText]}>
            {isReady ? '✅ Prête' : '❌ Non prête'}
          </Text>

          <Text style={styles.statusText}>Instance:</Text>
          <Text style={[styles.statusValue, database ? styles.successText : styles.errorText]}>
            {database ? '✅ Disponible' : '❌ Null'}
          </Text>

          {error && (
            <>
              <Text style={styles.statusText}>Erreur:</Text>
              <Text style={styles.errorText}>{error}</Text>
            </>
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.button} onPress={testDatabase}>
          <Text style={styles.buttonText}>Tester la base</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.retryButton]} 
          onPress={retryInitialization}
        >
          <Text style={styles.buttonText}>Réessayer l'initialisation</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonDanger]} 
          onPress={resetDatabase}
        >
          <Text style={styles.buttonText}>Reset base (DANGER)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DatabaseDebugScreen;
