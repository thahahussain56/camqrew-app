import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon } from 'lucide-react-native';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleTheme}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0e131b' : '#edf0f5',
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.iconPill, { backgroundColor: isDark ? colors.accentGlow : 'rgba(14, 90, 111, 0.15)' }]}>
        {isDark ? (
          <Moon size={18} color={colors.accent} />
        ) : (
          <Sun size={18} color={colors.accent} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconPill: {
    padding: 6,
    borderRadius: 16,
  },
});
