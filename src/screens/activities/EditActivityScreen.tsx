/**
 * Écran d'édition d'une activité avec interface moderne
 * Pattern offline-first conforme aux instructions Copilot
 * Architecture reprise de EditAccommodationScreen.tsx
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, useDataRefresh, useToast } from '../../contexts';
import { useActivityDetail } from '../../hooks/useActivityDetail';
import { useActivityUpdate_new } from '../../hooks/useActivityUpdate';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';
import { parseISODate } from '../../utils';
import { colors } from '../../constants/colors';
import { GooglePlacesInput, ThumbnailPicker, CustomDateTimeRow } from '../../components/common';

// ==========================================
// TYPES
// ==========================================

type EditActivityScreenNavigationProp = NativeStackNavigationProp<
  RoadtripsStackParamList,
  'EditActivity'
>;

interface RouteParams {
  stepId: string;
  activityId: string;
}

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
  styles,
  keyboardType = 'default'
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  styles: any;
  keyboardType?: any;
}) => {
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
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray500}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );
});
CustomTextInput.displayName = 'CustomTextInput';

/**
 * Composant de sélecteur de type d'activité - EXTRAIT
 */
const ActivityTypeSelector = React.memo(({
  value,
  onValueChange,
  styles
}: {
  value: string;
  onValueChange: (value: string) => void;
  styles: any;
}) => {
  const activityTypes = [
    { value: 'Randonnée', label: 'Randonnée', icon: 'walk' },
    { value: 'Visite', label: 'Visite', icon: 'camera' },
    { value: 'Restaurant', label: 'Restaurant', icon: 'restaurant' },
    { value: 'Transport', label: 'Transport', icon: 'car' },
    { value: 'Courses', label: 'Courses', icon: 'bag' },
    { value: 'Autre', label: 'Autre', icon: 'ellipsis-horizontal' },
  ];

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <Ionicons name="list" size={20} color={colors.primary} />
        <Text style={styles.inputLabel}>Type d'activité</Text>
      </View>
      <View style={styles.typeGrid}>
        {activityTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeButton,
              value === type.value && styles.typeButtonSelected
            ]}
            onPress={() => onValueChange(type.value)}
          >
            <Ionicons
              name={type.icon as any}
              size={20}
              color={value === type.value ? colors.white : colors.gray600}
            />
            <Text style={[
              styles.typeButtonText,
              value === type.value && styles.typeButtonTextSelected
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});
ActivityTypeSelector.displayName = 'ActivityTypeSelector';

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

export const EditActivityScreen_new: React.FC = () => {
  const navigation = useNavigation<EditActivityScreenNavigationProp>();
  const route = useRoute();
  const { stepId, activityId } = route.params as RouteParams;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { notifyStepUpdate } = useDataRefresh();
  const { showSuccess } = useToast();

  // Hooks métier
  const { activity, loading, error: loadError, refreshActivityDetail } = useActivityDetail(stepId, activityId);
  const { updating, error: updateError, updateActivityData } = useActivityUpdate_new();

  // État du formulaire - Basé sur le modèle backend Activity
  const [name, setName] = useState('');
  const [type, setType] = useState<'Randonnée' | 'Courses' | 'Visite' | 'Transport' | 'Restaurant' | 'Autre'>('Randonnée');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [reservationNumber, setReservationNumber] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'CAD' | 'EUR'>('EUR');
  const [duration, setDuration] = useState('');
  const [typeDuration, setTypeDuration] = useState<'M' | 'H' | 'J'>('H');
  const [trailDistance, setTrailDistance] = useState('');
  const [trailElevation, setTrailElevation] = useState('');
  const [trailType, setTrailType] = useState('');

  /**
   * Chargement initial avec useFocusEffect - Pattern sécurisé selon instructions Copilot
   */
  useFocusEffect(
    useCallback(() => {
      console.log('🚶 EditActivityScreen_new - useFocusEffect déclenché:', {
        hasActivity: !!activity,
        loading,
        error: !!loadError
      });

      // Conditions strictes pour éviter les appels multiples
      if (!activity && !loading && !loadError) {
        console.log('🔧 EditActivityScreen_new - Chargement initial des détails');
        refreshActivityDetail();
      } else {
        console.log('🔧 EditActivityScreen_new - Chargement ignoré:', {
          hasActivity: !!activity,
          loading,
          hasError: !!loadError,
          reason: 'conditions non remplies'
        });
      }
    }, [activity, loading, loadError, refreshActivityDetail]) // Dépendances minimales
  );

  /**
   * Remplissage du formulaire quand l'activity est chargé
   */
  useEffect(() => {
    if (activity) {
      console.log('🚶 EditActivityScreen_new - Remplissage du formulaire:', activity.name);

      setName(activity.name || '');
      setType(activity.type || 'Randonnée');
      setAddress(activity.address || '');
      setLatitude(activity.latitude || null);
      setLongitude(activity.longitude || null);

      // Dates de début (start)
      if (activity.startDateTime) {
        const startParsed = parseISODate(activity.startDateTime);
        if (startParsed) {
          setStartDate(startParsed.toISOString().split('T')[0]); // YYYY-MM-DD
          setStartTime(startParsed.toISOString().split('T')[1].substring(0, 5)); // HH:MM
        }
      }

      // Dates de fin (end)
      if (activity.endDateTime) {
        const endParsed = parseISODate(activity.endDateTime);
        if (endParsed) {
          setEndDate(endParsed.toISOString().split('T')[0]); // YYYY-MM-DD
          setEndTime(endParsed.toISOString().split('T')[1].substring(0, 5)); // HH:MM
        }
      }

      setWebsite(activity.website || activity.url || '');
      setPhone(activity.phone || '');
      setNotes(activity.notes || '');

      // Gestion de la thumbnail : peut être string ou objet avec { url, type, name, fileId, createdAt }
      if (activity.thumbnail) {
        if (typeof activity.thumbnail === 'string') {
          setThumbnail(activity.thumbnail);
        } else if (activity.thumbnail.url) {
          setThumbnail(activity.thumbnail.url);
        } else {
          setThumbnail(null);
        }
      } else {
        setThumbnail(null);
      }

      // Champs MongoDB complets spécifiques aux activités
      setEmail(activity.email || '');
      setWebsite(activity.website || '');
      setReservationNumber(activity.reservationNumber || '');
      setPrice(activity.price?.toString() || '');
      setCurrency(activity.currency || 'EUR');
      setDuration(activity.duration?.toString() || '');
      setTypeDuration(activity.typeDuration || 'H');
      setTrailDistance(activity.trailDistance?.toString() || '');
      setTrailElevation(activity.trailElevation?.toString() || '');
      setTrailType(activity.trailType || '');
    }
  }, [activity]);

  /**
   * Gestion de la sélection d'adresse via Google Places
   */
  const handlePlaceSelected = useCallback((place: any) => {
    console.log('📍 EditActivityScreen_new - Lieu sélectionné:', place.description);

    setAddress(place.description);

    if (place.geometry?.location) {
      setLatitude(place.geometry.location.lat);
      setLongitude(place.geometry.location.lng);
    }
  }, []);

  /**
   * Construction des dates complètes à partir de strings
   */
  const buildDateTime = useCallback((dateStr: string, timeStr: string): string | null => {
    if (!dateStr || !timeStr) return null;

    // Format: YYYY-MM-DDTHH:MM:00.000Z (ISO)
    return `${dateStr}T${timeStr}:00.000Z`;
  }, []);

  /**
   * Sauvegarde avec pattern offline-first
   */
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'activité est obligatoire');
      return;
    }

    console.log('💾 EditActivityScreen_new - Début sauvegarde');

    // Construction des données à sauvegarder
    const startDateTime = buildDateTime(startDate, startTime);
    const endDateTime = buildDateTime(endDate, endTime);

    console.log('🖼️ EditActivityScreen_new - Thumbnail debug:', {
      originalThumbnail: thumbnail,
      hasThumbnail: !!thumbnail,
      willUpload: !!thumbnail
    });

    const activityData = {
      name: name.trim(),
      type,
      address: address.trim(),
      latitude,
      longitude,
      startDateTime: startDateTime || null,
      endDateTime: endDateTime || null,
      duration: duration ? parseInt(duration) : null,
      typeDuration,
      phone: phone.trim() || null,
      email: email.trim() || null,
      website: website.trim() || null,
      reservationNumber: reservationNumber.trim() || null,
      price: price ? parseFloat(price) : null,
      currency: currency || 'EUR',
      trailDistance: trailDistance ? parseFloat(trailDistance) : null,
      trailElevation: trailElevation ? parseFloat(trailElevation) : null,
      trailType: trailType.trim() || null,
      notes: notes.trim() || null,
      thumbnail: thumbnail, // Passer l'URI directement pour upload multipart
    };

    const result = await updateActivityData(stepId, activityId, activityData);

    if (result) {
      // Sauvegarde locale réussie - Toast succès discret
      showSuccess('Modifications sauvegardées');
      
      // Rafraîchir les données locales pour mettre à jour l'affichage (notamment thumbnail)
      await refreshActivityDetail(true);
      
      // Notifier le système de rafraîchissement
      notifyStepUpdate(stepId);

      // Retourner à l'écran précédent
      navigation.goBack();
    } else {
      Alert.alert('Erreur', updateError || 'Erreur lors de la sauvegarde');
    }
  }, [
    name, type, address, latitude, longitude,
    startDate, startTime, endDate, endTime,
    phone, notes, thumbnail,
    stepId, activityId, updateActivityData, updateError,
    notifyStepUpdate, navigation, buildDateTime, refreshActivityDetail, showSuccess,
    // Champs MongoDB complets spécifiques aux activités
    email, website, reservationNumber, price, currency, duration, typeDuration,
    trailDistance, trailElevation, trailType
  ]);

  // Styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingTop: insets.top + 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 12,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: colors.gray400,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: 8,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginLeft: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    textInputMultiline: {
      height: 100,
      textAlignVertical: 'top',
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: 12,
    },
    dateTimeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
    },
    dateButton: {
      flex: 2,
    },
    timeButton: {
      flex: 1,
    },
    dateTimeButtonText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: '#dc3545',
      textAlign: 'center',
      marginTop: 16,
    },
    retryButton: {
      marginTop: 20,
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    // Styles pour la sélection de prix et currency
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    priceInput: {
      flex: 1,
    },
    currencySelector: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      overflow: 'hidden',
    },
    currencyButton: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.surface,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
    },
    currencyButtonSelected: {
      backgroundColor: colors.primary,
    },
    currencyText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    currencyTextSelected: {
      color: 'white',
    },
    // Styles pour CustomDateTimeRow (inspirés d'EditStepScreen)
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
    // Styles pour le type grid
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
    },
    typeButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeButtonText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 6,
    },
    typeButtonTextSelected: {
      color: colors.white,
    },
    // Styles pour les rangées flexibles
    rowContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    flexInput: {
      flex: 1,
    },
    // Styles pour durée
    durationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    durationInput: {
      flex: 1,
    },
    durationTypeSelector: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      overflow: 'hidden',
    },
    durationTypeButton: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.surface,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
    },
    durationTypeButtonSelected: {
      backgroundColor: colors.primary,
    },
    durationTypeText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    durationTypeTextSelected: {
      color: 'white',
    },
  });

  // État de chargement
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={theme.colors.surface} barStyle={'dark-content'} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Édition activité</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  // État d'erreur
  if (loadError) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={theme.colors.surface} barStyle={'dark-content'} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Édition activité</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#dc3545" />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refreshActivityDetail(true)}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Interface principale
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.surface} barStyle={'dark-content'} />

      {/* Header avec bouton de sauvegarde */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Édition activité</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (updating || !name.trim()) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={updating || !name.trim()}
        >
          {updating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
          <Text style={styles.saveButtonText}>
            {updating ? 'Sauvegarde...' : 'Sauvegarder'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled={true}
        >

          {/* Section Informations générales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="information-circle" size={20} color={colors.primary} style={styles.sectionIcon} />
              Informations générales
            </Text>

            <CustomTextInput
              label="Nom de l'activité"
              value={name}
              onChangeText={setName}
              placeholder="Ex: Randonnée du Mont Blanc"
              icon="walk"
              styles={styles}
            />

            <ActivityTypeSelector
              value={type}
              onValueChange={(value) => setType(value as any)}
              styles={styles}
            />
          </View>

          {/* Section Localisation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="location" size={20} color={colors.primary} style={styles.sectionIcon} />
              Localisation
            </Text>

            <View style={[styles.inputContainer, { zIndex: 1000 }]}>
              <View style={styles.inputHeader}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
                <Text style={styles.inputLabel}>Adresse</Text>
              </View>
              <GooglePlacesInput
                value={address}
                onChangeText={setAddress}
                onPlaceSelected={handlePlaceSelected}
                placeholder="Rechercher une adresse..."
              />
            </View>
          </View>

          {/* Section Horaires */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="time" size={20} color={colors.primary} style={styles.sectionIcon} />
              Horaires d'activité
            </Text>

            <CustomDateTimeRow
              label="Début"
              dateValue={startDate}
              timeValue={startTime}
              onDateChange={setStartDate}
              onTimeChange={setStartTime}
              icon="play"
              styles={styles}
            />

            <CustomDateTimeRow
              label="Fin"
              dateValue={endDate}
              timeValue={endTime}
              onDateChange={setEndDate}
              onTimeChange={setEndTime}
              icon="stop"
              styles={styles}
            />

            {/* Durée */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="timer-outline" size={20} color={colors.primary} />
                <Text style={styles.inputLabel}>Durée estimée</Text>
              </View>
              <View style={styles.durationRow}>
                <RNTextInput
                  style={[styles.textInput, styles.durationInput]}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="Ex: 4"
                  placeholderTextColor={colors.gray500}
                  keyboardType="numeric"
                />
                <View style={styles.durationTypeSelector}>
                  <TouchableOpacity
                    style={[styles.durationTypeButton, typeDuration === 'M' && styles.durationTypeButtonSelected]}
                    onPress={() => setTypeDuration('M')}
                  >
                    <Text style={[styles.durationTypeText, typeDuration === 'M' && styles.durationTypeTextSelected]}>Min</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.durationTypeButton, typeDuration === 'H' && styles.durationTypeButtonSelected]}
                    onPress={() => setTypeDuration('H')}
                  >
                    <Text style={[styles.durationTypeText, typeDuration === 'H' && styles.durationTypeTextSelected]}>H</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.durationTypeButton, typeDuration === 'J' && styles.durationTypeButtonSelected]}
                    onPress={() => setTypeDuration('J')}
                  >
                    <Text style={[styles.durationTypeText, typeDuration === 'J' && styles.durationTypeTextSelected]}>J</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Section Randonnée spécifique */}
          {type === 'Randonnée' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="trail-sign" size={20} color={colors.primary} style={styles.sectionIcon} />
                Détails randonnée
              </Text>

              <View style={styles.rowContainer}>
                <View style={styles.flexInput}>
                  <CustomTextInput
                    label="Distance (km)"
                    value={trailDistance}
                    onChangeText={setTrailDistance}
                    placeholder="12.5"
                    icon="map-outline"
                    styles={styles}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.flexInput}>
                  <CustomTextInput
                    label="Dénivelé (m)"
                    value={trailElevation}
                    onChangeText={setTrailElevation}
                    placeholder="850"
                    icon="trending-up-outline"
                    styles={styles}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <CustomTextInput
                label="Type de randonnée"
                value={trailType}
                onChangeText={setTrailType}
                placeholder="Ex: Boucle, Aller-retour, Traverse"
                icon="trail-sign-outline"
                styles={styles}
              />
            </View>
          )}

          {/* Section Contact & Réservation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="call" size={20} color={colors.primary} style={styles.sectionIcon} />
              Contact & Réservation
            </Text>

            <View style={styles.rowContainer}>
              <View style={styles.flexInput}>
                <CustomTextInput
                  label="Téléphone"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+33 1 23 45 67 89"
                  icon="call"
                  styles={styles}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.flexInput}>
                <CustomTextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="contact@exemple.com"
                  icon="mail"
                  styles={styles}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <CustomTextInput
              label="Site web"
              value={website}
              onChangeText={setWebsite}
              placeholder="https://..."
              icon="globe"
              styles={styles}
              keyboardType="url"
            />

            <CustomTextInput
              label="N° de réservation"
              value={reservationNumber}
              onChangeText={setReservationNumber}
              placeholder="RES-123456"
              icon="receipt-outline"
              styles={styles}
            />

            {/* Prix avec currency */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="card-outline" size={20} color={colors.primary} />
                <Text style={styles.inputLabel}>Prix</Text>
              </View>
              <View style={styles.priceRow}>
                <RNTextInput
                  style={[styles.textInput, styles.priceInput]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Ex: 25"
                  placeholderTextColor={colors.gray500}
                  keyboardType="numeric"
                />
                <View style={styles.currencySelector}>
                  <TouchableOpacity
                    style={[styles.currencyButton, currency === 'EUR' && styles.currencyButtonSelected]}
                    onPress={() => setCurrency('EUR')}
                  >
                    <Text style={[styles.currencyText, currency === 'EUR' && styles.currencyTextSelected]}>EUR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.currencyButton, currency === 'USD' && styles.currencyButtonSelected]}
                    onPress={() => setCurrency('USD')}
                  >
                    <Text style={[styles.currencyText, currency === 'USD' && styles.currencyTextSelected]}>USD</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.currencyButton, currency === 'CAD' && styles.currencyButtonSelected]}
                    onPress={() => setCurrency('CAD')}
                  >
                    <Text style={[styles.currencyText, currency === 'CAD' && styles.currencyTextSelected]}>CAD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Section Image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="image" size={20} color={colors.primary} style={styles.sectionIcon} />
              Photo
            </Text>

            <ThumbnailPicker
              value={thumbnail}
              onImageSelected={setThumbnail}
              label="Photo de l'activité"
            />
          </View>

          {/* Section Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="document-text" size={20} color={colors.primary} style={styles.sectionIcon} />
              Notes
            </Text>

            <CustomTextInput
              label="Notes personnelles"
              value={notes}
              onChangeText={setNotes}
              placeholder="Observations, recommandations..."
              multiline
              icon="create"
              styles={styles}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default EditActivityScreen_new;
