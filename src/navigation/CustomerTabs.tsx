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

const CustomBottomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index];
  const focusedScreenName = getFocusedRouteNameFromRoute(currentRoute) ?? '';

  if (HIDDEN_SCREENS.has(focusedScreenName)) {
    return null;
  }

  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <View style={[styles.tabBarWrapper, { bottom: bottomInset }]} pointerEvents="box-none">
      {/* Outer Floating Frosted Glass Capsule */}
      <View style={styles.tabBarCapsule}>
        {/* Frosted Dark Glass Acrylic Blur */}
        <View style={styles.blurClip}>
          <BlurView tint="dark" intensity={85} style={StyleSheet.absoluteFill} />
        </View>

        {/* Top Rim Luminous Hairline Highlight */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.10)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topRimHighlight}
        />

        {/* Navigation Items Row */}
        <View style={styles.tabItemsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

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

            let accessibilityLabel = 'Tab';
            let IconComponent = Home;
            let fillActive = false;

            if (route.name === 'HomeTab') {
              accessibilityLabel = 'Creators';
              IconComponent = Home;
              fillActive = true;
            } else if (route.name === 'ExploreTab') {
              accessibilityLabel = 'Categories';
              IconComponent = LayoutGrid;
              fillActive = false;
            } else if (route.name === 'ReelsTab') {
              accessibilityLabel = 'Reels';
              IconComponent = Film;
              fillActive = false;
            } else if (route.name === 'MarketplaceTab') {
              accessibilityLabel = 'Gear Store';
              IconComponent = ShoppingBag;
              fillActive = true;
            } else if (route.name === 'ProfileTab') {
              accessibilityLabel = 'Account';
              IconComponent = User;
              fillActive = true;
            }

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.7}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="tab"
                accessibilityLabel={accessibilityLabel}
                accessibilityState={{ selected: isFocused }}
                style={[
                  styles.tabItem,
                  isFocused && styles.tabItemActive,
                ]}
              >
                <IconComponent
                  size={22}
                  color={isFocused ? '#ffffff' : 'rgba(255, 255, 255, 0.55)'}
                  fill={isFocused && fillActive ? '#ffffff' : 'transparent'}
                  strokeWidth={isFocused ? 2.4 : 1.8}
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
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  tabBarCapsule: {
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(14, 20, 26, 0.65)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  blurClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    overflow: 'hidden',
  },
  topRimHighlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1.2,
    borderRadius: 1,
  },
  tabItemsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
  },
  tabItem: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
