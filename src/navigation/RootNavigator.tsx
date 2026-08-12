import React from 'react';
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { AuthStack } from './AuthStack';
import { CustomerTabs } from './CustomerTabs';
import { ProfessionalTabs } from './ProfessionalTabs';
import { AdminStack } from './AdminStack';

const Stack = createStackNavigator();

const MainAppContainer: React.FC = () => {
  const { activeRole } = useAuthStore();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {activeRole === 'customer' && <CustomerTabs />}
      {activeRole === 'professional' && <ProfessionalTabs />}
      {activeRole === 'admin' && <AdminStack />}
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
