/**
 * Resident Invite API Service
 * 
 * Handles access code validation and invite acceptance for resident onboarding.
 * 
 * Flow:
 * 1. Validate code (platform level, no auth): GET /api/v1/platform/resident-invites/validate-code
 * 2. Accept invite (tenant level, auth required): POST /api/v1/tenant/resident-invites/accept
 *    - Tenant code passed via X-Tenant-Code header (not in URL)
 * 3. Get profile (tenant level, auth required): GET /api/v1/{tenantCode}/me
 * 
 * Note: ENV.API_BASE_URL should be set to base URL without /v1 (e.g., http://localhost:5024/api)
 * The /v1 is added here in the endpoint paths.
 */

import axios from 'axios';
import { Platform } from 'react-native';
import { ENV } from '@/core/config/env';
import type { ApiError } from './apiClient';
import apiClient from './apiClient';

/**
 * Response from validate-code endpoint (platform level, no auth needed)
 */
export interface ValidateCodeResponse {
  isValid: boolean;
  tenantId?: string;
  tenantCode?: string;
  tenantName?: string;
  inviteId?: string;
  email?: string;
  partyName?: string;
  unitLabel?: string;
  role?: string;
  expiresAt?: string;
  invitationToken?: string;
  errorMessage?: string;
}

/**
 * Request body for accept endpoint (platform level)
 * 
 * Backend expects:
 * {
 *   "accessCode": "3SCDXU",
 *   "invitationToken": "REE1CTYVnAh6SY5fu6a4i8xTokK8VoW2PvT7GwHval8"
 * }
 */
export interface AcceptInviteRequest {
  accessCode: string;
  invitationToken: string;
}

/**
 * Response from accept endpoint (platform level)
 */
export interface AcceptInviteResponse {
  platformUserId: string;
  communityUserId: string;
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  leaseId: string;
  unitLabel: string;
  role: string;
}

/**
 * Response from GET /{tenantCode}/me endpoint
 */
export interface TenantProfileResponse {
  communityUserId: string;
  tenantUserId: string | null;
  partyId: string;
  partyName: string;
  email: string;
  role: string;
  leases: Array<{
    leaseId: string;
    unitLabel: string;
    role: string;
    status: string;
  }>;
  permissions: string[];
}

/**
 * Pending invite data stored in memory after validation
 */
export interface PendingInvite {
  accessCode: string; // Original access code entered by user
  inviteId: string;
  invitationToken: string;
  email: string;
  tenantId: string;
  tenantCode: string; // Can be empty - will be populated from tenant selection
  tenantName: string;
  unitLabel: string;
  role: string;
  partyName: string;
  expiresAt?: string;
}

/**
 * Tests connectivity to the API server by calling the health endpoint
 * Useful for debugging network issues
 */
export async function testApiConnectivity(): Promise<boolean> {
  try {
    // Try to reach the health endpoint (without /api prefix)
    const healthUrl = ENV.API_BASE_URL.replace('/api', '') + '/health';
    console.log('[ResidentInvite API] 🏥 Testing API connectivity:', {
      healthUrl,
      baseURL: ENV.API_BASE_URL,
      platform: Platform.OS,
    });
    
    const response = await axios.get(healthUrl, { timeout: 5000 });
    console.log('[ResidentInvite API] ✅ Health check successful:', {
      status: response.status,
      data: response.data,
    });
    return true;
  } catch (error: any) {
    console.error('[ResidentInvite API] ❌ Health check failed:', {
      error: error.message,
      code: error.code,
      isNetworkError: !error.response,
    });
    return false;
  }
}

/**
 * Validates an access code (6-digit code like ABC123)
 * 
 * Platform-level endpoint - no authentication or tenant code needed.
 * 
 * Backend Endpoint: GET /api/v1/platform/resident-invites/validate-code?code=ABC123
 * - [HttpGet("validate-code")]
 * - [AllowAnonymous]
 * 
 * The response includes tenantCode and invitationToken which MUST be saved
 * for use in the accept invite call.
 * 
 * @param code - The 6-digit access code from email (e.g., "ABC123")
 * @returns Validation response with invite details if valid
 * @throws ApiError if request fails
 * 
 * Response when valid:
 * {
 *   "isValid": true,
 *   "tenantCode": "maple-ridge",        // <-- MUST SAVE THIS
 *   "invitationToken": "76niy6jwba...", // <-- MUST SAVE THIS
 *   ...
 * }
 * 
 * Response when invalid:
 * {
 *   "isValid": false,
 *   "errorMessage": "Invalid access code...",
 *   ...
 * }
 */
export async function validateAccessCode(
  code: string
): Promise<ValidateCodeResponse> {
  // Normalize code: uppercase and trim (matches backend expectations)
  const normalizedCode = code.toUpperCase().trim();
  
  // Construct full URL for logging (apiClient uses baseURL + relative path)
  const url = `${ENV.API_BASE_URL}/v1/platform/resident-invites/validate-code`;
  const fullUrl = `${url}?code=${normalizedCode}`;
  
  console.log('[ResidentInvite API] 🔍 VALIDATE CODE REQUEST:', {
    code: normalizedCode,
    baseURL: ENV.API_BASE_URL,
    endpoint: '/v1/platform/resident-invites/validate-code',
    url,
    fullUrl,
    envApiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'not set',
    platform: Platform.OS,
    isDev: __DEV__,
    timestamp: new Date().toISOString(),
  });

  try {
    // Use apiClient for consistent timeout and error handling
    // Use relative path so apiClient's baseURL is used
    const response = await apiClient.get<ValidateCodeResponse>(
      '/v1/platform/resident-invites/validate-code',
      {
        params: {
          code: normalizedCode,
        },
      }
    );

    console.log('[ResidentInvite API] ✅ VALIDATE CODE RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      isValid: response.data.isValid,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    // Enhanced error logging
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK';
    const isTimeout = error.code === 'ECONNABORTED';
    const isLocalhost = ENV.API_BASE_URL.includes('localhost') || ENV.API_BASE_URL.includes('127.0.0.1');
    
    console.error('[ResidentInvite API] ❌ VALIDATE CODE ERROR:', {
      code: normalizedCode,
      url,
      baseURL: ENV.API_BASE_URL,
      errorType: axios.isAxiosError(error) ? 'AxiosError' : typeof error,
      errorMessage: error.message,
      errorCode: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      isNetworkError,
      isTimeout,
      isLocalhost,
      troubleshooting: isNetworkError && isLocalhost ? {
        note: 'Network error with localhost detected. On physical devices or Android emulator, localhost may not work.',
        platform: Platform.OS,
        currentBaseURL: ENV.API_BASE_URL,
        suggestions: Platform.select({
          ios: [
            'iOS Simulator: 127.0.0.1 should work, but try your Mac\'s IP if it doesn\'t',
            'Physical iOS Device: Use your Mac\'s IP address (e.g., http://192.168.x.x:5024/api)',
            'Find your Mac IP: System Settings > Network > Wi-Fi > Details',
          ],
          android: [
            'Android Emulator: Use 10.0.2.2 instead of 127.0.0.1 or localhost',
            'Physical Android Device: Use your computer\'s IP address (e.g., http://192.168.x.x:5024/api)',
            'Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)',
          ],
          default: [
            'Check if the API server is running on port 5024',
            'Verify EXPO_PUBLIC_API_BASE_URL in .env file',
            'Try accessing http://127.0.0.1:5024/health in a browser',
          ],
        }),
      } : null,
      requestConfig: error.config ? {
        baseURL: error.config.baseURL,
        url: error.config.url,
        params: error.config.params,
        timeout: error.config.timeout,
      } : null,
      timestamp: new Date().toISOString(),
    });

    // Handle axios errors with enhanced error messages
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as any;
      
      // Extract error message from response
      let errorMessage = error.message;
      if (responseData?.errorMessage) {
        errorMessage = responseData.errorMessage;
      } else if (responseData?.error) {
        errorMessage = responseData.error;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      }
      
      const apiError: ApiError = {
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
        originalError: error,
      };
      throw apiError;
    }

    throw error;
  }
}

/**
 * Accepts an invite after Firebase authentication
 * 
 * Backend Endpoint: POST /api/v1/platform/resident-invites/accept
 * 
 * Headers:
 * - Authorization: Bearer <firebase-id-token>
 * 
 * Request Body:
 * {
 *   "accessCode": "3SCDXU",
 *   "invitationToken": "REE1CTYVnAh6SY5fu6a4i8xTokK8VoW2PvT7GwHval8"
 * }
 * 
 * Note: This is a platform-level endpoint (no tenant code needed).
 * 
 * @param accessCode - Access code from validation (e.g., "3SCDXU")
 * @param invitationToken - Invitation token from validation response
 * @param firebaseToken - Firebase ID token from authenticated user
 * @returns Acceptance response with platform user ID, community user ID, tenant details, and lease info
 * @throws ApiError if request fails
 */
export async function acceptInvite(
  accessCode: string,
  invitationToken: string,
  firebaseToken: string
): Promise<AcceptInviteResponse> {
  // Validate accessCode and invitationToken are not empty
  if (!accessCode || accessCode.trim() === '') {
    throw new Error('Access code is required but was empty.');
  }
  if (!invitationToken || invitationToken.trim() === '') {
    throw new Error('Invitation token is required but was empty.');
  }

  // Endpoint is /v1/platform/resident-invites/accept (platform level, no tenant code)
  const url = `${ENV.API_BASE_URL}/v1/platform/resident-invites/accept`;
  
  console.log('[ResidentInvite API] 📝 ACCEPT INVITE REQUEST:', {
    accessCode: accessCode.trim(),
    hasInvitationToken: !!invitationToken,
    tokenLength: invitationToken?.length,
    hasFirebaseToken: !!firebaseToken,
    url,
    baseURL: ENV.API_BASE_URL,
    endpoint: '/v1/platform/resident-invites/accept',
    timestamp: new Date().toISOString(),
  });

  try {
    // Use apiClient for consistent timeout and error handling
    // Endpoint: /v1/platform/resident-invites/accept (platform level)
    const response = await apiClient.post<AcceptInviteResponse>(
      '/v1/platform/resident-invites/accept',
      {
        accessCode: accessCode.trim(),
        invitationToken: invitationToken.trim(),
      } as AcceptInviteRequest,
      {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[ResidentInvite API] ✅ ACCEPT INVITE RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      platformUserId: response.data.platformUserId,
      communityUserId: response.data.communityUserId,
      tenantId: response.data.tenantId,
      tenantCode: response.data.tenantCode,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[ResidentInvite API] ❌ ACCEPT INVITE ERROR:', {
      accessCode: accessCode.trim(),
      url,
      endpoint: '/v1/tenant/resident-invites/accept',
      errorType: axios.isAxiosError(error) ? 'AxiosError' : typeof error,
      errorMessage: error.message,
      errorCode: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
      timestamp: new Date().toISOString(),
    });

    // Handle axios errors with enhanced error messages
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as any;
      
      // Extract error message from response
      let errorMessage = error.message;
      if (responseData?.error) {
        errorMessage = responseData.error;
      } else if (responseData?.errorMessage) {
        errorMessage = responseData.errorMessage;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      }
      
      const apiError: ApiError = {
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
        originalError: error,
      };
      throw apiError;
    }

    throw error;
  }
}

/**
 * Gets user profile and permissions after accepting invite
 * 
 * Tenant-level endpoint - requires authentication and tenant code in URL.
 * 
 * @param firebaseToken - Firebase ID token from authenticated user
 * @param tenantCode - Tenant code (e.g., "maple-ridge")
 * @returns User profile with leases and permissions
 * @throws ApiError if request fails
 */
export async function getTenantProfile(
  firebaseToken: string,
  tenantCode: string
): Promise<TenantProfileResponse> {
  // Validate tenantCode is not empty
  if (!tenantCode || tenantCode.trim() === '') {
    const errorMsg = 'Tenant code is required but was empty. Cannot fetch profile without tenant code.';
    console.error('[ResidentInvite API] ❌ VALIDATION ERROR:', {
      error: errorMsg,
      tenantCode,
      hasFirebaseToken: !!firebaseToken,
      timestamp: new Date().toISOString(),
    });
    throw new Error(errorMsg);
  }

  const trimmedTenantCode = tenantCode.trim();
  const url = `${ENV.API_BASE_URL}/v1/${trimmedTenantCode}/me`;
  
  console.log('[ResidentInvite API] 👤 GET PROFILE REQUEST:', {
    tenantCode: trimmedTenantCode,
    originalTenantCode: tenantCode,
    url,
    baseURL: ENV.API_BASE_URL,
    hasFirebaseToken: !!firebaseToken,
    timestamp: new Date().toISOString(),
  });

  try {
    // Use apiClient for consistent timeout and error handling
    // Use relative path so apiClient's baseURL is used
    // Use trimmed tenantCode to prevent double slashes
    const response = await apiClient.get<TenantProfileResponse>(
      `/v1/${trimmedTenantCode}/me`,
      {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
          'X-Tenant-Code': trimmedTenantCode, // Use trimmed value
        },
      }
    );

    console.log('[ResidentInvite API] ✅ GET PROFILE RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      data: {
        communityUserId: response.data.communityUserId,
        partyName: response.data.partyName,
        email: response.data.email,
        role: response.data.role,
        leasesCount: response.data.leases?.length || 0,
        permissionsCount: response.data.permissions?.length || 0,
      },
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[ResidentInvite API] ❌ GET PROFILE ERROR:', {
      tenantCode: trimmedTenantCode,
      originalTenantCode: tenantCode,
      url,
      errorType: axios.isAxiosError(error) ? 'AxiosError' : typeof error,
      errorMessage: error.message,
      errorCode: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
      timestamp: new Date().toISOString(),
    });

    // Handle axios errors with enhanced error messages
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as any;
      
      // Extract error message from response
      let errorMessage = error.message;
      if (responseData?.error) {
        errorMessage = responseData.error;
      } else if (responseData?.errorMessage) {
        errorMessage = responseData.errorMessage;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      }
      
      const apiError: ApiError = {
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
        originalError: error,
      };
      throw apiError;
    }

    throw error;
  }
}

