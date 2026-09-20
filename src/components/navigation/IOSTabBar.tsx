import React, { useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "../../hooks/useTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// iOS spring config
const IOS_SPRING = { damping: 15, stiffness: 200, mass: 0.8 };
const PILL_SPRING = { damping: 22, stiffness: 300, mass: 0.7 };

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

interface TabItemProps {
  route: any;
  index: number;
  isFocused: boolean;
  descriptors: any;
  navigation: any;
  pillX: SharedValue<number>;
  isDark: boolean;
  colors: any;
  tabWidth: number;
}

const TabItem: React.FC<TabItemProps> = ({
  route,
  index,
  isFocused,
  descriptors,
  navigation,
  pillX,
  isDark,
  colors,
  tabWidth,
}) => {
  const scale = useSharedValue(1);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.5);
  const labelY = useSharedValue(isFocused ? 0 : 3);
  const iconY = useSharedValue(0);

  const { options } = descriptors[route.key];
  const label =
    options.tabBarLabel !== undefined
      ? options.tabBarLabel
      : options.title !== undefined
      ? options.title
      : route.name;

  const icon = options.tabBarIcon?.({
    focused: isFocused,
    color: isFocused ? colors.accent : colors.textFaint,
    size: 22,
  });

  useEffect(() => {
    labelOpacity.value = withTiming(isFocused ? 1 : 0.55, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    labelY.value = withSpring(isFocused ? 0 : 3, IOS_SPRING);
    iconY.value = withSpring(isFocused ? -1 : 0, IOS_SPRING);
  }, [isFocused]);

  const onPress = () => {
    scale.value = withSequence(
      withSpring(0.82, { damping: 12, stiffness: 420, mass: 0.5 }),
      withSpring(1.14, { damping: 10, stiffness: 360, mass: 0.5 }),
      withSpring(1.0, IOS_SPRING)
    );
    pillX.value = withSpring(index * tabWidth, PILL_SPRING);
    runOnJS(triggerHaptic)();

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate({ name: route.name, merge: true });
    }
  };

  const onLongPress = () => {
    navigation.emit({ type: "tabLongPress", target: route.key });
  };

  const animatedIcon = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: iconY.value },
    ] as any,
  }));

  const animatedLabel = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelY.value }],
  }));

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={1}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.iconWrap, animatedIcon]}>
        {icon}
      </Animated.View>
      <Animated.Text
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.accent : colors.textFaint },
          animatedLabel,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

export const IOSTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Check if current tab wants to hide bar (e.g. detail screens)
  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;
  const tabStyle = focusedOptions.tabBarStyle as any;
  if (tabStyle && tabStyle.display === "none") {
    return null;
  }

  const TAB_COUNT = state.routes.length;
  const SIDE_MARGIN = 16;
  const BAR_WIDTH = SCREEN_WIDTH - SIDE_MARGIN * 2;
  const TAB_WIDTH = BAR_WIDTH / TAB_COUNT;
  const BAR_HEIGHT = 58;
  const BOTTOM_OFFSET = Math.max(insets.bottom, 8) + 4;

  const pillX = useSharedValue(state.index * TAB_WIDTH);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.barWrapper,
        {
          bottom: BOTTOM_OFFSET,
          left: SIDE_MARGIN,
          right: SIDE_MARGIN,
          height: BAR_HEIGHT,
        },
      ]}
    >
      <View
        style={[
          styles.barContainer,
          {
            borderColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.07)",
          },
        ]}
      >
        <BlurView
          tint={isDark ? "dark" : "light"}
          intensity={isDark ? 75 : 65}
          style={StyleSheet.absoluteFill}
        />

        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? "rgba(6,8,10,0.55)"
                : "rgba(255,255,255,0.45)",
              borderRadius: 26,
            },
          ]}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            {
              width: TAB_WIDTH,
              backgroundColor: isDark
                ? "rgba(63,182,104,0.13)"
                : "rgba(63,182,104,0.10)",
            },
            pillStyle,
          ]}
        />

        <View style={styles.tabRow} pointerEvents="box-none">
          {state.routes.map((route, index) => (
            <TabItem
              key={route.key}
              route={route}
              index={index}
              isFocused={state.index === index}
              descriptors={descriptors}
              navigation={navigation}
              pillX={pillX}
              isDark={isDark}
              colors={colors}
              tabWidth={TAB_WIDTH}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  barWrapper: {
    position: "absolute",
    zIndex: 999,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 24,
  },
  barContainer: {
    flex: 1,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
  },
  activePill: {
    position: "absolute",
    top: 5,
    bottom: 5,
    borderRadius: 20,
    borderTopWidth: 1.5,
    borderTopColor: "rgba(63,182,104,0.30)",
  },
  tabRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 2,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
