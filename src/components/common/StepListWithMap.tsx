/**
 * Composant de liste d'étapes avec vue carte
 * Permet de basculer entre vue liste et vue carte
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useTheme } from '../../contexts';
import { colors } from '../../constants/colors';
import type { Step } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

interface StepListWithMapProps {
  /** Liste des étapes à afficher */
  steps: Step[];
  /** Callback appelé quand une étape est sélectionnée */
  onStepPress?: (step: Step) => void;
  /** Callback appelé quand on appuie sur le bouton d'édition */
  onEditPress?: (step: Step) => void;
  /** Vue initiale (liste ou carte) */
  initialView?: 'list' | 'map';
  /** Style personnalisé */
  style?: any;
}

// Styles avec styled-components
const Container = styled.View`
  flex: 1;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: ${colors.white};
  border-bottom-width: 1px;
  border-bottom-color: ${colors.gray200};
`;

const ViewToggle = styled.View`
  flex-direction: row;
  background-color: ${colors.gray100};
  border-radius: 8px;
  padding: 2px;
`;

const ToggleButton = styled.TouchableOpacity<{ active: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: ${props => props.active ? colors.primary : 'transparent'};
`;

const ToggleText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? colors.white : colors.gray700};
  font-size: 14px;
  font-weight: 500;
  margin-left: 4px;
`;

const MapContainer = styled.View`
  flex: 1;
`;

const ListContainer = styled.View`
  flex: 1;
`;

const StepItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  background-color: ${colors.white};
  border-bottom-width: 1px;
  border-bottom-color: ${colors.gray200};
`;

const StepContent = styled.View`
  flex: 1;
  margin-left: 12px;
`;

const StepTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.gray900};
  margin-bottom: 4px;
`;

const StepAddress = styled.Text`
  font-size: 14px;
  color: ${colors.gray600};
  margin-bottom: 2px;
`;

const StepDates = styled.Text`
  font-size: 12px;
  color: ${colors.gray500};
`;

const ActionButton = styled.TouchableOpacity`
  padding: 8px;
  margin-left: 8px;
`;

const EmptyState = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 32px;
`;

const EmptyText = styled.Text`
  font-size: 16px;
  color: ${colors.gray600};
  text-align: center;
  margin-top: 16px;
`;

export const StepListWithMap: React.FC<StepListWithMapProps> = ({
  steps,
  onStepPress,
  onEditPress,
  initialView = 'list',
  style,
}) => {
  const { theme } = useTheme();
  const [currentView, setCurrentView] = useState<'list' | 'map'>(initialView);

  // Filtrer les étapes avec coordonnées pour la carte
  const stepsWithCoordinates = steps.filter(step => 
    step.location?.latitude && step.location?.longitude
  );

  // Calculer la région de la carte pour englober toutes les étapes
  const getMapRegion = useCallback(() => {
    if (stepsWithCoordinates.length === 0) {
      return {
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    if (stepsWithCoordinates.length === 1) {
      const step = stepsWithCoordinates[0];
      return {
        latitude: step.location!.latitude,
        longitude: step.location!.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Calculer les limites
    let minLat = stepsWithCoordinates[0].location!.latitude;
    let maxLat = stepsWithCoordinates[0].location!.latitude;
    let minLng = stepsWithCoordinates[0].location!.longitude;
    let maxLng = stepsWithCoordinates[0].location!.longitude;

    stepsWithCoordinates.forEach(step => {
      if (step.location?.latitude && step.location?.longitude) {
        minLat = Math.min(minLat, step.location.latitude);
        maxLat = Math.max(maxLat, step.location.latitude);
        minLng = Math.min(minLng, step.location.longitude);
        maxLng = Math.max(maxLng, step.location.longitude);
      }
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = (maxLat - minLat) * 1.3; // Marge de 30%
    const deltaLng = (maxLng - minLng) * 1.3;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(deltaLat, 0.01),
      longitudeDelta: Math.max(deltaLng, 0.01),
    };
  }, [stepsWithCoordinates]);

  // Gestion du tap sur un marqueur
  const handleMarkerPress = (step: Step) => {
    if (onStepPress) {
      onStepPress(step);
    }
  };

  // Rendu d'un élément de liste
  const renderStepItem = ({ item: step }: { item: Step }) => (
    <StepItem onPress={() => onStepPress?.(step)}>
      <Ionicons 
        name="location" 
        size={24} 
        color={colors.primary} 
      />
      
      <StepContent>
        <StepTitle>{step.title || 'Étape sans titre'}</StepTitle>
        
        {step.location?.address && (
          <StepAddress>{step.location.address}</StepAddress>
        )}
        
        {step.startDate && (
          <StepDates>
            Du {new Date(step.startDate).toLocaleDateString()}
            {step.endDate && ` au ${new Date(step.endDate).toLocaleDateString()}`}
          </StepDates>
        )}
      </StepContent>
      
      {onEditPress && (
        <ActionButton onPress={() => onEditPress(step)}>
          <Ionicons name="create-outline" size={20} color={colors.gray600} />
        </ActionButton>
      )}
    </StepItem>
  );

  // Vue vide
  if (steps.length === 0) {
    return (
      <Container style={style}>
        <EmptyState>
          <Ionicons name="map-outline" size={64} color={colors.gray400} />
          <EmptyText>Aucune étape à afficher</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container style={style}>
      {/* Header avec toggle de vue */}
      <Header>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.gray900 }}>
          {steps.length} étape{steps.length > 1 ? 's' : ''}
        </Text>
        
        <ViewToggle>
          <ToggleButton 
            active={currentView === 'list'}
            onPress={() => setCurrentView('list')}
          >
            <Ionicons 
              name="list" 
              size={16} 
              color={currentView === 'list' ? colors.white : colors.gray700} 
            />
            <ToggleText active={currentView === 'list'}>Liste</ToggleText>
          </ToggleButton>
          
          <ToggleButton 
            active={currentView === 'map'}
            onPress={() => setCurrentView('map')}
          >
            <Ionicons 
              name="map" 
              size={16} 
              color={currentView === 'map' ? colors.white : colors.gray700} 
            />
            <ToggleText active={currentView === 'map'}>Carte</ToggleText>
          </ToggleButton>
        </ViewToggle>
      </Header>

      {/* Contenu selon la vue */}
      {currentView === 'list' ? (
        <ListContainer>
          <FlatList
            data={steps}
            renderItem={renderStepItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
          />
        </ListContainer>
      ) : (
        <MapContainer>
          {stepsWithCoordinates.length > 0 ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={getMapRegion()}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={false}
              showsBuildings={true}
              showsTraffic={false}
              showsIndoors={true}
            >
              {stepsWithCoordinates.map((step, index) => (
                <Marker
                  key={step._id}
                  coordinate={{
                    latitude: step.location!.latitude,
                    longitude: step.location!.longitude,
                  }}
                  title={step.title || `Étape ${index + 1}`}
                  description={step.location?.address}
                  pinColor={colors.primary}
                  onPress={() => handleMarkerPress(step)}
                />
              ))}
            </MapView>
          ) : (
            <EmptyState>
              <Ionicons name="location-outline" size={64} color={colors.gray400} />
              <EmptyText>
                Aucune étape avec coordonnées{'\n'}pour afficher la carte
              </EmptyText>
            </EmptyState>
          )}
        </MapContainer>
      )}
    </Container>
  );
};

export default StepListWithMap;
