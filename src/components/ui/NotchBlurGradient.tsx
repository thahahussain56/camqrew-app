import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

interface NotchBlurGradientProps {
  /** Optional extra bottom feather height beyond the safe area inset (defaults to 18px) */
  extraHeight?: number;
  /** Optional custom gradient colors override */
  colors?: string[];
  /** Optional custom blur intensity */
  intensity?: number;
}

/**
 * NotchBlurGradient
 * Renders an iPhone Instagram-style frosted glass blur + gradient layer
 * that covers and fills the device's top notch / Dynamic Island / status bar.
 *
 * It feathers smoothly downward so that as content scrolls underneath,
 * it dissolves gracefully into the notch without harsh cutoffs.
 * Uses pointerEvents="none" so all user interactions pass through freely.
 */
export const NotchBlurGradient: React.FC<NotchBlurGradientProps> = ({
  extraHeight = 18,
  colors: customColors,
  intensity,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  // Dynamic top safe area inset (iPhone notch / Dynamic Island is typically 44-59px)
  const topInset = insets.top || (Platform.OS === 'ios' ? 44 : 0);

  // If there is no top inset (e.g. desktop browser), do not render
  if (topInset === 0) {
    return null;
  }

  const totalHeight = topInset + extraHeight;

  // Instagram-style gradient: solid/opaque at the status bar top, softly feathering to transparent
  const defaultDarkGradient = [
    'rgba(6, 8, 10, 0.96)',
    'rgba(6, 8, 10, 0.78)',
    'rgba(6, 8, 10, 0.35)',
    'rgba(6, 8, 10, 0.0)',
  ];

  const defaultLightGradient = [
    'rgba(249, 250, 251, 0.96)',
    'rgba(249, 250, 251, 0.80)',
    'rgba(249, 250, 251, 0.35)',
    'rgba(249, 250, 251, 0.0)',
  ];

  const gradientColors = customColors || (isDark ? defaultDarkGradient : defaultLightGradient);
  const blurIntensity = intensity ?? (Platform.OS === 'ios' ? 70 : 85);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.notchContainer,
        { height: totalHeight },
      ]}
    >
      {/* 1. Frosted Glass Blur Layer */}
      <BlurView
        intensity={blurIntensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Soft Gradient Tint Layer (iPhone Instagram Aesthetic) */}
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        locations={[0, 0.55, 0.82, 1.0]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  notchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    overflow: 'hidden',
  },
});
