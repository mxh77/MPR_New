/**
 * Écran d'édition d'une activité avec interface moderne
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, useDataRefresh } from '../../contexts';
import { useActivityDetail } from '../../hooks/useActivityDetail_old';
import { useActivityUpdate } from '../../hooks/useActivityUpdate_old';
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
  styles
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  styles: any
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

export const EditActivityScreen: React.FC = () => {
  const navigation = useNavigation<EditActivityScreenNavigationProp>();
  const route = useRoute();
  const { stepId, activityId } = route.params as RouteParams;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { notifyStepUpdate } = useDataRefresh();

  // Hooks métier
  const { activity, loading, error: loadError, refreshActivityDetail } = useActivityDetail(stepId, activityId);
  const { updating, error: updateError, updateAccommodationData } = useActivityUpdate();

  // État du formulaire - Basé sur le modèle backend Activity
  const [name, setName] = useState('');
  const [type, setType] = useState<'Randonnée' | 'Courses' | 'Visite' | 'Transport' | 'Restaurant' | 'Autre'>('Randonnée');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [duration, setDuration] = useState('');
  const [typeDuration, setTypeDuration] = useState<'M' | 'H' | 'J'>('H');
  const [reservationNumber, setReservationNumber] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'CAD' | 'EUR'>('EUR');
  const [trailDistance, setTrailDistance] = useState('');
  const [trailElevation, setTrailElevation] = useState('');
  const [trailType, setTrailType] = useState('');
  const [notes, setNotes] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  /**
   * Chargement initial avec useFocusEffect - Pattern sécurisé selon instructions Copilot
   */
    useFocusEffect(
      useCallback(() => {
        console.log('� EditActivityScreen - useFocusEffect déclenché:', {
          hasActivity: !!activity,
          loading,
          error: !!loadError
        });
  
        // Conditions strictes pour éviter les appels multiples
        if (!activity && !loading && !loadError) {
          console.log('🔧 EditActivityScreen - Chargement initial des détails');
          refreshActivityDetail();
        } else {
          console.log('🔧 EditActivityScreen - Chargement ignoré:', {
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
      console.log('🏨 EditActivityScreen - Remplissage du formulaire:', activity.name);

      setName(activity.name || '');
      setAddress(activity.address || '');
      setLatitude(activity.latitude || null);
      setLongitude(activity.longitude || null);

      // Dates d'arrivée (check-in)
      if (activity.startDateTime || activity.arrivalDateTime) {
        const checkInDateStr = activity.startDateTime || activity.arrivalDateTime;
        const checkInParsed = parseISODate(checkInDateStr);
        if (checkInParsed) {
          setCheckInDate(checkInParsed.toISOString().split('T')[0]); // YYYY-MM-DD
          setCheckInTime(checkInParsed.toISOString().split('T')[1].substring(0, 5)); // HH:MM
        }
      }

      // Dates de départ (check-out)
      if (activity.endDateTime || activity.departureDateTime) {
        const checkOutDateStr = activity.endDateTime || activity.departureDateTime;
        const checkOutParsed = parseISODate(checkOutDateStr);
        if (checkOutParsed) {
          setCheckOutDate(checkOutParsed.toISOString().split('T')[0]); // YYYY-MM-DD
          setCheckOutTime(checkOutParsed.toISOString().split('T')[1].substring(0, 5)); // HH:MM
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

      // Champs MongoDB complets
      setEmail(activity.email || '');
      setWebsite(activity.website || '');
      setReservationNumber(activity.reservationNumber || '');
      setPrice(activity.price?.toString() || '');
      setCurrency(activity.currency || 'EUR');
      setNights(activity.nights?.toString() || '1');
    }
  }, [activity]);


























  /**
   * Gestion de la sélection d'adresse via Google Places
   */
  const handlePlaceSelected = useCallback((place: GooglePlacePrediction) => {
    console.log('🚶 EditActivityScreen - Lieu sélectionné:', place);

    if (place.description) {
      setAddress(place.description);
    }

    // TODO: Récupérer les coordonnées via Place Details API
    // if (place.latitude && place.longitude) {
    //   setLatitude(place.latitude);
    //   setLongitude(place.longitude);
    // }
  }, []);

  /**
   * Gestion de la sélection d'image
   */
  const handleImageSelected = useCallback((imageUri: string) => {
    console.log('🚶 EditActivityScreen - Image sélectionnée:', imageUri);
    setThumbnail(imageUri);
  }, []);

  /**
   * Suppression d'image
   */
  const handleImageRemoved = useCallback(() => {
    console.log('🚶 EditActivityScreen - Image supprimée');
    setThumbnail(undefined);
  }, []);

  /**
   * Validation du formulaire
   */
  const validateForm = useCallback((): boolean => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'activité est requis');
      return false;
    }

    return true;
  }, [name]);

  /**
   * Sauvegarde de l'activité
   */
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Préparer les données pour l'API
      const activityData = {
        name: name.trim(),
        type,
        address: address.trim(),
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        website: website.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        startDateTime: startDateTime || undefined,
        endDateTime: endDateTime || undefined,
        duration: duration ? parseInt(duration) : undefined,
        typeDuration,
        reservationNumber: reservationNumber.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        currency,
        trailDistance: trailDistance ? parseFloat(trailDistance) : undefined,
        trailElevation: trailElevation ? parseFloat(trailElevation) : undefined,
        trailType: trailType.trim() || undefined,
        notes: notes.trim() || undefined,
        thumbnailUri: thumbnail || undefined,
      };

      console.log('🚶 EditActivityScreen - Sauvegarde activité:', {
        activityId,
        dataFields: Object.keys(activityData)
      });

      // Utiliser le hook de mise à jour avec pattern offline-first
      await updateActivityWithAlert(activityId, stepId, activityData, () => {
        // Notification pour rafraîchir les écrans de détail
        notifyStepUpdate(stepId);

        // Retour à l'écran précédent
        navigation.goBack();
      });

    } catch (error) {
      console.error('🚶 EditActivityScreen - Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'activité');
    } finally {
      setSaving(false);
    }
  }, [
    validateForm,
    name,
    type,
    address,
    latitude,
    longitude,
    website,
    phone,
    email,
    startDateTime,
    endDateTime,
    duration,
    typeDuration,
    reservationNumber,
    price,
    currency,
    trailDistance,
    trailElevation,
    trailType,
    notes,
    thumbnail,
    activityId,
    updateActivityWithAlert,
    notifyStepUpdate,
    stepId,
    navigation
  ]);

  /**
   * Header personnalisé
   */
  const CustomHeader = React.memo(() => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor={theme.colors.surface} barStyle="dark-content" />
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Modifier l'activité</Text>

        <TouchableOpacity
          style={[styles.headerButton, (saving || updating) && styles.headerButtonDisabled]}
          onPress={handleSave}
          disabled={saving || updating}
        >
          {saving || updating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="checkmark" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  ));
  CustomHeader.displayName = 'CustomHeader';

  // Styles dynamiques utilisant le thème
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
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
      backgroundColor: colors.primary,
    },
    headerButtonDisabled: {
      opacity: 0.6,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
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
      color: theme.colors.text,
      marginLeft: 8,
    },
    textInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      minHeight: 48,
    },
    textInputMultiline: {
      minHeight: 100,
      paddingTop: 12,
      textAlignVertical: 'top',
    },
    googlePlacesContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      zIndex: 1000,
    },
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
    rowContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    flexInput: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <CustomHeader />

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

          {/* Section Photo de couverture */}
          <ThumbnailPicker
            label="Photo de l'activité"
            value={thumbnail}
            onImageSelected={handleImageSelected}
            onImageRemoved={handleImageRemoved}
          />

          {/* Section Informations générales */}
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

          {/* Section Localisation */}
          <View style={[styles.inputContainer, { zIndex: 1000 }]}>
            <View style={styles.inputHeader}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>Localisation</Text>
            </View>

            <GooglePlacesInput
              value={address}
              onChangeText={setAddress}
              onPlaceSelected={handlePlaceSelected}
              placeholder="Rechercher une adresse..."
              style={styles.googlePlacesContainer}
            />
          </View>

          {/* Section Contact */}
          <CustomTextInput
            label="Site web"
            value={website}
            onChangeText={setWebsite}
            placeholder="https://exemple.com"
            icon="globe-outline"
            styles={styles}
            keyboardType="url"
          />

          <View style={styles.rowContainer}>
            <View style={styles.flexInput}>
              <CustomTextInput
                label="Téléphone"
                value={phone}
                onChangeText={setPhone}
                placeholder="+33 1 23 45 67 89"
                icon="call-outline"
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
                icon="mail-outline"
                styles={styles}
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Section Réservation */}
          <View style={styles.rowContainer}>
            <View style={styles.flexInput}>
              <CustomTextInput
                label="Prix"
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                icon="card-outline"
                styles={styles}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flexInput}>
              <CustomTextInput
                label="N° de réservation"
                value={reservationNumber}
                onChangeText={setReservationNumber}
                placeholder="RES-123456"
                icon="receipt-outline"
                styles={styles}
              />
            </View>
          </View>

          {/* Section Randonnée spécifique */}
          {type === 'Randonnée' && (
            <>
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
            </>
          )}

          {/* Section Notes */}
          <CustomTextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Informations complémentaires..."
            multiline
            icon="document-text-outline"
            styles={styles}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default EditActivityScreen;
