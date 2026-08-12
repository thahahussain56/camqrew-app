import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';

// A sample component that fetches data
const UserProfile = () => {
  const [name, setName] = useState('Loading...');

  useEffect(() => {
    let isMounted = true;
    fetch('https://api.camcrew.com/user')
      .then(res => res.json())
      .then(data => {
        if (isMounted) setName(data.name);
      })
      .catch(() => {
        if (isMounted) setName('Error fetching data');
      });
    return () => { isMounted = false; };
  }, []);

  return <View><Text>{name}</Text></View>;
};

describe('Network Requests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('displays user data after a successful fetch', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ name: 'Alex Designer' }),
      })
    );

    await render(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText('Alex Designer')).toBeTruthy();
    });
  });
});