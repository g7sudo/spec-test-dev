import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/core/theme';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyLarge'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'button';

type TextWeight = 'regular' | 'medium' | 'semiBold' | 'bold';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  weight,
  color,
  align,
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const variantStyles = {
    h1: {
      fontSize: theme.typography.fontSize.xxxl,
      fontWeight: '700' as const,
      lineHeight: theme.typography.fontSize.xxxl * theme.typography.lineHeight.tight,
    },
    h2: {
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: '600' as const,
      lineHeight: theme.typography.fontSize.xxl * theme.typography.lineHeight.tight,
    },
    h3: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: '600' as const,
      lineHeight: theme.typography.fontSize.xl * theme.typography.lineHeight.normal,
    },
    body: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: '400' as const,
      lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
    },
    bodyLarge: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '400' as const,
      lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.normal,
    },
    bodySmall: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '400' as const,
      lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
    },
    caption: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '400' as const,
      lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.normal,
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '500' as const,
      lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
    },
    button: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: '600' as const,
      lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.tight,
    },
  };

  const weightStyles = {
    regular: { fontWeight: '400' as const },
    medium: { fontWeight: '500' as const },
    semiBold: { fontWeight: '600' as const },
    bold: { fontWeight: '700' as const },
  };

  return (
    <RNText
      style={[
        { color: color || theme.colors.textPrimary },
        variantStyles[variant],
        weight && weightStyles[weight],
        align && { textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default Text;
