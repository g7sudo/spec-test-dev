/**
 * Session state store using Zustand
 * Manages session expiry and refresh dialogs
 */

import { create } from 'zustand';

// ============================================
// Store Interface
// ============================================

interface SessionStore {
  // State
  isSessionExpired: boolean;
  isRefreshing: boolean;
  
  // Actions
  setSessionExpired: (expired: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  reset: () => void;
}

// ============================================
// Store Implementation
// ============================================

export const useSessionStore = create<SessionStore>((set) => ({
  // Initial state
  isSessionExpired: false,
  isRefreshing: false,
  
  // Mark session as expired (shows dialog)
  setSessionExpired: (expired) =>
    set({ isSessionExpired: expired }),
  
  // Set refreshing state
  setRefreshing: (refreshing) =>
    set({ isRefreshing: refreshing }),
  
  // Reset session state
  reset: () =>
    set({
      isSessionExpired: false,
      isRefreshing: false,
    }),
}));

// ============================================
// Selectors
// ============================================

export const selectIsSessionExpired = (state: SessionStore) =>
  state.isSessionExpired;

export const selectIsRefreshing = (state: SessionStore) =>
  state.isRefreshing;

