import { useState, useEffect, useRef } from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { useAppStore, useAppHasHydrated } from '@/state/appStore';
import { useAuthStore, useAuthHasHydrated } from '@/state/authStore';
import { useTenantStore, useTenantHasHydrated } from '@/state/tenantStore';
import { checkForUpdate, UpdateResult } from '@/core/update/updateChecker';
import { changeLanguage } from '@/core/i18n';
import { appLogger } from '@/core/logger';

export type StartupResult =
  | 'force_update'
  | 'onboarding'
  | 'auth'
  | 'tenant_select'
  | 'main';

interface UseStartupReturn {
  isLoading: boolean;
  error: string | null;
  result: StartupResult | null;
  retry: () => void;
}

// Module-level flag to prevent re-runs across component remounts
let startupCompleted = false;
let startupRunning = false;

export const useStartup = (): UseStartupReturn => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StartupResult | null>(null);

  // Track if this instance has triggered startup
  const hasTriggeredRef = useRef(false);

  // Zustand hydration status
  const appHydrated = useAppHasHydrated();
  const authHydrated = useAuthHasHydrated();
  const tenantHydrated = useTenantHasHydrated();

  // Run startup effect - only depends on hydration status
  useEffect(() => {
    // Skip if already completed or running
    if (startupCompleted || startupRunning) {
      appLogger.debug('Startup already completed or running, skipping');
      setIsLoading(false);
      return;
    }

    // Skip if this instance already triggered
    if (hasTriggeredRef.current) {
      return;
    }

    // Wait for all stores to hydrate
    if (!appHydrated || !authHydrated || !tenantHydrated) {
      appLogger.debug('Waiting for stores to hydrate', { appHydrated, authHydrated, tenantHydrated });
      return;
    }

    // Mark as triggered and running
    hasTriggeredRef.current = true;
    startupRunning = true;

    const runStartup = async () => {
      appLogger.info('Starting app initialization');

      try {
        setIsLoading(true);
        setError(null);

        // Get current state values
        const { language, onboardingCompleted } = useAppStore.getState();
        const { isAuthenticated, tenantMemberships } = useAuthStore.getState();
        const { currentTenant } = useTenantStore.getState();

        // 1. Apply stored language
        if (language) {
          await changeLanguage(language);
        }

        // 2. Check for force update
        let updateResult: UpdateResult;
        try {
          updateResult = await checkForUpdate();
        } catch (e) {
          appLogger.warn('Update check failed:', e);
          updateResult = { type: 'none', message: '', storeUrl: '' };
        }

        if (updateResult.type === 'force_update') {
          appLogger.info('Force update required');
          setResult('force_update');
          startupCompleted = true;
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'ForceUpdate',
                  params: {
                    message: updateResult.message,
                    storeUrl: updateResult.storeUrl,
                  },
                },
              ],
            })
          );
          return;
        }

        if (updateResult.type === 'soft_update') {
          useAppStore.getState().setSoftUpdateAvailable(true);
        }

        // Helper function to reset navigation with nested state
        const resetToAuth = (screen: string) => {
          appLogger.debug('Resetting navigation to Auth/', screen);
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Auth',
                  state: {
                    index: 0,
                    routes: [{ name: screen }],
                  },
                },
              ],
            })
          );
        };

        // 3. Check onboarding status
        if (!onboardingCompleted) {
          appLogger.info('Navigating to onboarding');
          setResult('onboarding');
          startupCompleted = true;
          resetToAuth('Onboarding');
          return;
        }

        // 4. Check authentication
        if (!isAuthenticated) {
          appLogger.info('Navigating to sign in');
          setResult('auth');
          startupCompleted = true;
          resetToAuth('SignIn');
          return;
        }

        // 5. Check tenant selection
        if (tenantMemberships.length === 0) {
          appLogger.info('No tenant memberships, navigating to NoTenant');
          setResult('tenant_select');
          startupCompleted = true;
          resetToAuth('NoTenant');
          return;
        }

        // If no current tenant or current tenant not in memberships
        const tenantStillValid = currentTenant
          ? tenantMemberships.some((m) => m.tenantId === currentTenant.id)
          : false;

        if (!currentTenant || !tenantStillValid) {
          // If only one membership, auto-select
          if (tenantMemberships.length === 1) {
            const membership = tenantMemberships[0];
            appLogger.info('Auto-selecting single tenant:', membership.tenantName);
            useTenantStore.getState().selectTenant({
              id: membership.tenantId,
              name: membership.tenantName,
              slug: membership.tenantSlug,
            });
          } else {
            appLogger.info('Multiple tenants, navigating to TenantSelect');
            setResult('tenant_select');
            startupCompleted = true;
            resetToAuth('TenantSelect');
            return;
          }
        }

        // 6. All good - go to main app
        appLogger.info('Startup complete, navigating to Main');
        setResult('main');
        startupCompleted = true;
        useAppStore.getState().setIsAppReady(true);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      } catch (e) {
        appLogger.error('Startup error:', e);
        setError('Failed to initialize app. Please try again.');
        startupRunning = false;
      } finally {
        setIsLoading(false);
        startupRunning = false;
      }
    };

    runStartup();
  }, [appHydrated, authHydrated, tenantHydrated, navigation]);

  const retry = () => {
    startupCompleted = false;
    startupRunning = false;
    hasTriggeredRef.current = false;
    setError(null);
    // Force re-run by triggering a state update
    setIsLoading(true);
  };

  return {
    isLoading,
    error,
    result,
    retry,
  };
};

// Reset startup state (useful for logout)
export const resetStartupState = () => {
  startupCompleted = false;
  startupRunning = false;
};

export default useStartup;
