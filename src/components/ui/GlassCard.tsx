import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  style?: ViewStyle;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, intensity = 40, style }) => {
  const { isDark, colors } = useTheme();

  return (
    <View style={[styles.container, { borderColor: colors.border }, style]}>
      <BlurView intensity={intensity} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
        <View style={styles.innerContent}>{children}</View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  blur: {
    width: '100%',
  },
  innerContent: {
    padding: 16,
  },
});
