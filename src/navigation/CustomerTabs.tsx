import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
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
import { useAuthStore } from '../store/authStore';

import { Home, LayoutGrid, ShoppingBag, User, MessageSquare, Briefcase } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
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
    </Stack.Navigator>
  );
}

function JobStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="JobBoardScreen" component={JobBoardScreen} />
    </Stack.Navigator>
  );
}

export const CustomerTabs: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { activeRole, user } = useAuthStore();

  const defaultTabBarStyle = {
    position: 'absolute' as const,
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: isDark ? 'rgba(11, 15, 18, 0.65)' : 'rgba(255, 255, 255, 0.65)',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    borderRadius: 28,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
  };

  const getDynamicTabStyle = (route: any) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? '';
    const hiddenScreens = ['ProductDetail', 'Cart', 'SaleCheckout', 'RentalCheckout', 'Chat', 'ChatInfo', 'Booking', 'OrderDetail', 'PublicProfile', 'EditProfile', 'PrimeSubscription', 'CreateJob'];
    if (hiddenScreens.includes(routeName)) {
      return { display: 'none' as const };
    }
    return defaultTabBarStyle;
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: defaultTabBarStyle,
        tabBarBackground: () => (
          <View style={{ flex: 1, borderRadius: 28, overflow: 'hidden' }}>
            <BlurView
              tint={isDark ? 'dark' : 'light'}
              intensity={80}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={({ route }) => ({
          tabBarLabel: 'Creators',
          tabBarIcon: ({ focused, color }) => <Home color={color} size={20} fill={focused ? color : 'transparent'} />,
          tabBarStyle: getDynamicTabStyle(route),
        })}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreStack}
        options={({ route }) => ({
          tabBarLabel: 'Categories',
          tabBarIcon: ({ focused, color }) => <LayoutGrid color={color} size={20} fill={focused ? color : 'transparent'} />,
          tabBarStyle: getDynamicTabStyle(route),
        })}
      />
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceStack}
        options={({ route }) => ({
          tabBarLabel: 'Gear Store',
          tabBarIcon: ({ focused, color }) => <ShoppingBag color={color} size={20} fill={focused ? color : 'transparent'} />,
          tabBarStyle: getDynamicTabStyle(route),
        })}
      />
      {user?.role === 'professional' && (
        <Tab.Screen
          name="JobTab"
          component={JobStack}
          options={({ route }) => ({
            tabBarLabel: 'Job Board',
            tabBarIcon: ({ focused, color }) => <Briefcase color={color} size={20} fill={focused ? color : 'transparent'} />,
            tabBarStyle: getDynamicTabStyle(route),
          })}
        />
      )}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={({ route }) => ({
          tabBarLabel: 'Account',
          tabBarIcon: ({ focused, color }) => <User color={color} size={20} fill={focused ? color : 'transparent'} />,
          tabBarStyle: getDynamicTabStyle(route),
        })}
      />
    </Tab.Navigator>
  );
};
