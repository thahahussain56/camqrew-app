import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Clock, X, Check } from 'lucide-react-native';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (timeStr: string) => void;
  selectedTime?: string;
  title?: string;
}

const MORNING_SLOTS = ['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM'];
const AFTERNOON_SLOTS = ['12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
const EVENING_SLOTS = ['06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'];

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onSelectTime,
  selectedTime = '',
  title = 'Select Time',
}) => {
  const { colors } = useTheme();

  const renderSection = (heading: string, slots: string[]) => (
    <View style={styles.section}>
      <Text style={[styles.sectionHeading, { color: colors.textFaint }]}>{heading}</Text>
      <View style={styles.slotsGrid}>
        {slots.map(t => {
          const isSelected = selectedTime === t;
          return (
            <TouchableOpacity
              key={t}
              style={[
                styles.slotChip,
                {
                  backgroundColor: isSelected ? '#fc8019' : colors.background,
                  borderColor: isSelected ? '#fc8019' : colors.border,
                },
              ]}
              onPress={() => {
                onSelectTime(t);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.slotText,
                  { color: isSelected ? '#ffffff' : colors.textPrimary },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Clock size={18} color="#fc8019" style={{ marginRight: 8 }} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {renderSection('🌅 Morning Shoot', MORNING_SLOTS)}
            {renderSection('☀️ Afternoon Shoot', AFTERNOON_SLOTS)}
            {renderSection('🌙 Evening & Night Shoot', EVENING_SLOTS)}
          </ScrollView>
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
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
