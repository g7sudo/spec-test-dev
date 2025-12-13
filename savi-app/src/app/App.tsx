import React, { useEffect, ErrorInfo, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { StyleSheet, View, Text, Button } from 'react-native';

import { ThemeProvider } from '@/core/theme';
import { i18n } from '@/core/i18n';
import { queryClient } from '@/services/api';
import { RootNavigator } from './navigation';
import { appLogger, logError } from '@/core/logger';
import { ScrollDirectionProvider } from '@/core/contexts/ScrollDirectionContext';
import { PendingInviteProvider } from '@/core/contexts/PendingInviteContext';
import { initializeFirebase, setupAuthStateListener } from '@/services/firebase';
import { usePushNotifications } from '@/core/notifications';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { useIsApiLoading } from '@/state/apiLoadingStore';
import { useAuthStore, useAuthHasHydrated } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { useAppStore } from '@/state/appStore';
import { navigationRef } from '@/core/navigation/navigationRef';
import { CommonActions } from '@react-navigation/native';
import { resetStartupState } from '@/features/startup/hooks/useStartup';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logError('ErrorBoundary', error);
    appLogger.error('Component Stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e53935',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});

const AppContent: React.FC = () => {
  // Track global API loading state
  const isApiLoading = useIsApiLoading();

  /**
   * Initialize push notifications
   * 
   * This hook handles:
   * - Requesting notification permissions
   * - Getting FCM token
   * - Registering device with backend
   * - Handling token refresh
   * - Notification tap handling
   */
  usePushNotifications({
    // Handle notification tap - can be used for navigation
    onNotificationTap: (data) => {
      appLogger.info('[App] Notification tapped with data:', data);
      // TODO: Handle deep linking based on notification data
      // Example: Navigate to specific screen based on notification type
      // if (data.type === 'maintenance') {
      //   navigationRef.navigate('MaintenanceDetails', { id: data.id });
      // }
    },
    // Handle foreground notification received
    onNotificationReceived: (data) => {
      appLogger.info('[App] Notification received in foreground:', data);
      // Notification banner is shown automatically
      // Add custom handling here if needed (e.g., refresh data)
    },
  });

  return (
    <>
      <RootNavigator />
      {/* Global loading overlay - shows when any API call is active */}
      <LoadingOverlay visible={isApiLoading} />
    </>
  );
};

export const App: React.FC = () => {
  // Track if auth listener is set up to prevent duplicates
  const authListenerSetupRef = useRef(false);
  const authHydrated = useAuthHasHydrated();
  
  useEffect(() => {
    appLogger.info('App starting...');

    // Initialize Firebase early in app lifecycle
    try {
      initializeFirebase();
      appLogger.info('Firebase initialized');
    } catch (error) {
      appLogger.error('Firebase initialization failed:', error);
    }

    // Log uncaught JS errors
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      logError('UncaughtJS', error);
      appLogger.error('Fatal:', isFatal);
      originalHandler(error, isFatal);
    });

    return () => {
      ErrorUtils.setGlobalHandler(originalHandler);
    };
  }, []);

  /**
   * Setup Firebase onAuthStateChanged listener
   * 
   * This listener handles cases where:
   * - User signs out from another device
   * - Firebase session expires while app is running
   * - User account is disabled/deleted
   */
  useEffect(() => {
    // Wait for auth store to hydrate before setting up listener
    if (!authHydrated) {
      return;
    }

    // Prevent duplicate listener setup (React Strict Mode / hot reload)
    if (authListenerSetupRef.current) {
      return;
    }
    authListenerSetupRef.current = true;

    appLogger.info('Setting up Firebase auth state listener');

    // Handler for when Firebase detects user should be logged out
    const handleAuthLogout = () => {
      const { isAuthenticated } = useAuthStore.getState();
      
      // Only trigger logout if app thinks user is authenticated
      // This prevents logout during initial app load
      if (!isAuthenticated) {
        appLogger.debug('Auth listener: User not authenticated in store, skipping logout');
        return;
      }

      appLogger.warn('Firebase auth state changed: User signed out - triggering app logout');
      
      // Clear all stores
      useAuthStore.getState().logout();
      useTenantStore.getState().clearTenant();
      useAppStore.getState().setIsAppReady(false);
      
      // Reset startup state so it runs again
      resetStartupState();
      
      // Navigate to splash screen
      if (navigationRef.isReady()) {
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Splash' }],
          })
        );
      }
    };

    // Handler for token refresh (optional - keeps token in sync)
    const handleTokenRefresh = (newToken: string) => {
      const { isAuthenticated, idToken } = useAuthStore.getState();
      
      // Only update if authenticated and token is different
      if (isAuthenticated && newToken && newToken !== idToken) {
        appLogger.debug('Auth listener: Updating stored token');
        useAuthStore.getState().updateToken(newToken);
      }
    };

    // Setup the listener
    const unsubscribe = setupAuthStateListener(handleAuthLogout, handleTokenRefresh);

    // Cleanup on unmount
    return () => {
      appLogger.info('Cleaning up Firebase auth state listener');
      authListenerSetupRef.current = false;
      unsubscribe();
    };
  }, [authHydrated]);

  appLogger.debug('Rendering App component');

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
              <ThemeProvider>
                <ScrollDirectionProvider>
                  <PendingInviteProvider>
                    <AppContent />
                  </PendingInviteProvider>
                </ScrollDirectionProvider>
              </ThemeProvider>
            </I18nextProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
