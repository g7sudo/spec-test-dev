/**
 * Logout Utility
 * 
 * Comprehensive logout function that clears all app state and resets navigation
 * to a fresh state. This ensures a clean logout experience.
 */

import { CommonActions } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/native';
import { signOut as firebaseSignOut } from '@/services/firebase/auth';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { useAppStore } from '@/state/appStore';
import { appLogger } from '@/core/logger';

/**
 * Performs a complete logout:
 * 1. Signs out from Firebase
 * 2. Clears auth store
 * 3. Clears tenant store
 * 4. Resets app store (isAppReady)
 * 5. Resets navigation to Splash screen
 * 
 * @param navigationRef - Navigation container reference for resetting navigation
 * @param clearPendingInvite - Optional function to clear pending invite context
 */
export async function performLogout(
  navigationRef: NavigationContainerRef<any> | null,
  clearPendingInvite?: () => void
): Promise<void> {
  try {
    appLogger.info('Starting logout process...');

    // 1. Sign out from Firebase
    try {
      await firebaseSignOut();
      appLogger.info('Firebase sign out successful');
    } catch (error) {
      appLogger.warn('Firebase sign out error (continuing anyway):', error);
      // Continue with logout even if Firebase sign out fails
    }

    // 2. Clear pending invite context if provided
    if (clearPendingInvite) {
      clearPendingInvite();
      appLogger.info('Pending invite cleared');
    }

    // 3. Clear all stores
    useAuthStore.getState().logout();
    useTenantStore.getState().clearTenant();
    useAppStore.getState().setIsAppReady(false);
    
    appLogger.info('All stores cleared');

    // 4. Reset navigation to Splash screen
    if (navigationRef?.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Splash' }],
        })
      );
      appLogger.info('Navigation reset to Splash screen');
    } else {
      appLogger.warn('Navigation not ready, cannot reset');
    }

    appLogger.info('Logout completed successfully');
  } catch (error) {
    appLogger.error('Error during logout:', error);
    // Even if there's an error, try to reset navigation
    if (navigationRef?.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Splash' }],
        })
      );
    }
    throw error;
  }
}

