/**
 * Profile API Service
 * 
 * Handles user profile-related API calls.
 */

import apiClient from './apiClient';

/**
 * Response from GET /v1/tenant/me/profile endpoint
 */
export interface UserProfileResponse {
  id: string;
  communityUserId: string;
  displayName: string | null;
  aboutMe: string | null;
  profilePhotoDocumentId: string | null;
  profilePhotoUrl: string | null;
  partyName: string | null;
  firstName: string | null;
  lastName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  directoryVisibility: 'Hidden' | 'Block Only' | 'Community';
  showInDirectory: boolean;
  showNameInDirectory: boolean;
  showUnitInDirectory: boolean;
  showPhoneInDirectory: boolean;
  showEmailInDirectory: boolean;
  showProfilePhotoInDirectory: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  notifyMaintenanceUpdates: boolean;
  notifyAmenityBookings: boolean;
  notifyVisitorAtGate: boolean;
  notifyAnnouncements: boolean;
  notifyMarketplace: boolean;
  createdAt: string;
  updatedAt: string | null;
}

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
 * Gets user profile
 * 
 * Backend Endpoint: GET /api/v1/tenant/me/profile
 * 
 * Headers:
 * - Authorization: Bearer <firebase-id-token>
 * - X-Tenant-Id: <tenant-id> (added automatically by apiClient)
 * 
 * @param firebaseToken - Firebase ID token from authenticated user
 * @returns User profile with all details
 * @throws ApiError if request fails
 */
export async function getUserProfile(): Promise<UserProfileResponse> {
  console.log('[Profile API] 👤 GET USER PROFILE REQUEST:', {
    timestamp: new Date().toISOString(),
  });

  try {
    // Authorization and X-Tenant-Id headers are automatically added by apiClient interceptor
    const response = await apiClient.get<UserProfileResponse>(
      '/v1/tenant/me/profile'
    );

    console.log('[Profile API] ✅ GET USER PROFILE RESPONSE:', {
      status: response.status,
      id: response.data.id,
      communityUserId: response.data.communityUserId,
      displayName: response.data.displayName,
      firstName: response.data.firstName,
      lastName: response.data.lastName,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Profile API] ❌ GET USER PROFILE ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Updates user profile
 * 
 * Backend Endpoint: PUT /api/v1/tenant/me/party
 * 
 * Headers (added automatically by apiClient):
 * - Authorization: Bearer <firebase-id-token> (from auth store)
 * - X-Tenant-Id: <tenant-id> (from persisted tenant store)
 * 
 * @param profileData - Profile data to update
 * @returns Update response
 * @throws ApiError if request fails
 */
export async function updateProfile(
  profileData: UpdateProfileRequest
): Promise<UpdateProfileResponse> {
  console.log('[Profile API] 📝 UPDATE PROFILE REQUEST:', {
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    timestamp: new Date().toISOString(),
  });

  try {
    // Authorization and X-Tenant-Id headers are automatically added by apiClient interceptor
    const response = await apiClient.put<UpdateProfileResponse>(
      '/v1/tenant/me/party',
      profileData
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

/**
 * Lease information for a unit
 */
export interface LeaseInfo {
  leaseId: string;
  status: string;
  startDate: string;
  endDate: string;
  role: string;
  isPrimary: boolean;
  moveInDate: string;
  moveOutDate: string | null;
}

/**
 * Resident information for a unit
 */
export interface ResidentInfo {
  partyId: string;
  leasePartyId: string;
  name: string;
  role: string;
  isPrimary: boolean;
  hasAppAccess: boolean;
  profilePhotoUrl: string | null;
}

/**
 * Unit information with lease and residents
 */
export interface UnitInfo {
  unitId: string;
  unitNumber: string;
  blockName: string;
  floorName: string;
  unitTypeName: string;
  areaSqft: number;
  lease: LeaseInfo;
  residents: ResidentInfo[];
}

/**
 * Response from GET /v1/tenant/me/home endpoint
 */
export interface HomeResponse {
  units: UnitInfo[];
}

/**
 * Gets user's home/units information with lease and residents
 * 
 * Backend Endpoint: GET /api/v1/tenant/me/home
 * 
 * Headers (added automatically by apiClient):
 * - Authorization: Bearer <firebase-id-token> (from auth store)
 * - X-Tenant-Id: <tenant-id> (from persisted tenant store)
 * 
 * @returns Home response with units, lease details, and residents
 * @throws ApiError if request fails
 */
export async function getHomeInfo(): Promise<HomeResponse> {
  console.log('[Profile API] 🏠 GET HOME INFO REQUEST:', {
    timestamp: new Date().toISOString(),
  });

  try {
    // Authorization and X-Tenant-Id headers are automatically added by apiClient interceptor
    const response = await apiClient.get<HomeResponse>(
      '/v1/tenant/me/home'
    );

    console.log('[Profile API] ✅ GET HOME INFO RESPONSE:', {
      status: response.status,
      unitsCount: response.data.units?.length || 0,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Profile API] ❌ GET HOME INFO ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

