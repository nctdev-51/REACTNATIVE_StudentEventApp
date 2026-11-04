import React, { createContext, useContext, useState, useMemo } from 'react';

export type ThemeMode = 'Sáng' | 'Tối';

export interface ThemePalette {
  mode: ThemeMode;
  isDark: boolean;
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryLight: string;
  cardShadow: string;
  tabBackground: string;
  tabBorder: string;
  inputBackground: string;
  inputBorder: string;
  danger: string;
  success: string;
  starActive: string;
  starInactive: string;
  statusBarStyle: 'dark-content' | 'light-content';
  badgeBackground: string;
}

export const lightTheme: ThemePalette = {
  mode: 'Sáng',
  isDark: false,
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  cardShadow: 'rgba(0, 0, 0, 0.05)',
  tabBackground: '#FFFFFF',
  tabBorder: '#E2E8F0',
  inputBackground: '#FFFFFF',
  inputBorder: '#CBD5E1',
  danger: '#EF4444',
  success: '#10B981',
  starActive: '#FBBF24',
  starInactive: '#CBD5E1',
  statusBarStyle: 'dark-content',
  badgeBackground: '#EFF6FF',
};

export const darkTheme: ThemePalette = {
  mode: 'Tối',
  isDark: true,
  background: '#0B1120',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  border: '#334155',
  borderSubtle: '#243247',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryLight: '#1E3A8A',
  cardShadow: 'rgba(0, 0, 0, 0.6)',
  tabBackground: '#0F172A',
  tabBorder: '#1E293B',
  inputBackground: '#1E293B',
  inputBorder: '#475569',
  danger: '#F87171',
  success: '#34D399',
  starActive: '#FBBF24',
  starInactive: '#475569',
  statusBarStyle: 'light-content',
  badgeBackground: '#1E3A8A',
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  theme: ThemePalette;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const defaultContextValue: ThemeContextType = {
  mode: 'Sáng',
  isDark: false,
  theme: lightTheme,
  toggleTheme: () => {},
  setTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('Sáng');

  const toggleTheme = () => {
    setMode((prev) => (prev === 'Sáng' ? 'Tối' : 'Sáng'));
  };

  const isDark = mode === 'Tối';
  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark,
        theme,
        toggleTheme,
        setTheme: setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  return context || defaultContextValue;
};

export default ThemeContext;
