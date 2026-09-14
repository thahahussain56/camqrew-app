import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';

/**
 * TopNotchBlur
 *
 * Implements an iPhone Instagram-style translucent frosted glass blur across
 * the device notch / status bar.
 *
 * Features:
 * - Real native UIVisualEffectView blur via expo-blur (NO solid opaque shapes).
 * - Scrolled content (cards, buttons, text, images) scrolls seamlessly behind
 *   the notch and is softly blurred through the glass.
 * - Soft alpha gradient feather at the bottom edge to guarantee zero hard cutoff lines.
 * - pointerEvents="none" so touch interactions pass through unobstructed.
 */
export const TopNotchBlur: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  // Notch / Dynamic Island inset (typically 44-59px on iOS, 24-36px on Android)
  const topInset = insets.top || (Platform.OS === 'ios' ? 47 : (Platform.OS === 'android' ? 28 : 0));

  if (topInset === 0) {
    return null;
  }

  // Extend slightly past the status bar to provide a gentle feather transition
  const totalHeight = topInset + 12;

  const gradientColors = isDark
    ? (['rgba(11, 15, 18, 0.65)', 'rgba(11, 15, 18, 0.25)', 'rgba(11, 15, 18, 0.0)'] as const)
    : (['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.0)'] as const);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { height: totalHeight },
      ]}
    >
      <BlurView
        tint={isDark ? 'dark' : 'light'}
        intensity={Platform.OS === 'ios' ? 85 : 55}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={gradientColors as any}
        locations={[0.0, 0.65, 1.0]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    overflow: 'hidden',
  },
});
