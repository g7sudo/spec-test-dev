/**
 * Route configuration and helper functions for SAVI Portal
 * Centralizes all route definitions to avoid hardcoded strings
 */

// ============================================
// Route Constants
// ============================================

export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  RESET_PASSWORD: '/reset-password',
  
  // Platform routes (for Platform Admins)
  PLATFORM: {
    DASHBOARD: '/platform/dashboard',
    TENANTS: '/platform/tenants',
    USERS: '/platform/users',
  },
  
  // Account routes (shared across scopes)
  ACCOUNT: {
    PROFILE: '/account/profile',
  },
} as const;

// ============================================
// Route Helpers
// ============================================

/**
 * Builds a tenant-scoped route
 * @param tenantSlug - The tenant's unique slug
 * @param path - The path within tenant scope
 */
export function tenantRoute(tenantSlug: string, path: string = '/dashboard'): string {
  return `/tenant/${tenantSlug}${path}`;
}

/**
 * Gets the dashboard route for a tenant
 */
export function tenantDashboard(tenantSlug: string): string {
  return tenantRoute(tenantSlug, '/dashboard');
}

/**
 * Extracts tenant slug from a pathname
 * @returns tenant slug or null if not in tenant scope
 */
export function extractTenantSlug(pathname: string): string | null {
  const match = pathname.match(/^\/tenant\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Checks if a path is in platform scope
 */
export function isPlatformPath(pathname: string): boolean {
  return pathname.startsWith('/platform');
}

/**
 * Checks if a path is in tenant scope
 */
export function isTenantPath(pathname: string): boolean {
  return pathname.startsWith('/tenant/');
}

/**
 * Checks if a path is an auth page (no auth required)
 */
export function isAuthPath(pathname: string): boolean {
  return pathname === ROUTES.LOGIN || pathname === ROUTES.RESET_PASSWORD;
}

