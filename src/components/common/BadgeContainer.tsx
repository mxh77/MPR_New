/**
 * Container pour afficher plusieurs badges sur une carte
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Badge } from './Badge';

interface BadgeContainerProps {
  accommodationCount?: number;
  activityCount?: number;
  hasAddress?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  style?: any;
}

export const BadgeContainer: React.FC<BadgeContainerProps> = ({
  accommodationCount,
  activityCount,
  hasAddress = true,
  position = 'top-right',
  style
}) => {
  // Calculer la position
  const positionStyle = {
    'top-right': { top: 8, right: 8 },
    'top-left': { top: 8, left: 8 },
    'bottom-right': { bottom: 8, right: 8 },
    'bottom-left': { bottom: 8, left: 8 },
  }[position];

  return (
    <View style={[styles.container, positionStyle, style]}>
      {/* Badge pour adresse manquante - priorité haute */}
      {!hasAddress && (
        <Badge warning icon="alert-circle" size="small" />
      )}
      
      {/* Badge pour nombre d'hébergements */}
      {accommodationCount !== undefined && accommodationCount > 0 && (
        <Badge 
          count={accommodationCount} 
          icon="bed" 
          backgroundColor="rgba(76, 175, 80, 0.9)"
          size="small"
        />
      )}
      
      {/* Badge pour nombre d'activités */}
      {activityCount !== undefined && activityCount > 0 && (
        <Badge 
          count={activityCount} 
          icon="walk" 
          backgroundColor="rgba(33, 150, 243, 0.9)"
          size="small"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'column',
    gap: 4,
    zIndex: 10,
  },
});
