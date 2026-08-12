import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface EarningsChartProps {
  data?: number[];
  labels?: string[];
}

export const EarningsChart: React.FC<EarningsChartProps> = ({
  data = [12000, 25000, 18000, 32000, 45000, 38000, 52000],
  labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
}) => {
  const { colors } = useTheme();
  const maxValue = Math.max(...data, 1);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Monthly Revenue Trend</Text>
      <View style={styles.barsContainer}>
        {data.map((val, idx) => {
          const heightPercent = (val / maxValue) * 100;

          return (
            <View key={idx} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.label, { color: colors.textFaint }]}>{labels[idx]}</Text>
            </View>
          );
        })}
      </View>
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
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  label: {
    fontSize: 11,
    marginTop: 6,
  },
});
