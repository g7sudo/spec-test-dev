import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface TenantMembership {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: string;
  unitId: string;
  unitName: string;
}

interface AuthState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // Token
  idToken: string | null;
  setIdToken: (token: string | null) => void;

  // Memberships
  tenantMemberships: TenantMembership[];
  setTenantMemberships: (memberships: TenantMembership[]) => void;

  // Auth state
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  setIsAuthLoading: (loading: boolean) => void;

  // Actions
  login: (user: User, token: string, memberships: TenantMembership[]) => void;
  logout: () => void;
  signOut: () => void; // Alias for logout
  updateToken: (token: string) => void;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      // Token
      idToken: null,
      setIdToken: (token) => set({ idToken: token }),

      // Memberships
      tenantMemberships: [],
      setTenantMemberships: (memberships) => set({ tenantMemberships: memberships }),

      // Auth state
      isAuthenticated: false,
      isAuthLoading: true,
      setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),

      // Actions
      login: (user, token, memberships) =>
        set({
          user,
          idToken: token,
          tenantMemberships: memberships,
          isAuthenticated: true,
          isAuthLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          idToken: null,
          tenantMemberships: [],
          isAuthenticated: false,
          isAuthLoading: false,
        }),

      signOut: () =>
        set({
          user: null,
          idToken: null,
          tenantMemberships: [],
          isAuthenticated: false,
          isAuthLoading: false,
        }),

      updateToken: (token) => set({ idToken: token }),

      // Hydration
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        idToken: state.idToken,
        tenantMemberships: state.tenantMemberships,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.setIsAuthLoading(false);
      },
    }
  )
);

// Selector hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useIdToken = () => useAuthStore((state) => state.idToken);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useTenantMemberships = () => useAuthStore((state) => state.tenantMemberships);
export const useIsAuthLoading = () => useAuthStore((state) => state.isAuthLoading);
export const useAuthHasHydrated = () => useAuthStore((state) => state._hasHydrated);
