/**
 * Push Notifications Hook
 * 
 * Manages push notification lifecycle:
 * - Initializes push notifications on mount
 * - Registers device with backend
 * - Handles token refresh
 * - Handles notification taps for navigation
 * 
 * Usage: Call this hook in App.tsx after user is authenticated
 */

import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Subscription } from 'expo-notifications';

import { appLogger } from '@/core/logger';
import { useAuthStore } from '@/state/authStore';
import { ENV } from '@/core/config/env';
import {
  getDevicePushToken,
  setupAndroidNotificationChannel,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  addPushTokenListener,
  getLastNotificationResponse,
} from './pushNotification';
import {
  registerDevice,
  updateDeviceToken,
  unregisterDevice,
  RegisterDeviceRequest,
} from '@/services/api/devices';

// ============================================================================
// Device ID Management
// ============================================================================

const DEVICE_ID_KEY = 'savi_push_device_id';

/**
 * Get or generate a unique device identifier
 * 
 * Persists the device ID in SecureStore so it remains stable across app restarts.
 * This ID is used to identify the device on the backend.
 * 
 * @returns Unique device ID string
 */
async function getOrCreateDeviceId(): Promise<string> {
  try {
    // Try to get existing device ID from secure storage
    const existingId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (existingId) {
      appLogger.debug('[Push] Using existing device ID');
      return existingId;
    }

    // Generate new device ID if none exists
    // Format: platform-model-timestamp-random
    const parts = [
      Platform.OS,
      (Device.modelName || 'unknown').replace(/\s+/g, '-'),
      Date.now().toString(36),
      Math.random().toString(36).substring(2, 8),
    ];
    const newDeviceId = parts.join('-');

    // Persist the new device ID
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newDeviceId);
    appLogger.info('[Push] Generated and stored new device ID');

    return newDeviceId;
  } catch (error: any) {
    // Fallback to in-memory ID if SecureStore fails
    appLogger.warn('[Push] SecureStore failed, using fallback device ID:', error.message);
    return `${Platform.OS}-${Device.modelName || 'unknown'}-${Date.now().toString(36)}`;
  }
}

/**
 * Get device name for display
 */
function getDeviceName(): string {
  if (Device.deviceName) {
    return Device.deviceName;
  }
  return `${Device.manufacturer || ''} ${Device.modelName || 'Unknown Device'}`.trim();
}

// ============================================================================
// Hook
// ============================================================================

interface UsePushNotificationsOptions {
  /** Callback when user taps a notification */
  onNotificationTap?: (data: Record<string, unknown>) => void;
  /** Callback when notification received in foreground */
  onNotificationReceived?: (data: Record<string, unknown>) => void;
}

/**
 * Hook to manage push notifications
 * 
 * Call this in App.tsx after user authentication is confirmed.
 * Handles:
 * - Initial setup and device registration
 * - Token refresh handling
 * - Notification tap handling
 * 
 * @param options - Optional callbacks for notification events
 */
export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  // Store callbacks in refs to avoid dependency changes triggering re-init
  const onNotificationTapRef = useRef(options.onNotificationTap);
  const onNotificationReceivedRef = useRef(options.onNotificationReceived);
  
  // Update refs when callbacks change (without triggering effects)
  useEffect(() => {
    onNotificationTapRef.current = options.onNotificationTap;
    onNotificationReceivedRef.current = options.onNotificationReceived;
  }, [options.onNotificationTap, options.onNotificationReceived]);
  
  // Track initialization state - persists across re-renders
  // IMPORTANT: Don't reset on cleanup to prevent re-init in Strict Mode
  const initializedRef = useRef(false);
  const deviceIdRef = useRef<string | null>(null);
  
  // Track the last registered token to avoid duplicate API calls
  const lastTokenRef = useRef<string | null>(null);
  
  // Subscription refs for cleanup
  const notificationReceivedSubRef = useRef<Subscription | null>(null);
  const notificationResponseSubRef = useRef<Subscription | null>(null);
  const tokenRefreshSubRef = useRef<Subscription | null>(null);
  
  // Track if we're currently processing a token update (debounce)
  const tokenUpdateInProgressRef = useRef(false);

  // Get auth state - use selectors for stable references
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  /**
   * Register device with backend
   * Only calls API if token is different from last registered token
   */
  const registerDeviceWithBackend = useCallback(async (fcmToken: string): Promise<boolean> => {
    // Skip if token hasn't changed
    if (lastTokenRef.current === fcmToken) {
      appLogger.debug('[Push] Token unchanged - skipping registration');
      return true;
    }
    
    try {
      // Get or create persistent device ID
      if (!deviceIdRef.current) {
        deviceIdRef.current = await getOrCreateDeviceId();
      }

      const request: RegisterDeviceRequest = {
        deviceToken: fcmToken,
        deviceId: deviceIdRef.current,
        deviceName: getDeviceName(),
        platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
        appVersion: ENV.APP_VERSION,
        osVersion: Device.osVersion || undefined,
      };

      const result = await registerDevice(request);
      
      // Store the token after successful registration
      lastTokenRef.current = fcmToken;
      
      appLogger.info('[Push] ✅ Device registered with backend:', {
        deviceRegistrationId: result.deviceRegistrationId,
        isNewRegistration: result.isNewRegistration,
      });
      
      return true;
    } catch (error: any) {
      // Log but don't throw - push registration failure shouldn't break the app
      appLogger.error('[Push] ❌ Failed to register device with backend:', {
        error: error.message,
        status: error.status,
      });
      return false;
    }
  }, []);

  /**
   * Handle token refresh - with debouncing and duplicate prevention
   */
  const handleTokenRefresh = useCallback(async (newToken: string): Promise<void> => {
    // Skip if token is the same as last one
    if (lastTokenRef.current === newToken) {
      appLogger.debug('[Push] Token refresh - token unchanged, skipping');
      return;
    }
    
    // Skip if no device ID yet
    if (!deviceIdRef.current) {
      appLogger.warn('[Push] Token refresh received but no device ID - skipping update');
      return;
    }
    
    // Debounce: skip if already processing
    if (tokenUpdateInProgressRef.current) {
      appLogger.debug('[Push] Token update already in progress - skipping');
      return;
    }
    
    tokenUpdateInProgressRef.current = true;
    
    try {
      await updateDeviceToken(deviceIdRef.current, {
        deviceToken: newToken,
        appVersion: ENV.APP_VERSION,
        osVersion: Device.osVersion || undefined,
      });
      
      // Update stored token after successful update
      lastTokenRef.current = newToken;
      
      appLogger.info('[Push] ✅ Token refreshed and updated on backend');
    } catch (error: any) {
      appLogger.error('[Push] ❌ Failed to update token on backend:', {
        error: error.message,
      });
    } finally {
      tokenUpdateInProgressRef.current = false;
    }
  }, []);

  /**
   * Initialize push notifications - runs only once per session
   */
  useEffect(() => {
    // Only initialize when authenticated
    if (!isAuthenticated) {
      appLogger.debug('[Push] Not authenticated - skipping push notification setup');
      return;
    }

    // CRITICAL: Prevent double initialization
    // This ref persists across Strict Mode remounts
    if (initializedRef.current) {
      appLogger.debug('[Push] Already initialized - skipping');
      return;
    }
    
    // Mark as initialized BEFORE async work to prevent race conditions
    initializedRef.current = true;

    appLogger.info('[Push] 🚀 Initializing push notifications...');

    const initializePushNotifications = async () => {
      try {
        // Setup Android notification channel (required for Android 8+)
        await setupAndroidNotificationChannel();

        // Get FCM token
        const tokenResult = await getDevicePushToken();
        
        if (!tokenResult) {
          appLogger.warn('[Push] ⚠️ Could not get push token - notifications disabled');
          return;
        }

        // Register with backend (will skip if token unchanged)
        await registerDeviceWithBackend(tokenResult.token);

        // Check if app was opened from a notification (cold start)
        const lastResponse = await getLastNotificationResponse();
        if (lastResponse) {
          appLogger.info('[Push] App opened from notification:', {
            actionId: lastResponse.actionIdentifier,
            data: lastResponse.notification.request.content.data,
          });
          
          if (onNotificationTapRef.current) {
            onNotificationTapRef.current(lastResponse.notification.request.content.data as Record<string, unknown>);
          }
        }

        // Setup notification listeners (only if not already set up)
        if (!notificationReceivedSubRef.current) {
          notificationReceivedSubRef.current = addNotificationReceivedListener((notification) => {
            appLogger.info('[Push] 📬 Notification received (foreground):', {
              title: notification.request.content.title,
              body: notification.request.content.body,
              data: notification.request.content.data,
            });
            
            if (onNotificationReceivedRef.current) {
              onNotificationReceivedRef.current(notification.request.content.data as Record<string, unknown>);
            }
          });
        }

        if (!notificationResponseSubRef.current) {
          notificationResponseSubRef.current = addNotificationResponseListener((response) => {
            appLogger.info('[Push] 👆 Notification tapped:', {
              actionId: response.actionIdentifier,
              data: response.notification.request.content.data,
            });
            
            if (onNotificationTapRef.current) {
              onNotificationTapRef.current(response.notification.request.content.data as Record<string, unknown>);
            }
          });
        }

        // Listen for token refresh (only if not already listening)
        if (!tokenRefreshSubRef.current) {
          tokenRefreshSubRef.current = addPushTokenListener((tokenData) => {
            appLogger.info('[Push] 🔄 Token refresh event received');
            handleTokenRefresh(tokenData.data);
          });
        }

        appLogger.info('[Push] ✅ Push notifications initialized successfully');
      } catch (error: any) {
        appLogger.error('[Push] ❌ Failed to initialize push notifications:', {
          error: error.message,
        });
        // Reset initialized flag to allow retry
        initializedRef.current = false;
      }
    };

    initializePushNotifications();

    // Cleanup function - remove listeners but DON'T reset initializedRef
    // This prevents re-initialization in React Strict Mode
    return () => {
      appLogger.debug('[Push] Cleaning up push notification listeners');
      
      // Remove subscriptions
      if (notificationReceivedSubRef.current) {
        notificationReceivedSubRef.current.remove();
        notificationReceivedSubRef.current = null;
      }
      if (notificationResponseSubRef.current) {
        notificationResponseSubRef.current.remove();
        notificationResponseSubRef.current = null;
      }
      if (tokenRefreshSubRef.current) {
        tokenRefreshSubRef.current.remove();
        tokenRefreshSubRef.current = null;
      }
      
      // NOTE: We intentionally do NOT reset initializedRef here
      // This prevents re-initialization when React Strict Mode
      // unmounts and remounts the component
    };
  }, [isAuthenticated, registerDeviceWithBackend, handleTokenRefresh]);

  /**
   * Handle logout - unregister device and reset state
   */
  useEffect(() => {
    // When user logs out, unregister device and reset
    if (!isAuthenticated && deviceIdRef.current && lastTokenRef.current) {
      appLogger.info('[Push] User logged out - unregistering device');
      
      const deviceId = deviceIdRef.current;
      
      // Reset state
      deviceIdRef.current = null;
      lastTokenRef.current = null;
      initializedRef.current = false; // Allow re-init on next login
      
      // Unregister from backend (fire and forget)
      unregisterDevice(deviceId).catch((error) => {
        appLogger.warn('[Push] Failed to unregister device on logout:', error.message);
      });
    }
  }, [isAuthenticated]);

  return {
    /** Manually request notification permissions and register device */
    requestPermissions: async () => {
      const tokenResult = await getDevicePushToken();
      if (tokenResult) {
        return await registerDeviceWithBackend(tokenResult.token);
      }
      return false;
    },
  };
}
