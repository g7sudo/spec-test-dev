import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color }) => {
  const { theme } = useTheme();
  return <Ionicons name={name} size={size} color={color || theme.colors.icon} />;
};

export default Icon;
