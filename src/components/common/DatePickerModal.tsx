/**
 * Modal de sélection de date
 */
import React, { useState } from 'react';
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

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onDateChange: (date: Date) => void;
  currentDate: Date;
  title: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onDateChange,
  currentDate,
  title,
  minimumDate,
  maximumDate,
}) => {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();
  const selectedDay = selectedDate.getDate();
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleYearChange = (year: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    setSelectedDate(newDate);
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(month);
    // Ajuster le jour si nécessaire
    const maxDay = getDaysInMonth(newDate.getFullYear(), month);
    if (newDate.getDate() > maxDay) {
      newDate.setDate(maxDay);
    }
    setSelectedDate(newDate);
  };

  const handleDayChange = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onDateChange(selectedDate);
    onClose();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
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
      maxHeight: '80%',
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
    previewContainer: {
      backgroundColor: theme.colors.primary + '20',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
      alignItems: 'center',
    },
    previewText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    pickerSection: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    picker: {
      maxHeight: 120,
    },
    pickerItem: {
      padding: 12,
      margin: 2,
      borderRadius: 8,
      alignItems: 'center',
    },
    pickerItemSelected: {
      backgroundColor: theme.colors.primary,
    },
    pickerItemDefault: {
      backgroundColor: theme.colors.background,
    },
    pickerText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    pickerTextSelected: {
      color: theme.colors.white,
      fontWeight: '600',
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    dayItem: {
      width: '13%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
    confirmButtonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: '600',
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
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.previewContainer}>
            <Text style={styles.previewText}>{formatDate(selectedDate)}</Text>
          </View>

          {/* Année */}
          <View style={styles.pickerSection}>
            <Text style={styles.sectionLabel}>Année</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.picker}
            >
              {years.map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    year === selectedYear ? styles.pickerItemSelected : styles.pickerItemDefault
                  ]}
                  onPress={() => handleYearChange(year)}
                >
                  <Text style={[
                    styles.pickerText,
                    year === selectedYear && styles.pickerTextSelected
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Mois */}
          <View style={styles.pickerSection}>
            <Text style={styles.sectionLabel}>Mois</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.picker}
            >
              {months.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.pickerItem,
                    index === selectedMonth ? styles.pickerItemSelected : styles.pickerItemDefault
                  ]}
                  onPress={() => handleMonthChange(index)}
                >
                  <Text style={[
                    styles.pickerText,
                    index === selectedMonth && styles.pickerTextSelected
                  ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Jour */}
          <View style={styles.pickerSection}>
            <Text style={styles.sectionLabel}>Jour</Text>
            <View style={styles.daysGrid}>
              {days.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayItem,
                    day === selectedDay ? styles.pickerItemSelected : styles.pickerItemDefault
                  ]}
                  onPress={() => handleDayChange(day)}
                >
                  <Text style={[
                    styles.pickerText,
                    day === selectedDay && styles.pickerTextSelected
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default DatePickerModal;
