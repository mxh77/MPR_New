/**
 * Écran de création/édition de roadtrip avec formulaire complet - Version corrigée
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts';
import { useRoadtripForm, useRoadtripsWithApi } from '../../hooks';
import { Input, DatePickerModal, CurrencyPickerModal } from '../../components/common';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';

type CreateRoadtripNavigationProp = NativeStackNavigationProp<RoadtripsStackParamList, 'CreateRoadtrip'>;

interface CreateRoadtripFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  startLocation: string;
  endLocation: string;
  currency: string;
  participants: number;
  estimatedBudget: string;
  isPublic: boolean;
}

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dollar US' },
  { code: 'GBP', symbol: '£', name: 'Livre Sterling' },
  { code: 'CHF', symbol: 'CHF', name: 'Franc Suisse' },
  { code: 'CAD', symbol: 'C$', name: 'Dollar Canadien' },
  { code: 'JPY', symbol: '¥', name: 'Yen Japonais' },
];

export const CreateRoadtripScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<CreateRoadtripNavigationProp>();
  const { createRoadtrip, loading: creatingRoadtrip, refreshRoadtrips } = useRoadtripsWithApi();
  
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const initialData: CreateRoadtripFormData = {
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
    startLocation: '',
    endLocation: '',
    currency: 'EUR',
    participants: 2,
    estimatedBudget: '',
    isPublic: false,
  };

  const { formData, updateField, errors, isValid, validateForm } = useRoadtripForm<CreateRoadtripFormData>({
    initialData,
    validationRules: {
      title: { required: true, minLength: 3 },
      startLocation: { required: true, minLength: 2 },
      endLocation: { required: true, minLength: 2 },
      participants: { required: true, min: 1, max: 20 },
    },
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const calculateDuration = () => {
    const diffTime = Math.abs(formData.endDate.getTime() - formData.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDateChange = (date: Date, type: 'start' | 'end') => {
    if (type === 'start') {
      updateField('startDate', date);
      // Si la date de début est après la date de fin, ajuster la date de fin
      if (date >= formData.endDate) {
        const newEndDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        updateField('endDate', newEndDate);
      }
    } else {
      // Vérifier que la date de fin est après la date de début
      if (date <= formData.startDate) {
        Alert.alert('Date invalide', 'La date de fin doit être après la date de début');
        return;
      }
      updateField('endDate', date);
    }
    setShowDatePicker(null);
  };

  const handleLocationSuggestion = (field: 'startLocation' | 'endLocation', value: string) => {
    updateField(field, value);
  };

  const handlePlaceSelected = (field: 'startLocation' | 'endLocation', place: any) => {
    // La place sélectionnée contient plus d'informations si nécessaire
    updateField(field, place.description);
    console.log('Place sélectionnée pour', field, ':', place);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Formulaire incomplet', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      
      // Préparer les données pour la création
      const roadtripData = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startLocation: formData.startLocation,
        endLocation: formData.endLocation,
        currency: formData.currency,
        participants: formData.participants,
      };
      
      // Créer le roadtrip via l'API
      const newRoadtrip = await createRoadtrip(roadtripData);
      
      if (newRoadtrip) {
        Alert.alert(
          '✅ Roadtrip créé !',
          `"${formData.title}" a été créé avec succès`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Déclencher le rafraîchissement de la liste et retourner
                refreshRoadtrips();
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('❌ Erreur', 'Impossible de créer le roadtrip');
      }
    } catch (error) {
      console.error('Erreur création roadtrip:', error);
      Alert.alert('❌ Erreur', 'Impossible de créer le roadtrip');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    requiredLabel: {
      color: theme.colors.danger,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.danger,
      marginTop: 4,
    },
    dateButton: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateButtonText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    durationInfo: {
      backgroundColor: theme.colors.primary + '20',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    durationText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    currencySelector: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    currencyText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    participantsContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    participantsControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    participantsButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    participantsCount: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      minWidth: 30,
      textAlign: 'center',
    },
    toggleContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    toggleSwitch: {
      width: 50,
      height: 30,
      borderRadius: 15,
      padding: 2,
      justifyContent: 'center',
    },
    toggleThumb: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.colors.white,
    },
    footer: {
      padding: 20,
      paddingBottom: 40,
    },
    createButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    createButtonDisabled: {
      backgroundColor: theme.colors.textSecondary,
    },
    createButtonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const durationCount = calculateDuration();
  const currentCurrency = CURRENCIES.find(c => c.code === formData.currency);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Nouveau roadtrip</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Informations de base */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations générales</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Titre <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <Input
                value={formData.title}
                onChangeText={(value) => updateField('title', value)}
                placeholder="Ex: Roadtrip en Toscane"
                error={errors.title || undefined}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <Input
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Décrivez votre roadtrip..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dates du voyage</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date de début</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker('start')}
              >
                <Text style={styles.dateButtonText}>
                  {formatDate(formData.startDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Date de fin</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker('end')}
              >
                <Text style={styles.dateButtonText}>
                  {formatDate(formData.endDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.durationInfo}>
              <Ionicons name="time" size={16} color={theme.colors.primary} />
              <Text style={styles.durationText}>
                {`Durée: ${durationCount} jour${durationCount > 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>

          {/* Lieux */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itinéraire</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Lieu de départ <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <Input
                value={formData.startLocation}
                onChangeText={(value) => updateField('startLocation', value)}
                placeholder="Ex: Paris, France"
                leftIcon="location-outline"
              />
              {errors.startLocation && (
                <Text style={styles.errorText}>{errors.startLocation}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Lieu d'arrivée <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <Input
                value={formData.endLocation}
                onChangeText={(value) => updateField('endLocation', value)}
                placeholder="Ex: Rome, Italie"
                leftIcon="location-outline"
              />
              {errors.endLocation && (
                <Text style={styles.errorText}>{errors.endLocation}</Text>
              )}
            </View>
          </View>

          {/* Paramètres avancés */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paramètres</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Devise</Text>
              <TouchableOpacity 
                style={styles.currencySelector}
                onPress={() => setShowCurrencyPicker(true)}
              >
                <Text style={styles.currencyText}>
                  {`${currentCurrency?.symbol || ''} ${formData.currency}`}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre de participants</Text>
              <View style={styles.participantsContainer}>
                <Text style={styles.participantsCount}>{String(formData.participants)}</Text>
                <View style={styles.participantsControls}>
                  <TouchableOpacity 
                    style={styles.participantsButton}
                    onPress={() => updateField('participants', Math.max(1, formData.participants - 1))}
                  >
                    <Ionicons name="remove" size={20} color={theme.colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.participantsButton}
                    onPress={() => updateField('participants', Math.min(20, formData.participants + 1))}
                  >
                    <Ionicons name="add" size={20} color={theme.colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Budget estimé (optionnel)</Text>
              <Input
                value={formData.estimatedBudget}
                onChangeText={(value) => updateField('estimatedBudget', value)}
                placeholder="Ex: 1500"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>Roadtrip public</Text>
                <TouchableOpacity 
                  style={[
                    styles.toggleSwitch,
                    { backgroundColor: formData.isPublic ? theme.colors.primary : theme.colors.border }
                  ]}
                  onPress={() => updateField('isPublic', !formData.isPublic)}
                >
                  <View 
                    style={[
                      styles.toggleThumb,
                      { marginLeft: formData.isPublic ? 22 : 2 }
                    ]} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.createButton,
              (!isValid || loading || creatingRoadtrip) && styles.createButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isValid || loading || creatingRoadtrip}
          >
            {(loading || creatingRoadtrip) ? (
              <>
                <Ionicons name="sync" size={20} color={theme.colors.white} />
                <Text style={styles.createButtonText}>Création...</Text>
              </>
            ) : (
              <>
                <Ionicons name="add" size={20} color={theme.colors.white} />
                <Text style={styles.createButtonText}>Créer le roadtrip</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Modals */}
      <DatePickerModal
        visible={showDatePicker === 'start'}
        onClose={() => setShowDatePicker(null)}
        onDateChange={(date) => handleDateChange(date, 'start')}
        currentDate={formData.startDate}
        title="Date de début"
        minimumDate={new Date()}
      />
      
      <DatePickerModal
        visible={showDatePicker === 'end'}
        onClose={() => setShowDatePicker(null)}
        onDateChange={(date) => handleDateChange(date, 'end')}
        currentDate={formData.endDate}
        title="Date de fin"
        minimumDate={formData.startDate}
      />
      
      {/* Currency Picker Modal */}
      <CurrencyPickerModal
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        onCurrencySelect={(currency) => updateField('currency', currency.code)}
        currencies={CURRENCIES}
        selectedCurrency={formData.currency}
      />
    </SafeAreaView>
  );
};

export default CreateRoadtripScreen;
