import { Theme, ThemeColors, ThemeSpacing, ThemeBorderRadius, ThemeTypography } from './types';

const colors: ThemeColors = {
  // Brand colors
  primary: '#6C63FF',
  primaryLight: '#2A2850',
  primaryDark: '#4A42CC',
  secondary: '#1A1A2E',

  // Backgrounds
  background: '#121212',
  backgroundSecondary: '#1A1A1A',
  surface: '#1E1E1E',
  surfaceVariant: '#2A2A2A',
  card: '#1E1E1E',

  // Text
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  textInverse: '#1A1A2E',

  // Status colors
  success: '#66BB6A',
  successLight: '#1B3A1D',
  warning: '#FFCA28',
  warningLight: '#3D3414',
  error: '#EF5350',
  errorLight: '#3D1C1C',
  info: '#42A5F5',
  infoLight: '#1A2D3D',

  // UI elements
  border: '#333333',
  borderLight: '#2A2A2A',
  divider: '#2A2A2A',
  icon: '#FFFFFF',
  iconSecondary: '#B0B0B0',

  // Interactive
  ripple: 'rgba(108, 99, 255, 0.2)',
  highlight: 'rgba(108, 99, 255, 0.2)',

  // Tab bar
  tabBarBackground: '#1E1E1E',
  tabBarActive: '#6C63FF',
  tabBarInactive: '#808080',

  // Status pill colors
  statusPending: '#FFCA28',
  statusConfirmed: '#66BB6A',
  statusInProgress: '#42A5F5',
  statusCompleted: '#66BB6A',
  statusCancelled: '#757575',
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

export const darkTheme: Theme = {
  mode: 'dark',
  colors,
  spacing,
  borderRadius,
  typography,
};
