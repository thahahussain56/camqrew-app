import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { CheckCircle2 } from 'lucide-react-native';

interface AvatarProps {
  source?: string;
  size?: number;
  verified?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ source, size = 48, verified = false }) => {
  const { colors } = useTheme();

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: source || defaultAvatar }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2, borderColor: colors.accent },
        ]}
      />
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
  verifiedBadge: {
    position: 'absolute',
    borderRadius: 10,
  },
});
