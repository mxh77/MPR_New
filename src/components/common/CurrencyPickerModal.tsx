/**
 * Modal de sélection de devise
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts';

const { width } = Dimensions.get('window');

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface CurrencyPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onCurrencySelect: (currency: Currency) => void;
  currencies: Currency[];
  selectedCurrency: string;
}

export const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({
  visible,
  onClose,
  onCurrencySelect,
  currencies,
  selectedCurrency,
}) => {
  const { theme } = useTheme();

  const handleCurrencySelect = (currency: Currency) => {
    onCurrencySelect(currency);
    onClose();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 20,
      width: width * 0.9,
      maxWidth: 400,
      maxHeight: '70%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    currencyList: {
      flex: 1,
    },
    currencyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: theme.colors.background,
    },
    currencyItemSelected: {
      backgroundColor: theme.colors.primary + '20',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    currencySymbol: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      width: 40,
      textAlign: 'center',
    },
    currencySymbolSelected: {
      color: theme.colors.primary,
    },
    currencyInfo: {
      flex: 1,
      marginLeft: 12,
    },
    currencyCode: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    currencyCodeSelected: {
      color: theme.colors.primary,
    },
    currencyName: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    checkIcon: {
      marginLeft: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
          <View style={styles.header}>
            <Text style={styles.title}>Choisir une devise</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
            {currencies.map((currency) => {
              const isSelected = currency.code === selectedCurrency;
              
              return (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyItem,
                    isSelected && styles.currencyItemSelected
                  ]}
                  onPress={() => handleCurrencySelect(currency)}
                >
                  <Text style={[
                    styles.currencySymbol,
                    isSelected && styles.currencySymbolSelected
                  ]}>
                    {currency.symbol}
                  </Text>
                  
                  <View style={styles.currencyInfo}>
                    <Text style={[
                      styles.currencyCode,
                      isSelected && styles.currencyCodeSelected
                    ]}>
                      {currency.code}
                    </Text>
                    <Text style={styles.currencyName}>
                      {currency.name}
                    </Text>
                  </View>
                  
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Ionicons 
                        name="checkmark-circle" 
                        size={24} 
                        color={theme.colors.primary} 
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default CurrencyPickerModal;
