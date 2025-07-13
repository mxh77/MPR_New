/**
 * Modal de sélection de date moderne avec calendrier amélioré
 */
import React, { useState, useEffect } from 'react';
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

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

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
  const [selectedDate, setSelectedDate] = useState(new Date(currentDate));
  const [viewDate, setViewDate] = useState(new Date(currentDate));
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedDate(new Date(currentDate));
      setViewDate(new Date(currentDate));
      setShowYearPicker(false);
      setShowMonthPicker(false);
    }
  }, [visible, currentDate]);

  const handleConfirm = () => {
    onDateChange(selectedDate);
    onClose();
  };

  const handleCancel = () => {
    setSelectedDate(new Date(currentDate));
    onClose();
  };

  const handleTodayPress = () => {
    const today = new Date();
    setSelectedDate(today);
    setViewDate(today);
    setShowYearPicker(false);
    setShowMonthPicker(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setViewDate(newDate);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setShowYearPicker(false);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(monthIndex);
    setViewDate(newDate);
    setShowMonthPicker(false);
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = minimumDate ? minimumDate.getFullYear() : currentYear - 50;
    const endYear = maximumDate ? maximumDate.getFullYear() : currentYear + 50;
    
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };

  const isDateDisabled = (date: Date) => {
    if (minimumDate && date < minimumDate) return true;
    if (maximumDate && date > maximumDate) return true;
    return false;
  };

  const isDateSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDayPress = (date: Date) => {
    if (isDateDisabled(date)) {
      return;
    }
    setSelectedDate(new Date(date));
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Jour de la semaine du premier jour (0 = dimanche)
    const startDay = firstDay.getDay();
    
    // Jours du mois précédent à afficher
    const prevMonthDays = [];
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      prevMonthDays.push(new Date(year, month - 1, day));
    }
    
    // Jours du mois actuel
    const currentMonthDays = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentMonthDays.push(new Date(year, month, day));
    }
    
    // Jours du mois suivant pour compléter la grille
    const nextMonthDays = [];
    const totalCells = 42; // 6 semaines × 7 jours
    const remainingCells = totalCells - (prevMonthDays.length + currentMonthDays.length);
    for (let day = 1; day <= remainingCells; day++) {
      nextMonthDays.push(new Date(year, month + 1, day));
    }
    
    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    
    return (
      <View style={styles.calendar}>
        {/* En-têtes des jours */}
        <View style={styles.weekHeader}>
          {DAYS_FR.map((day) => (
            <View key={day} style={styles.dayHeader}>
              <Text style={[styles.dayHeaderText, { color: theme.colors.textSecondary }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Grille des jours */}
        <View style={styles.daysGrid}>
          {allDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === month;
            const isSelected = isDateSelected(date);
            const isDisabled = isDateDisabled(date);
            const isTodayDate = isToday(date);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isSelected && { backgroundColor: theme.colors.primary },
                  isTodayDate && !isSelected && { 
                    borderWidth: 1, 
                    borderColor: theme.colors.primary 
                  },
                ]}
                onPress={() => handleDayPress(date)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: theme.colors.text },
                    !isCurrentMonth && { color: theme.colors.textSecondary, opacity: 0.5 },
                    isSelected && { color: theme.colors.white, fontWeight: 'bold' },
                    isDisabled && { color: theme.colors.textSecondary, opacity: 0.3 },
                    isTodayDate && !isSelected && { 
                      color: theme.colors.primary,
                      fontWeight: 'bold'
                    },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderYearPicker = () => {
    const years = generateYears();
    
    return (
      <View style={styles.pickerContainer}>
        <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>Sélectionner une année</Text>
        <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.pickerItem,
                year === viewDate.getFullYear() && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => handleYearSelect(year)}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  { color: theme.colors.text },
                  year === viewDate.getFullYear() && { color: theme.colors.white, fontWeight: 'bold' },
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMonthPicker = () => {
    return (
      <View style={styles.pickerContainer}>
        <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>Sélectionner un mois</Text>
        <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
          {MONTHS_FR.map((month, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pickerItem,
                index === viewDate.getMonth() && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => handleMonthSelect(index)}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  { color: theme.colors.text },
                  index === viewDate.getMonth() && { color: theme.colors.white, fontWeight: 'bold' },
                ]}
              >
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      margin: 20,
      width: width - 40,
      maxHeight: '80%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 0,
    },
    monthNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      backgroundColor: theme.colors.card,
    },
    navButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
    },
    monthTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    todayButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '20',
    },
    todayButtonText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    calendar: {
      padding: 20,
    },
    weekHeader: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    dayHeader: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    dayHeaderText: {
      fontSize: 12,
      fontWeight: '600',
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: `${100/7}%`,
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      marginBottom: 4,
    },
    dayText: {
      fontSize: 16,
      textAlign: 'center',
    },
    selectedDateInfo: {
      padding: 20,
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    selectedDateText: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    selectedDateDetail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: 12,
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: theme.colors.text,
    },
    confirmButtonText: {
      color: theme.colors.white,
    },
    // Styles pour les sélecteurs rapides
    pickerContainer: {
      padding: 20,
      maxHeight: 300,
    },
    pickerTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 16,
      textAlign: 'center',
    },
    pickerScroll: {
      maxHeight: 240,
    },
    pickerItem: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 4,
      alignItems: 'center',
    },
    pickerItemText: {
      fontSize: 16,
    },
  });

  const formatSelectedDate = () => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(selectedDate);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity style={styles.todayButton} onPress={handleTodayPress}>
                <Text style={styles.todayButtonText}>Aujourd'hui</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation mois/année */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('prev')}>
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => {
              setShowYearPicker(!showYearPicker);
              setShowMonthPicker(false);
            }}>
              <Text style={[styles.monthTitle, { color: showYearPicker ? theme.colors.primary : theme.colors.text }]}>
                {viewDate.getFullYear()}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => {
              setShowMonthPicker(!showMonthPicker);
              setShowYearPicker(false);
            }}>
              <Text style={[styles.monthTitle, { color: showMonthPicker ? theme.colors.primary : theme.colors.text }]}>
                {MONTHS_FR[viewDate.getMonth()]}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('next')}>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Contenu principal */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {showYearPicker ? renderYearPicker() : 
             showMonthPicker ? renderMonthPicker() : 
             renderCalendar()}
          </ScrollView>

          {/* Date sélectionnée */}
          <View style={styles.selectedDateInfo}>
            <Text style={styles.selectedDateText}>Date sélectionnée</Text>
            <Text style={styles.selectedDateDetail}>{formatSelectedDate()}</Text>
          </View>

          {/* Footer avec boutons */}
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
              <Text style={[styles.buttonText, styles.confirmButtonText]}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DatePickerModal;
