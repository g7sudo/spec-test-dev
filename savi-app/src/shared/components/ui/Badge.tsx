import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/core/theme';
import { Text } from './Text';

type BadgeSize = 'small' | 'medium' | 'large';
type BadgeVariant = 'solid' | 'outline';

export interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  size?: BadgeSize;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color,
  backgroundColor,
  size = 'medium',
  variant = 'solid',
  style,
}) => {
  const { theme } = useTheme();

  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 10,
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 12,
    },
    large: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 14,
    },
  };

  const currentSize = sizeStyles[size];
  const bgColor = backgroundColor || color || theme.colors.primary;
  const textColor = variant === 'solid' ? '#FFFFFF' : bgColor;
  const borderColor = bgColor;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variant === 'solid' ? bgColor : 'transparent',
          borderColor: borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
        style,
      ]}
    >
      <Text
        variant="caption"
        weight="semiBold"
        color={textColor}
        style={{ fontSize: currentSize.fontSize }}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
});

export default Badge;
