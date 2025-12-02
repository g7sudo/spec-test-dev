'use client';

/**
 * Route Guards
 * Centralized access control logic for layouts
 */

import { RequestContext } from './request-context';
import { ROUTES } from '@/config/routes';

// ============================================
// Guard Result Types
// ============================================

export type GuardResult = 
  | { allowed: true }
  | { allowed: false; redirect: string; reason: GuardFailReason };

export type GuardFailReason = 
  | 'not_authenticated'
  | 'no_platform_access'
  | 'tenant_not_found'
  | 'no_tenant_access';

// ============================================
// Platform Guard
// ============================================

/**
 * Checks if user can access platform scope
 * 
 * Rules:
 * - Must be authenticated
 * - Must have platform admin role
 */
export function requirePlatformAccess(context: RequestContext): GuardResult {
  // Check authentication
  if (!context.userId) {
    return {
      allowed: false,
      redirect: ROUTES.LOGIN,
      reason: 'not_authenticated',
    };
  }
  
  // Check platform admin role
  if (!context.isPlatformAdmin) {
    return {
      allowed: false,
      redirect: '/unauthorized',
      reason: 'no_platform_access',
    };
  }
  
  return { allowed: true };
}

// ============================================
// Tenant Guard
// ============================================

/**
 * Checks if user can access a specific tenant
 * 
 * Rules:
 * - Must be authenticated
 * - Tenant must exist (user must have membership record)
 * - User must be a member of the tenant OR be a platform admin
 */
export function requireTenantAccess(
  context: RequestContext,
  tenantSlug: string
): GuardResult {
  // Check authentication
  if (!context.userId) {
    return {
      allowed: false,
      redirect: ROUTES.LOGIN,
      reason: 'not_authenticated',
    };
  }
  
  // Check if tenant exists in user's memberships
  const membership = context.tenantMemberships.find(
    m => m.tenantSlug === tenantSlug
  );
  
  // Platform admins can access any tenant they have membership to
  // Regular users must be explicit members
  if (!membership) {
    // If platform admin, they might not have explicit membership
    // but can still access - check if tenant exists via API would be needed
    // For now, treat missing membership as "no access"
    return {
      allowed: false,
      redirect: '/unauthorized',
      reason: 'no_tenant_access',
    };
  }
  
  return { allowed: true };
}

// ============================================
// Account Guard
// ============================================

/**
 * Checks if user can access account pages (profile, settings)
 * 
 * Rules:
 * - Must be authenticated
 */
export function requireAuthenticated(context: RequestContext): GuardResult {
  if (!context.userId) {
    return {
      allowed: false,
      redirect: ROUTES.LOGIN,
      reason: 'not_authenticated',
    };
  }
  
  return { allowed: true };
}

// ============================================
// Default Route Helper
// ============================================

/**
 * Gets the appropriate default route for a user
 * Used when redirecting from unauthorized pages
 */
export function getDefaultRoute(context: RequestContext): string {
  // Platform admin goes to platform dashboard
  if (context.isPlatformAdmin) {
    return ROUTES.PLATFORM.DASHBOARD;
  }
  
  // User with tenant access goes to first tenant
  if (context.tenantMemberships.length > 0) {
    return `/tenant/${context.tenantMemberships[0].tenantSlug}/dashboard`;
  }
  
  // No access anywhere
  return '/no-access';
}

