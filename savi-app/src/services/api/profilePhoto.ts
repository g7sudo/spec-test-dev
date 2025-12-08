/**
 * Profile Photo API Service
 * 
 * Handles profile photo upload operations using multipart/form-data.
 * Uses React Native's fetch API instead of axios for better FormData support.
 */

import { Platform } from 'react-native';
import { ENV } from '@/core/config/env';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';

/**
 * Profile Photo Upload Request
 * Uses FormData with file field for multipart/form-data upload
 */
export interface UploadProfilePhotoRequest {
  uri: string; // File URI from ImagePicker
  fileName?: string;
  contentType?: string; // MIME type (e.g., 'image/jpeg', 'image/png')
}

/**
 * Profile Photo Upload Response
 */
export interface UploadProfilePhotoResponse {
  documentId: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Uploads profile photo using multipart/form-data
 * 
 * Backend Endpoint: POST /api/v1/tenant/me/profile/photo
 * Content-Type: multipart/form-data
 * Field name: file
 * Max size: 10MB
 * Note: Uses POST instead of PUT for better React Native FormData compatibility
 * 
 * Headers (added automatically by apiClient):
 * - Authorization: Bearer <firebase-id-token>
 * - X-Tenant-Id: <tenant-id>
 * - Content-Type: multipart/form-data (set automatically by FormData)
 * 
 * @param photoData - Photo data with file URI, fileName, and contentType
 * @returns Upload response with document ID and download URL
 * @throws ApiError if request fails
 */
export async function uploadProfilePhoto(
  photoData: UploadProfilePhotoRequest
): Promise<UploadProfilePhotoResponse> {
  const { uri, fileName, contentType } = photoData;

  // Create FormData for multipart/form-data upload
  // React Native FormData format: { uri, type, name }
  // CRITICAL: Ensure URI is properly formatted - expo-image-picker already provides file:// URI
  const formData = new FormData();
  
  // Use the exact format that works with React Native FormData
  // The 'file' field name must match what backend expects (IFormFile file parameter)
  const fileObject = {
    uri: uri, // expo-image-picker already provides file:// URI format
    type: contentType || 'image/jpeg',
    name: fileName || `profile-photo-${Date.now()}.jpg`,
  };
  
  formData.append('file', fileObject as any); // Type assertion needed for React Native FormData format
  
  // Log FormData structure for debugging
  console.log('[Profile Photo API] 📋 FormData structure:', {
    fieldName: 'file',
    fileObject: {
      uri: fileObject.uri.substring(0, 50) + '...',
      type: fileObject.type,
      name: fileObject.name,
    },
  });

  console.log('[Profile Photo API] 📸 UPLOAD PROFILE PHOTO REQUEST:', {
    uri: uri.substring(0, 50) + '...',
    fileName: fileName || 'auto-generated',
    contentType: contentType || 'image/jpeg',
    timestamp: new Date().toISOString(),
  });

  try {
    // Use React Native's fetch API for FormData uploads
    // fetch handles FormData natively and automatically sets Content-Type with boundary
    // This is more reliable than axios for React Native FormData polyfill
    
    // Get auth token and tenant ID
    const idToken = useAuthStore.getState().idToken;
    const currentTenant = useTenantStore.getState().currentTenant;
    
    if (!idToken) {
      throw new Error('Authentication token not available');
    }
    
    if (!currentTenant?.id) {
      throw new Error('Tenant ID not available');
    }

    // Build request URL
    const url = `${ENV.API_BASE_URL}/v1/tenant/me/profile/photo`;
    
    // Set headers - DO NOT set Content-Type manually, fetch will set it with boundary
    const headers: HeadersInit = {
      'Authorization': `Bearer ${idToken}`,
      'X-Tenant-Id': currentTenant.id,
      // Let fetch set Content-Type automatically for FormData
    };

    // IMPORTANT: In React Native, fetch API may not automatically set Content-Type for FormData
    // We need to let React Native handle it, but sometimes it doesn't work correctly
    // Try without explicitly setting Content-Type - React Native should handle it
    // If that doesn't work, we may need to use a different approach
    
    console.log('[Profile Photo API] 📤 Sending FormData via fetch:', {
      url,
      hasFormData: !!formData,
      formDataParts: (formData as any)._parts ? (formData as any)._parts.length : 'unknown',
      headers: {
        ...headers,
        Authorization: 'Bearer ***',
      },
    });

    // Use fetch API with POST method (not PUT)
    // React Native's fetch handles FormData better with POST than PUT
    // DO NOT set Content-Type header - React Native will set it automatically with boundary
    // If we set it manually, it won't include the boundary and backend will reject
    const response = await fetch(url, {
      method: 'POST', // Changed from PUT to POST for better FormData support
      headers, // No Content-Type header - let React Native set it
      body: formData,
    });
    
    // Log the actual Content-Type that was sent (for debugging)
    console.log('[Profile Photo API] 📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
    });

    // Check if response is OK
    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.title || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      console.error('[Profile Photo API] ❌ UPLOAD PROFILE PHOTO ERROR:', {
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        timestamp: new Date().toISOString(),
      });
      
      throw new Error(errorMessage);
    }

    // Parse response
    const responseData: UploadProfilePhotoResponse = await response.json();

    console.log('[Profile Photo API] ✅ UPLOAD PROFILE PHOTO RESPONSE:', {
      status: response.status,
      documentId: responseData.documentId,
      fileName: responseData.fileName,
      contentType: responseData.contentType,
      sizeBytes: responseData.sizeBytes,
      downloadUrl: responseData.downloadUrl.substring(0, 50) + '...',
      timestamp: new Date().toISOString(),
    });

    return responseData;
  } catch (error: any) {
    console.error('[Profile Photo API] ❌ UPLOAD PROFILE PHOTO ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

