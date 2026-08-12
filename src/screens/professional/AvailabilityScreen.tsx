import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react-native';

export const AvailabilityScreen: React.FC = () => {
  const { colors } = useTheme();

  // Highlight default blocked dates for August 2026
  const [blockedDates, setBlockedDates] = useState<string[]>(['2026-08-15', '2026-08-20']);

  const days = Array.from({ length: 31 }).map((_, i) => i + 1);
  
  // August 2026 starts on Saturday (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6)
  const offset = 5; 

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Availability Calendar</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>August 2026</Text>
      </View>

      {/* Calendar Grid Representation */}
      <Card style={styles.calendarCard}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Blocked / Booked</Text>
          </View>
        </View>

        {/* Week Days Headers */}
        <View style={styles.weekRow}>
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
            <Text key={d} style={[styles.weekCell, { color: colors.textFaint }]}>{d}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {/* Offset empty days */}
          {Array.from({ length: offset }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.emptyBox} />
          ))}

          {days.map(d => {
            const dateStr = `2026-08-${d < 10 ? '0' + d : d}`;
            const isBlocked = blockedDates.includes(dateStr);

            return (
              <TouchableOpacity
                key={d}
                activeOpacity={0.8}
                style={[
                  styles.dayBox,
                  {
                    backgroundColor: isBlocked ? 'rgba(255,107,107,0.15)' : colors.chipBg,
                    borderColor: isBlocked ? colors.danger : colors.border,
                  },
                ]}
                onPress={() => {
                  if (isBlocked) setBlockedDates(blockedDates.filter(bd => bd !== dateStr));
                  else setBlockedDates([...blockedDates, dateStr]);
                }}
              >
                <Text style={[styles.dayText, { color: isBlocked ? colors.danger : colors.textPrimary }]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* iCal Subscription Status */}
      <Card style={styles.syncCard}>
        <View style={styles.syncHeader}>
          <RefreshCw size={20} color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={[styles.syncTitle, { color: colors.textPrimary }]}>Google Calendar Sync</Text>
        </View>
        <Text style={[styles.syncSub, { color: colors.textFaint }]}>
          iCal feeds are synced automatically every 15 minutes.
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 68,
    paddingBottom: 115,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  calendarCard: {
    marginBottom: 16,
    borderWidth: 0,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    padding: 16,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekCell: {
    width: '13%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayBox: {
    width: '13%',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  emptyBox: {
    width: '13%',
    height: 40,
    marginVertical: 2,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
  },
  syncCard: {
    marginBottom: 16,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  syncSub: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
