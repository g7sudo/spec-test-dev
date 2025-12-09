/**
 * Authentication API Service
 * 
 * Handles authentication-related API calls.
 */

import apiClient from './apiClient';

/**
 * Response from GET /v1/platform/auth/me endpoint
 */
export interface AuthMeResponse {
  userId: string;
  displayName: string | null; // null for new users
  email: string;
  phoneNumber: string | null;
  globalRoles: string[];
  tenantMemberships: Array<{
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    roles: string[];
  }>;
  currentScope: string | null;
  permissions?: Record<string, boolean>; // Platform permissions
}

/**
 * Lease information from tenant auth endpoint
 */
export interface TenantAuthLease {
  leaseId: string;
  unitId: string;
  unitLabel: string;
  role: string;
  isPrimary: boolean;
  status: string;
}

/**
 * Response from GET /v1/tenant/me/auth endpoint
 * 
 * IMPORTANT: Use `communityUserId` (tenant-level) for all app operations.
 * Do NOT use `userId` (platform-level) in the app.
 */
export interface TenantAuthResponse {
  userId: string; // Platform-level user ID (NOT used in app)
  tenantUserId: string; // Tenant-level user ID
  communityUserId: string; // Community user ID (USE THIS ONE - stored as userId in authStore)
  displayName: string | null;
  email: string;
  phoneNumber: string | null;
  tenant: {
    tenantId: string;
    tenantCode?: string; // Optional in case backend doesn't return it
    tenantName: string;
  };
  roles: string[];
  leases: TenantAuthLease[];
  permissions: Record<string, boolean>;
}

/**
 * Gets current user profile and tenant memberships
 * 
 * Backend Endpoint: GET /api/v1/platform/auth/me
 * 
 * Headers:
 * - Authorization: Bearer <firebase-id-token>
 * 
 * @param firebaseToken - Firebase ID token from authenticated user
 * @returns User profile with tenant memberships
 * @throws ApiError if request fails
 */
export async function getAuthMe(firebaseToken: string): Promise<AuthMeResponse> {
  console.log('[Auth API] 👤 GET AUTH ME REQUEST:', {
    hasFirebaseToken: !!firebaseToken,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.get<AuthMeResponse>(
      '/v1/platform/auth/me',
      {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[Auth API] ✅ GET AUTH ME RESPONSE:', {
      status: response.status,
      userId: response.data.userId,
      email: response.data.email,
      tenantMembershipsCount: response.data.tenantMemberships?.length || 0,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Auth API] ❌ GET AUTH ME ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Gets tenant-specific authentication and user data
 * 
 * Backend Endpoint: GET /api/v1/tenant/me/auth
 * 
 * Headers (added automatically by apiClient):
 * - Authorization: Bearer <firebase-id-token> (from auth store)
 * - X-Tenant-Id: <tenant-id> (from tenant store)
 * 
 * @returns Tenant auth response with user data, tenant info, leases, and permissions
 * @throws ApiError if request fails
 */
export async function getTenantAuth(): Promise<TenantAuthResponse> {
  console.log('[Auth API] 🏢 GET TENANT AUTH REQUEST:', {
    timestamp: new Date().toISOString(),
  });

  try {
    // Authorization and X-Tenant-Id headers are automatically added by apiClient interceptor
    const response = await apiClient.get<TenantAuthResponse>(
      '/v1/tenant/me/auth'
    );

    console.log('[Auth API] ✅ GET TENANT AUTH RESPONSE:', {
      status: response.status,
      userId: response.data.userId, // Platform-level (NOT used in app)
      tenantUserId: response.data.tenantUserId,
      communityUserId: response.data.communityUserId, // Tenant-level (USED in app)
      tenantId: response.data.tenant.tenantId,
      tenantCode: response.data.tenant.tenantCode,
      leasesCount: response.data.leases?.length || 0,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Auth API] ❌ GET TENANT AUTH ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

