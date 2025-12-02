/**
 * Scope management utilities
 * Handles platform vs tenant scope logic
 */

import { AuthMeResponse, TenantMembership, isPlatformAdmin } from '@/types/auth';
import { SESSION_STORAGE_KEY } from '@/config/env';

// ============================================
// Scope Types
// ============================================

export type ScopeType = 'platform' | 'tenant';

export interface ScopeOption {
  type: ScopeType;
  label: string;
  value: string; // 'platform' or tenant slug
  tenantId?: string;
}

// ============================================
// Scope Helpers
// ============================================

/**
 * Builds scope dropdown options from user profile
 * Platform admins get 'Platform' + all tenants
 * Tenant-only users get just their tenants
 */
export function buildScopeOptions(profile: AuthMeResponse): ScopeOption[] {
  const options: ScopeOption[] = [];
  
  // Platform admins get platform option
  if (isPlatformAdmin(profile)) {
    options.push({
      type: 'platform',
      label: 'Platform',
      value: 'platform',
    });
  }
  
  // Add tenant memberships
  for (const membership of profile.tenantMemberships) {
    options.push({
      type: 'tenant',
      label: membership.tenantName,
      value: membership.tenantSlug,
      tenantId: membership.tenantId,
    });
  }
  
  return options;
}

/**
 * Gets the current scope from URL path
 */
export function getCurrentScopeFromPath(pathname: string): ScopeOption | null {
  if (pathname.startsWith('/platform')) {
    return { type: 'platform', label: 'Platform', value: 'platform' };
  }
  
  const tenantMatch = pathname.match(/^\/tenant\/([^/]+)/);
  if (tenantMatch) {
    return {
      type: 'tenant',
      label: tenantMatch[1], // Will be replaced with actual name
      value: tenantMatch[1],
    };
  }
  
  return null;
}

/**
 * Gets the dashboard URL for a scope
 */
export function getScopeDashboardUrl(scope: ScopeOption): string {
  if (scope.type === 'platform') {
    return '/platform/dashboard';
  }
  return `/tenant/${scope.value}/dashboard`;
}

/**
 * Saves the last used scope for session resumption
 */
export function saveLastScope(scope: ScopeOption): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(scope));
  }
}

/**
 * Gets the last used scope (for login redirect)
 */
export function getLastScope(): ScopeOption | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Clears stored scope (on logout)
 */
export function clearLastScope(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

/**
 * Checks if user has access to a specific tenant
 */
export function hasAccessToTenant(
  profile: AuthMeResponse,
  tenantSlug: string
): TenantMembership | undefined {
  return profile.tenantMemberships.find(m => m.tenantSlug === tenantSlug);
}

