/**
 * Écran d'édition d'un accommodation avec interface moderne
 * Pattern offline-first conforme aux instructions Copilot
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
import { useAccommodationDetail } from '../../hooks/useAccommodationDetail';
import { useAccommodationUpdate } from '../../hooks/useAccommodationUpdate';
import type { RoadtripsStackParamList } from '../../components/navigation/RoadtripsNavigator';
import { parseISODate } from '../../utils';
import { colors } from '../../constants/colors';
import { GooglePlacesInput, ThumbnailPicker, CustomDateTimeRow } from '../../components/common';

// ==========================================
// TYPES
// ==========================================

type EditAccommodationScreenNavigationProp = NativeStackNavigationProp<
  RoadtripsStackParamList,
  'EditAccommodation'
>;

interface RouteParams {
  stepId: string;
  accommodationId: string;
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
      />
    </View>
  );
});
CustomTextInput.displayName = 'CustomTextInput';

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

export const EditAccommodationScreen: React.FC = () => {
  const navigation = useNavigation<EditAccommodationScreenNavigationProp>();
  const route = useRoute();
  const { stepId, accommodationId } = route.params as RouteParams;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { notifyStepUpdate } = useDataRefresh();
  const { showSuccess } = useToast();

  // Hooks métier
  const { accommodation, loading, error: loadError, refreshAccommodationDetail } = useAccommodationDetail(stepId, accommodationId);
  const { updating, error: updateError, updateAccommodationData } = useAccommodationUpdate();

  // État du formulaire
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [reservationNumber, setReservationNumber] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [nights, setNights] = useState('1');

  /**
   * Chargement initial avec useFocusEffect - Pattern sécurisé selon instructions Copilot
   */
  useFocusEffect(
    useCallback(() => {
      console.log('� EditAccommodationScreen - useFocusEffect déclenché:', {
        hasAccommodation: !!accommodation,
        loading,
        error: !!loadError
      });

      // Conditions strictes pour éviter les appels multiples
      if (!accommodation && !loading && !loadError) {
        console.log('🔧 EditAccommodationScreen - Chargement initial des détails');
        refreshAccommodationDetail();
      } else {
        console.log('🔧 EditAccommodationScreen - Chargement ignoré:', {
          hasAccommodation: !!accommodation,
          loading,
          hasError: !!loadError,
          reason: 'conditions non remplies'
        });
      }
    }, [accommodation, loading, loadError, refreshAccommodationDetail]) // Dépendances minimales
  );

  /**
   * Remplissage du formulaire quand l'accommodation est chargé
   */
  useEffect(() => {
    if (accommodation) {
      console.log('🏨 EditAccommodationScreen - Remplissage du formulaire:', accommodation.name);

      setName(accommodation.name || '');
      setAddress(accommodation.address || '');
      setLatitude(accommodation.latitude || null);
      setLongitude(accommodation.longitude || null);

      // Dates d'arrivée (check-in)
      if (accommodation.startDateTime || accommodation.arrivalDateTime) {
        const checkInDateStr = accommodation.startDateTime || accommodation.arrivalDateTime;
        const checkInParsed = parseISODate(checkInDateStr);
        if (checkInParsed) {
          setCheckInDate(checkInParsed.toISOString().split('T')[0]); // YYYY-MM-DD
          setCheckInTime(checkInParsed.toISOString().split('T')[1].substring(0, 5)); // HH:MM
        }
      }

      // Dates de départ (check-out)
      if (accommodation.endDateTime || accommodation.departureDateTime) {
        const checkOutDateStr = accommodation.endDateTime || accommodation.departureDateTime;
        const checkOutParsed = parseISODate(checkOutDateStr);
        if (checkOutParsed) {
          setCheckOutDate(checkOutParsed.toISOString().split('T')[0]); // YYYY-MM-DD
          setCheckOutTime(checkOutParsed.toISOString().split('T')[1].substring(0, 5)); // HH:MM
        }
      }

      setWebsite(accommodation.website || accommodation.url || '');
      setPhone(accommodation.phone || '');
      setNotes(accommodation.notes || '');

      // Gestion de la thumbnail : peut être string ou objet avec { url, type, name, fileId, createdAt }
      if (accommodation.thumbnail) {
        if (typeof accommodation.thumbnail === 'string') {
          setThumbnail(accommodation.thumbnail);
        } else if (accommodation.thumbnail.url) {
          setThumbnail(accommodation.thumbnail.url);
        } else {
          setThumbnail(null);
        }
      } else {
        setThumbnail(null);
      }

      // Champs MongoDB complets
      setEmail(accommodation.email || '');
      setWebsite(accommodation.website || '');
      setReservationNumber(accommodation.reservationNumber || '');
      setPrice(accommodation.price?.toString() || '');
      setCurrency(accommodation.currency || 'EUR');
      setNights(accommodation.nights?.toString() || '1');
    }
  }, [accommodation]);

  /**
   * Gestion de la sélection d'adresse via Google Places
   */
  const handlePlaceSelected = useCallback((place: any) => {
    console.log('📍 EditAccommodationScreen - Lieu sélectionné:', place.description);

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
      Alert.alert('Erreur', 'Le nom de l\'hébergement est obligatoire');
      return;
    }

    console.log('💾 EditAccommodationScreen - Début sauvegarde');

    // Construction des données à sauvegarder
    const checkInDateTime = buildDateTime(checkInDate, checkInTime);
    const checkOutDateTime = buildDateTime(checkOutDate, checkOutTime);

    console.log('🖼️ EditAccommodationScreen - Thumbnail debug:', {
      originalThumbnail: thumbnail,
      hasThumbnail: !!thumbnail,
      willUpload: !!thumbnail
    });

    const accommodationData = {
      name: name.trim(),
      address: address.trim(),
      latitude,
      longitude,
      // CORRECTION: Utiliser les bons noms de champs MongoDB
      arrivalDateTime: checkInDateTime || null,
      departureDateTime: checkOutDateTime || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      website: website.trim() || null,
      reservationNumber: reservationNumber.trim() || null,
      price: price ? parseFloat(price) : null,
      currency: currency || 'EUR',
      nights: nights ? parseInt(nights) : null,
      notes: notes.trim() || null,
      thumbnail: thumbnail, // Passer l'URI directement pour upload multipart
    };

    const result = await updateAccommodationData(stepId, accommodationId, accommodationData);

    if (result) {
      // Sauvegarde locale réussie - Toast succès discret
      showSuccess('Modifications sauvegardées');
      
      // Notifier le système de rafraîchissement
      notifyStepUpdate(stepId);

      // Retourner à l'écran précédent
      navigation.goBack();
    } else {
      Alert.alert('Erreur', updateError || 'Erreur lors de la sauvegarde');
    }
  }, [
    name, address, latitude, longitude,
    checkInDate, checkInTime, checkOutDate, checkOutTime,
    phone, notes, thumbnail,
    stepId, accommodationId, updateAccommodationData, updateError,
    notifyStepUpdate, navigation, buildDateTime,
    // Champs MongoDB complets
    email, website, reservationNumber, price, currency, nights
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
            <Text style={styles.headerTitle}>Édition hébergement</Text>
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
            <Text style={styles.headerTitle}>Édition hébergement</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#dc3545" />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refreshAccommodationDetail(true)}>
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
          <Text style={styles.headerTitle}>Édition hébergement</Text>
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

          {/* Section Photo - Déplacée en haut */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="image" size={20} color={colors.primary} style={styles.sectionIcon} />
              Photo
            </Text>

            <ThumbnailPicker
              value={thumbnail}
              onImageSelected={setThumbnail}
              label="Photo de l'hébergement"
            />
          </View>

          {/* Section Informations générales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="information-circle" size={20} color={colors.primary} style={styles.sectionIcon} />
              Informations générales
            </Text>

            <CustomTextInput
              label="Nom de l'hébergement"
              value={name}
              onChangeText={setName}
              placeholder="Ex: Hôtel du Centre"
              icon="business"
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

          {/* Section Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="calendar" size={20} color={colors.primary} style={styles.sectionIcon} />
              Dates de séjour
            </Text>

            <CustomDateTimeRow
              label="Check-in"
              dateValue={checkInDate}
              timeValue={checkInTime}
              onDateChange={setCheckInDate}
              onTimeChange={setCheckInTime}
              icon="log-in"
              styles={styles}
            />

            <CustomDateTimeRow
              label="Check-out"
              dateValue={checkOutDate}
              timeValue={checkOutTime}
              onDateChange={setCheckOutDate}
              onTimeChange={setCheckOutTime}
              icon="log-out"
              styles={styles}
            />
          </View>

          {/* Section Détails */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="star" size={20} color={colors.primary} style={styles.sectionIcon} />
              Détails
            </Text>

            {/* Prix avec currency */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="card-outline" size={20} color={colors.primary} />
                <Text style={styles.inputLabel}>Prix total</Text>
              </View>
              <View style={styles.priceRow}>
                <RNTextInput
                  style={[styles.textInput, styles.priceInput]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Ex: 340"
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

            <CustomTextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="contact@hotel.com"
              icon="mail"
              styles={styles}
            />

            <CustomTextInput
              label="Site web"
              value={website}
              onChangeText={setWebsite}
              placeholder="https://..."
              icon="globe"
              styles={styles}
            />

            <CustomTextInput
              label="Téléphone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+33 1 23 45 67 89"
              icon="call"
              styles={styles}
            />
          </View>

          {/* Section Image */}
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

export default EditAccommodationScreen;
