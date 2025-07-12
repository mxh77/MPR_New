/**
 * Composant Input réutilisable
 */
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: any;
  inputStyle?: any;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  required,
  secureTextEntry,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const [isSecureEntry, setIsSecureEntry] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const handleSecureTextToggle = () => {
    setIsSecureEntry(!isSecureEntry);
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    labelContainer: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    required: {
      color: theme.colors.danger,
      marginLeft: 4,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: error 
        ? theme.colors.danger 
        : isFocused 
          ? theme.colors.primary 
          : theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      minHeight: 48,
    },
    leftIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      paddingVertical: 12,
    },
    rightIcon: {
      marginLeft: 12,
      padding: 4,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.danger,
      marginTop: 4,
    },
  });

  // Détermine l'icône de droite (mot de passe ou personnalisée)
  const getRightIcon = () => {
    if (secureTextEntry) {
      return isSecureEntry ? 'eye-off' : 'eye';
    }
    return rightIcon;
  };

  const handleRightIconPress = () => {
    if (secureTextEntry) {
      handleSecureTextToggle();
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}
      
      <View style={styles.inputContainer}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={theme.colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={theme.colors.placeholder}
          secureTextEntry={isSecureEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
        
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            onPress={handleRightIconPress}
            style={styles.rightIcon}
            disabled={!secureTextEntry && !onRightIconPress}
          >
            <Ionicons
              name={getRightIcon()}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default Input;
