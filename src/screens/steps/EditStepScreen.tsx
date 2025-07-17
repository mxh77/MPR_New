/**
 * Écran d'édition d'une étape avec interface moderne
 * Design conforme au thème de l'application
 */
import React, { useState, useCallback, useEffect } from 'react';
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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme, useDataRefresh } from '../../contexts';
import { useStepDetail } from '../../hooks/useStepDetail';
import { useStepUpdate } from '../../hooks/useStepUpdate';
import type { Step } from '../../types';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';
import { formatDateWithoutTimezone, parseISODate } from '../../utils';
import { colors } from '../../constants/colors';
import { GooglePlacesInput, ThumbnailPicker } from '../../components/common';
import ENV from '../../config/env';

// ==========================================
// COMPOSANTS EXTRAITS POUR ÉVITER RE-RENDERS
// ==========================================

/**
 * Composant de champ de texte personnalisé - EXTRAIT
 */
const CustomTextInput = React.memo(({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  multiline = false, 
  icon,
  styles
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  styles: any;
}) => {
  console.log('🔄 DEBUG - CustomTextInput render:', { label, value });
  
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <RNTextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline
        ]}
        value={value}
        onChangeText={(text) => {
          console.log('🔤 DEBUG - TextInput onChangeText:', { label, text });
          onChangeText(text);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.gray500}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );
});
CustomTextInput.displayName = 'CustomTextInput';

/**
 * Composant de date et heure sur la même ligne - EXTRAIT avec DateTimePicker
 */
const CustomDateTimeRow = React.memo(({ 
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  icon,
  disabled = false,
  disabledMessage,
  styles
}: {
  label: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (text: string) => void;
  onTimeChange: (text: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  disabledMessage?: string;
  styles: any;
}) => {
  console.log('🔄 DEBUG - CustomDateTimeRow render:', { label, dateValue, timeValue, disabled });
  
  // États pour les modales de sélection
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Conversion des valeurs string en Date
  const getDateObject = () => {
    if (dateValue && timeValue) {
      return new Date(`${dateValue}T${timeValue}:00`);
    } else if (dateValue) {
      return new Date(`${dateValue}T12:00:00`);
    }
    return new Date();
  };

  // Gestion du changement de date
  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      console.log('📅 DEBUG - DatePicker onChange:', { label, formattedDate });
      onDateChange(formattedDate);
    }
  };

  // Gestion du changement d'heure
  const handleTimePickerChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const formattedTime = selectedTime.toTimeString().substring(0, 5); // HH:MM
      console.log('⏰ DEBUG - TimePicker onChange:', { label, formattedTime });
      onTimeChange(formattedTime);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <Ionicons name={icon} size={20} color={disabled ? colors.gray500 : colors.primary} />
        <Text style={[styles.inputLabel, disabled && styles.disabledLabel]}>{label}</Text>
        {disabled && disabledMessage && (
          <View style={styles.disabledInfoContainer}>
            <Ionicons name="information-circle" size={16} color={colors.warning} />
            <Text style={styles.disabledInfo}>{disabledMessage}</Text>
          </View>
        )}
      </View>
      <View style={styles.dateTimeRow}>
        {/* Champ Date */}
        <View style={styles.dateInputContainer}>
          <Text style={[styles.dateTimeSubLabel, disabled && styles.disabledLabel]}>Date</Text>
          <TouchableOpacity
            style={[
              styles.textInput, 
              styles.dateTimeInput, 
              styles.dateTimeButton,
              disabled && styles.disabledInput
            ]}
            onPress={() => !disabled && setShowDatePicker(true)}
            disabled={disabled}
          >
            <Text style={[
              styles.dateTimeButtonText, 
              !dateValue && styles.placeholderText,
              disabled && styles.disabledText
            ]}>
              {dateValue || 'YYYY-MM-DD'}
            </Text>
            <Ionicons 
              name="calendar-outline" 
              size={16} 
              color={disabled ? colors.gray400 : colors.gray500} 
            />
          </TouchableOpacity>
        </View>

        {/* Champ Heure */}
        <View style={styles.timeInputContainer}>
          <Text style={[styles.dateTimeSubLabel, disabled && styles.disabledLabel]}>Heure</Text>
          <TouchableOpacity
            style={[
              styles.textInput, 
              styles.dateTimeInput, 
              styles.dateTimeButton,
              disabled && styles.disabledInput
            ]}
            onPress={() => !disabled && setShowTimePicker(true)}
            disabled={disabled}
          >
            <Text style={[
              styles.dateTimeButtonText, 
              !timeValue && styles.placeholderText,
              disabled && styles.disabledText
            ]}>
              {timeValue || 'HH:MM'}
            </Text>
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={disabled ? colors.gray400 : colors.gray500} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* DatePicker Modal - seulement si pas désactivé */}
      {showDatePicker && !disabled && (
        <DateTimePicker
          value={getDateObject()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDatePickerChange}
        />
      )}

      {/* TimePicker Modal - seulement si pas désactivé */}
      {showTimePicker && !disabled && (
        <DateTimePicker
          value={getDateObject()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={true}
          onChange={handleTimePickerChange}
        />
      )}
    </View>
  );
});
CustomDateTimeRow.displayName = 'CustomDateTimeRow';

type EditStepScreenNavigationProp = NativeStackNavigationProp<RoadtripsStackParamList, 'EditStep'>;

interface RouteParams {
  stepId: string;
  roadtripId: string;
}

const EditStepScreen: React.FC = () => {
  const { theme } = useTheme();
  const { notifyStepUpdate } = useDataRefresh();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<EditStepScreenNavigationProp>();
  const route = useRoute();
  const { stepId, roadtripId } = route.params as RouteParams;

  // Hook offline-first pour les détails de l'étape - Optimisé pour éviter re-renders
  const { 
    step, 
    loading, 
    syncing, 
    error, 
    fetchStepDetail, 
    refreshStepDetail 
  } = useStepDetail(stepId);

  // Hook pour la mise à jour - Stable
  const { 
    updating, 
    error: updateError, 
    updateStepData 
  } = useStepUpdate();

  // États pour le formulaire
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    arrivalDate: '',
    arrivalTime: '',
    departureDate: '',
    departureTime: '',
    thumbnail: undefined as string | undefined,
  });

  // États pour la sauvegarde
  const [saving, setSaving] = useState(false);

  // Référence pour formData pour éviter les re-renders dans handleSave
  const formDataRef = React.useRef(formData);
  formDataRef.current = formData;

  // Combinaison des erreurs
  const combinedError = error || updateError;

  // Debug counter pour voir les re-renders
  const renderCount = React.useRef(0);
  renderCount.current += 1;

  // Debug pour les références des fonctions du hook
  const hookRefCount = React.useRef(0);
  const lastFetchRef = React.useRef(fetchStepDetail);
  if (lastFetchRef.current !== fetchStepDetail) {
    hookRefCount.current += 1;
    lastFetchRef.current = fetchStepDetail;
  }

  console.log('🔧 EditStepScreen - stepId:', stepId, 'roadtripId:', roadtripId);
  console.log('🔄 DEBUG - EditStepScreen render #', renderCount.current, {
    formData,
    loading,
    syncing,
    saving,
    updating,
    hasStep: !!step,
    hookRefChanges: hookRefCount.current
  });

  /**
   * Chargement initial des données - Optimisé pour éviter re-renders
   */
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 DEBUG - useFocusEffect déclenché:', { hasStep: !!step, loading, syncing });
      if (!step && !loading && !syncing) {
        console.log('🔧 EditStepScreen - Chargement initial des détails');
        fetchStepDetail();
      }
    }, [step, loading, syncing]) // Retirer fetchStepDetail des dépendances
  );

  /**
   * Initialisation du formulaire quand les données arrivent
   */
  useEffect(() => {
    if (step) {
      console.log('📝 EditStepScreen - Initialisation du formulaire avec:', {
        name: step.title,
        type: step.type,
        hasStartDate: !!step.startDate,
        hasEndDate: !!step.endDate
      });

      // Extraction de la date et de l'heure séparément
      const arrivalDate = step.startDate ? step.startDate.toISOString().split('T')[0] : '';
      const arrivalTime = step.startDate ? step.startDate.toISOString().split('T')[1].substring(0, 5) : '';
      const departureDate = step.endDate ? step.endDate.toISOString().split('T')[0] : '';
      const departureTime = step.endDate ? step.endDate.toISOString().split('T')[1].substring(0, 5) : '';

      setFormData({
        name: step.title || '',
        notes: step.description || '',
        address: step.location?.address || '',
        latitude: step.location?.latitude,
        longitude: step.location?.longitude,
        arrivalDate,
        arrivalTime,
        departureDate,
        departureTime,
        thumbnail: step.thumbnail || undefined,
      });
    }
  }, [step]);

  /**
   * Vérifie si l'étape a des activités ou hébergements avec des dates définies
   * Si c'est le cas, les dates de l'étape sont calculées automatiquement par le backend
   */
  const hasActivitiesOrAccommodationsWithDates = useCallback(() => {
    if (!step) return false;

    const stepData = step as any;

    // Vérifier les activités
    const activities = Array.isArray(stepData.activities) ? stepData.activities : [];
    const hasActivitiesWithDates = activities.some((activity: any) => 
      activity && (activity.startDateTime || activity.endDateTime || activity.arrivalDateTime || activity.departureDateTime)
    );

    // Vérifier les hébergements
    const accommodations = Array.isArray(stepData.accommodations) ? stepData.accommodations : [];
    const hasAccommodationsWithDates = accommodations.some((accommodation: any) => 
      accommodation && (accommodation.startDateTime || accommodation.endDateTime || accommodation.arrivalDateTime || accommodation.departureDateTime)
    );

    const result = hasActivitiesWithDates || hasAccommodationsWithDates;
    
    console.log('📅 EditStepScreen - Vérification dates automatiques:', {
      activitiesCount: activities.length,
      accommodationsCount: accommodations.length,
      hasActivitiesWithDates,
      hasAccommodationsWithDates,
      datesAreAutoCalculated: result
    });

    return result;
  }, [step]);

  // Variables pour l'interface utilisateur
  const datesAreAutoCalculated = hasActivitiesOrAccommodationsWithDates();

  /**
   * Sauvegarde des modifications - OFFLINE-FIRST
   * Sauvegarde immédiate en local, synchronisation API en arrière-plan
   */
  const handleSave = useCallback(async () => {
    if (saving || updating) return;

    const currentFormData = formDataRef.current;

    if (!currentFormData.name.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'étape est obligatoire');
      return;
    }

    setSaving(true);

    try {
      // Reconstruction des dates complètes - SEULEMENT si pas de calcul automatique
      let arrivalDateTime: string | undefined;
      let departureDateTime: string | undefined;

      // Si les dates ne sont PAS calculées automatiquement par le backend
      if (!datesAreAutoCalculated) {
        if (currentFormData.arrivalDate && currentFormData.arrivalTime) {
          arrivalDateTime = `${currentFormData.arrivalDate}T${currentFormData.arrivalTime}:00.000Z`;
        }

        if (currentFormData.departureDate && currentFormData.departureTime) {
          departureDateTime = `${currentFormData.departureDate}T${currentFormData.departureTime}:00.000Z`;
        }
        
        console.log('📅 EditStepScreen - Dates manuelles construites:', {
          arrivalDateTime,
          departureDateTime
        });
      } else {
        console.log('📅 EditStepScreen - Dates ignorées (calcul automatique par le backend)');
      }

      const updatedData = {
        name: currentFormData.name.trim(),
        notes: currentFormData.notes.trim(),
        address: currentFormData.address.trim(),
        latitude: currentFormData.latitude,
        longitude: currentFormData.longitude,
        thumbnail: currentFormData.thumbnail,
        // Inclure les dates SEULEMENT si elles ne sont pas calculées automatiquement
        ...(datesAreAutoCalculated ? {} : { arrivalDateTime, departureDateTime }),
      };

      console.log('💾 EditStepScreen - Sauvegarde offline-first:', updatedData);

      // Sauvegarde offline-first : immédiate en local, sync API en arrière-plan
      const result = await updateStepData(stepId, updatedData);
      
      if (result) {
        // Succès immédiat après sauvegarde locale
        console.log('✅ EditStepScreen - Sauvegarde locale réussie, affichage succès immédiat');
        
        Alert.alert(
          'Succès',
          'Les modifications ont été sauvegardées',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('🔄 EditStepScreen - Notification et retour immédiat');
                
                // Notifier le système qu'un step a été mis à jour
                notifyStepUpdate(stepId);
                
                // Rafraîchir les données locales et retourner immédiatement
                refreshStepDetail(false).then(() => {
                  console.log('✅ EditStepScreen - Rafraîchissement local terminé');
                }).catch(err => {
                  console.warn('⚠️ EditStepScreen - Erreur rafraîchissement mineur:', err);
                });
                
                // Retourner immédiatement sans attendre la sync
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        throw new Error('Erreur lors de la sauvegarde locale');
      }

    } catch (err: any) {
      console.error('❌ EditStepScreen - Erreur sauvegarde:', err);
      Alert.alert(
        'Erreur',
        updateError || 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  }, [saving, updating, updateStepData, updateError, refreshStepDetail, navigation, stepId, notifyStepUpdate]);

  /**
   * Gestion des champs de texte optimisée - Version finale
   */
  const handleTextChange = useCallback((field: string, value: string) => {
    console.log('🎯 DEBUG - handleTextChange appelé:', { field, value });
    setFormData(prev => {
      console.log('🎯 DEBUG - setFormData:', { field, prev, value });
      return {
        ...prev,
        [field]: value,
      };
    });
  }, []); // SANS dépendances pour éviter les re-renders

  // Utiliser des refs pour éviter que les callbacks changent
  const handleTextChangeRef = React.useRef(handleTextChange);
  handleTextChangeRef.current = handleTextChange;

  // Fonctions spécifiques stables avec refs - NE CHANGENT JAMAIS
  const handleNameChange = React.useMemo(() => (text: string) => {
    console.log('🎯 DEBUG - handleNameChange:', text);
    handleTextChangeRef.current('name', text);
  }, []);
  
  const handleAddressChange = React.useMemo(() => (text: string) => {
    console.log('🎯 DEBUG - handleAddressChange:', text);
    handleTextChangeRef.current('address', text);
  }, []);
  
  const handleNotesChange = React.useMemo(() => (text: string) => {
    console.log('🎯 DEBUG - handleNotesChange:', text);
    handleTextChangeRef.current('notes', text);
  }, []);
  
  const handleArrivalDateChange = React.useMemo(() => (text: string) => {
    console.log('🎯 DEBUG - handleArrivalDateChange:', text);
    handleTextChangeRef.current('arrivalDate', text);
  }, []);
  
  const handleArrivalTimeChange = React.useMemo(() => (text: string) => {
    console.log('🎯 DEBUG - handleArrivalTimeChange:', text);
    handleTextChangeRef.current('arrivalTime', text);
  }, []);
  
  const handleDepartureDateChange = React.useMemo(() => (text: string) => {
    console.log('🎯 DEBUG - handleDepartureDateChange:', text);
    handleTextChangeRef.current('departureDate', text);
  }, []);
  
  const handleDepartureTimeChange = React.useMemo(() => (text: string) => {
    console.log('🎯 DEBUG - handleDepartureTimeChange:', text);
    handleTextChangeRef.current('departureTime', text);
  }, []);

  // Fonction pour gérer la sélection d'un lieu Google Places
  const handlePlaceSelected = useCallback(async (place: any) => {
    console.log('🎯 DEBUG - Place sélectionné:', place);
    
    try {
      // Récupérer les détails du lieu pour obtenir les coordonnées
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=geometry,formatted_address&key=${ENV.GOOGLE_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const address = data.result.formatted_address || place.description;
        
        console.log('🎯 DEBUG - Coordonnées récupérées:', { lat, lng, address });
        
        // Mettre à jour le formData avec l'adresse et les coordonnées
        setFormData(prev => ({
          ...prev,
          address,
          latitude: lat,
          longitude: lng
        }));
        
        // Mettre à jour la ref pour handleSave
        formDataRef.current = {
          ...formDataRef.current,
          address,
          latitude: lat,
          longitude: lng
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du lieu:', error);
      // En cas d'erreur, utiliser juste la description
      handleAddressChange(place.description);
    }
  }, [handleAddressChange]);

  // Fonction pour gérer la suppression de l'adresse et des coordonnées
  const handleAddressClear = useCallback(() => {
    console.log('🎯 DEBUG - Suppression adresse et coordonnées');
    
    // Vider l'adresse et les coordonnées
    setFormData(prev => ({
      ...prev,
      address: '',
      latitude: undefined,
      longitude: undefined
    }));
    
    // Mettre à jour la ref pour handleSave
    formDataRef.current = {
      ...formDataRef.current,
      address: '',
      latitude: undefined,
      longitude: undefined
    };
  }, []);

  // Fonction pour gérer la sélection d'une image thumbnail
  const handleThumbnailSelected = useCallback((imageUri: string) => {
    console.log('🎯 DEBUG - Thumbnail sélectionné:', imageUri);
    
    setFormData(prev => ({
      ...prev,
      thumbnail: imageUri
    }));
    
    // Mettre à jour la ref pour handleSave
    formDataRef.current = {
      ...formDataRef.current,
      thumbnail: imageUri
    };
  }, []);

  // Fonction pour gérer la suppression du thumbnail
  const handleThumbnailRemoved = useCallback(() => {
    console.log('🎯 DEBUG - Thumbnail supprimé');
    
    setFormData(prev => ({
      ...prev,
      thumbnail: undefined
    }));
    
    // Mettre à jour la ref pour handleSave
    formDataRef.current = {
      ...formDataRef.current,
      thumbnail: undefined
    };
  }, []);

  // Debug pour les callbacks de champs (après définition)
  const callbackRefCount = React.useRef(0);
  const lastNameChangeRef = React.useRef(handleNameChange);
  if (lastNameChangeRef.current !== handleNameChange) {
    callbackRefCount.current += 1;
    lastNameChangeRef.current = handleNameChange;
  }

  // Logs debug finaux
  console.log('🔄 DEBUG FINAL - EditStepScreen render #', renderCount.current, {
    formData,
    loading,
    syncing,
    saving,
    updating,
    hasStep: !!step,
    hookRefChanges: hookRefCount.current,
    callbackRefChanges: callbackRefCount.current
  });

  /**
   * Composant Header personnalisé - Mémorisé pour éviter re-renders
   */
  const CustomHeader = React.memo(() => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Modifier l'étape</Text>
        
        <TouchableOpacity
          style={[styles.headerButton, (saving || updating) && styles.headerButtonDisabled]}
          onPress={handleSave}
          disabled={saving || updating}
        >
          {saving || updating ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="checkmark" size={24} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  ));
  CustomHeader.displayName = 'CustomHeader';

  // États de chargement et d'erreur
  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </View>
    );
  }

  if (combinedError || !step) {
    return (
      <View style={styles.container}>
        <CustomHeader />
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.danger} />
          <Text style={styles.errorText}>
            {combinedError || 'Impossible de charger les détails de l\'étape'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refreshStepDetail(true)}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Nom de l'étape */}
          <CustomTextInput
            label="Nom de l'étape *"
            value={formData.name}
            onChangeText={handleNameChange}
            placeholder="Entrez le nom de l'étape..."
            icon="location"
            styles={styles}
          />

          {/* Adresse avec autocomplétion Google */}
          <View style={[styles.inputContainer, { zIndex: 1000 }]}>
            <View style={styles.inputHeader}>
              <Ionicons name="map" size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>Adresse</Text>
            </View>
            <GooglePlacesInput
              value={formData.address}
              onChangeText={handleAddressChange}
              onPlaceSelected={handlePlaceSelected}
              onClear={handleAddressClear}
              placeholder="Rechercher une adresse..."
              icon="" // Pas d'icône dans le champ lui-même
              style={styles.googlePlacesContainer}
            />
          </View>

          {/* Thumbnail */}
          <ThumbnailPicker
            label="Photo de l'étape"
            value={formData.thumbnail}
            onImageSelected={handleThumbnailSelected}
            onImageRemoved={handleThumbnailRemoved}
          />

          {/* Date et heure d'arrivée */}
          <CustomDateTimeRow
            label="Arrivée"
            dateValue={formData.arrivalDate}
            timeValue={formData.arrivalTime}
            onDateChange={handleArrivalDateChange}
            onTimeChange={handleArrivalTimeChange}
            icon="calendar"
            disabled={datesAreAutoCalculated}
            disabledMessage={datesAreAutoCalculated ? "Calculées automatiquement" : undefined}
            styles={styles}
          />

          {/* Date et heure de départ */}
          <CustomDateTimeRow
            label="Départ"
            dateValue={formData.departureDate}
            timeValue={formData.departureTime}
            onDateChange={handleDepartureDateChange}
            onTimeChange={handleDepartureTimeChange}
            icon="calendar-outline"
            disabled={datesAreAutoCalculated}
            disabledMessage={datesAreAutoCalculated ? "Calculées automatiquement" : undefined}
            styles={styles}
          />

          {/* Notes */}
          <CustomTextInput
            label="Notes"
            value={formData.notes}
            onChangeText={handleNotesChange}
            placeholder="Ajoutez des notes ou descriptions..."
            multiline
            icon="document-text"
            styles={styles}
          />

          {/* Espace pour le bouton de sauvegarde sur iOS */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  header: {
    backgroundColor: colors.primary,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray300,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.gray800,
    minHeight: 48,
  },
  textInputMultiline: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  googlePlacesContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 2,
  },
  timeInputContainer: {
    flex: 1,
  },
  dateTimeSubLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray600,
    marginBottom: 4,
  },
  dateTimeInput: {
    minHeight: 44,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: colors.gray800,
    flex: 1,
  },
  placeholderText: {
    color: colors.gray500,
  },
  // Styles pour les éléments désactivés
  disabledLabel: {
    color: colors.gray500,
  },
  disabledInput: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
  },
  disabledText: {
    color: colors.gray400,
  },
  disabledInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.warning + '20', // Warning color with 20% opacity
    borderRadius: 8,
  },
  disabledInfo: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray600,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});

export default EditStepScreen;
