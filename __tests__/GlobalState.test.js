import React, { createContext, useContext, useState } from 'react';
import { Text, Button, View } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

// 1. Create a dummy Auth Context and Provider
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState('Guest');
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// 2. Create a component that consumes the Context
const ProfileScreen = () => {
  const { user, setUser } = useContext(AuthContext);
  return (
    <View>
      <Text>Welcome, {user}!</Text>
      <Button title="Login" onPress={() => setUser('Camcrew Admin')} />
    </View>
  );
};

describe('Global State (React Context)', () => {
  it('updates the context state correctly when interacting with the UI', async () => {
    // 3. Render the component WRAPPED inside the Provider
    await render(
      <AuthProvider>
        <ProfileScreen />
      </AuthProvider>
    );

    // 4. Verify the initial default state
    expect(screen.getByText('Welcome, Guest!')).toBeTruthy();

    // 5. Trigger the state change
    fireEvent.press(screen.getByText('Login'));

    // 6. Await findByText to wait for async state re-render
    expect(await screen.findByText('Welcome, Camcrew Admin!')).toBeTruthy();
  });
});