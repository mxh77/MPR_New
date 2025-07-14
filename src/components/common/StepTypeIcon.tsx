/**
 * Icône pour les types d'étapes
 */
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { StepType } from '../../types';

interface StepTypeIconProps {
  type: StepType;
  size?: number;
  color?: string;
}

const StepTypeIcon: React.FC<StepTypeIconProps> = ({ 
  type, 
  size = 16, 
  color = '#000' 
}) => {
  const getIconName = (stepType: StepType): keyof typeof Ionicons.glyphMap => {
    switch (stepType) {
      case 'Stop':
        return 'pause-circle-outline';
      case 'Stage':
        return 'bed-outline';
      default:
        return 'location-outline';
    }
  };

  return (
    <Ionicons 
      name={getIconName(type)} 
      size={size} 
      color={color} 
    />
  );
};

export default StepTypeIcon;
