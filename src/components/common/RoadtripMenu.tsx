/**
 * Menu contextuel pour les actions sur les roadtrips
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts';

const { width } = Dimensions.get('window');

interface MenuAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  destructive?: boolean;
}

interface RoadtripMenuProps {
  visible: boolean;
  onClose: () => void;
  onAction: (actionId: string) => void;
  roadtripTitle: string;
  position?: { x: number; y: number };
  loadingAction?: string | null;
}

const defaultActions: MenuAction[] = [
  {
    id: 'view',
    label: 'Voir les détails',
    icon: 'eye-outline',
  },
  {
    id: 'edit',
    label: 'Modifier',
    icon: 'create-outline',
  },
  {
    id: 'duplicate',
    label: 'Dupliquer',
    icon: 'copy-outline',
  },
  {
    id: 'share',
    label: 'Partager',
    icon: 'share-outline',
  },
  {
    id: 'delete',
    label: 'Supprimer',
    icon: 'trash-outline',
    destructive: true,
  },
];

export const RoadtripMenu: React.FC<RoadtripMenuProps> = ({
  visible,
  onClose,
  onAction,
  roadtripTitle,
  position,
  loadingAction,
}) => {
  const { theme } = useTheme();

  const handleAction = (actionId: string) => {
    if (actionId === 'delete') {
      // Confirmation pour la suppression
      Alert.alert(
        'Supprimer le roadtrip',
        `Êtes-vous sûr de vouloir supprimer "${roadtripTitle}" ?\n\nCette action est irréversible.`,
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              onClose();
              onAction(actionId);
            },
          },
        ]
      );
    } else {
      onClose();
      onAction(actionId);
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      paddingVertical: 8,
      marginHorizontal: 20,
      maxWidth: width - 40,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    menuHeader: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    menuItemIcon: {
      width: 24,
      alignItems: 'center',
    },
    menuItemText: {
      fontSize: 16,
      flex: 1,
    },
    destructiveItem: {
      // Style spécial pour les actions destructives
    },
    destructiveText: {
      color: theme.colors.danger,
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          {/* Header */}
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {roadtripTitle}
            </Text>
          </View>

          {/* Actions */}
          {defaultActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.menuItem,
                action.destructive && styles.destructiveItem,
              ]}
              onPress={() => handleAction(action.id)}
              activeOpacity={0.7}
              disabled={!!loadingAction}
            >
              <View style={styles.menuItemIcon}>
                {loadingAction === action.id ? (
                  <ActivityIndicator 
                    size={20} 
                    color={action.destructive ? theme.colors.danger : theme.colors.primary} 
                  />
                ) : (
                  <Ionicons
                    name={action.icon}
                    size={20}
                    color={
                      action.destructive
                        ? theme.colors.danger
                        : theme.colors.text
                    }
                  />
                )}
              </View>
              <Text
                style={[
                  styles.menuItemText,
                  { color: theme.colors.text },
                  action.destructive && styles.destructiveText,
                  loadingAction && { opacity: 0.6 },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

export default RoadtripMenu;
