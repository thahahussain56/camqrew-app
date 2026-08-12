import { act } from '@testing-library/react-native';
import { useThemeStore } from '../src/store/themeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('themeStore', () => {
  beforeEach(async () => {
    await act(async () => {
      useThemeStore.setState({ mode: 'dark' });
    });
    jest.clearAllMocks();
  });

  it('toggles theme mode between dark and light', async () => {
    expect(useThemeStore.getState().mode).toBe('dark');

    await act(async () => {
      await useThemeStore.getState().toggleTheme();
    });
    expect(useThemeStore.getState().mode).toBe('light');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@camcrew_theme', 'light');

    await act(async () => {
      await useThemeStore.getState().toggleTheme();
    });
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@camcrew_theme', 'dark');
  });

  it('sets theme mode explicitly', async () => {
    await act(async () => {
      await useThemeStore.getState().setTheme('light');
    });
    expect(useThemeStore.getState().mode).toBe('light');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@camcrew_theme', 'light');
  });

  it('loads saved theme preference from AsyncStorage', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('light');

    await act(async () => {
      await useThemeStore.getState().loadTheme();
    });
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('handles AsyncStorage load error gracefully', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage failure'));

    await act(async () => {
      await useThemeStore.getState().loadTheme();
    });
    expect(useThemeStore.getState().mode).toBe('dark');
  });
});
