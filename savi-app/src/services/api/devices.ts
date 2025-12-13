/**
 * Device Registration API Service
 * 
 * Handles device registration for FCM push notifications.
 * Registers device token with backend for notification delivery.
 * 
 * Backend Endpoints:
 * - POST /api/v1/platform/devices/register - Register new device
 * - PUT /api/v1/platform/devices/{deviceId}/token - Update FCM token
 * - DELETE /api/v1/platform/devices/{deviceId} - Unregister device
 * - GET /api/v1/platform/devices - List user's devices
 */

import apiClient from './apiClient';

// ============================================================================
// Types - Match backend DTOs
// ============================================================================

/**
 * Request payload for registering a device
 * Matches: Savi.Application.Platform.Devices.Dtos.RegisterDeviceRequest
 */
export interface RegisterDeviceRequest {
  /** Firebase Cloud Messaging (FCM) device token */
  deviceToken: string;
  /** Unique identifier for the device (from mobile app) */
  deviceId: string;
  /** User-friendly name for the device */
  deviceName?: string;
  /** Platform type: "iOS" or "Android" */
  platform: 'iOS' | 'Android';
  /** Version of the mobile app */
  appVersion?: string;
  /** Operating system version */
  osVersion?: string;
}

/**
 * Response from device registration
 * Matches: Savi.Application.Platform.Devices.Dtos.RegisterDeviceResponse
 */
export interface RegisterDeviceResponse {
  deviceRegistrationId: string;
  deviceId: string;
  isNewRegistration: boolean;
}

/**
 * Request payload for updating device token
 * Matches: Savi.Application.Platform.Devices.Dtos.UpdateDeviceTokenRequest
 */
export interface UpdateDeviceTokenRequest {
  /** The new Firebase Cloud Messaging (FCM) device token */
  deviceToken: string;
  /** Optional updated app version */
  appVersion?: string;
  /** Optional updated OS version */
  osVersion?: string;
}

/**
 * Device info from backend
 * Matches: Savi.Application.Platform.Devices.Dtos.DeviceDto
 */
export interface DeviceDto {
  id: string;
  deviceId: string;
  deviceName?: string;
  platform: string;
  appVersion?: string;
  osVersion?: string;
  lastActiveAt: string;
  createdAt: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Register a device for push notifications
 * 
 * Called on app startup after user is authenticated.
 * If device already exists (by DeviceId), updates the token.
 * 
 * @param request - Device registration data
 * @returns Registration result with device ID
 */
export async function registerDevice(
  request: RegisterDeviceRequest
): Promise<RegisterDeviceResponse> {
  console.log('[Devices API] 📱 Registering device for push notifications:', {
    deviceId: request.deviceId,
    platform: request.platform,
    hasToken: !!request.deviceToken,
  });

  const response = await apiClient.post<RegisterDeviceResponse>(
    '/v1/platform/devices/register',
    request
  );

  console.log('[Devices API] ✅ Device registered:', {
    deviceRegistrationId: response.data.deviceRegistrationId,
    isNewRegistration: response.data.isNewRegistration,
  });

  return response.data;
}

/**
 * Update the FCM token for an existing device
 * 
 * Called when Firebase SDK refreshes the token (happens periodically).
 * 
 * @param deviceId - The unique device identifier
 * @param request - Token update data
 */
export async function updateDeviceToken(
  deviceId: string,
  request: UpdateDeviceTokenRequest
): Promise<void> {
  console.log('[Devices API] 🔄 Updating device token:', {
    deviceId,
    hasNewToken: !!request.deviceToken,
  });

  await apiClient.put(`/v1/platform/devices/${deviceId}/token`, request);

  console.log('[Devices API] ✅ Device token updated');
}

/**
 * Unregister a device from push notifications
 * 
 * Called when user logs out or disables notifications.
 * 
 * @param deviceId - The unique device identifier
 */
export async function unregisterDevice(deviceId: string): Promise<void> {
  console.log('[Devices API] 🗑️ Unregistering device:', { deviceId });

  await apiClient.delete(`/v1/platform/devices/${deviceId}`);

  console.log('[Devices API] ✅ Device unregistered');
}

/**
 * Get all registered devices for the current user
 * 
 * @returns List of registered devices
 */
export async function getMyDevices(): Promise<DeviceDto[]> {
  console.log('[Devices API] 📋 Fetching user devices');

  const response = await apiClient.get<DeviceDto[]>('/v1/platform/devices');

  console.log('[Devices API] ✅ Fetched devices:', {
    count: response.data.length,
  });

  return response.data;
}
