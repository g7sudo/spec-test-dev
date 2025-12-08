import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-outline',
  title,
  message,
  actionText,
  onAction,
  style,
  compact = false,
}) => {
  const { theme } = useTheme();

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Text variant="body" color={theme.colors.textSecondary}>
          {title}
        </Text>
        {actionText && onAction && (
          <Button
            title={actionText}
            variant="ghost"
            size="small"
            onPress={onAction}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name={icon}
        size={64}
        color={theme.colors.textTertiary}
      />
      <Text variant="h3" style={styles.title}>
        {title}
      </Text>
      {message && (
        <Text
          variant="body"
          color={theme.colors.textSecondary}
          align="center"
          style={styles.message}
        >
          {message}
        </Text>
      )}
      {actionText && onAction && (
        <Button
          title={actionText}
          variant="primary"
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    marginTop: 16,
  },
  message: {
    marginTop: 8,
    paddingHorizontal: 24,
  },
  button: {
    marginTop: 24,
  },
});

export default EmptyState;
