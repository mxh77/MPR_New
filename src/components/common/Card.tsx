/**
 * Composant Card réutilisable
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  onPress,
  style,
  elevated = true,
  padding = 'medium',
}) => {
  const { theme } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'small': return 8;
      case 'large': return 24;
      default: return 16; // medium
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: getPadding(),
      ...(elevated && {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    pressable: {
      borderRadius: 12,
    },
    header: {
      marginBottom: title && subtitle ? 8 : title ? 4 : 0,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: subtitle ? 4 : 0,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    content: {
      flex: 1,
    },
  });

  const cardContent = (
    <View style={[styles.card, style]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.pressable}
        activeOpacity={0.7}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

export default Card;
