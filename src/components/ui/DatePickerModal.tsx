import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react-native';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
  selectedDate?: string;
  blockedDates?: string[];
  title?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  selectedDate = '',
  blockedDates = [],
  title = 'Select Shoot Date',
}) => {
  const { colors } = useTheme();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Calculate days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  // Format integer to 2-digit string
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = `${pad(day)}/${pad(currentMonth + 1)}/${currentYear}`;
    if (blockedDates.includes(formatted)) {
      Alert.alert('Date Unavailable', `Date ${formatted} is blocked by the creator and unavailable for booking.`);
      return;
    }
    onSelectDate(formatted);
    onClose();
  };

  // Offset empty slots for first day of week (Monday as 0)
  const offset = (firstDayOfWeek + 6) % 7;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Calendar size={18} color="#fc8019" style={{ marginRight: 8 }} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View style={[styles.monthNav, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <ChevronLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: colors.textPrimary }]}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <ChevronRight size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Days of Week Row */}
          <View style={styles.weekRow}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <Text key={d} style={[styles.weekCell, { color: colors.textFaint }]}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.daysGrid}>
            {Array.from({ length: offset }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const formatted = `${pad(dayNum)}/${pad(currentMonth + 1)}/${currentYear}`;
              const isSelected = selectedDate === formatted;
              const isBlocked = blockedDates.includes(formatted);

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: '#fc8019' },
                    isBlocked && { backgroundColor: 'rgba(239,68,68,0.18)', borderColor: '#ef4444', borderWidth: 1 },
                  ]}
                  onPress={() => handleSelectDay(dayNum)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isSelected ? '#ffffff' : isBlocked ? '#ef4444' : colors.textPrimary },
                      isBlocked && { textDecorationLine: 'line-through' },
                    ]}
                  >
                    {dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Format Notice */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textFaint }]}>
              Format: DD/MM/YYYY
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  navBtn: {
    padding: 4,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekCell: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 14,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
