/**
 * Composant de sélection de thumbnail
 * Permet de choisir une image depuis la galerie ou l'appareil photo
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import styled from 'styled-components/native';
import { useTheme } from '../../contexts';
import { colors } from '../../constants/colors';
import { Theme } from '../../constants/colors';

interface ThumbnailPickerProps {
  /** Label du champ */
  label?: string;
  /** URL ou URI de l'image actuelle */
  value?: string | null;
  /** Callback appelé quand une image est sélectionnée */
  onImageSelected?: (imageUri: string) => void;
  /** Callback appelé quand l'image est supprimée */
  onImageRemoved?: () => void;
  /** Désactiver le composant */
  disabled?: boolean;
  /** Style personnalisé */
  style?: any;
}

// Styled Components
const Container = styled.View`
  margin-bottom: 24px;
`;

const Label = styled.Text<{ theme: Theme }>`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.gray800};
  margin-bottom: 8px;
  margin-left: 8px;
`;

const LabelContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

const ThumbnailContainer = styled.View`
  background-color: ${colors.white};
  border-radius: 12px;
  border-width: 1px;
  border-color: ${colors.gray300};
  overflow: hidden;
`;

const ThumbnailButton = styled.TouchableOpacity<{ hasImage: boolean }>`
  width: 100%;
  height: ${props => props.hasImage ? '200px' : '120px'};
  justify-content: center;
  align-items: center;
  background-color: ${colors.gray50};
  position: relative;
`;

const ThumbnailImage = styled.Image`
  width: 100%;
  height: 100%;
  resize-mode: cover;
`;

const PlaceholderContainer = styled.View`
  align-items: center;
  justify-content: center;
`;

const PlaceholderText = styled.Text`
  font-size: 16px;
  color: ${colors.gray500};
  margin-top: 8px;
  text-align: center;
`;

const ActionButton = styled.TouchableOpacity`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: rgba(0, 0, 0, 0.6);
  justify-content: center;
  align-items: center;
`;

const BottomActions = styled.View`
  flex-direction: row;
  border-top-width: 1px;
  border-top-color: ${colors.gray200};
`;

const BottomButton = styled.TouchableOpacity`
  flex: 1;
  padding: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-right-width: 1px;
  border-right-color: ${colors.gray200};
`;

const BottomButtonLast = styled.TouchableOpacity`
  flex: 1;
  padding: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const BottomButtonText = styled.Text`
  font-size: 14px;
  color: ${colors.primary};
  margin-left: 8px;
  font-weight: 500;
`;

export const ThumbnailPicker: React.FC<ThumbnailPickerProps> = ({
  label = "Photo de couverture",
  value,
  onImageSelected,
  onImageRemoved,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  // Demander les permissions si nécessaire
  const requestPermissions = async (type: 'camera' | 'library') => {
    try {
      if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission requise',
            'Nous avons besoin de l\'autorisation d\'accès à l\'appareil photo pour prendre des photos.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission requise',
            'Nous avons besoin de l\'autorisation d\'accès à la galerie pour sélectionner des photos.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  };

  // Ouvrir l'appareil photo
  const openCamera = async () => {
    try {
      setIsLoading(true);
      
      const hasPermission = await requestPermissions('camera');
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📸 ThumbnailPicker - Photo prise:', imageUri);
        onImageSelected?.(imageUri);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir la galerie
  const openGallery = async () => {
    try {
      setIsLoading(true);
      
      const hasPermission = await requestPermissions('library');
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('🖼️ ThumbnailPicker - Image sélectionnée:', imageUri);
        onImageSelected?.(imageUri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer l'image
  const removeImage = () => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer cette photo de couverture ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            console.log('🗑️ ThumbnailPicker - Image supprimée');
            onImageRemoved?.();
          },
        },
      ]
    );
  };

  // Afficher les options (iOS et Android)
  const showImageOptions = () => {
    if (Platform.OS === 'ios') {
      // ActionSheet pour iOS (natif)
      const options = value 
        ? ['Prendre une photo', 'Choisir depuis la galerie', 'Supprimer', 'Annuler']
        : ['Prendre une photo', 'Choisir depuis la galerie', 'Annuler'];
      
      const destructiveButtonIndex = value ? 2 : undefined;
      const cancelButtonIndex = value ? 3 : 2;

      // Note: ActionSheet n'est plus supporté directement
      // Utiliser Alert.alert avec plusieurs boutons à la place
      const buttons = value 
        ? [
            { text: 'Prendre une photo', onPress: openCamera },
            { text: 'Choisir depuis la galerie', onPress: openGallery },
            { text: 'Supprimer', onPress: removeImage, style: 'destructive' as const },
            { text: 'Annuler', style: 'cancel' as const },
          ]
        : [
            { text: 'Prendre une photo', onPress: openCamera },
            { text: 'Choisir depuis la galerie', onPress: openGallery },
            { text: 'Annuler', style: 'cancel' as const },
          ];

      Alert.alert('Sélectionner une option', '', buttons);
    } else {
      // Alert simple pour Android
      const buttons = value 
        ? [
            { text: 'Prendre une photo', onPress: openCamera },
            { text: 'Choisir depuis la galerie', onPress: openGallery },
            { text: 'Supprimer', onPress: removeImage },
            { text: 'Annuler', style: 'cancel' as const },
          ]
        : [
            { text: 'Prendre une photo', onPress: openCamera },
            { text: 'Choisir depuis la galerie', onPress: openGallery },
            { text: 'Annuler', style: 'cancel' as const },
          ];

      Alert.alert('Photo de couverture', 'Choisissez une option :', buttons);
    }
  };

  return (
    <Container style={style}>
      {/* Label */}
      <LabelContainer>
        <Ionicons name="image" size={20} color={colors.primary} />
        <Label theme={theme}>{label}</Label>
      </LabelContainer>

      <ThumbnailContainer>
        {/* Zone principale d'affichage/sélection */}
        <ThumbnailButton
          hasImage={!!value}
          onPress={disabled ? undefined : showImageOptions}
          disabled={disabled || isLoading}
          activeOpacity={0.7}
        >
          {value ? (
            <>
              <ThumbnailImage source={{ uri: value }} />
              {/* Bouton supprimer sur l'image */}
              <ActionButton
                onPress={removeImage}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={20} color={colors.white} />
              </ActionButton>
            </>
          ) : (
            <PlaceholderContainer>
              <Ionicons 
                name="camera" 
                size={48} 
                color={isLoading ? colors.gray400 : colors.gray500} 
              />
              <PlaceholderText>
                {isLoading ? 'Chargement...' : 'Ajouter une photo de couverture'}
              </PlaceholderText>
            </PlaceholderContainer>
          )}
        </ThumbnailButton>

        {/* Actions en bas */}
        {!value && (
          <BottomActions>
            <BottomButton
              onPress={openCamera}
              disabled={disabled || isLoading}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={20} color={colors.primary} />
              <BottomButtonText>Appareil photo</BottomButtonText>
            </BottomButton>
            
            <BottomButtonLast
              onPress={openGallery}
              disabled={disabled || isLoading}
              activeOpacity={0.7}
            >
              <Ionicons name="images" size={20} color={colors.primary} />
              <BottomButtonText>Galerie</BottomButtonText>
            </BottomButtonLast>
          </BottomActions>
        )}
      </ThumbnailContainer>
    </Container>
  );
};

export default ThumbnailPicker;
