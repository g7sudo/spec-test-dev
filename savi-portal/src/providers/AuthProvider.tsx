'use client';

/**
 * Authentication Provider
 * Manages Firebase auth state and syncs with backend profile
 * 
 * Uses tenant cache to avoid double API calls on tenant pages
 */

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  subscribeToAuthState,
  getIdToken,
  signOut as firebaseSignOut,
  logoutBackend,
  clearLastScope,
} from '@/lib/auth';
import { getCachedTenant, cacheAllTenants, clearTenantCache } from '@/lib/auth/tenant-cache';
import { httpClient, setTokenGetter } from '@/lib/http';
import { useAuthStore } from '@/lib/store/auth-store';
import { useScopeStore } from '@/lib/store/scope-store';
import { AuthMeResponse, AuthUser, getDefaultLandingRoute } from '@/types/auth';
import { ROUTES, extractTenantSlug } from '@/config/routes';

// ============================================
// Constants
// ============================================

const AUTH_ME_ENDPOINT = '/api/v1/platform/auth/me';

// ============================================
// Context
// ============================================

interface AuthContextValue {
  // Sign out and redirect to login
  logout: () => Promise<void>;
  // Refresh profile from backend
  refreshProfile: () => Promise<void>;
  // Get the landing route based on roles
  getLandingRoute: () => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// Provider Component
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setLoading, setAuthenticated, setUnauthenticated, setError, profile } =
    useAuthStore();
  const { setTenantScope, setPlatformScope } = useScopeStore();

  /**
   * Converts Firebase User to our AuthUser type
   */
  const mapFirebaseUser = useCallback(
    async (user: User): Promise<AuthUser> => {
      const idToken = await user.getIdToken();
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        idToken,
      };
    },
    []
  );

  /**
   * Fetches backend profile with scope awareness
   * Uses cached tenant ID if available to avoid double fetch
   */
  const fetchProfileWithScope = useCallback(
    async (): Promise<AuthMeResponse> => {
      // Check URL for tenant scope
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const tenantSlug = extractTenantSlug(pathname);
        
        if (tenantSlug) {
          // Try to get tenant ID from cache first
          const cached = getCachedTenant(tenantSlug);
          
          if (cached) {
            // Cache hit! Single API call with tenant context
            const tenantProfile = await httpClient.get<AuthMeResponse>(AUTH_ME_ENDPOINT, {
              tenantId: cached.tenantId,
            });
            
            // Set scope store
            setTenantScope(cached.tenantId, cached.tenantSlug);
            
            // Update cache with latest memberships
            cacheAllTenants(tenantProfile.tenantMemberships || []);
            
            return tenantProfile;
          }
          
          // Cache miss - need two calls
          // First fetch to get memberships
          const initialProfile = await httpClient.get<AuthMeResponse>(AUTH_ME_ENDPOINT);
          
          // Cache all tenants for future use
          cacheAllTenants(initialProfile.tenantMemberships || []);
          
          // Find tenant ID from memberships
          const membership = initialProfile.tenantMemberships?.find(
            m => m.tenantSlug === tenantSlug
          );
          
          if (membership) {
            // Second fetch with tenant context for correct permissions
            const tenantProfile = await httpClient.get<AuthMeResponse>(AUTH_ME_ENDPOINT, {
              tenantId: membership.tenantId,
            });
            
            // Set scope store
            setTenantScope(membership.tenantId, membership.tenantSlug);
            
            return tenantProfile;
          }
          
          // No membership found - return initial profile (will show unauthorized)
          return initialProfile;
        }
        
        // Platform scope
        if (pathname.startsWith('/platform')) {
          setPlatformScope();
        }
      }
      
      // Platform scope or no URL detection needed - single call
      const platformProfile = await httpClient.get<AuthMeResponse>(AUTH_ME_ENDPOINT);
      
      // Cache tenants for future use
      cacheAllTenants(platformProfile.tenantMemberships || []);
      
      return platformProfile;
    },
    [setTenantScope, setPlatformScope]
  );

  /**
   * Fetches backend profile and sets auth state
   */
  const handleAuthenticatedUser = useCallback(
    async (firebaseUser: User) => {
      try {
        // Map Firebase user
        const authUser = await mapFirebaseUser(firebaseUser);
        
        // Fetch backend profile (scope-aware)
        const profileData = await fetchProfileWithScope();
        
        // Set authenticated state
        setAuthenticated(authUser, profileData);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setError('Failed to load user profile');
      }
    },
    [mapFirebaseUser, fetchProfileWithScope, setAuthenticated, setError]
  );

  /**
   * Subscribes to Firebase auth state changes
   */
  useEffect(() => {
    setLoading();

    // Set up token getter for HTTP client
    setTokenGetter(async () => getIdToken());

    // Subscribe to auth state
    const unsubscribe = subscribeToAuthState(async (user: User | null) => {
      if (user) {
        await handleAuthenticatedUser(user);
      } else {
        setUnauthenticated();
      }
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, [setLoading, setUnauthenticated, handleAuthenticatedUser]);

  /**
   * Logs out user completely
   */
  const logout = useCallback(async () => {
    try {
      // Call backend logout for audit
      await logoutBackend().catch(() => {
        // Ignore backend logout errors
      });
      
      // Sign out from Firebase
      await firebaseSignOut();
      
      // Clear stored scope and tenant cache
      clearLastScope();
      clearTenantCache();
      
      // Clear auth state
      setUnauthenticated();
      
      // Hard redirect to login
      window.location.href = ROUTES.LOGIN;
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect anyway
      window.location.href = ROUTES.LOGIN;
    }
  }, [setUnauthenticated]);

  /**
   * Refreshes profile from backend (uses current scope)
   */
  const refreshProfile = useCallback(async () => {
    try {
      const { tenantId } = useScopeStore.getState();
      const profileData = await httpClient.get<AuthMeResponse>(AUTH_ME_ENDPOINT, {
        tenantId,
      });
      useAuthStore.getState().updateProfile(profileData);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }, []);

  /**
   * Gets the appropriate landing route
   */
  const getLandingRoute = useCallback((): string => {
    if (!profile) return ROUTES.LOGIN;
    return getDefaultLandingRoute(profile);
  }, [profile]);

  const value: AuthContextValue = {
    logout,
    refreshProfile,
    getLandingRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to access auth state from store
 */
export function useAuthState() {
  return useAuthStore();
}
