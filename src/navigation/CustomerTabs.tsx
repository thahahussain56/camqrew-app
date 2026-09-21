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
import { QuotationSummaryScreen } from '../screens/customer/QuotationSummaryScreen';

// Professional Screens (for Creator Dashboard access via Profile)
import { ProfessionalDashboardScreen } from '../screens/professional/ProfessionalDashboardScreen';
import { ProfessionalEditScreen } from '../screens/professional/ProfessionalEditScreen';
import { AvailabilityScreen } from '../screens/professional/AvailabilityScreen';
import { EarningsScreen } from '../screens/professional/EarningsScreen';
import { JobBoardScreen } from '../screens/professional/JobBoardScreen';
import { ReelsFeedScreen } from '../screens/customer/ReelsFeedScreen';
import { useAuthStore } from '../store/authStore';

import { Home, LayoutGrid, ShoppingBag, User, MessageSquare, Briefcase, Film } from 'lucide-react-native';
import { GlassmorphicTabBar } from '../components/navigation/GlassmorphicTabBar';

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
      <Stack.Screen name="QuotationSummary" component={QuotationSummaryScreen} />
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
      <Stack.Screen name="QuotationSummary" component={QuotationSummaryScreen} />
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
export const CustomerTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassmorphicTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ tabBarLabel: 'Creators' }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreStack}
        options={{ tabBarLabel: 'Categories' }}
      />
      <Tab.Screen
        name="ReelsTab"
        component={ReelsStack}
        options={{ tabBarLabel: 'Reels' }}
      />
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceStack}
        options={{ tabBarLabel: 'Gear Store' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
};
