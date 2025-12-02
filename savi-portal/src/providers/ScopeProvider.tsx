'use client';

/**
 * Scope Provider
 * Manages the current scope context (platform vs tenant)
 * 
 * NOTE: Does NOT fetch /auth/me - that's handled by AuthProvider.
 * This provider only:
 * 1. Syncs scope store with URL
 * 2. Provides HTTP client with tenant ID getter
 * 3. Handles scope SWITCH (user changes tenant via dropdown)
 */

import { createContext, useContext, useEffect, useCallback, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useScopeStore } from '@/lib/store/scope-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { setTenantIdGetter, httpClient } from '@/lib/http';
import { extractTenantSlug } from '@/config/routes';
import { AuthMeResponse } from '@/types/auth';

// ============================================
// Constants
// ============================================

const AUTH_ME_ENDPOINT = '/api/v1/platform/auth/me';

// ============================================
// Context
// ============================================

interface ScopeContextValue {
  // Refresh profile for current scope (manual trigger)
  refreshProfileForScope: () => Promise<void>;
  // Get current tenant ID
  getCurrentTenantId: () => string | null;
}

const ScopeContext = createContext<ScopeContextValue | null>(null);

// ============================================
// Provider Component
// ============================================

interface ScopeProviderProps {
  children: ReactNode;
}

export function ScopeProvider({ children }: ScopeProviderProps) {
  const pathname = usePathname();
  const { profile, updateProfile, status } = useAuthStore();
  const { tenantId, setPlatformScope, setTenantScope } = useScopeStore();
  
  // Track the tenant ID that AuthProvider initially set
  // Used to detect when user SWITCHES scope (vs initial load)
  const initialTenantIdRef = useRef<string | null | undefined>(undefined);
  const hasStoredInitialRef = useRef(false);

  /**
   * Sync scope store with URL changes
   * This runs when user navigates within the app
   */
  useEffect(() => {
    const tenantSlug = extractTenantSlug(pathname);
    
    if (tenantSlug && profile) {
      // Find the tenant ID from memberships
      const membership = profile.tenantMemberships?.find(
        m => m.tenantSlug === tenantSlug
      );
      
      if (membership) {
        setTenantScope(membership.tenantId, membership.tenantSlug);
      }
    } else if (pathname.startsWith('/platform')) {
      setPlatformScope();
    }
  }, [pathname, profile, setPlatformScope, setTenantScope]);

  /**
   * Setup tenant ID getter for HTTP client
   */
  useEffect(() => {
    setTenantIdGetter(() => tenantId);
  }, [tenantId]);

  /**
   * Store the initial tenant ID set by AuthProvider
   * Only fetch when user SWITCHES to a different tenant
   */
  useEffect(() => {
    // Skip if not authenticated
    if (status !== 'authenticated' || !profile) return;
    
    // Store initial tenant ID on first run
    if (!hasStoredInitialRef.current) {
      hasStoredInitialRef.current = true;
      initialTenantIdRef.current = tenantId;
      return; // Don't fetch - AuthProvider already did
    }
    
    // Check if tenant actually changed from initial
    if (initialTenantIdRef.current === tenantId) return;
    
    // User switched tenant! Update initial ref and fetch new permissions
    initialTenantIdRef.current = tenantId;
    
    const fetchNewPermissions = async () => {
      try {
        const newProfile = await httpClient.get<AuthMeResponse>(AUTH_ME_ENDPOINT, {
          tenantId,
        });
        updateProfile(newProfile);
      } catch (error) {
        console.error('Failed to refresh profile for scope:', error);
      }
    };
    
    fetchNewPermissions();
  }, [tenantId, status, profile, updateProfile]);

  /**
   * Manual refresh for current scope
   */
  const refreshProfileForScope = useCallback(async () => {
    try {
      const newProfile = await httpClient.get<AuthMeResponse>(AUTH_ME_ENDPOINT, {
        tenantId,
      });
      updateProfile(newProfile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }, [tenantId, updateProfile]);

  /**
   * Get current tenant ID for API calls
   */
  const getCurrentTenantId = useCallback(() => tenantId, [tenantId]);

  const value: ScopeContextValue = {
    refreshProfileForScope,
    getCurrentTenantId,
  };

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useScope(): ScopeContextValue {
  const context = useContext(ScopeContext);
  if (!context) {
    throw new Error('useScope must be used within a ScopeProvider');
  }
  return context;
}

/**
 * Hook to access scope state from store
 */
export function useScopeState() {
  return useScopeStore();
}
