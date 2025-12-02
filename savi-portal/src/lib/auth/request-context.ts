'use client';

/**
 * Request Context Builder
 * Builds the current user context from auth state and URL
 * Used by layout guards to determine access
 */

import { AuthMeResponse, isPlatformAdmin } from '@/types/auth';
import { extractTenantSlug, isPlatformPath } from '@/config/routes';

// ============================================
// Types
// ============================================

export type ScopeType = 'platform' | 'tenant' | 'account' | 'unknown';

export interface RequestContext {
  // User info
  userId: string | null;
  email: string | null;
  displayName: string | null;
  
  // Roles & permissions
  globalRoles: string[];
  permissions: Record<string, boolean>;
  
  // Tenant access
  tenantMemberships: AuthMeResponse['tenantMemberships'];
  
  // Current scope derived from URL
  currentScope: {
    type: ScopeType;
    tenantSlug: string | null;
    tenantId: string | null;
    tenantName: string | null;
  };
  
  // Access flags
  isPlatformAdmin: boolean;
  hasTenantAccess: boolean;
  currentTenantRoles: string[];
}

// ============================================
// Context Builder
// ============================================

/**
 * Builds request context from auth profile and current pathname
 * This is the single source of truth for "who is the user and what can they access"
 */
export function buildRequestContext(
  profile: AuthMeResponse | null,
  pathname: string
): RequestContext {
  // Determine scope from URL
  const scopeType = getScopeType(pathname);
  const tenantSlug = extractTenantSlug(pathname);
  
  // Find tenant membership if in tenant scope
  const tenantMembership = tenantSlug
    ? profile?.tenantMemberships?.find(m => m.tenantSlug === tenantSlug)
    : null;

  return {
    // User info
    userId: profile?.userId || null,
    email: profile?.email || null,
    displayName: profile?.displayName || null,
    
    // Roles & permissions
    globalRoles: profile?.globalRoles || [],
    permissions: profile?.permissions || {},
    
    // Tenant access
    tenantMemberships: profile?.tenantMemberships || [],
    
    // Current scope
    currentScope: {
      type: scopeType,
      tenantSlug: tenantSlug,
      tenantId: tenantMembership?.tenantId || null,
      tenantName: tenantMembership?.tenantName || null,
    },
    
    // Access flags
    isPlatformAdmin: isPlatformAdmin(profile),
    hasTenantAccess: !!tenantMembership,
    currentTenantRoles: tenantMembership?.roles || [],
  };
}

/**
 * Determines the scope type from pathname
 */
function getScopeType(pathname: string): ScopeType {
  if (isPlatformPath(pathname)) return 'platform';
  if (pathname.startsWith('/tenant/')) return 'tenant';
  if (pathname.startsWith('/account')) return 'account';
  return 'unknown';
}

// ============================================
// Permission Helpers
// ============================================

/**
 * Checks if user has a specific permission
 */
export function hasPermission(
  context: RequestContext,
  permission: string
): boolean {
  return context.permissions[permission] === true;
}

/**
 * Checks if user has any of the specified permissions
 */
export function hasAnyPermission(
  context: RequestContext,
  permissions: string[]
): boolean {
  return permissions.some(p => context.permissions[p] === true);
}

/**
 * Checks if user has all of the specified permissions
 */
export function hasAllPermissions(
  context: RequestContext,
  permissions: string[]
): boolean {
  return permissions.every(p => context.permissions[p] === true);
}

/**
 * Checks if user has a specific role in current tenant
 */
export function hasTenantRole(
  context: RequestContext,
  role: string
): boolean {
  return context.currentTenantRoles.some(
    r => r.toUpperCase() === role.toUpperCase()
  );
}

