/**
 * Auth module exports
 */

// Firebase utilities
export {
  getFirebaseApp,
  getFirebaseAuth,
  signInWithEmail,
  createUserWithEmail,
  signOut,
  sendPasswordReset,
  getIdToken,
  subscribeToAuthState,
  getCurrentUser,
  getFirebaseErrorMessage,
} from './firebase';

// API functions
export { fetchAuthMe, logoutBackend, fetchProfile } from './api';

// Scope utilities
export {
  buildScopeOptions,
  getCurrentScopeFromPath,
  getScopeDashboardUrl,
  saveLastScope,
  getLastScope,
  clearLastScope,
  hasAccessToTenant,
} from './scope';
export type { ScopeType, ScopeOption } from './scope';

// Tenant cache
export {
  getCachedTenant,
  cacheTenant,
  cacheAllTenants,
  clearTenantCache,
} from './tenant-cache';

// Request context
export {
  buildRequestContext,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasTenantRole,
} from './request-context';
export type { RequestContext } from './request-context';

// Guards
export {
  requirePlatformAccess,
  requireTenantAccess,
  requireAuthenticated,
  getDefaultRoute,
} from './guards';
export type { GuardResult, GuardFailReason } from './guards';

