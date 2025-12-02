/**
 * Auth-related API calls
 * Communicates with SAVI backend for user info
 */

import { httpClient } from '@/lib/http';
import { AuthMeResponse } from '@/types/auth';

// ============================================
// API Endpoints
// ============================================

const AUTH_ENDPOINTS = {
  ME: '/api/v1/platform/auth/me',
  LOGOUT: '/api/v1/platform/auth/logout',
  PROFILE: '/api/v1/platform/me/profile',
} as const;

// ============================================
// API Functions
// ============================================

/**
 * Fetches the authenticated user's profile and access info
 * This is the main entry point after Firebase auth
 * 
 * @param tenantId - Optional tenant ID to get tenant-specific permissions
 *                   If null/undefined, returns platform permissions
 */
export async function fetchAuthMe(tenantId?: string | null): Promise<AuthMeResponse> {
  return httpClient.get<AuthMeResponse>(AUTH_ENDPOINTS.ME, {
    tenantId: tenantId || null, // Explicitly pass null for platform scope
  });
}

/**
 * Logs out on the backend (for audit/session cleanup)
 * Frontend should also call Firebase signOut
 */
export async function logoutBackend(): Promise<void> {
  await httpClient.post<void>(AUTH_ENDPOINTS.LOGOUT);
}

/**
 * Fetches the user's profile
 * Same as /auth/me but explicit profile endpoint
 * 
 * @param tenantId - Optional tenant ID for tenant-scoped profile
 */
export async function fetchProfile(tenantId?: string | null): Promise<AuthMeResponse> {
  return httpClient.get<AuthMeResponse>(AUTH_ENDPOINTS.PROFILE, {
    tenantId: tenantId || null,
  });
}
