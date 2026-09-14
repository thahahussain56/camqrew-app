import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useThemeStore } from './src/store/themeStore';
import { useAuthStore } from './src/store/authStore';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from './src/services/pushRegistrationService';
import * as Linking from 'expo-linking';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// A standard publishable key for test mode. To go live, this would be loaded from env vars.
const STRIPE_PUBLISHABLE_KEY = "pk_test_TYooMQauvdEDq54NiTphI7jx";

export default function App() {
  const { loadTheme, mode } = useThemeStore();
  const { loadAuth, user } = useAuthStore();

  useEffect(() => {
    loadTheme();
    loadAuth();
  }, []);

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync();
    }
  }, [user]);

  const linking = {
    prefixes: [Linking.createURL('/'), 'camcrew://'],
    config: {
      screens: {
        MainApp: {
          screens: {
            Chat: 'chat/:otherUserId',
            Booking: 'booking/:bookingId',
          }
        }
      }
    }
  };

  return (
    <StripeProvider 
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.camcrew.app"
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer linking={linking as any}>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </StripeProvider>
  );
}
