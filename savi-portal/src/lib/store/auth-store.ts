/**
 * Authentication state store using Zustand
 * Manages Firebase auth state and backend profile
 */

import { create } from 'zustand';
import { AuthMeResponse, AuthUser, AuthStatus } from '@/types/auth';

// ============================================
// Store Interface
// ============================================

interface AuthStore {
  // State
  status: AuthStatus;
  user: AuthUser | null;
  profile: AuthMeResponse | null;
  error: string | null;
  
  // Actions
  setLoading: () => void;
  setAuthenticated: (user: AuthUser, profile: AuthMeResponse) => void;
  setUnauthenticated: () => void;
  setError: (error: string) => void;
  updateProfile: (profile: AuthMeResponse) => void;
  clearError: () => void;
}

// ============================================
// Store Implementation
// ============================================

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  status: 'loading',
  user: null,
  profile: null,
  error: null,
  
  // Set loading state (while checking auth)
  setLoading: () =>
    set({ status: 'loading', error: null }),
  
  // Set authenticated with user and profile
  setAuthenticated: (user, profile) =>
    set({
      status: 'authenticated',
      user,
      profile,
      error: null,
    }),
  
  // Clear auth state (logout)
  setUnauthenticated: () =>
    set({
      status: 'unauthenticated',
      user: null,
      profile: null,
      error: null,
    }),
  
  // Set error state
  setError: (error) =>
    set({ error, status: 'unauthenticated' }),
  
  // Update just the profile (after edit)
  updateProfile: (profile) =>
    set((state) => ({
      ...state,
      profile,
    })),
  
  // Clear error
  clearError: () =>
    set({ error: null }),
}));

// ============================================
// Selectors
// ============================================

/**
 * Selects just the auth status
 */
export const selectAuthStatus = (state: AuthStore) => state.status;

/**
 * Selects the authenticated user
 */
export const selectUser = (state: AuthStore) => state.user;

/**
 * Selects the user profile
 */
export const selectProfile = (state: AuthStore) => state.profile;

/**
 * Checks if user is authenticated
 */
export const selectIsAuthenticated = (state: AuthStore) =>
  state.status === 'authenticated' && state.user !== null;

