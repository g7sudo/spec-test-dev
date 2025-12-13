/**
 * Push Notification Service
 * 
 * Handles FCM token generation, permissions, and notification events.
 * Uses expo-notifications which internally uses FCM for Android and APNs for iOS.
 * 
 * Key Features:
 * - Get native FCM/APNs push token (not Expo token)
 * - Request notification permissions
 * - Handle foreground notification display
 * - Listen for token refresh events
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { appLogger } from '@/core/logger';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configure how notifications appear when app is in foreground
 * This determines if a notification banner shows when the app is open
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // Show notification banner
    shouldPlaySound: true,    // Play notification sound
    shouldSetBadge: true,     // Update app badge count
    shouldShowBanner: true,   // Show banner (iOS 15+)
    shouldShowList: true,     // Show in notification center
  }),
});

// ============================================================================
// Types
// ============================================================================

export interface PushTokenResult {
  /** The FCM token (Android) or APNs token (iOS) */
  token: string;
  /** Token type: 'android' for FCM, 'ios' for APNs */
  type: 'android' | 'ios';
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

// ============================================================================
// Permission Functions
// ============================================================================

/**
 * Check current notification permission status
 * 
 * @returns Current permission status
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as NotificationPermissionStatus;
}

/**
 * Request notification permissions from the user
 * 
 * Shows the system permission dialog if not already granted.
 * On iOS, this is required before receiving any notifications.
 * On Android 13+, this is also required.
 * 
 * @returns true if permission granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  appLogger.info('[Push] Requesting notification permissions...');

  // Check current status first
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus === 'granted') {
    appLogger.info('[Push] ✅ Permissions already granted');
    return true;
  }

  // Request permission
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status === 'granted') {
    appLogger.info('[Push] ✅ Permissions granted by user');
    return true;
  }

  appLogger.warn('[Push] ⚠️ Permissions denied by user');
  return false;
}

// ============================================================================
// Token Functions
// ============================================================================

/**
 * Get the native device push token (FCM for Android, APNs for iOS)
 * 
 * This returns the raw FCM/APNs token that can be sent directly to your
 * backend for use with Firebase Admin SDK.
 * 
 * Prerequisites:
 * - Must be on a physical device (not simulator/emulator for production)
 * - Must have notification permissions granted
 * - For Android: Must have google-services.json configured (via app.json)
 * 
 * @returns Push token result with token string and type, or null if failed
 */
export async function getDevicePushToken(): Promise<PushTokenResult | null> {
  appLogger.info('[Push] Getting device push token...');

  // Check if running on physical device
  // Note: In development, simulators can work but won't receive actual push notifications
  if (!Device.isDevice) {
    appLogger.warn('[Push] ⚠️ Not a physical device - push tokens may not work correctly');
    // Continue anyway for development testing
  }

  try {
    // Request permissions first if not granted
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      appLogger.error('[Push] ❌ Cannot get token - permissions not granted');
      return null;
    }

    // Get the native device push token (FCM/APNs)
    // This is different from getExpoPushTokenAsync() which returns an Expo-specific token
    const tokenData = await Notifications.getDevicePushTokenAsync();

    appLogger.info('[Push] ✅ Got device push token:', {
      type: tokenData.type,
      tokenLength: tokenData.data.length,
      tokenPreview: `${tokenData.data.substring(0, 20)}...`,
    });

    return {
      token: tokenData.data,
      type: tokenData.type as 'android' | 'ios',
    };
  } catch (error: any) {
    appLogger.error('[Push] ❌ Failed to get push token:', {
      error: error.message,
      code: error.code,
    });
    return null;
  }
}

// ============================================================================
// Android Channel Configuration
// ============================================================================

/**
 * Setup Android notification channel
 * 
 * Required for Android 8.0+ (API 26+). Notification channels allow users
 * to customize notification behavior per-channel.
 * 
 * Call this during app initialization.
 */
export async function setupAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  appLogger.info('[Push] Setting up Android notification channel...');

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    description: 'Default notification channel for Savi app',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4A90D9', // Match app theme color
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
    sound: 'default',
  });

  appLogger.info('[Push] ✅ Android notification channel created');
}

// ============================================================================
// Notification Listeners
// ============================================================================

/**
 * Add listener for when a notification is received while app is foregrounded
 * 
 * @param callback - Function to call when notification received
 * @returns Subscription to remove listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for when user taps on a notification
 * 
 * @param callback - Function to call when notification tapped
 * @returns Subscription to remove listener
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add listener for when push token changes
 * 
 * FCM tokens can refresh periodically. When this happens, you need to
 * update the token on your backend.
 * 
 * @param callback - Function to call with new token
 * @returns Subscription to remove listener
 */
export function addPushTokenListener(
  callback: (token: Notifications.DevicePushToken) => void
): Notifications.Subscription {
  return Notifications.addPushTokenListener(callback);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the last notification response (when app was opened from notification)
 * 
 * Useful for handling deep links from notifications on app cold start.
 * 
 * @returns Last notification response or null
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 * 
 * @param count - Badge count to display (0 to clear)
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all delivered notifications from notification center
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

