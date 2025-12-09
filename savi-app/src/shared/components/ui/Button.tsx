import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  leftIcon?: string | React.ReactNode; // Icon name (string) or custom ReactNode
  rightIcon?: string | React.ReactNode; // Icon name (string) or custom ReactNode
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  leftIcon,
  rightIcon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const renderIcon = (iconProp: string | React.ReactNode | undefined, color: string) => {
    if (!iconProp) return null;
    if (typeof iconProp === 'string') {
      return <Ionicons name={iconProp as keyof typeof Ionicons.glyphMap} size={20} color={color} />;
    }
    return iconProp;
  };

  const sizeStyles = {
    small: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
    },
    medium: {
      paddingVertical: theme.spacing.md - 4,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
    },
    large: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.md,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: theme.colors.textInverse,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: theme.colors.textInverse,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
      textColor: theme.colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: theme.colors.primary,
    },
    danger: {
      backgroundColor: theme.colors.error,
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: theme.colors.textInverse,
    },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];
  const isDisabled = disabled || loading;

  // Extract onPress from props to avoid override
  const { onPress: originalOnPress, ...restProps } = props;

  return (
    <TouchableOpacity
      {...restProps}
      style={[
        styles.button,
        currentSize,
        {
          backgroundColor: currentVariant.backgroundColor,
          borderWidth: currentVariant.borderWidth,
          borderColor: currentVariant.borderColor,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      onPress={originalOnPress}
    >
      {loading ? (
        <ActivityIndicator color={currentVariant.textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && (
            <View style={styles.iconLeft}>{renderIcon(leftIcon, currentVariant.textColor)}</View>
          )}
          {icon && iconPosition === 'left' && !leftIcon && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text
            variant="button"
            color={currentVariant.textColor}
            style={size === 'small' && { fontSize: 12 }}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && !rightIcon && (
            <View style={styles.iconRight}>{icon}</View>
          )}
          {rightIcon && (
            <View style={styles.iconRight}>{renderIcon(rightIcon, currentVariant.textColor)}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
