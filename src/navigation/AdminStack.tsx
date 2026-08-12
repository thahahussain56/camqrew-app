import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';

const Stack = createStackNavigator();

export const AdminStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboardMain" component={AdminDashboardScreen} />
    </Stack.Navigator>
  );
};
