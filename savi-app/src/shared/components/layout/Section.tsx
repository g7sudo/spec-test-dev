import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/core/theme';
import { Text } from '../ui/Text';

interface SectionProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Section: React.FC<SectionProps> = ({
  title,
  actionText,
  onActionPress,
  children,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text variant="h3" weight="semiBold">
          {title}
        </Text>
        {actionText && onActionPress && (
          <TouchableOpacity onPress={onActionPress}>
            <Text variant="bodySmall" color={theme.colors.primary} weight="medium">
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  content: {},
});

export default Section;
