import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '@/core/theme';

interface CardProps extends Omit<TouchableOpacityProps, 'style'> {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'medium',
  style,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();

  const paddingMap = {
    none: 0,
    small: theme.spacing.sm,
    medium: theme.spacing.md,
    large: theme.spacing.lg,
  };

  const baseStyle: ViewStyle = {
    borderRadius: theme.borderRadius.md,
    padding: paddingMap[padding],
    backgroundColor: theme.colors.card,
  };

  const variantStyles: Record<string, ViewStyle> = {
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    outlined: {
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filled: {
      backgroundColor: theme.colors.surfaceVariant,
    },
  };

  const cardStyle = [baseStyle, variantStyles[variant], style];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

export default Card;
