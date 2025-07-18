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
  error_message?: string;
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

  // Debug - Vérifier la clé API au chargement du composant
  useEffect(() => {
    console.log('🔍 GooglePlacesInput - Configuration API:', {
      hasKey: !!ENV.GOOGLE_API_KEY,
      keyLength: ENV.GOOGLE_API_KEY?.length || 0,
      keyStart: ENV.GOOGLE_API_KEY?.substring(0, 10) || 'undefined',
      environment: ENV.ENVIRONMENT || 'unknown',
      isDevelopment: ENV.IS_DEVELOPMENT || false
    });
    
    // Test simple de l'API au chargement du composant
    if (ENV.GOOGLE_API_KEY) {
      testGooglePlacesAPI();
    }
  }, []);

  // Fonction de test simple de l'API
  const testGooglePlacesAPI = async () => {
    try {
      const testUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Paris&key=${ENV.GOOGLE_API_KEY}&language=fr`;
      console.log('🧪 Test API URL:', testUrl.replace(ENV.GOOGLE_API_KEY, 'API_KEY_HIDDEN'));
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      console.log('🧪 Test API résultat:', {
        status: data.status,
        predictionsCount: data.predictions?.length || 0,
        error: data.error_message || 'aucune'
      });
      
      if (data.status !== 'OK') {
        console.error('🚨 API Google Places - Erreur:', data.error_message || data.status);
      }
    } catch (error) {
      console.error('🚨 API Google Places - Erreur réseau:', error);
    }
  };

  // Couleur de l'icône par défaut basée sur le thème
  const finalIconColor = iconColor || theme.colors.primary;

  // Fonction pour récupérer les suggestions Google Places
  const fetchSuggestions = async (input: string) => {
    console.log('🔍 GooglePlacesInput - fetchSuggestions appelé:', { input, length: input.length });
    
    if (input.length < 2) {
      console.log('🔍 GooglePlacesInput - Input trop court, arrêt');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!ENV.GOOGLE_API_KEY) {
      console.warn('🔍 GooglePlacesInput: GOOGLE_API_KEY manquante');
      return;
    }

    console.log('🔍 GooglePlacesInput - Clé API trouvée, appel en cours...');

    try {
      // SOLUTION TEMPORAIRE: Utiliser directement l'API avec note sur les restrictions
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${ENV.GOOGLE_API_KEY}&language=fr`;
      console.log('🔍 GooglePlacesInput - URL API:', url.replace(ENV.GOOGLE_API_KEY, 'API_KEY_HIDDEN'));
      
      const response = await fetch(url);
      const data: GooglePlacesResponse = await response.json();
      
      console.log('🔍 GooglePlacesInput - Réponse API:', { status: data.status, predictionsCount: data.predictions?.length || 0 });
      
      if (data.status === 'OK' && data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
        console.log('🔍 GooglePlacesInput - Suggestions mises à jour:', data.predictions.length);
      } else {
        console.log('🔍 GooglePlacesInput - Pas de suggestions trouvées:', data.status);
        
        // Messages d'erreur détaillés avec solutions
        if (data.status === 'REQUEST_DENIED') {
          console.error('🚨 ERREUR Google Places API - REQUEST_DENIED:');
          console.error('  ➡️  SOLUTION: Ajoutez cette empreinte SHA-1 dans Google Cloud Console:');
          console.error('      5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25');
          console.error('  📍 Google Cloud Console > APIs & Services > Credentials');
          console.error('  📍 Cliquez sur votre clé API > Application restrictions > Android apps');
          console.error('  📍 Ajoutez l\'empreinte ci-dessus pour le mode développement');
          console.error('  ⚠️  Gardez aussi l\'empreinte de release existante !');
          if (data.error_message) {
            console.error('  - Message d\'erreur:', data.error_message);
          }
        } else if (data.status === 'OVER_QUERY_LIMIT') {
          console.error('🚨 ERREUR Google Places API - Limite de quota dépassée');
        } else if (data.status === 'INVALID_REQUEST') {
          console.error('🚨 ERREUR Google Places API - Requête invalide');
        }
        
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('🔍 GooglePlacesInput - Erreur lors de la récupération des suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounce pour éviter trop d'appels API
  const handleInputChange = (text: string) => {
    console.log('🔍 GooglePlacesInput - handleInputChange:', { text, isFocused });
    onChangeText(text);

    // Annuler le précédent timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Programmer la recherche après 300ms
    debounceTimeoutRef.current = setTimeout(() => {
      console.log('🔍 GooglePlacesInput - Debounce timeout déclenché:', { text, isFocused });
      if (isFocused) {
        fetchSuggestions(text);
      } else {
        console.log('🔍 GooglePlacesInput - Pas de fetch car pas focused');
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
    // Remettre le focus sur l'input pour garder le clavier ouvert après sélection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
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
    console.log('🔍 GooglePlacesInput - Focus reçu');
    setIsFocused(true);
    if (value.length >= 2) {
      console.log('🔍 GooglePlacesInput - Fetch suggestions au focus car value >= 2');
      fetchSuggestions(value);
    }
  };

  // Gérer la perte de focus
  const handleBlur = () => {
    console.log('🔍 GooglePlacesInput - Blur reçu');
    setIsFocused(false);
    // Délai pour permettre de cliquer sur une suggestion avant de fermer
    setTimeout(() => {
      setShowSuggestions(false);
      setSuggestions([]);
    }, 200);
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

  // Log pour debug
  if (__DEV__) {
    console.log('🔍 GooglePlacesInput - Render:', { 
      showSuggestions, 
      suggestionsLength: suggestions.length, 
      isFocused, 
      value 
    });
  }

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
            zIndex: 99999, // Z-index très élevé pour être au-dessus de tout
          }}
        >
          {/* Utiliser ScrollView avec map() au lieu de FlatList pour éviter l'erreur VirtualizedList */}
          <ScrollView
            keyboardShouldPersistTaps="always" // TOUJOURS garder le clavier ouvert
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
