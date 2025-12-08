import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ThemeMode } from './types';
import { lightTheme } from './theme-light';
import { darkTheme } from './theme-dark';
import { useAppStore } from '@/state/appStore';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  // Use selector to only subscribe to themeMode, not the whole store
  const themeMode = useAppStore((s) => s.themeMode);

  const theme = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  }, [themeMode, systemColorScheme]);

  const isDark = theme.mode === 'dark';

  // Create stable setThemeMode reference using useCallback
  const setThemeMode = React.useCallback((mode: ThemeMode) => {
    useAppStore.getState().setThemeMode(mode);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      isDark,
    }),
    [theme, themeMode, setThemeMode, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hook to just get theme colors
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

// Convenience hook to just get spacing
export const useThemeSpacing = () => {
  const { theme } = useTheme();
  return theme.spacing;
};
