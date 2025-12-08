import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  style?: ViewStyle;
  inline?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Unable to load. Please try again.',
  onRetry,
  retryText = 'Retry',
  style,
  inline = false,
}) => {
  const { theme } = useTheme();

  if (inline) {
    return (
      <View style={[styles.inlineContainer, style]}>
        <Text variant="bodySmall" color={theme.colors.error}>
          {message}
        </Text>
        {onRetry && (
          <Button
            title={retryText}
            variant="ghost"
            size="small"
            onPress={onRetry}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name="alert-circle-outline"
        size={48}
        color={theme.colors.error}
      />
      <Text variant="h3" style={styles.title}>
        {title}
      </Text>
      <Text
        variant="body"
        color={theme.colors.textSecondary}
        align="center"
        style={styles.message}
      >
        {message}
      </Text>
      {onRetry && (
        <Button
          title={retryText}
          variant="primary"
          onPress={onRetry}
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
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
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

export default ErrorState;
