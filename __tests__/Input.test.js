import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Input } from '../src/components/ui/Input';

describe('Input Component', () => {
  it('calls onChangeText with the correct input when the user types', async () => {
    const mockOnChangeText = jest.fn();
    await render(
      <Input 
        placeholder="Enter your name" 
        onChangeText={mockOnChangeText} 
        value="" 
      />
    );

    const inputElement = screen.getByPlaceholderText('Enter your name');
    fireEvent.changeText(inputElement, 'Camcrew User');

    expect(mockOnChangeText).toHaveBeenCalledWith('Camcrew User');
  });

  it('renders label, error message, and leftIcon correctly', async () => {
    const DummyIcon = <Text testID="left-icon">🔍</Text>;
    await render(
      <Input 
        label="Username" 
        error="Invalid username" 
        leftIcon={DummyIcon} 
        placeholder="Search" 
      />
    );

    expect(screen.getByText('Username')).toBeTruthy();
    expect(screen.getByText('Invalid username')).toBeTruthy();
    expect(screen.getByTestId('left-icon')).toBeTruthy();
  });

  it('renders secureTextEntry password input correctly', async () => {
    await render(
      <Input 
        label="Password" 
        isPassword={true} 
        placeholder="Enter password" 
      />
    );
    expect(screen.getByPlaceholderText('Enter password')).toBeTruthy();
  });
});