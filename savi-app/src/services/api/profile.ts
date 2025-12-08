/**
 * Profile API Service
 * 
 * Handles user profile-related API calls.
 */

import apiClient from './apiClient';

/**
 * Request body for updating user profile
 */
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Format: "YYYY-MM-DD"
  phoneNumber: string;
  email: string;
}

/**
 * Response from PUT /v1/tenant/me/party endpoint
 */
export interface UpdateProfileResponse {
  success: boolean;
  message?: string;
}

/**
 * Updates user profile (for newly signed up users)
 * 
 * Backend Endpoint: PUT /api/v1/tenant/me/party
 * 
 * Headers:
 * - Authorization: Bearer <firebase-id-token>
 * - X-Tenant-Id: <tenant-id>
 * 
 * @param profileData - Profile data to update
 * @param firebaseToken - Firebase ID token from authenticated user
 * @param tenantId - Tenant ID from accept invite response
 * @returns Update response
 * @throws ApiError if request fails
 */
export async function updateProfile(
  profileData: UpdateProfileRequest,
  firebaseToken: string,
  tenantId: string
): Promise<UpdateProfileResponse> {
  console.log('[Profile API] 📝 UPDATE PROFILE REQUEST:', {
    tenantId,
    hasFirebaseToken: !!firebaseToken,
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.put<UpdateProfileResponse>(
      '/v1/tenant/me/party',
      profileData,
      {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
          'X-Tenant-Id': tenantId,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[Profile API] ✅ UPDATE PROFILE RESPONSE:', {
      status: response.status,
      success: response.data.success,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Profile API] ❌ UPDATE PROFILE ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

