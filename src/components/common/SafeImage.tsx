/**
 * Composant sécurisé pour le rendu d'images
 * Extrait de StepDetailScreen pour réutilisation
 */
import React from 'react';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getImageUri, isValidImageUri, SafeImageProps } from '../../utils/stepDetailHelpers';

/**
 * Composant sécurisé pour le rendu d'images
 */
export const SafeImage: React.FC<SafeImageProps> = ({ thumbnail, style, placeholderIcon, onError, theme }) => {
  // Sécurité : si pas de thumbnail, retourner directement le placeholder
  if (!thumbnail) {
    console.log('🖼️ SafeImage - Pas de thumbnail, utilisation du placeholder');
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
        <Ionicons name={placeholderIcon} size={32} color={theme.colors.textSecondary} />
      </View>
    );
  }

  const imageUri = getImageUri(thumbnail);

//   console.log('🖼️ SafeImage - Debug:', {
//     thumbnail: typeof thumbnail,
//     imageUri: typeof imageUri,
//     imageUriValue: imageUri,
//     isValidImageUri: imageUri ? isValidImageUri(imageUri) : false
//   });

  // Triple validation pour éviter l'erreur de casting
  if (imageUri &&
    typeof imageUri === 'string' &&
    imageUri.length > 0 &&
    isValidImageUri(imageUri) &&
    typeof imageUri !== 'object') { // Sécurité supplémentaire
    return (
      <Image
        source={{ uri: imageUri }}
        style={style}
        resizeMode="cover"
        onError={(error) => {
          console.warn('🖼️ SafeImage - Erreur chargement:', error.nativeEvent.error, 'URI:', imageUri);
          if (onError) onError(error);
        }}
      />
    );
  } else {
    console.log('🖼️ SafeImage - Utilisation du placeholder car URI invalide');
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
        <Ionicons name={placeholderIcon} size={32} color={theme.colors.textSecondary} />
      </View>
    );
  }
};
