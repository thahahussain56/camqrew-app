import React from 'react';
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { AuthStack } from './AuthStack';
import { CustomerTabs } from './CustomerTabs';
import { AdminStack } from './AdminStack';

const Stack = createStackNavigator();

import { ProPaywallScreen } from '../screens/professional/ProPaywallScreen';
import { CreateJobScreen } from '../screens/customer/CreateJobScreen';

const MainAppContainer: React.FC = () => {
  const { activeRole, user } = useAuthStore();
  const { colors } = useTheme();

  const isProLocked = activeRole === 'professional' && user?.subscription_status !== 'active';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isProLocked ? (
        <ProPaywallScreen />
      ) : (
        <>
          {(activeRole === 'customer' || activeRole === 'professional') && <CustomerTabs />}
          {activeRole === 'admin' && <AdminStack />}
        </>
      )}
    </View>
  );
};

export const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <Stack.Screen name="MainApp" component={MainAppContainer} />
      )}
    </Stack.Navigator>
  );
};
