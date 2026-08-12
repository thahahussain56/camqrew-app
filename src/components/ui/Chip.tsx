import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({ label, active = false, onPress, icon, style }) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accent : colors.chipBg,
          borderColor: active ? colors.accent : colors.border,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          {
            color: active
              ? (isDark ? '#000000' : '#ffffff')
              : colors.textPrimary,
            fontWeight: active ? '700' : '500',
            marginLeft: icon ? 6 : 0,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
  },
});
