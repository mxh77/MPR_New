/**
 * Écran de création d'une nouvelle étape
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  TextInput as RNTextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, useDataRefresh, useToast } from '../../contexts';
import { useSteps } from '../../hooks/useSteps';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';
import type { CreateStepRequest } from '../../services/api/steps';
import { GooglePlacesInput } from '../../components/common';
import ENV from '../../config/env';

type CreateStepScreenNavigationProp = NativeStackNavigationProp<RoadtripsStackParamList, 'CreateStep'>;

interface RouteParams {
  roadtripId: string;
}

const CreateStepScreen: React.FC = () => {
  const { theme } = useTheme();
  const { showSuccess, showError } = useToast();
  const { notifyStepUpdate } = useDataRefresh();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CreateStepScreenNavigationProp>();
  const route = useRoute();
  const { roadtripId } = route.params as RouteParams;

  // Hook pour la création d'étapes
  const { createStepOptimistic } = useSteps(roadtripId);

  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    arrivalDate: new Date().toISOString().split('T')[0],
    arrivalTime: '09:00',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '18:00',
    type: 'Stage' as 'Stage' | 'Stop',
  });

  // États pour les pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentPickerField, setCurrentPickerField] = useState<string>('');
  
  // État de sauvegarde
  const [saving, setSaving] = useState(false);

  /**
   * Gestion des champs texte
   */
  const handleNameChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, name: text }));
  }, []);

  const handleNotesChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, notes: text }));
  }, []);

  /**
   * Gestion de l'adresse avec Google Places
   */
  const handleAddressSelect = useCallback(async (place: any) => {
    console.log('🗺️ Place sélectionné:', place);
    
    try {
      // Récupérer les détails du lieu pour obtenir les coordonnées
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=geometry,formatted_address&key=${ENV.GOOGLE_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const address = data.result.formatted_address || place.description;
        
        console.log('🗺️ Coordonnées récupérées:', { lat, lng, address });
        
        setFormData(prev => ({
          ...prev,
          address,
          latitude: lat,
          longitude: lng,
        }));
      } else {
        console.warn('🗺️ Impossible de récupérer les coordonnées:', data.status);
        // Utiliser seulement l'adresse sans coordonnées
        setFormData(prev => ({
          ...prev,
          address: place.description,
        }));
      }
    } catch (error) {
      console.error('🗺️ Erreur lors de la récupération des détails:', error);
      // Utiliser seulement l'adresse sans coordonnées
      setFormData(prev => ({
        ...prev,
        address: place.description,
      }));
    }
  }, []);

  const handleAddressChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, address: text }));
  }, []);

  /**
   * Gestion du type d'étape
   */
  const handleTypeChange = useCallback((type: 'Stage' | 'Stop') => {
    setFormData(prev => ({ ...prev, type }));
  }, []);

  /**
   * Gestion des dates et heures
   */
  const openDatePicker = useCallback((field: string) => {
    setCurrentPickerField(field);
    setShowDatePicker(true);
  }, []);

  const openTimePicker = useCallback((field: string) => {
    setCurrentPickerField(field);
    setShowTimePicker(true);
  }, []);

  const handleDatePickerChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && currentPickerField) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, [currentPickerField]: dateString }));
    }
  }, [currentPickerField]);

  const handleTimePickerChange = useCallback((event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime && currentPickerField) {
      const timeString = selectedTime.toTimeString().slice(0, 5);
      setFormData(prev => ({ ...prev, [currentPickerField]: timeString }));
    }
  }, [currentPickerField]);

  /**
   * Validation du formulaire
   */
  const validateForm = useCallback((): string | null => {
    if (!formData.name.trim()) {
      return 'Le nom de l\'étape est obligatoire';
    }
    if (!formData.address.trim()) {
      return 'L\'adresse est obligatoire';
    }
    if (!formData.latitude || !formData.longitude) {
      return 'Veuillez sélectionner une adresse valide';
    }
    return null;
  }, [formData]);

  /**
   * Sauvegarde de l'étape
   */
  const handleSave = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      showError(validationError);
      return;
    }

    setSaving(true);

    try {
      // Création des dates complètes
      const arrivalDateTime = new Date(`${formData.arrivalDate}T${formData.arrivalTime}:00.000Z`);
      const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime}:00.000Z`);

      const stepData: CreateStepRequest = {
        roadtripId,
        type: formData.type,
        name: formData.name,
        address: formData.address,
        latitude: formData.latitude!,
        longitude: formData.longitude!,
        arrivalDateTime: arrivalDateTime.toISOString(),
        departureDateTime: departureDateTime.toISOString(),
        notes: formData.notes,
      };

      await createStepOptimistic(stepData);
      
      showSuccess('Étape créée avec succès !');
      notifyStepUpdate('step_created');
      navigation.goBack();
      
    } catch (error) {
      console.error('Erreur lors de la création de l\'étape:', error);
      showError('Erreur lors de la création de l\'étape');
    } finally {
      setSaving(false);
    }
  }, [formData, roadtripId, createStepOptimistic, validateForm, showSuccess, showError, notifyStepUpdate, navigation]);

  /**
   * Fonction pour obtenir un objet Date à partir des champs date/time
   */
  const getDateObject = useCallback((fieldType: 'arrival' | 'departure') => {
    const dateField = fieldType === 'arrival' ? 'arrivalDate' : 'departureDate';
    const timeField = fieldType === 'arrival' ? 'arrivalTime' : 'departureTime';
    const date = formData[dateField];
    const time = formData[timeField];
    
    if (currentPickerField.includes('Date')) {
      return new Date(`${date}T12:00:00.000Z`);
    } else {
      return new Date(`2024-01-01T${time}:00.000Z`);
    }
  }, [formData, currentPickerField]);

  /**
   * Composant Row personnalisé pour les dates et heures
   */
  const CustomDateTimeRow = React.memo(({ 
    label, 
    dateField, 
    timeField, 
    icon, 
    color 
  }: {
    label: string;
    dateField: string;
    timeField: string;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
      <View style={styles.inputHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{label}</Text>
      </View>
      
      <View style={styles.dateTimeRow}>
        <TouchableOpacity
          style={[styles.dateTimeButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => openDatePicker(dateField)}
        >
          <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
            {new Date(formData[dateField as keyof typeof formData] as string).toLocaleDateString('fr-FR')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.dateTimeButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => openTimePicker(timeField)}
        >
          <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
            {formData[timeField as keyof typeof formData] as string}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ));

  /**
   * Composant Header personnalisé
   */
  const CustomHeader = React.memo(() => (
    <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.colors.surface }]}>
      <StatusBar backgroundColor={theme.colors.surface} barStyle="dark-content" />
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Nouvelle étape</Text>
        
        <TouchableOpacity
          style={[styles.headerButton, saving && styles.headerButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>
              Créer
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  ));

  const colors = theme.colors;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerButton: {
      padding: 8,
      borderRadius: 8,
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonDisabled: {
      opacity: 0.5,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      flex: 1,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    inputContainer: {
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    inputHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.background,
      color: colors.text,
    },
    notesInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    typeSelector: {
      flexDirection: 'row',
      marginTop: 12,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    typeButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    typeButtonTextSelected: {
      color: colors.white,
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: 12,
    },
    dateTimeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
    },
    dateTimeText: {
      fontSize: 14,
      fontWeight: '500',
    },
    addressContainer: {
      zIndex: 1000,
    },
    bottomPadding: {
      height: 32,
    },
  });

  return (
    <View style={styles.container}>
      <CustomHeader />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {/* Nom de l'étape */}
          <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
            <View style={styles.inputHeader}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Nom de l'étape *</Text>
            </View>
            <RNTextInput
              style={[styles.textInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.background, color: theme.colors.text }]}
              value={formData.name}
              onChangeText={handleNameChange}
              placeholder="Ex: Visite du château de Versailles"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Type d'étape */}
          <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
            <View style={styles.inputHeader}>
              <Ionicons name="flag" size={20} color={colors.secondary} />
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Type d'étape</Text>
            </View>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { borderColor: theme.colors.border },
                  formData.type === 'Stage' && styles.typeButtonSelected
                ]}
                onPress={() => handleTypeChange('Stage')}
              >
                <Text style={[
                  styles.typeButtonText,
                  { color: theme.colors.text },
                  formData.type === 'Stage' && styles.typeButtonTextSelected
                ]}>
                  Étape
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { borderColor: theme.colors.border },
                  formData.type === 'Stop' && styles.typeButtonSelected
                ]}
                onPress={() => handleTypeChange('Stop')}
              >
                <Text style={[
                  styles.typeButtonText,
                  { color: theme.colors.text },
                  formData.type === 'Stop' && styles.typeButtonTextSelected
                ]}>
                  Arrêt
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Adresse avec Google Places */}
          <View style={[styles.inputContainer, styles.addressContainer, { borderColor: theme.colors.border, zIndex: 1000 }]}>
            <View style={styles.inputHeader}>
              <Ionicons name="map" size={20} color={colors.success} />
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Adresse *</Text>
            </View>
            <GooglePlacesInput
              value={formData.address}
              onChangeText={handleAddressChange}
              onPlaceSelected={handleAddressSelect}
              placeholder="Rechercher une adresse..."
              icon="location-outline"
              iconColor={colors.success}
            />
          </View>

          {/* Dates et heures d'arrivée */}
          <CustomDateTimeRow
            label="Arrivée"
            dateField="arrivalDate"
            timeField="arrivalTime"
            icon="log-in"
            color={colors.success}
          />

          {/* Dates et heures de départ */}
          <CustomDateTimeRow
            label="Départ"
            dateField="departureDate"
            timeField="departureTime"
            icon="log-out"
            color={colors.warning}
          />

          {/* Notes */}
          <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
            <View style={styles.inputHeader}>
              <Ionicons name="document-text" size={20} color={colors.info} />
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Notes</Text>
            </View>
            <RNTextInput
              style={[styles.textInput, styles.notesInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.background, color: theme.colors.text }]}
              value={formData.notes}
              onChangeText={handleNotesChange}
              placeholder="Ajoutez des notes sur cette étape..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DatePicker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={getDateObject(currentPickerField.includes('arrival') ? 'arrival' : 'departure')}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDatePickerChange}
        />
      )}

      {/* TimePicker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={getDateObject(currentPickerField.includes('arrival') ? 'arrival' : 'departure')}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={true}
          onChange={handleTimePickerChange}
        />
      )}
    </View>
  );
};

export default CreateStepScreen;
