// Theme type definitions

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Brand colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;

  // Backgrounds
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceVariant: string;
  card: string;

  // Text (with aliases)
  text: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // UI elements
  border: string;
  borderLight: string;
  divider: string;
  icon: string;
  iconSecondary: string;

  // Interactive
  ripple: string;
  highlight: string;

  // Specific UI elements
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Status pill colors
  statusPending: string;
  statusConfirmed: string;
  statusInProgress: string;
  statusCompleted: string;
  statusCancelled: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ThemeTypography {
  fontFamily: {
    regular: string;
    medium: string;
    semiBold: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  typography: ThemeTypography;
}
