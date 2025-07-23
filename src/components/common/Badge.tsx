/**
 * Composant Badge pour afficher des pastilles d'information discrètes
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BadgeProps {
  count?: number;
  warning?: boolean;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  size?: 'small' | 'medium';
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  warning = false,
  icon,
  color = '#ffffff',
  backgroundColor,
  size = 'small'
}) => {
  // Si c'est un warning, utiliser les couleurs d'alerte
  const finalBackgroundColor = warning 
    ? '#ff4757' 
    : backgroundColor || 'rgba(0, 0, 0, 0.6)';

  const finalColor = warning ? '#ffffff' : color;

  const sizeStyle = size === 'medium' ? styles.badgeMedium : styles.badgeSmall;
  const textStyle = size === 'medium' ? styles.textMedium : styles.textSmall;

  // Ne rien afficher si count est 0 (pour les compteurs)
  if (typeof count === 'number' && count === 0) {
    return null;
  }

  return (
    <View style={[
      styles.badge,
      sizeStyle,
      { backgroundColor: finalBackgroundColor }
    ]}>
      {icon && (
        <Ionicons 
          name={icon as any} 
          size={size === 'medium' ? 12 : 10} 
          color={finalColor} 
          style={count !== undefined ? { marginRight: 2 } : undefined}
        />
      )}
      {count !== undefined && (
        <Text style={[textStyle, { color: finalColor }]}>
          {count}
        </Text>
      )}
      {warning && !icon && (
        <Text style={[textStyle, { color: finalColor }]}>
          !
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
  },
  badgeSmall: {
    height: 18,
  },
  badgeMedium: {
    height: 22,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  textSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
  textMedium: {
    fontSize: 11,
    fontWeight: '600',
  },
});
