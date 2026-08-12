import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { CheckCircle2 } from 'lucide-react-native';

interface BadgeProps {
  label: string;
  variant?: 'verified' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info' }) => {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'verified':
        return { bg: colors.accentGlow, text: colors.accent, border: colors.accent };
      case 'success':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: colors.success, border: colors.success };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: colors.warning, border: colors.warning };
      case 'danger':
        return { bg: 'rgba(255, 107, 107, 0.15)', text: colors.danger, border: colors.danger };
      case 'info':
      default:
        return { bg: colors.secondaryAccentGlow, text: colors.secondaryAccent, border: colors.secondaryAccent };
    }
  };

  const bColors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bColors.bg, borderColor: bColors.border }]}>
      {variant === 'verified' && <CheckCircle2 size={12} color={colors.accent} style={{ marginRight: 4 }} />}
      <Text style={[styles.text, { color: bColors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
