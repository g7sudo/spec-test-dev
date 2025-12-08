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

