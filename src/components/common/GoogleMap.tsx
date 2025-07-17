/**
 * Composant GoogleMap réutilisable
 * Affiche une carte Google Maps avec marqueurs et contrôles
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useTheme } from '../../contexts';
import { colors } from '../../constants/colors';

const { width: screenWidth } = Dimensions.get('window');

// Fonction pour obtenir l'icône et la couleur selon le type de marqueur
const getMarkerStyle = (type?: string) => {
  switch (type) {
    case 'step':
      return { icon: 'flag', color: '#c02f2fff' }; // Drapeau pour step principal
    case 'accommodation':
      return { icon: 'bed', color: '#677267ff' }; // Lit
    case 'hiking':
      return { icon: 'walk', color: '#4CAF50' }; // Randonneur
    case 'visit':
      return { icon: 'camera', color: '#9C27B0' }; // Appareil photo
    case 'restaurant':
      return { icon: 'restaurant', color: '#FF9800' }; // Restaurant
    case 'transport':
      return { icon: 'car', color: '#1db3fdff' }; // Voiture
    case 'courses':
      return { icon: 'basket', color: '#795548' }; // Chariot
    case 'activity':
      return { icon: 'star', color: '#FF9800' }; // Etoile
    default:
      return { icon: 'location', color: '#FF9800' }; // Orange par défaut - Pin de localisation
  }
};

interface GoogleMapProps {
  /** Titre de la carte (optionnel) */
  title?: string;
  /** Latitude du centre de la carte */
  latitude: number;
  /** Longitude du centre de la carte */
  longitude: number;
  /** Adresse à afficher (optionnel) */
  address?: string;
  /** Largeur de la carte (par défaut: largeur écran - 32) */
  width?: number;
  /** Hauteur de la carte (par défaut: 200) */
  height?: number;
  /** Marqueurs additionnels à afficher */
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    color?: string;
    type?: 'step' | 'accommodation' | 'activity' | 'transport' | 'hiking' | 'visit' | 'restaurant' | 'courses';
  }>;
  /** Désactiver les interactions (par défaut: false) */
  disabled?: boolean;
  /** Afficher les boutons de contrôle (zoom, recentrer, plein écran) */
  showControls?: boolean;
  /** Ajuster automatiquement la vue pour inclure tous les marqueurs */
  enableFitBounds?: boolean;
  /** Style personnalisé */
  style?: any;
  /** Callback appelé quand la carte est tapée */
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  /** Callback appelé quand un marqueur est tapé */
  onMarkerPress?: (markerId: string) => void;
  /** Callback pour le plein écran */
  onFullScreen?: () => void;
}

// Styles avec styled-components
const Container = styled.View`
  margin-bottom: 16px;
`;

const MapContainer = styled.View<{ width: number; height: number }>`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  border-radius: 12px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${colors.gray300};
  background-color: ${colors.gray100};
`;

const TitleContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

const TitleText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.gray800};
  margin-left: 8px;
`;

const AddressContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 8px;
  padding: 8px 12px;
  background-color: ${colors.gray50};
  border-radius: 8px;
`;

const AddressText = styled.Text`
  font-size: 14px;
  color: ${colors.gray700};
  margin-left: 8px;
  flex: 1;
`;

const LoadingContainer = styled.View<{ width: number; height: number }>`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  justify-content: center;
  align-items: center;
  background-color: ${colors.gray100};
  border-radius: 12px;
  border-width: 1px;
  border-color: ${colors.gray300};
`;

const ErrorContainer = styled.View<{ width: number; height: number }>`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  justify-content: center;
  align-items: center;
  background-color: ${colors.gray100};
  border-radius: 12px;
  border-width: 1px;
  border-color: ${colors.gray300};
`;

const ErrorText = styled.Text`
  font-size: 14px;
  color: ${colors.gray600};
  text-align: center;
  margin-top: 8px;
`;

const ControlsContainer = styled.View`
  position: absolute;
  right: 12px;
  top: 12px;
  flex-direction: column;
  gap: 8px;
`;

const ControlButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 3;
`;

export const GoogleMap: React.FC<GoogleMapProps> = ({
  title,
  latitude,
  longitude,
  address,
  width = screenWidth - 32,
  height = 200,
  markers = [],
  disabled = false,
  showControls = true,
  style,
  onMapPress,
  onMarkerPress,
  onFullScreen,
}) => {
  const { theme } = useTheme();
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = React.useRef<MapView>(null);

  // Vérification des coordonnées valides
  const isValidCoordinates = (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  // Calcul des bounds pour tous les markers
  const calculateRegion = () => {
    // Collecter toutes les coordonnées (marqueur principal + marqueurs additionnels)
    const allCoordinates = [
      { latitude, longitude },
      ...markers.map(marker => ({ latitude: marker.latitude, longitude: marker.longitude }))
    ];

    if (allCoordinates.length === 1) {
      // Un seul marker : zoom proche
      return {
        latitude: allCoordinates[0].latitude,
        longitude: allCoordinates[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Calculer les bounds
    const latitudes = allCoordinates.map(coord => coord.latitude);
    const longitudes = allCoordinates.map(coord => coord.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    const deltaLat = (maxLat - minLat) * 1.5; // Ajouter 50% de marge
    const deltaLng = (maxLng - minLng) * 1.5;
    
    // Minimum de zoom pour éviter un zoom trop proche
    const minDelta = 0.005;
    
    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(deltaLat, minDelta),
      longitudeDelta: Math.max(deltaLng, minDelta),
    };
  };

  // Validation des props
  useEffect(() => {
    if (!isValidCoordinates(latitude, longitude)) {
      setMapError('Coordonnées invalides');
      console.error('GoogleMap - Coordonnées invalides:', { latitude, longitude });
    } else {
      setMapError(null);
    }
  }, [latitude, longitude]);

  // Configuration de la région calculée
  const initialRegion = calculateRegion();

  // Ajuster la carte quand elle est prête et qu'il y a plusieurs markers
  useEffect(() => {
    if (mapReady && mapRef.current && markers.length > 0) {
      console.log('🗺️ GoogleMap - Ajustement région pour', markers.length + 1, 'markers');
      
      // Délai pour s'assurer que la carte est complètement chargée
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(initialRegion, 1000);
        }
      }, 500);
    }
  }, [mapReady, markers.length]);

  // Gestion des erreurs de carte
  const handleMapError = (error: any) => {
    console.error('GoogleMap - Erreur carte:', error);
    setMapError('Erreur lors du chargement de la carte');
  };

  // Gestion du tap sur la carte
  const handleMapPress = (event: any) => {
    if (onMapPress && !disabled) {
      const { coordinate } = event.nativeEvent;
      onMapPress(coordinate);
    }
  };

  // Gestion du tap sur un marqueur
  const handleMarkerPress = (markerId: string) => {
    if (onMarkerPress) {
      onMarkerPress(markerId);
    }
  };

  // Fonctions de contrôle de la carte
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({ zoom: 1 }, { duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({ zoom: -1 }, { duration: 300 });
    }
  };

  const handleRecenter = () => {
    if (mapRef.current) {
      const region = calculateRegion();
      mapRef.current.animateToRegion(region, 800);
    }
  };

  const handleFullScreen = () => {
    if (onFullScreen) {
      onFullScreen();
    } else {
      // Comportement par défaut : agrandir la carte
      Alert.alert('Plein écran', 'Fonctionnalité plein écran à implémenter');
    }
  };

  // Affichage d'erreur
  if (mapError) {
    return (
      <Container style={style}>
        {title && (
          <TitleContainer>
            <Ionicons name="map" size={20} color={colors.danger} />
            <TitleText>{title}</TitleText>
          </TitleContainer>
        )}
        
        <ErrorContainer width={width} height={height}>
          <Ionicons name="warning-outline" size={32} color={colors.gray400} />
          <ErrorText>{mapError}</ErrorText>
        </ErrorContainer>
        
        {address && (
          <AddressContainer>
            <Ionicons name="location" size={16} color={colors.gray500} />
            <AddressText>{address}</AddressText>
          </AddressContainer>
        )}
      </Container>
    );
  }

  return (
    <Container style={style}>
      {title && (
        <TitleContainer>
          <Ionicons name="map" size={20} color={colors.primary} />
          <TitleText>{title}</TitleText>
        </TitleContainer>
      )}
      
      <MapContainer width={width} height={height}>
        {!mapReady && (
          <LoadingContainer width={width} height={height}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ErrorText>Chargement de la carte...</ErrorText>
          </LoadingContainer>
        )}
        
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          onMapReady={() => {
            console.log('🗺️ GoogleMap - Carte prête avec', markers.length + 1, 'markers');
            setMapReady(true);
          }}
          onPress={handleMapPress}
          scrollEnabled={!disabled}
          zoomEnabled={!disabled}
          rotateEnabled={!disabled}
          pitchEnabled={!disabled}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={!disabled}
          showsScale={false}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={true}
          loadingEnabled={true}
          loadingIndicatorColor={colors.primary}
          loadingBackgroundColor={colors.gray100}
        >
          {/* Marqueurs avec icônes typées */}
          {markers.map((marker) => {
            const markerStyle = getMarkerStyle(marker.type);
            console.log('🎯 Marker Debug:', {
              id: marker.id,
              type: marker.type,
              icon: markerStyle.icon,
              color: markerStyle.color,
              customColor: marker.color
            });
            
            return (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={marker.title}
                description={marker.description}
                onPress={() => handleMarkerPress(marker.id)}
              >
                <View style={{
                  backgroundColor: marker.color || markerStyle.color,
                  borderRadius: 20,
                  width: marker.id.includes('main-step') ? 40 : 36, // Step principal plus grand
                  height: marker.id.includes('main-step') ? 40 : 36,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: marker.id.includes('main-step') ? 3 : 2, // Bordure plus épaisse pour step principal
                  borderColor: 'white',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}>
                  <Ionicons 
                    name={markerStyle.icon as any} 
                    size={marker.id.includes('main-step') ? 20 : 18} 
                    color="white" 
                  />
                </View>
              </Marker>
            );
          })}
          
          {/* Marqueur de fallback si aucun marker fourni */}
          {markers.length === 0 && (
            <Marker
              coordinate={{ latitude, longitude }}
              title={title || 'Position'}
              description={address}
              onPress={() => handleMarkerPress('main')}
            >
              <View style={{
                backgroundColor: colors.primary,
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <Ionicons name="flag" size={20} color="white" />
              </View>
            </Marker>
          )}
        </MapView>
        
        {/* Boutons de contrôle */}
        {showControls && !disabled && (
          <ControlsContainer>
            <ControlButton onPress={handleZoomIn}>
              <Ionicons name="add" size={20} color={colors.gray700} />
            </ControlButton>
            
            <ControlButton onPress={handleZoomOut}>
              <Ionicons name="remove" size={20} color={colors.gray700} />
            </ControlButton>
            
            <ControlButton onPress={handleRecenter}>
              <Ionicons name="locate" size={20} color={colors.gray700} />
            </ControlButton>
            
            <ControlButton onPress={handleFullScreen}>
              <Ionicons name="expand" size={20} color={colors.gray700} />
            </ControlButton>
          </ControlsContainer>
        )}
      </MapContainer>
      
      {address && (
        <AddressContainer>
          <Ionicons name="location" size={16} color={colors.gray500} />
          <AddressText>{address}</AddressText>
        </AddressContainer>
      )}
    </Container>
  );
};

export default GoogleMap;
