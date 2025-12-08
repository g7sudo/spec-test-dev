// Storage key constants
// Using a central place for all storage keys to avoid typos and collisions

export const STORAGE_KEYS = {
  // App state (persisted by Zustand)
  APP_STORAGE: 'app-storage',
  AUTH_STORAGE: 'auth-storage',
  TENANT_STORAGE: 'tenant-storage',

  // Secure storage keys (for sensitive data)
  SECURE_AUTH_TOKEN: 'secure_auth_token',
  SECURE_REFRESH_TOKEN: 'secure_refresh_token',

  // Device
  DEVICE_ID: 'device_id',
  FCM_TOKEN: 'fcm_token',

  // Cache keys
  CACHE_PREFIX: 'cache_',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
