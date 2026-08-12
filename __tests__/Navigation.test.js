import React from 'react';
import { Button } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';

// Mock @react-navigation/native (the routing library used in camcrew-app)
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

// A navigation component matching React Navigation
const GoToCartButton = () => {
  const navigation = useNavigation();
  return <Button title="View Cart" onPress={() => navigation.navigate('Cart')} />;
};

describe('Navigation Testing', () => {
  it('routes to the cart screen on press', async () => {
    // 1. Set up mock navigate function
    const mockNavigate = jest.fn();
    useNavigation.mockReturnValue({ navigate: mockNavigate });

    // 2. Render component and simulate tap
    await render(<GoToCartButton />);
    fireEvent.press(screen.getByText('View Cart'));

    // 3. Verify app navigated to 'Cart' screen
    expect(mockNavigate).toHaveBeenCalledWith('Cart');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});