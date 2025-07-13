/**
 * Composant d'autocomplétion Google Places
 * Inspiré de l'implémentation existante avec Portal modal
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useTheme } from '../../contexts';
import ENV from '../../config/env';
import { Theme } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface GooglePlacesInputProps {
  /** Valeur actuelle du champ */
  value: string;
  /** Callback appelé quand la valeur change */
  onChangeText: (text: string) => void;
  /** Callback appelé quand une suggestion est sélectionnée */
  onPlaceSelected?: (place: GooglePlacePrediction) => void;
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
  border-color: ${props => props.theme.colors.border};
  border-radius: 12px;
  background-color: ${props => props.theme.colors.background};
`;

const IconContainer = styled.View`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-12px);
  z-index: 1;
`;

const StyledTextInput = styled(TextInput)<{ 
  hasIcon: boolean; 
  isFocused: boolean; 
  theme: Theme; 
}>`
  height: 48px;
  padding-horizontal: ${props => props.hasIcon ? '44px' : '16px'};
  padding-vertical: 12px;
  font-size: 16px;
  color: ${props => props.theme.colors.text};
  border-radius: 12px;
  ${props => props.isFocused && `
    border-color: ${props.theme.colors.primary};
    border-width: 2px;
  `}
`;

const ModalOverlay = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.1);
`;

const SuggestionsContainer = styled.View<{ theme: Theme }>`
  position: absolute;
  background-color: ${props => props.theme.colors.background};
  border-radius: 12px;
  elevation: 8;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
  max-height: 300px;
  z-index: 9999;
`;

const SuggestionItem = styled.TouchableOpacity<{ theme: Theme }>`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
`;

const SuggestionTextContainer = styled.View`
  flex: 1;
`;

const SuggestionMainText = styled.Text<{ theme: Theme }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 2px;
`;

const SuggestionSecondaryText = styled.Text<{ theme: Theme }>`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
`;

export const GooglePlacesInput: React.FC<GooglePlacesInputProps> = ({
  value,
  onChangeText,
  onPlaceSelected,
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
  const [inputLayout, setInputLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const inputRef = useRef<TextInput>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Couleur de l'icône par défaut basée sur le thème
  const finalIconColor = iconColor || theme.colors.primary;

  // Fonction pour mesurer la position du champ de saisie
  const measureInput = () => {
    if (inputRef.current) {
      inputRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setInputLayout({ x: pageX, y: pageY, width, height });
      });
    }
  };

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
        measureInput(); // Mesurer la position pour le Modal
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
    
    // Retirer le focus
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Gérer le focus
  const handleFocus = () => {
    setIsFocused(true);
    measureInput();
    if (value.length >= 2) {
      fetchSuggestions(value);
    }
  };

  // Gérer la perte de focus
  const handleBlur = () => {
    setIsFocused(false);
    // Délai pour permettre la sélection d'une suggestion
    setTimeout(() => {
      setShowSuggestions(false);
      setSuggestions([]);
    }, 200);
  };

  // Nettoyer les timeouts
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Rendu d'une suggestion
  const renderSuggestion = ({ item }: { item: GooglePlacePrediction }) => (
    <SuggestionItem theme={theme} onPress={() => handleSuggestionPress(item)} activeOpacity={0.7}>
      <Ionicons 
        name="location-outline" 
        size={16} 
        color={theme.colors.textSecondary} 
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
  );

  return (
    <Container style={style}>
      {/* Label */}
      {label && <Label theme={theme}>{label}</Label>}
      
      <InputContainer theme={theme}>
        {/* Icône */}
        {icon && (
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
          hasIcon={!!icon}
          isFocused={isFocused}
          theme={theme}
          placeholderTextColor={theme.colors.textSecondary}
        />
      </InputContainer>

      {/* Modal des suggestions */}
      <Modal
        visible={showSuggestions && suggestions.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <ModalOverlay onPress={() => setShowSuggestions(false)}>
          <SuggestionsContainer
            theme={theme}
            style={{
              top: inputLayout.y + inputLayout.height + 8,
              left: inputLayout.x,
              width: inputLayout.width,
            }}
          >
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={renderSuggestion}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
            />
          </SuggestionsContainer>
        </ModalOverlay>
      </Modal>
    </Container>
  );
};

export default GooglePlacesInput;
