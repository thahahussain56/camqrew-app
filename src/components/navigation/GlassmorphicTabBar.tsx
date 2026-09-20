import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Home, LayoutGrid, Film, ShoppingBag, User } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HIDDEN_SCREENS = [
  'ProductDetail',
  'Cart',
  'SaleCheckout',
  'RentalCheckout',
  'Chat',
  'ChatInfo',
  'Booking',
  'OrderDetail',
  'PublicProfile',
  'EditProfile',
  'PrimeSubscription',
  'CreateJob',
  'JobBoardScreen',
  'JobBoard',
];

interface TabButtonProps {
  route: any;
  index: number;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  isDark: boolean;
  colors: any;
}

const TabButton: React.FC<TabButtonProps> = ({
  route,
  isFocused,
  onPress,
  onLongPress,
  isDark,
  colors,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics unavailable
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.86,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const activeColor = isDark ? '#ffffff' : colors.textPrimary;
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.45)';

  const renderIcon = () => {
    const size = 22;
    const strokeWidth = isFocused ? 2 : 1.8;
    const fill = isFocused ? activeColor : 'transparent';
    const color = isFocused ? activeColor : inactiveColor;

    switch (route.name) {
      case 'HomeTab':
        return <Home size={size} color={color} fill={fill} strokeWidth={strokeWidth} />;
      case 'ExploreTab':
        return <LayoutGrid size={size} color={color} fill={fill} strokeWidth={strokeWidth} />;
      case 'ReelsTab':
        return <Film size={size} color={color} fill={fill} strokeWidth={strokeWidth} />;
      case 'MarketplaceTab':
        return <ShoppingBag size={size} color={color} fill={fill} strokeWidth={strokeWidth} />;
      case 'ProfileTab':
        return <User size={size} color={color} fill={fill} strokeWidth={strokeWidth} />;
      default:
        return <Home size={size} color={color} fill={fill} strokeWidth={strokeWidth} />;
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={styles.tabButton}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {renderIcon()}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const GlassmorphicTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Hide tab bar on specific child screens (Booking, Chat, ProductDetail, etc.)
  const focusedRoute = state.routes[state.index];
  const focusedRouteName = getFocusedRouteNameFromRoute(focusedRoute) ?? '';
  const focusedOptions = descriptors[focusedRoute.key].options;
  const tabStyle = focusedOptions.tabBarStyle as any;

  if (HIDDEN_SCREENS.includes(focusedRouteName) || (tabStyle && tabStyle.display === 'none')) {
    return null;
  }

  const SIDE_MARGIN = 20;
  const [barWidth, setBarWidth] = useState(SCREEN_WIDTH - SIDE_MARGIN * 2);

  const TAB_COUNT = state.routes.length;
  const tabWidth = barWidth / TAB_COUNT;
  const PILL_H_MARGIN = 6;
  const pillWidth = Math.max(tabWidth - PILL_H_MARGIN * 2, 40);

  const pillAnim = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.spring(pillAnim, {
      toValue: state.index,
      damping: 18,
      stiffness: 220,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  const translateX = pillAnim.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * tabWidth + PILL_H_MARGIN),
  });

  const bottomOffset = Math.max(insets.bottom, 10) + 8;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.barWrapper,
        {
          bottom: bottomOffset,
          left: SIDE_MARGIN,
          right: SIDE_MARGIN,
        },
      ]}
    >
      <View
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          if (width > 0 && Math.abs(width - barWidth) > 2) {
            setBarWidth(width);
          }
        }}
        style={[
          styles.barContainer,
          {
            backgroundColor: isDark
              ? 'rgba(15, 23, 32, 0.68)'
              : 'rgba(255, 255, 255, 0.72)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.22)'
              : 'rgba(255, 255, 255, 0.85)',
            shadowOpacity: isDark ? 0.45 : 0.12,
          },
        ]}
      >
        {/* Native Frosted Blur Backdrop */}
        <BlurView
          tint={isDark ? 'dark' : 'light'}
          intensity={Platform.OS === 'ios' ? 75 : 95}
          style={StyleSheet.absoluteFill}
        />

        {/* Floating Active Pill Bubble */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            {
              width: pillWidth,
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.08)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.20)'
                : 'rgba(0, 0, 0, 0.06)',
              transform: [{ translateX }],
            },
          ]}
        />

        {/* Tab Icons Row */}
        <View style={styles.tabRow} pointerEvents="box-none">
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TabButton
                key={route.key}
                route={route}
                index={index}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                isDark={isDark}
                colors={colors}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    zIndex: 999,
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    height: 64,
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 1.2,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 12,
    justifyContent: 'center',
  },
  activePill: {
    position: 'absolute',
    top: 7,
    bottom: 7,
    borderRadius: 9999,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
