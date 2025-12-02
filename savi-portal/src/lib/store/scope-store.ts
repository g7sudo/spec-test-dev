'use client';

/**
 * Scope state store using Zustand
 * Manages the current scope (platform vs tenant) and tenant ID for API calls
 */

import { create } from 'zustand';

// ============================================
// Types
// ============================================

export type CurrentScopeType = 'platform' | 'tenant';

export interface ScopeState {
  // Current scope type
  scopeType: CurrentScopeType;
  // Current tenant ID (null if platform scope)
  tenantId: string | null;
  // Current tenant slug (null if platform scope)
  tenantSlug: string | null;
}

interface ScopeStore extends ScopeState {
  // Set platform scope
  setPlatformScope: () => void;
  // Set tenant scope
  setTenantScope: (tenantId: string, tenantSlug: string) => void;
  // Clear scope
  clearScope: () => void;
}

// ============================================
// Store Implementation
// ============================================

export const useScopeStore = create<ScopeStore>((set) => ({
  // Initial state - platform scope
  scopeType: 'platform',
  tenantId: null,
  tenantSlug: null,
  
  // Set platform scope
  setPlatformScope: () =>
    set({
      scopeType: 'platform',
      tenantId: null,
      tenantSlug: null,
    }),
  
  // Set tenant scope with ID and slug
  setTenantScope: (tenantId, tenantSlug) =>
    set({
      scopeType: 'tenant',
      tenantId,
      tenantSlug,
    }),
  
  // Clear scope (on logout)
  clearScope: () =>
    set({
      scopeType: 'platform',
      tenantId: null,
      tenantSlug: null,
    }),
}));

// ============================================
// Selectors
// ============================================

export const selectCurrentTenantId = (state: ScopeStore) => state.tenantId;
export const selectScopeType = (state: ScopeStore) => state.scopeType;
export const selectIsInTenantScope = (state: ScopeStore) => state.scopeType === 'tenant';

