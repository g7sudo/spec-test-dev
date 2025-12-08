import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme';
import { Text } from '@/shared/components/ui';
import { useStartup } from '../hooks/useStartup';

export const SplashScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isLoading, error, retry } = useStartup();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Logo placeholder */}
      <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
        <Text variant="h1" color={theme.colors.textInverse} weight="bold">
          SAVI
        </Text>
      </View>

      <Text variant="h2" style={styles.title}>
        SAVI
      </Text>
      <Text variant="body" color={theme.colors.textSecondary} style={styles.subtitle}>
        Manage your community
      </Text>

      <View style={styles.loadingContainer}>
        {isLoading && (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        )}
        {error && (
          <View style={styles.errorContainer}>
            <Text variant="body" color={theme.colors.error} align="center">
              {error}
            </Text>
            <Text
              variant="body"
              color={theme.colors.primary}
              style={styles.retryText}
              onPress={retry}
            >
              Tap to retry
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 48,
  },
  loadingContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
  },
  retryText: {
    marginTop: 12,
    textDecorationLine: 'underline',
  },
});

export default SplashScreen;
