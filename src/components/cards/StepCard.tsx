/**
 * Composant de carte pour afficher une étape
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts';
import type { Step, StepType } from '../../types';
import StepTypeIcon from '../common/StepTypeIcon';

interface StepCardProps {
  step: Step;
  index: number;
  onPress?: (step: Step) => void;
  onEdit?: (step: Step) => void;
  onDelete?: (step: Step) => void;
  showActions?: boolean;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const { theme } = useTheme();

  const getStepTypeColor = (type: StepType): string => {
    switch (type) {
      case 'stop':
        return theme.colors.warning;
      case 'overnight':
        return theme.colors.primary;
      case 'activity':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStepTypeLabel = (type: StepType): string => {
    switch (type) {
      case 'stop':
        return 'Arrêt';
      case 'overnight':
        return 'Étape';
      case 'activity':
        return 'Activité';
      default:
        return 'Inconnu';
    }
  };

  const formatDuration = (startDate?: Date, endDate?: Date): string => {
    if (!startDate || !endDate) return '';
    
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 jour';
    if (diffDays > 1) return `${diffDays} jours`;
    
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (diffHours === 1) return '1 heure';
    if (diffHours > 1) return `${diffHours} heures`;
    
    return 'Quelques minutes';
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    stepNumberText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.white,
    },
    info: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginRight: 8,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    typeText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.white,
    },
    address: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    details: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    detail: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    menuButton: {
      padding: 8,
      marginLeft: 8,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 12,
      lineHeight: 20,
    },
    syncStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 4,
    },
    syncStatusText: {
      fontSize: 12,
      color: theme.colors.warning,
    },
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(step)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>
            {index + 1}
          </Text>
        </View>
        
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {step.title}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: getStepTypeColor(step.type) }]}>
              <StepTypeIcon type={step.type} size={12} color={theme.colors.white} />
              <Text style={styles.typeText}>
                {getStepTypeLabel(step.type)}
              </Text>
            </View>
          </View>
          
          {step.location.address && (
            <Text style={styles.address} numberOfLines={1}>
              <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
              {' '}{step.location.address}
            </Text>
          )}
          
          <View style={styles.details}>
            {step.startDate && (
              <Text style={styles.detail}>
                <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                {' '}{new Intl.DateTimeFormat('fr-FR', { 
                  day: 'numeric', 
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(step.startDate)}
              </Text>
            )}
            
            {step.startDate && step.endDate && (
              <Text style={styles.detail}>
                • {formatDuration(step.startDate, step.endDate)}
              </Text>
            )}
            
            {step.distance && (
              <Text style={styles.detail}>
                • {Math.round(step.distance)} km
              </Text>
            )}
          </View>
        </View>
        
        {showActions && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              // Actions menu could be handled by parent component
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {step.description && (
        <Text style={styles.description} numberOfLines={2}>
          {step.description}
        </Text>
      )}
      
      {/* Indicateur de statut de synchronisation */}
      {step.syncStatus === 'pending' && (
        <View style={styles.syncStatus}>
          <Ionicons name="cloud-upload-outline" size={12} color={theme.colors.warning} />
          <Text style={styles.syncStatusText}>
            En attente de synchronisation
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default StepCard;
