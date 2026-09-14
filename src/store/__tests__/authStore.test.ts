import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types/auth';

const mockUser: User = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  role: 'customer',
  avatar: 'test.jpg',
  subscription_tier: 'free',
  subscription_status: 'active',
  createdAt: new Date().toISOString()
};

describe('authStore', () => {
  beforeEach(async () => {
    // Clear storage before each test
    jest.clearAllMocks();
    
    // Reset the store state to initial
    const { result } = renderHook(() => useAuthStore());
    await act(async () => {
      await result.current.logout();
    });
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.activeRole).toBe('customer');
  });

  it('should handle login and update state & AsyncStorage', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      await result.current.login(mockUser, 'test-token');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('test-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.activeRole).toBe('customer');

    // Verify AsyncStorage was called
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@camcrew_token', 'test-token');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@camcrew_user', JSON.stringify(mockUser));
  });

  it('should handle logout and clear state & AsyncStorage', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Setup initial logged-in state
    await act(async () => {
      await result.current.login(mockUser, 'test-token');
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    // Verify AsyncStorage was cleared
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@camcrew_token');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@camcrew_user');
  });

  it('should handle setActiveRole', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setActiveRole('professional');
    });

    expect(result.current.activeRole).toBe('professional');
  });

  it('should handle updateUser', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      await result.current.login(mockUser, 'test-token');
    });

    act(() => {
      result.current.updateUser({ name: 'Updated Name', subscription_tier: 'pro' });
    });

    expect(result.current.user?.name).toBe('Updated Name');
    expect(result.current.user?.subscription_tier).toBe('pro');
    
    // Verify it saved the updated object to AsyncStorage
    const expectedUser = { ...mockUser, name: 'Updated Name', subscription_tier: 'pro' };
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@camcrew_user', JSON.stringify(expectedUser));
  });
});
