/**
 * Composant réutilisable pour sélection de date et heure
 * Gère le retrait automatique du fuseau horaire pour affichage correct
 * Basé sur le pattern validé dans EditStepScreen
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface CustomDateTimeRowProps {
  label: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  disabledMessage?: string;
  styles: any;
}

export const CustomDateTimeRow: React.FC<CustomDateTimeRowProps> = React.memo(({
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  icon,
  disabled = false,
  disabledMessage,
  styles
}) => {
  console.log('🔄 DEBUG - CustomDateTimeRow render:', { label, dateValue, timeValue, disabled });
  
  // États pour les modales de sélection
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Conversion des valeurs string en Date
  const getDateObject = () => {
    if (dateValue && timeValue) {
      return new Date(`${dateValue}T${timeValue}:00`);
    } else if (dateValue) {
      return new Date(`${dateValue}T12:00:00`);
    }
    return new Date();
  };

  // Gestion du changement de date - SANS fuseau horaire
  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // ✅ Utiliser toISOString().split('T')[0] comme dans EditStepScreen
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log('📅 DEBUG - DatePicker onChange (ISO):', { 
        label, 
        selectedDate: selectedDate.toISOString(),
        formattedDate,
        originalGetDate: selectedDate.getDate(),
        utcGetDate: selectedDate.getUTCDate()
      });
      
      onDateChange(formattedDate);
    }
  };

  // Gestion du changement d'heure - SANS fuseau horaire
  const handleTimePickerChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // ✅ Utiliser toTimeString().substring(0, 5) comme dans EditStepScreen (heure locale)
      const formattedTime = selectedTime.toTimeString().substring(0, 5); // HH:MM
      
      console.log('⏰ DEBUG - TimePicker onChange (Local):', { 
        label, 
        selectedTime: selectedTime.toISOString(),
        formattedTime,
        originalGetHours: selectedTime.getHours(),
        timeString: selectedTime.toTimeString()
      });
      
      onTimeChange(formattedTime);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <Ionicons name={icon} size={20} color={disabled ? colors.gray500 : colors.primary} />
        <Text style={[styles.inputLabel, disabled && styles.disabledLabel]}>{label}</Text>
        {disabled && disabledMessage && (
          <View style={styles.disabledInfoContainer}>
            <Ionicons name="information-circle" size={16} color={colors.warning} />
            <Text style={styles.disabledInfo}>{disabledMessage}</Text>
          </View>
        )}
      </View>
      <View style={styles.dateTimeRow}>
        {/* Champ Date */}
        <View style={styles.dateInputContainer}>
          <Text style={[styles.dateTimeSubLabel, disabled && styles.disabledLabel]}>Date</Text>
          <TouchableOpacity
            style={[
              styles.textInput, 
              styles.dateTimeInput, 
              styles.dateTimeButton,
              disabled && styles.disabledInput
            ]}
            onPress={() => !disabled && setShowDatePicker(true)}
            disabled={disabled}
          >
            <Text style={[
              styles.dateTimeButtonText, 
              !dateValue && styles.placeholderText,
              disabled && styles.disabledText
            ]}>
              {dateValue || 'YYYY-MM-DD'}
            </Text>
            <Ionicons 
              name="calendar-outline" 
              size={16} 
              color={disabled ? colors.gray400 : colors.gray500} 
            />
          </TouchableOpacity>
        </View>

        {/* Champ Heure */}
        <View style={styles.timeInputContainer}>
          <Text style={[styles.dateTimeSubLabel, disabled && styles.disabledLabel]}>Heure</Text>
          <TouchableOpacity
            style={[
              styles.textInput, 
              styles.dateTimeInput, 
              styles.dateTimeButton,
              disabled && styles.disabledInput
            ]}
            onPress={() => !disabled && setShowTimePicker(true)}
            disabled={disabled}
          >
            <Text style={[
              styles.dateTimeButtonText, 
              !timeValue && styles.placeholderText,
              disabled && styles.disabledText
            ]}>
              {timeValue || 'HH:MM'}
            </Text>
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={disabled ? colors.gray400 : colors.gray500} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* DatePicker Modal - seulement si pas désactivé */}
      {showDatePicker && !disabled && (
        <DateTimePicker
          value={getDateObject()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDatePickerChange}
        />
      )}

      {/* TimePicker Modal - seulement si pas désactivé */}
      {showTimePicker && !disabled && (
        <DateTimePicker
          value={getDateObject()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={true}
          onChange={handleTimePickerChange}
        />
      )}
    </View>
  );
});

CustomDateTimeRow.displayName = 'CustomDateTimeRow';
