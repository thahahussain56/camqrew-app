import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

describe('Test Environment Setup', () => {
  it('renders a text component successfully', async () => {
    const { getByText } = await render(<Text>Testing works!</Text>);

    // This checks that the text we rendered actually exists in the virtual DOM
    expect(getByText('Testing works!')).toBeTruthy();
  });
});
