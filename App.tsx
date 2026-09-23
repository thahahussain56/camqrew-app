import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeStripeProvider as StripeProvider } from './src/utils/stripeWrapper';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useThemeStore } from './src/store/themeStore';
import { useAuthStore } from './src/store/authStore';
import { useNotificationStore } from './src/store/notificationStore';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from './src/services/pushRegistrationService';
import { navigationRef, navigate } from './src/navigation/navigationRef';
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

  // Handle push notification registration & realtime notifications stream
  useEffect(() => {
    if (user?.id) {
      registerForPushNotificationsAsync();
      const unsubRealtime = useNotificationStore.getState().subscribeToRealtimeNotifications(user.id);
      useNotificationStore.getState().fetchNotifications(user.id);
      return () => {
        unsubRealtime();
      };
    }
  }, [user?.id]);

  // Handle push notification interactions (tap to open screen) & foreground alerts
  useEffect(() => {
    const handleUrlNavigation = (url?: string) => {
      if (!url) return;
      if (url.includes('chat/')) {
        const parts = url.split('chat/');
        const otherUserId = parts[1]?.split('?')[0];
        if (otherUserId) navigate('Chat', { otherUserId });
      } else if (url.includes('chat?') || url.includes('/chat')) {
        const match = url.match(/userId=([^&?]+)/);
        if (match) {
          navigate('Chat', { otherUserId: match[1] });
        } else {
          navigate('ChatList');
        }
      } else if (url.includes('job_board') || url.includes('jobboard')) {
        navigate('JobBoardScreen');
      } else if (url.includes('booking')) {
        const match = url.match(/(?:booking\/|bookingId=)([^&?]+)/);
        if (match) {
          navigate('Booking', { bookingId: match[1] });
        }
      } else if (url.includes('job_review') || url.includes('jobreview')) {
        const match = url.match(/jobId=([^&?]+)/);
        if (match) {
          navigate('JobReview', { jobId: match[1] });
        }
      }
    };

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response?.notification?.request?.content?.data?.url;
      if (typeof url === 'string') {
        handleUrlNavigation(url);
      }
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      if (user?.id) {
        useNotificationStore.getState().fetchNotifications(user.id);
      }
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [user?.id]);

  const linking = {
    prefixes: [Linking.createURL('/'), 'camcrew://'],
    config: {
      screens: {
        MainApp: {
          screens: {
            HomeTab: {
              screens: {
                Chat: 'chat/:otherUserId',
                Booking: 'booking/:bookingId',
                JobReview: 'job_review',
              },
            },
            JobTab: {
              screens: {
                JobBoardScreen: 'job_board',
              },
            },
          },
        },
      },
    },
  };

  return (
    <StripeProvider 
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.camcrew.app"
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef} linking={linking as any}>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </StripeProvider>
  );
}
