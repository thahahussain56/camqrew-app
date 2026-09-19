import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { CheckCircle2, User } from 'lucide-react-native';
import { isCustomAvatar } from '../../utils/avatarUtils';

interface AvatarProps {
  source?: string | null;
  size?: number;
  verified?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ source, size = 48, verified = false }) => {
  const { colors, isDark } = useTheme();

  const hasCustom = isCustomAvatar(source);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {hasCustom ? (
        <Image
          source={{ uri: source! }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2, borderColor: colors.accent },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: colors.borderLight,
              backgroundColor: isDark ? '#1a2228' : '#e5e7eb',
            },
          ]}
        >
          <User size={Math.round(size * 0.52)} color={colors.textSecondary} />
        </View>
      )}
      {verified && (
        <View style={[styles.verifiedBadge, { bottom: -2, right: -2 }]}>
          <CheckCircle2 size={size * 0.35} color={colors.accent} fill="#06080a" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    borderWidth: 1.5,
  },
  placeholder: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    borderRadius: 10,
  },
});
