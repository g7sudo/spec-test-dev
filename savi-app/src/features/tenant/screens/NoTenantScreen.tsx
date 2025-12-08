import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button } from '@/shared/components';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { usePendingInvite } from '@/core/contexts/PendingInviteContext';
import { signOut as firebaseSignOut } from '@/services/firebase/auth';
import { useAppStore } from '@/state/appStore';
import { navigationRef } from '@/core/navigation/navigationRef';
import { useTranslation } from 'react-i18next';

export const NoTenantScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { clearPendingInvite } = usePendingInvite();

  const handleLogout = async () => {
    try {
      // 1. Sign out from Firebase
      try {
        await firebaseSignOut();
      } catch (error) {
        console.warn('Firebase sign out error:', error);
        // Continue with logout even if Firebase sign out fails
      }

      // 2. Clear pending invite context
      clearPendingInvite();

      // 3. Clear all stores
      useAuthStore.getState().logout();
      useTenantStore.getState().clearTenant();
      useAppStore.getState().setIsAppReady(false);

      // 4. Reset navigation to Splash screen
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Splash' }],
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Even on error, try to clear state and reset navigation
      useAuthStore.getState().logout();
      useTenantStore.getState().clearTenant();
      useAppStore.getState().setIsAppReady(false);
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Splash' }],
        });
      }
    }
  };

  const handleRefresh = () => {
    // TODO: Refresh tenant memberships from API
    console.log('Refresh memberships');
  };

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.container}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.warningLight },
          ]}
        >
          <Ionicons
            name="home-outline"
            size={64}
            color={theme.colors.warning}
          />
        </View>

        <Text variant="h2" align="center" style={styles.title}>
          {t('tenant.noLinkedCommunity')}
        </Text>

        <Text
          variant="body"
          color={theme.colors.textSecondary}
          align="center"
          style={styles.description}
        >
          {t('tenant.noLinkedCommunityDescription')}
        </Text>

        <View style={styles.steps}>
          <View style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Text variant="bodySmall" color={theme.colors.primary} weight="bold">
                1
              </Text>
            </View>
            <Text variant="body" style={styles.stepText}>
              {t('tenant.step1')}
            </Text>
          </View>
          <View style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Text variant="bodySmall" color={theme.colors.primary} weight="bold">
                2
              </Text>
            </View>
            <Text variant="body" style={styles.stepText}>
              {t('tenant.step2')}
            </Text>
          </View>
          <View style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Text variant="bodySmall" color={theme.colors.primary} weight="bold">
                3
              </Text>
            </View>
            <Text variant="body" style={styles.stepText}>
              {t('tenant.step3')}
            </Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <Button
            title={t('refresh')}
            variant="primary"
            size="large"
            fullWidth
            onPress={handleRefresh}
            leftIcon="refresh"
          />
          <Button
            title={t('logout', { ns: 'auth' })}
            variant="outline"
            size="large"
            fullWidth
            onPress={handleLogout}
            leftIcon="log-out-outline"
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  steps: {
    alignSelf: 'stretch',
    gap: 16,
    marginBottom: 48,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
  },
  buttons: {
    alignSelf: 'stretch',
    gap: 12,
  },
});

export default NoTenantScreen;
