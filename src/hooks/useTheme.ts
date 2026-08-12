import { useThemeStore } from '../store/themeStore';

export const useTheme = () => {
  const { mode, colors, toggleTheme, setTheme } = useThemeStore();
  return {
    mode,
    colors,
    isDark: mode === 'dark',
    toggleTheme,
    setTheme,
  };
};
