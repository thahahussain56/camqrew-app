import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../src/components/ui/Button';

describe('Button Component', () => {
  it('renders the correct title', async () => {
    await render(<Button title="Submit" onPress={() => {}} />);
    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('fires the onPress function when tapped', async () => {
    const mockPress = jest.fn();
    await render(<Button title="Click Me" onPress={mockPress} />);
    fireEvent.press(screen.getByText('Click Me'));
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled is true', async () => {
    const mockPress = jest.fn();
    await render(<Button title="Disabled" onPress={mockPress} disabled={true} />);
    fireEvent.press(screen.getByText('Disabled'));
    expect(mockPress).not.toHaveBeenCalled();
  });

  it('renders loading spinner when loading is true', async () => {
    await render(<Button title="Loading Button" onPress={() => {}} loading={true} />);
    expect(screen.queryByText('Loading Button')).toBeNull();
  });

  it('renders button variants correctly (secondary, outline, danger, ghost)', async () => {
    await render(
      <>
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
        <Button title="Outline" variant="outline" onPress={() => {}} />
        <Button title="Danger" variant="danger" onPress={() => {}} />
        <Button title="Ghost" variant="ghost" onPress={() => {}} />
      </>
    );
    expect(screen.getByText('Secondary')).toBeTruthy();
    expect(screen.getByText('Outline')).toBeTruthy();
    expect(screen.getByText('Danger')).toBeTruthy();
    expect(screen.getByText('Ghost')).toBeTruthy();
  });

  it('renders button sizes correctly (sm, lg)', async () => {
    await render(
      <>
        <Button title="Small" size="sm" onPress={() => {}} />
        <Button title="Large" size="lg" onPress={() => {}} />
      </>
    );
    expect(screen.getByText('Small')).toBeTruthy();
    expect(screen.getByText('Large')).toBeTruthy();
  });

  it('renders custom icon alongside text', async () => {
    const DummyIcon = <Text testID="dummy-icon">★</Text>;
    await render(<Button title="With Icon" icon={DummyIcon} onPress={() => {}} />);
    expect(screen.getByTestId('dummy-icon')).toBeTruthy();
    expect(screen.getByText('With Icon')).toBeTruthy();
  });
});