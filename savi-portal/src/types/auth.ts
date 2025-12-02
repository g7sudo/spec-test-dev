/**
 * Authentication and authorization types
 * Matches backend API response structures
 */

// ============================================
// User & Auth Types
// ============================================

/**
 * Tenant membership info for a user
 */
export interface TenantMembership {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  roles: string[];
}

/**
 * Current active scope info
 */
export interface CurrentScope {
  type: 'platform' | 'tenant';
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
}

/**
 * Response from /auth/me endpoint
 * Contains all user info needed for routing and authorization
 */
export interface AuthMeResponse {
  userId: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  globalRoles: string[];
  tenantMemberships: TenantMembership[];
  currentScope: CurrentScope | null;
  permissions: Record<string, boolean>;
}

/**
 * Authenticated user context stored in app state
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  idToken: string;
}

// ============================================
// Auth State Types
// ============================================

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  profile: AuthMeResponse | null;
  error: string | null;
}

// ============================================
// Role & Permission Helpers
// ============================================

// Role codes as returned by backend (UPPERCASE_SNAKE_CASE)
export const PLATFORM_ADMIN_ROLE = 'PLATFORM_ADMIN';
export const TENANT_ADMIN_ROLE = 'COMMUNITY_ADMIN';

/**
 * Checks if user has platform admin role
 * Case-insensitive check to handle variations
 */
export function isPlatformAdmin(profile: AuthMeResponse | null): boolean {
  if (!profile?.globalRoles) return false;
  
  // Check for platform admin role (case-insensitive)
  return profile.globalRoles.some(
    role => role.toUpperCase() === 'PLATFORM_ADMIN' || role.toUpperCase() === 'PLATFORMADMIN'
  );
}

/**
 * Gets the default landing route based on user roles
 */
export function getDefaultLandingRoute(profile: AuthMeResponse): string {
  if (isPlatformAdmin(profile)) {
    return '/platform/dashboard';
  }
  
  // Tenant-only user: go to first tenant
  if (profile.tenantMemberships.length > 0) {
    return `/tenant/${profile.tenantMemberships[0].tenantSlug}/dashboard`;
  }
  
  // No access anywhere
  return '/no-access';
}

