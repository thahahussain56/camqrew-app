import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../hooks/useTheme';

import { ProfessionalDashboardScreen } from '../screens/professional/ProfessionalDashboardScreen';
import { ProfessionalEditScreen } from '../screens/professional/ProfessionalEditScreen';
import { AvailabilityScreen } from '../screens/professional/AvailabilityScreen';
import { EarningsScreen } from '../screens/professional/EarningsScreen';
import { PublicProfileScreen } from '../screens/customer/PublicProfileScreen';
import { SettingsScreen } from '../screens/customer/SettingsScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { ChatListScreen } from '../screens/shared/ChatListScreen';

import { LayoutDashboard, Calendar, DollarSign, UserCheck, Settings, MessageSquare } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ProDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProDashboard" component={ProfessionalDashboardScreen} />
      <Stack.Screen name="ProfessionalEdit" component={ProfessionalEditScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function ProProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProPublicView" component={PublicProfileScreen} />
      <Stack.Screen name="ProfessionalEdit" component={ProfessionalEditScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

export const ProfessionalTabs: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          backgroundColor: colors.surfaceCard,
          borderRadius: 28,
          borderTopWidth: 0,
          borderWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.18,
          shadowRadius: 18,
          elevation: 10,
        },
        tabBarActiveTintColor: '#fc8019',
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontSize: 9.5,
          fontWeight: '700',
          marginTop: 1,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={ProDashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="MyProfileTab"
        component={ProProfileStack}
        options={{
          tabBarLabel: 'My Studio',
          tabBarIcon: ({ color }) => <UserCheck color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="AvailabilityTab"
        component={AvailabilityScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color }) => <Calendar color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color }) => <DollarSign color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="ProSettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} size={20} />,
        }}
      />
    </Tab.Navigator>
  );
};
