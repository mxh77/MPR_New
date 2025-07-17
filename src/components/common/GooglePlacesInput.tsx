/**
 * Composant d'autocomplétion Google Places
 * Inspiré de l'implémentation existante avec Portal modal
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useTheme } from '../../contexts';
import ENV from '../../config/env';
import { Theme } from '../../constants/colors';

interface GooglePlacesInputProps {
  /** Valeur actuelle du champ */
  value: string;
  /** Callback appelé quand la valeur change */
  onChangeText: (text: string) => void;
  /** Callback appelé quand une suggestion est sélectionnée */
  onPlaceSelected?: (place: GooglePlacePrediction) => void;
  /** Callback appelé quand le champ est vidé via le bouton de suppression */
  onClear?: () => void;
  /** Placeholder du champ de saisie */
  placeholder?: string;
  /** Label du champ */
  label?: string;
  /** Icône à afficher */
  icon?: string;
  /** Couleur de l'icône */
  iconColor?: string;
  /** Style personnalisé pour le conteneur */
  style?: any;
  /** Désactiver le composant */
  disabled?: boolean;
}

interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GooglePlacesResponse {
  predictions: GooglePlacePrediction[];
  status: string;
}

// Styled Components
const Container = styled.View`
  position: relative;
  z-index: 1;
`;

const Label = styled.Text<{ theme: Theme }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
`;

const InputContainer = styled.View<{ theme: Theme }>`
  position: relative;
  border-width: 1px;
  border-color: #D1D5DB;
  border-radius: 12px;
  background-color: #FFFFFF;
`;

const IconContainer = styled.View`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-12px);
  z-index: 1;
`;

const ClearButton = styled.TouchableOpacity<{ theme: Theme }>`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-12px);
  z-index: 1;
  width: 24px;
  height: 24px;
  justify-content: center;
  align-items: center;
`;

const StyledTextInput = styled(TextInput)<{ 
  hasIcon: boolean; 
  hasClearButton: boolean;
  isFocused: boolean; 
  theme: Theme; 
}>`
  height: 48px;
  padding-left: ${props => props.hasIcon ? '44px' : '16px'};
  padding-right: ${props => props.hasClearButton ? '44px' : '16px'};
  padding-top: 12px;
  padding-bottom: 12px;
  font-size: 16px;
  color: #1F2937;
  border-radius: 12px;
  background-color: transparent;
  ${props => props.isFocused && `
    border-color: ${props.theme.colors.primary};
    border-width: 2px;
  `}
`;

const SuggestionsContainer = styled.View<{ theme: Theme }>`
  background-color: #FFFFFF;
  border-radius: 12px;
  elevation: 8;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  border-width: 1px;
  border-color: #D1D5DB;
  max-height: 300px;
  z-index: 9999;
`;

const SuggestionItem = styled.TouchableOpacity<{ theme: Theme }>`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #D1D5DB;
`;

const SuggestionTextContainer = styled.View`
  flex: 1;
`;

const SuggestionMainText = styled.Text<{ theme: Theme }>`
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 2px;
`;

const SuggestionSecondaryText = styled.Text<{ theme: Theme }>`
  font-size: 14px;
  color: #6B7280;
`;

export const GooglePlacesInput: React.FC<GooglePlacesInputProps> = ({
  value,
  onChangeText,
  onPlaceSelected,
  onClear,
  placeholder = "Rechercher une adresse...",
  label,
  icon = "location-outline",
  iconColor,
  style,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [suggestions, setSuggestions] = useState<GooglePlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Couleur de l'icône par défaut basée sur le thème
  const finalIconColor = iconColor || theme.colors.primary;

  // Fonction pour récupérer les suggestions Google Places
  const fetchSuggestions = async (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!ENV.GOOGLE_API_KEY) {
      console.warn('GooglePlacesInput: GOOGLE_API_KEY manquante');
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${ENV.GOOGLE_API_KEY}&language=fr`
      );
      const data: GooglePlacesResponse = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounce pour éviter trop d'appels API
  const handleInputChange = (text: string) => {
    onChangeText(text);

    // Annuler le précédent timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Programmer la recherche après 300ms
    debounceTimeoutRef.current = setTimeout(() => {
      if (isFocused) {
        fetchSuggestions(text);
      }
    }, 300);
  };

  // Gérer la sélection d'une suggestion
  const handleSuggestionPress = (suggestion: GooglePlacePrediction) => {
    onChangeText(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (onPlaceSelected) {
      onPlaceSelected(suggestion);
    }
    
    // NE PAS retirer le focus pour maintenir le clavier ouvert
    // L'utilisateur peut continuer à taper après sélection
  };

  // Gérer la suppression du contenu
  const handleClearText = () => {
    console.log('🎯 DEBUG - Suppression du contenu adresse');
    onChangeText('');
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Appeler la callback de suppression si fournie
    if (onClear) {
      onClear();
    }
    
    // Remettre le focus sur le champ après suppression
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Gérer le focus
  const handleFocus = () => {
    setIsFocused(true);
    if (value.length >= 2) {
      fetchSuggestions(value);
    }
  };

  // Gérer la perte de focus
  const handleBlur = () => {
    setIsFocused(false);
    // Fermer immédiatement les suggestions quand on perd le focus
    // (sauf si l'utilisateur clique sur une suggestion dans les 150ms)
    setTimeout(() => {
      setShowSuggestions(false);
      setSuggestions([]);
    }, 150);
  };

  // Nettoyer les timeouts et fermer les suggestions si le composant perd le focus
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Fermer les suggestions quand le composant n'est plus focusé
  useEffect(() => {
    if (!isFocused) {
      // Délai court pour permettre la sélection d'une suggestion
      const timer = setTimeout(() => {
        setShowSuggestions(false);
        setSuggestions([]);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  return (
    <Container style={style}>
      {/* Label */}
      {label && <Label theme={theme}>{label}</Label>}
      
      <InputContainer theme={theme}>
        {/* Icône */}
        {icon && icon !== '' && (
          <IconContainer>
            <Ionicons name={icon as any} size={20} color={finalIconColor} />
          </IconContainer>
        )}
        
        {/* Champ de saisie */}
        <StyledTextInput
          ref={inputRef}
          value={value}
          onChangeText={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          editable={!disabled}
          hasIcon={!!(icon && icon !== '')}
          hasClearButton={value.length > 0}
          isFocused={isFocused}
          theme={theme}
          placeholderTextColor="#6B7280"
        />

        {/* Bouton de suppression */}
        {value.length > 0 && (
          <ClearButton 
            theme={theme}
            onPress={handleClearText}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name="close-circle" 
              size={20} 
              color="#6B7280" 
            />
          </ClearButton>
        )}
      </InputContainer>

      {/* Suggestions directement dans la hiérarchie - SANS Modal */}
      {showSuggestions && suggestions.length > 0 && (
        <SuggestionsContainer
          theme={theme}
          style={{
            position: 'absolute',
            top: 56, // Hauteur approximative de l'input + padding
            left: 0,
            right: 0,
            zIndex: 9999,
          }}
        >
          {/* Utiliser ScrollView avec map() au lieu de FlatList pour éviter l'erreur VirtualizedList */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            style={{ maxHeight: 300 }}
          >
            {suggestions.map((item) => (
              <SuggestionItem 
                key={item.place_id}
                theme={theme} 
                onPress={() => handleSuggestionPress(item)} 
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="location-outline" 
                  size={16} 
                  color="#6B7280" 
                  style={{ marginRight: 12 }} 
                />
                <SuggestionTextContainer>
                  <SuggestionMainText theme={theme} numberOfLines={1}>
                    {item.structured_formatting.main_text}
                  </SuggestionMainText>
                  <SuggestionSecondaryText theme={theme} numberOfLines={1}>
                    {item.structured_formatting.secondary_text}
                  </SuggestionSecondaryText>
                </SuggestionTextContainer>
              </SuggestionItem>
            ))}
          </ScrollView>
        </SuggestionsContainer>
      )}
    </Container>
  );
};

export default GooglePlacesInput;
