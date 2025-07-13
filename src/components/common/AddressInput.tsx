/**
 * Composant d'adresse avec autocomplétion Google Places
 * Version spécialisée pour les entités (steps, accommodations, activities)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GooglePlacesInput from './GooglePlacesInput';
import { useTheme } from '../../contexts';

interface AddressInputProps {
  /** Valeur actuelle de l'adresse */
  value: string;
  /** Callback appelé quand l'adresse change */
  onChangeText: (address: string) => void;
  /** Callback appelé quand une suggestion est sélectionnée */
  onPlaceSelected?: (place: any) => void;
  /** Label du champ */
  label?: string;
  /** Placeholder */
  placeholder?: string;
  /** Message d'erreur */
  error?: string;
  /** Champ requis */
  required?: boolean;
  /** Style personnalisé */
  style?: any;
  /** Désactiver le composant */
  disabled?: boolean;
  /** Type d'entité pour personnaliser l'icône */
  entityType?: 'step' | 'accommodation' | 'activity' | 'restaurant' | 'generic';
}

export const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChangeText,
  onPlaceSelected,
  label = "Adresse",
  placeholder = "Rechercher une adresse...",
  error,
  required = false,
  style,
  disabled = false,
  entityType = 'generic',
}) => {
  const { theme } = useTheme();

  // Icônes selon le type d'entité
  const getIcon = () => {
    switch (entityType) {
      case 'step':
        return 'map-outline';
      case 'accommodation':
        return 'bed-outline';
      case 'activity':
        return 'fitness-outline';
      case 'restaurant':
        return 'restaurant-outline';
      default:
        return 'location-outline';
    }
  };

  // Couleur de l'icône selon le type d'entité
  const getIconColor = () => {
    switch (entityType) {
      case 'step':
        return theme.colors.info;
      case 'accommodation':
        return theme.colors.success;
      case 'activity':
        return theme.colors.warning;
      case 'restaurant':
        return theme.colors.secondary;
      default:
        return theme.colors.primary;
    }
  };

  // Suggestions personnalisées selon le type d'entité
  const getPlaceholder = () => {
    if (placeholder !== "Rechercher une adresse...") {
      return placeholder;
    }
    
    switch (entityType) {
      case 'step':
        return "Rechercher un lieu d'étape...";
      case 'accommodation':
        return "Rechercher un hébergement...";
      case 'activity':
        return "Rechercher une activité ou un lieu...";
      case 'restaurant':
        return "Rechercher un restaurant...";
      default:
        return "Rechercher une adresse...";
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    labelContainer: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    requiredMark: {
      color: theme.colors.danger,
      marginLeft: 4,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.danger,
      marginTop: 4,
      marginLeft: 8,
    },
    inputContainer: {
      borderWidth: error ? 2 : 1,
      borderColor: error ? theme.colors.danger : theme.colors.border,
      borderRadius: 12,
      backgroundColor: disabled ? theme.colors.surface : theme.colors.background,
      opacity: disabled ? 0.6 : 1,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredMark}>*</Text>}
        </View>
      )}
      
      {/* Champ d'adresse avec autocomplétion */}
      <View style={styles.inputContainer}>
        <GooglePlacesInput
          value={value}
          onChangeText={onChangeText}
          onPlaceSelected={onPlaceSelected}
          placeholder={getPlaceholder()}
          icon={getIcon()}
          iconColor={getIconColor()}
          disabled={disabled}
          style={{ borderWidth: 0 }} // Enlever la bordure du GooglePlacesInput car on la gère ici
        />
      </View>
      
      {/* Message d'erreur */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

export default AddressInput;
