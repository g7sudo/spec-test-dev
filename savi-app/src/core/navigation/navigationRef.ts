/**
 * Navigation Reference Utility
 * 
 * Provides a global navigation reference that can be accessed from anywhere
 * in the app, useful for navigation operations like logout that need to reset
 * the entire navigation stack.
 */

import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '@/app/navigation/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate to a screen using the global navigation ref
 */
export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

/**
 * Reset navigation stack
 */
export function resetNavigation(routes: Array<{ name: keyof RootStackParamList; params?: any }>) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: routes as never[],
    });
  }
}

