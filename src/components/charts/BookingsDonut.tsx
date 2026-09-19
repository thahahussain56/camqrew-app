import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface BookingsDonutProps {
  categories?: { name: string; count: number; color: string }[];
}

export const BookingsDonut: React.FC<BookingsDonutProps> = ({ categories = [] }) => {
  const { colors } = useTheme();

  const total = categories.reduce((a, b) => a + b.count, 0);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Bookings by Category</Text>
      {total === 0 ? (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <Text style={{ color: colors.textFaint, fontSize: 13 }}>No shoot bookings recorded yet</Text>
        </View>
      ) : (
        <View style={styles.legendContainer}>
          {categories.map((cat, idx) => {
            const percent = Math.round((cat.count / total) * 100);

            return (
              <View key={idx} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                <Text style={[styles.catName, { color: colors.textPrimary }]}>{cat.name}</Text>
                <Text style={[styles.catCount, { color: colors.accent }]}>
                  {cat.count} ({percent}%)
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendContainer: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  catName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  catCount: {
    fontSize: 13,
    fontWeight: '700',
  },
});
