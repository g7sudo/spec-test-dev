import { Theme, ThemeColors, ThemeSpacing, ThemeBorderRadius, ThemeTypography } from './types';

const colors: ThemeColors = {
  // Brand colors - based on UI design (deep navy/indigo)
  primary: '#1A1A2E',
  primaryLight: '#E8E8EB',
  primaryDark: '#0F0F1A',
  secondary: '#6C63FF',

  // Backgrounds
  background: '#F5F5F5',
  backgroundSecondary: '#EEEEEE',
  surface: '#FFFFFF',
  surfaceVariant: '#F8F8F8',
  card: '#FFFFFF',

  // Text
  text: '#1A1A2E',
  textPrimary: '#1A1A2E',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',

  // Status colors
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FFC107',
  warningLight: '#FFF8E1',
  error: '#F44336',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',

  // UI elements
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  divider: '#EEEEEE',
  icon: '#1A1A2E',
  iconSecondary: '#666666',

  // Interactive
  ripple: 'rgba(26, 26, 46, 0.1)',
  highlight: 'rgba(108, 99, 255, 0.1)',

  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#1A1A2E',
  tabBarInactive: '#999999',

  // Status pill colors
  statusPending: '#FFC107',
  statusConfirmed: '#4CAF50',
  statusInProgress: '#2196F3',
  statusCompleted: '#4CAF50',
  statusCancelled: '#9E9E9E',
};

const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius: ThemeBorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

const typography: ThemeTypography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const lightTheme: Theme = {
  mode: 'light',
  colors,
  spacing,
  borderRadius,
  typography,
};
