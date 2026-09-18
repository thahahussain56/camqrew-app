import { useSafeAreaInsets } from "react-native-safe-area-context";

const NAV_BAR_HEIGHT = 44;

/**
 * Returns the total height of the IOSNavBar (safe area top inset + 44pt bar).
 * Use this as contentContainerStyle={{ paddingTop: navBarHeight }} on
 * ScrollViews that sit under an absolute-positioned IOSNavBar.
 */
export function useNavBarHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.top + NAV_BAR_HEIGHT;
}
