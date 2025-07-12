/**
 * Composant Button réutilisable
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = 8;
        baseStyle.paddingHorizontal = 16;
        baseStyle.minHeight = 32;
        break;
      case 'large':
        baseStyle.paddingVertical = 16;
        baseStyle.paddingHorizontal = 24;
        baseStyle.minHeight = 56;
        break;
      default: // medium
        baseStyle.paddingVertical = 12;
        baseStyle.paddingHorizontal = 20;
        baseStyle.minHeight = 44;
    }

    // Variant
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = theme.colors.gray200;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = theme.colors.primary;
        break;
      case 'danger':
        baseStyle.backgroundColor = theme.colors.danger;
        break;
      default: // primary
        baseStyle.backgroundColor = theme.colors.primary;
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.backgroundColor = theme.colors.gray400;
      baseStyle.borderColor = theme.colors.gray400;
    }

    // Full width
    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.fontSize = 14;
        break;
      case 'large':
        baseStyle.fontSize = 18;
        break;
      default: // medium
        baseStyle.fontSize = 16;
    }

    // Variant
    switch (variant) {
      case 'secondary':
        baseStyle.color = theme.colors.text;
        break;
      case 'outline':
        baseStyle.color = disabled ? theme.colors.gray400 : theme.colors.primary;
        break;
      default: // primary, danger
        baseStyle.color = theme.colors.white;
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.color = theme.colors.gray600;
    }

    return baseStyle;
  };

  const styles = StyleSheet.create({
    button: getButtonStyle(),
    text: getTextStyle(),
    loader: {
      marginRight: 8,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={styles.text.color}
          style={styles.loader}
        />
      )}
      <Text style={[styles.text, textStyle]}>
        {loading ? 'Chargement...' : title}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;
