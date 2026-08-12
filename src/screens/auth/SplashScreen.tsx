import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';

export const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        navigation.replace('Onboarding');
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoBox}>
        <Image
          source={
            isDark
              ? require('../../../assets/camcrew-logo-white.png')
              : require('../../../assets/camcrew-logo-dark.png')
          }
          style={styles.logoImage}
        />
        <Text style={[styles.subText, { color: colors.textSecondary }]}>STUDIO</Text>
      </View>
      <Text style={[styles.footerText, { color: colors.textFaint }]}>India's Creative Marketplace</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    alignItems: 'center',
  },
  logoImage: {
    width: 220,
    height: 54,
    resizeMode: 'contain',
  },
  subText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 6,
    marginTop: 8,
  },
  footerText: {
    position: 'absolute',
    bottom: 40,
    fontSize: 13,
    letterSpacing: 1,
  },
});
