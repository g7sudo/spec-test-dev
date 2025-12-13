/**
 * Notifications Module Exports
 * 
 * Central export point for push notification functionality.
 */

export {
  // Permission functions
  getNotificationPermissionStatus,
  requestNotificationPermissions,
  
  // Token functions
  getDevicePushToken,
  
  // Setup
  setupAndroidNotificationChannel,
  
  // Listeners
  addNotificationReceivedListener,
  addNotificationResponseListener,
  addPushTokenListener,
  
  // Utilities
  getLastNotificationResponse,
  getBadgeCount,
  setBadgeCount,
  clearAllNotifications,
  
  // Types
  type PushTokenResult,
  type NotificationPermissionStatus,
} from './pushNotification';

export { usePushNotifications } from './usePushNotifications';

