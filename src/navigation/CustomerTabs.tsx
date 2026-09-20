import React from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

import { HomeScreen } from '../screens/customer/HomeScreen';
import { ServicesScreen } from '../screens/customer/ServicesScreen';
import { MarketplaceScreen } from '../screens/customer/MarketplaceScreen';
import { CustomerProfileScreen } from '../screens/customer/CustomerProfileScreen';

import { PublicProfileScreen } from '../screens/customer/PublicProfileScreen';
import { BookingScreen } from '../screens/customer/BookingScreen';
import { CreateJobScreen } from '../screens/customer/CreateJobScreen';
import { ProductDetailScreen } from '../screens/customer/ProductDetailScreen';
import { CartScreen } from '../screens/customer/CartScreen';
import { SaleCheckoutScreen } from '../screens/customer/SaleCheckoutScreen';
import { RentalCheckoutScreen } from '../screens/customer/RentalCheckoutScreen';
import { OrderDetailScreen } from '../screens/customer/OrderDetailScreen';
import { SettingsScreen } from '../screens/customer/SettingsScreen';
import { EditProfileScreen } from '../screens/customer/EditProfileScreen';
import { PrimeSubscriptionScreen } from '../screens/customer/PrimeSubscriptionScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { AboutScreen } from '../screens/shared/AboutScreen';
import { ContactScreen } from '../screens/shared/ContactScreen';
import { TermsOfServiceScreen } from '../screens/shared/TermsOfServiceScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { ChatListScreen } from '../screens/shared/ChatListScreen';
import { ChatInfoScreen } from '../screens/shared/ChatInfoScreen';
import { JobReviewScreen } from '../screens/customer/JobReviewScreen';

// Professional Screens (for Creator Dashboard access via Profile)
import { ProfessionalDashboardScreen } from '../screens/professional/ProfessionalDashboardScreen';
import { ProfessionalEditScreen } from '../screens/professional/ProfessionalEditScreen';
import { AvailabilityScreen } from '../screens/professional/AvailabilityScreen';
import { EarningsScreen } from '../screens/professional/EarningsScreen';
import { JobBoardScreen } from '../screens/professional/JobBoardScreen';
import { ReelsFeedScreen } from '../screens/customer/ReelsFeedScreen';
import { useAuthStore } from '../store/authStore';

import { Home, LayoutGrid, ShoppingBag, User, MessageSquare, Briefcase, Film } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ReelsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReelsFeedScreen" component={ReelsFeedScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="CreateJob" component={CreateJobScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatInfo" component={ChatInfoScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="SaleCheckout" component={SaleCheckoutScreen} />
      <Stack.Screen name="RentalCheckout" component={RentalCheckoutScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="JobReview" component={JobReviewScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="ProfessionalEdit" component={ProfessionalEditScreen} />
      <Stack.Screen name="ReelsFeed" component={ReelsFeedScreen} />
      <Stack.Screen name="JobBoardScreen" component={JobBoardScreen} />
      <Stack.Screen name="JobBoard" component={JobBoardScreen} />
    </Stack.Navigator>
  );
}

function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServicesScreen" component={ServicesScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatInfo" component={ChatInfoScreen} />
      <Stack.Screen name="ProfessionalEdit" component={ProfessionalEditScreen} />
      <Stack.Screen name="ReelsFeed" component={ReelsFeedScreen} />
      <Stack.Screen name="JobBoardScreen" component={JobBoardScreen} />
      <Stack.Screen name="JobBoard" component={JobBoardScreen} />
    </Stack.Navigator>
  );
}

function MarketplaceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MarketplaceScreen" component={MarketplaceScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="SaleCheckout" component={SaleCheckoutScreen} />
      <Stack.Screen name="RentalCheckout" component={RentalCheckoutScreen} />
    </Stack.Navigator>
  );
}

// ChatStack removed as Messages is moved to HomeScreen

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PrimeSubscription" component={PrimeSubscriptionScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      
      {/* Professional specific screens */}
      <Stack.Screen name="ProDashboard" component={ProfessionalDashboardScreen} />
      <Stack.Screen name="ProfessionalEdit" component={ProfessionalEditScreen} />
      <Stack.Screen name="Availability" component={AvailabilityScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="JobReview" component={JobReviewScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <Stack.Screen name="CreateJob" component={CreateJobScreen} />
      <Stack.Screen name="JobBoardScreen" component={JobBoardScreen} />
      <Stack.Screen name="JobBoard" component={JobBoardScreen} />
    </Stack.Navigator>
  );
}

const HIDDEN_SCREENS = new Set([
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
]);

const CustomBottomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index];
  const focusedScreenName = getFocusedRouteNameFromRoute(currentRoute) ?? '';

  if (HIDDEN_SCREENS.has(focusedScreenName)) {
    return null;
  }

  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <View style={[styles.tabBarWrapper, { bottom: bottomInset }]} pointerEvents="box-none">
      {/* Outer Floating Island Capsule */}
      <View style={styles.tabBarCapsule}>
        {/* Frosted Dark Acrylic Blur (clipped to capsule border) */}
        <View style={styles.blurClip}>
          <BlurView tint="dark" intensity={95} style={StyleSheet.absoluteFill} />
        </View>

        {/* Top Rim Luminous Hairline Accent */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.06)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topRimHighlight}
        />

        {/* Navigation Items Row */}
        <View style={styles.tabItemsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const isCenterReels = route.name === 'ReelsTab';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            if (isCenterReels) {
              return (
                <TouchableOpacity
                  key={route.key}
                  activeOpacity={0.85}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.centerHeroTabItem}
                >
                  <LinearGradient
                    colors={isFocused ? ['#3fb668', '#10b981'] : ['#18231c', '#0f1611']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.centerHeroButton,
                      isFocused && styles.centerHeroButtonFocused,
                    ]}
                  >
                    <Film
                      size={22}
                      color={isFocused ? '#ffffff' : '#3fb668'}
                      strokeWidth={2.4}
                    />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.centerHeroLabel,
                      { color: isFocused ? '#3fb668' : 'rgba(255, 255, 255, 0.6)' },
                    ]}
                  >
                    Reels
                  </Text>
                </TouchableOpacity>
              );
            }

            // Standard Side Tabs
            let label = 'Tab';
            let IconComponent = Home;

            if (route.name === 'HomeTab') {
              label = 'Creators';
              IconComponent = Home;
            } else if (route.name === 'ExploreTab') {
              label = 'Categories';
              IconComponent = LayoutGrid;
            } else if (route.name === 'MarketplaceTab') {
              label = 'Gear Store';
              IconComponent = ShoppingBag;
            } else if (route.name === 'ProfileTab') {
              label = 'Account';
              IconComponent = User;
            }

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.7}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.standardTabItem}
              >
                <View style={[styles.iconContainer, isFocused && styles.iconContainerFocused]}>
                  <IconComponent
                    size={20}
                    color={isFocused ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'}
                    fill={isFocused ? '#ffffff' : 'transparent'}
                  />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelFocused : styles.tabLabelUnfocused,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                {/* Active Micro-Indicator Dot */}
                <View
                  style={[
                    styles.activeIndicatorDot,
                    { backgroundColor: isFocused ? '#3fb668' : 'transparent' },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export const CustomerTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="ExploreTab" component={ExploreStack} />
      <Tab.Screen name="ReelsTab" component={ReelsStack} />
      <Tab.Screen name="MarketplaceTab" component={MarketplaceStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
  },
  tabBarCapsule: {
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(7, 9, 12, 0.94)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 14,
  },
  blurClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 34,
    overflow: 'hidden',
  },
  topRimHighlight: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1.2,
    borderRadius: 1,
  },
  tabItemsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  standardTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  tabLabel: {
    fontSize: 9.5,
    letterSpacing: 0.2,
    marginTop: 1,
  },
  tabLabelFocused: {
    color: '#ffffff',
    fontWeight: '800',
  },
  tabLabelUnfocused: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '600',
  },
  activeIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  centerHeroTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginTop: -18,
  },
  centerHeroButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(63, 182, 104, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  centerHeroButtonFocused: {
    borderColor: '#6ee7b7',
    borderWidth: 2,
    shadowColor: '#3fb668',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
  },
  centerHeroLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.3,
  },
});
