/**
 * Profile Settings API Service
 * 
 * Handles app settings, notifications, and privacy settings API calls.
 */

import apiClient from './apiClient';

/**
 * App Settings Response
 */
export interface AppSettingsResponse {
  theme: 'Light' | 'Dark' | 'System';
  biometricEnabled: boolean;
  locale: string;
}

/**
 * App Settings Request
 */
export interface AppSettingsRequest {
  theme: 'Light' | 'Dark' | 'System';
  biometricEnabled: boolean;
  locale: string;
}

/**
 * Notifications Settings Response
 */
export interface NotificationsSettingsResponse {
  pushEnabled: boolean;
  emailEnabled: boolean;
  notifyMaintenanceUpdates: boolean;
  notifyAmenityBookings: boolean;
  notifyVisitorAtGate: boolean;
  notifyAnnouncements: boolean;
  notifyMarketplace: boolean;
}

/**
 * Notifications Settings Request
 */
export interface NotificationsSettingsRequest {
  pushEnabled: boolean;
  emailEnabled: boolean;
  notifyMaintenanceUpdates: boolean;
  notifyAmenityBookings: boolean;
  notifyVisitorAtGate: boolean;
  notifyAnnouncements: boolean;
  notifyMarketplace: boolean;
}

/**
 * Privacy Settings Response
 */
export interface PrivacySettingsResponse {
  directoryVisibility: 'Hidden' | 'BlockOnly' | 'Community';
  showInDirectory: boolean;
  showNameInDirectory: boolean;
  showUnitInDirectory: boolean;
  showPhoneInDirectory: boolean;
  showEmailInDirectory: boolean;
  showProfilePhotoInDirectory: boolean;
}

/**
 * Privacy Settings Request
 */
export interface PrivacySettingsRequest {
  directoryVisibility: 'Hidden' | 'BlockOnly' | 'Community';
  showInDirectory: boolean;
  showNameInDirectory: boolean;
  showUnitInDirectory: boolean;
  showPhoneInDirectory: boolean;
  showEmailInDirectory: boolean;
  showProfilePhotoInDirectory: boolean;
}

/**
 * Gets app settings
 * 
 * Backend Endpoint: GET /api/v1/tenant/me/profile/appsettings
 * 
 * Headers (added automatically by apiClient):
 * - Authorization: Bearer <firebase-id-token>
 * - X-Tenant-Id: <tenant-id>
 */
export async function getAppSettings(): Promise<AppSettingsResponse> {
  console.log('[Profile Settings API] ⚙️ GET APP SETTINGS REQUEST');

  try {
    const response = await apiClient.get<AppSettingsResponse>(
      '/v1/tenant/me/profile/appsettings'
    );

    console.log('[Profile Settings API] ✅ GET APP SETTINGS RESPONSE:', {
      theme: response.data.theme,
      biometricEnabled: response.data.biometricEnabled,
      locale: response.data.locale,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Profile Settings API] ❌ GET APP SETTINGS ERROR:', error.message);
    throw error;
  }
}

/**
 * Updates app settings
 * 
 * Backend Endpoint: PUT /api/v1/tenant/me/profile/appsettings
 */
export async function updateAppSettings(
  settings: AppSettingsRequest
): Promise<AppSettingsResponse> {
  console.log('[Profile Settings API] ⚙️ UPDATE APP SETTINGS REQUEST:', settings);

  try {
    const response = await apiClient.put<AppSettingsResponse>(
      '/v1/tenant/me/profile/appsettings',
      settings
    );

    console.log('[Profile Settings API] ✅ UPDATE APP SETTINGS RESPONSE:', {
      theme: response.data.theme,
      biometricEnabled: response.data.biometricEnabled,
      locale: response.data.locale,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Profile Settings API] ❌ UPDATE APP SETTINGS ERROR:', error.message);
    throw error;
  }
}

/**
 * Gets notifications settings
 * 
 * Backend Endpoint: GET /api/v1/tenant/me/profile/notifications
 */
export async function getNotificationsSettings(): Promise<NotificationsSettingsResponse> {
  console.log('[Profile Settings API] 🔔 GET NOTIFICATIONS SETTINGS REQUEST');

  try {
    const response = await apiClient.get<NotificationsSettingsResponse>(
      '/v1/tenant/me/profile/notifications'
    );

    console.log('[Profile Settings API] ✅ GET NOTIFICATIONS SETTINGS RESPONSE:', {
      pushEnabled: response.data.pushEnabled,
      emailEnabled: response.data.emailEnabled,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Profile Settings API] ❌ GET NOTIFICATIONS SETTINGS ERROR:', error.message);
    throw error;
  }
}

/**
 * Updates notifications settings
 * 
 * Backend Endpoint: PUT /api/v1/tenant/me/profile/notifications
 */
export async function updateNotificationsSettings(
  settings: NotificationsSettingsRequest
): Promise<NotificationsSettingsResponse> {
  console.log('[Profile Settings API] 🔔 UPDATE NOTIFICATIONS SETTINGS REQUEST:', settings);

  try {
    const response = await apiClient.put<NotificationsSettingsResponse>(
      '/v1/tenant/me/profile/notifications',
      settings
    );

    console.log('[Profile Settings API] ✅ UPDATE NOTIFICATIONS SETTINGS RESPONSE:', {
      pushEnabled: response.data.pushEnabled,
      emailEnabled: response.data.emailEnabled,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Profile Settings API] ❌ UPDATE NOTIFICATIONS SETTINGS ERROR:', error.message);
    throw error;
  }
}

/**
 * Gets privacy settings
 * 
 * Backend Endpoint: GET /api/v1/tenant/me/profile/privacy
 */
export async function getPrivacySettings(): Promise<PrivacySettingsResponse> {
  console.log('[Profile Settings API] 🔒 GET PRIVACY SETTINGS REQUEST');

  try {
    const response = await apiClient.get<PrivacySettingsResponse>(
      '/v1/tenant/me/profile/privacy'
    );

    console.log('[Profile Settings API] ✅ GET PRIVACY SETTINGS RESPONSE:', {
      directoryVisibility: response.data.directoryVisibility,
      showInDirectory: response.data.showInDirectory,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Profile Settings API] ❌ GET PRIVACY SETTINGS ERROR:', error.message);
    throw error;
  }
}

/**
 * Updates privacy settings
 * 
 * Backend Endpoint: PUT /api/v1/tenant/me/profile/privacy
 */
export async function updatePrivacySettings(
  settings: PrivacySettingsRequest
): Promise<PrivacySettingsResponse> {
  console.log('[Profile Settings API] 🔒 UPDATE PRIVACY SETTINGS REQUEST:', settings);

  try {
    const response = await apiClient.put<PrivacySettingsResponse>(
      '/v1/tenant/me/profile/privacy',
      settings
    );

    console.log('[Profile Settings API] ✅ UPDATE PRIVACY SETTINGS RESPONSE:', {
      directoryVisibility: response.data.directoryVisibility,
      showInDirectory: response.data.showInDirectory,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Profile Settings API] ❌ UPDATE PRIVACY SETTINGS ERROR:', error.message);
    throw error;
  }
}

