/**
 * Global API Loading State Store
 * 
 * Tracks active API calls at the middleware level.
 * Used to show loading indicators and disable buttons globally.
 */

import { create } from 'zustand';

interface ApiLoadingState {
  activeRequests: number;
  isLoading: boolean;
  incrementRequest: () => void;
  decrementRequest: () => void;
  reset: () => void;
}

/**
 * Global store for tracking active API requests
 * 
 * Usage:
 * - apiClient interceptors call incrementRequest() on request start
 * - apiClient interceptors call decrementRequest() on request end (success or error)
 * - Components can use useIsApiLoading() to check if any API call is active
 */
export const useApiLoadingStore = create<ApiLoadingState>((set) => ({
  activeRequests: 0,
  isLoading: false,
  
  incrementRequest: () => {
    set((state) => {
      const newCount = state.activeRequests + 1;
      return {
        activeRequests: newCount,
        isLoading: newCount > 0,
      };
    });
  },
  
  decrementRequest: () => {
    set((state) => {
      const newCount = Math.max(0, state.activeRequests - 1);
      return {
        activeRequests: newCount,
        isLoading: newCount > 0,
      };
    });
  },
  
  reset: () => {
    set({
      activeRequests: 0,
      isLoading: false,
    });
  },
}));

/**
 * Hook to check if any API call is currently active
 */
export const useIsApiLoading = () => useApiLoadingStore((state) => state.isLoading);

/**
 * Hook to get the count of active API requests
 */
export const useActiveApiRequests = () => useApiLoadingStore((state) => state.activeRequests);

