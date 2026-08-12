import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors, isDark } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    onPress();
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.accent,
            shadowColor: colors.accent,
            shadowOpacity: isDark ? 0.35 : 0.2,
            shadowRadius: 8,
            elevation: 4,
          },
          text: { color: isDark ? '#000000' : '#ffffff', fontWeight: '700' },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDark ? colors.surfaceCard : colors.chipBg,
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: { color: colors.textPrimary, fontWeight: '600' },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.accent,
          },
          text: { color: colors.accent, fontWeight: '600' },
        };
      case 'danger':
        return {
          container: { backgroundColor: colors.danger },
          text: { color: '#ffffff', fontWeight: '700' },
        };
      case 'ghost':
      default:
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: colors.accent, fontWeight: '600' },
        };
    }
  };

  const getSizePadding = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 28, borderRadius: 14 };
      case 'md':
      default:
        return { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 };
    }
  };

  const vStyles = getVariantStyles();
  const pStyles = getSizePadding();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.button,
        vStyles.container,
        pStyles,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vStyles.text.color} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, vStyles.text, icon ? { marginLeft: 8 } : null, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
  },
  disabled: {
    opacity: 0.5,
  },
});
