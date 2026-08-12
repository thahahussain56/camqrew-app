import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, LightTheme, ThemeTokens } from '../constants/theme';

interface ThemeState {
  mode: 'dark' | 'light';
  colors: ThemeTokens;
  toggleTheme: () => void;
  setTheme: (mode: 'dark' | 'light') => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  colors: DarkTheme,
  toggleTheme: async () => {
    const nextMode = get().mode === 'dark' ? 'light' : 'dark';
    const nextColors = nextMode === 'dark' ? DarkTheme : LightTheme;
    set({ mode: nextMode, colors: nextColors });
    await AsyncStorage.setItem('@camcrew_theme', nextMode);
  },
  setTheme: async (mode: 'dark' | 'light') => {
    const nextColors = mode === 'dark' ? DarkTheme : LightTheme;
    set({ mode, colors: nextColors });
    await AsyncStorage.setItem('@camcrew_theme', mode);
  },
  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem('@camcrew_theme');
      if (saved === 'light' || saved === 'dark') {
        set({ mode: saved, colors: saved === 'dark' ? DarkTheme : LightTheme });
      }
    } catch (e) {
      console.warn('Failed to load theme preference');
    }
  },
}));
