import React, { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useTheme } from "../../hooks/useTheme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IOSNavBarProps {
  /** Center title text */
  title?: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Custom left-side content (overrides back button) */
  leftAction?: ReactNode;
  /** Custom right-side content */
  rightAction?: ReactNode;
  /** Label for the back button (default "Back") */
  backLabel?: string;
  /** Called when the back chevron is tapped */
  onPressBack?: () => void;
  /** Whether to show the default back chevron button */
  showBack?: boolean;
  /** Whether to show the frosted-glass blur backdrop (iOS only) */
  translucent?: boolean;
  /** Override the container style */
  style?: ViewStyle;
  /** Show hairline border at bottom */
  showBorder?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NAV_HEIGHT = 44;
const IOS_BLUE = "#007AFF";
const SEPARATOR_COLOR = "rgba(60, 60, 67, 0.29)";
const SEPARATOR_DARK = "rgba(255, 255, 255, 0.15)";

// ---------------------------------------------------------------------------
// Back Button
// ---------------------------------------------------------------------------

const BackButton: React.FC<{
  label?: string;
  onPress: () => void;
  color: string;
}> = ({ label = "Back", onPress, color }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.6}
    style={styles.actionBtn}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    accessibilityRole="button"
    accessibilityLabel={"Go back" + (label ? ", " + label : "")}
  >
    {/* iOS chevron — ‹ at 22pt looks exactly like SF Symbols chevron.left */}
    <Text style={[styles.chevron, { color }]}>{"‹"}</Text>
    {label ? (
      <Text style={[styles.actionLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    ) : null}
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const IOSNavBar: React.FC<IOSNavBarProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  backLabel = "Back",
  onPressBack,
  showBack = false,
  translucent = true,
  style,
  showBorder = true,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const totalHeight = insets.top + NAV_HEIGHT;
  const separatorColor = isDark ? SEPARATOR_DARK : SEPARATOR_COLOR;
  const actionColor = IOS_BLUE; // Always system blue per HIG

  // Resolve left slot
  const leftSlot =
    leftAction !== undefined ? (
      leftAction
    ) : showBack && onPressBack ? (
      <BackButton label={backLabel} onPress={onPressBack} color={actionColor} />
    ) : (
      <View style={styles.placeholder} />
    );

  // Resolve right slot
  const rightSlot = rightAction !== undefined ? rightAction : <View style={styles.placeholder} />;

  const backgroundStyle = {
    backgroundColor: isDark
      ? "rgba(28, 28, 30, 0.92)"
      : "rgba(249, 249, 249, 0.92)",
  };

  return (
    <View
      style={[
        styles.wrapper,
        { height: totalHeight },
        !translucent && backgroundStyle,
        style,
      ]}
    >
      {/* Frosted glass — iOS only */}
      {Platform.OS === "ios" && translucent && (
        <BlurView
          tint={isDark ? "dark" : "light"}
          intensity={isDark ? 80 : 70}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Android fallback — solid translucent bg */}
      {Platform.OS !== "ios" && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, backgroundStyle]}
        />
      )}

      {/* Hairline bottom border */}
      {showBorder && (
        <View
          style={[styles.separator, { bottom: 0, backgroundColor: separatorColor }]}
          pointerEvents="none"
        />
      )}

      {/* 3-column bar — sits below the status bar / notch */}
      <View style={[styles.bar, { marginTop: insets.top }]}>
        {/* Left */}
        <View style={styles.sideSlot}>{leftSlot}</View>

        {/* Center */}
        <View style={styles.centerSlot} pointerEvents="none">
          {title ? (
            <>
              <Text
                style={[styles.title, { color: colors.textPrimary }]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {subtitle}
                </Text>
              ) : null}
            </>
          ) : null}
        </View>

        {/* Right */}
        <View style={[styles.sideSlot, styles.rightSlot]}>{rightSlot}</View>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
  },
  bar: {
    height: NAV_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  sideSlot: {
    width: 100,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  rightSlot: {
    alignItems: "flex-end",
  },
  centerSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.41,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: -0.1,
    textAlign: "center",
    marginTop: 1,
  },
  separator: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 44,
    minHeight: 44,
  },
  chevron: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "300",
    // Pixel-perfect iOS chevron weight
    marginRight: 2,
    marginTop: -2,
  },
  actionLabel: {
    fontSize: 17,
    fontWeight: "400",
    letterSpacing: -0.41,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
});
