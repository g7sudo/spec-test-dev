// Environment configuration
// In production, these would come from environment variables

export const ENV = {
  // API Configuration
  API_BASE_URL: __DEV__
    ? 'http://localhost:5024/api/v1'
    : 'http://localhost:5024/api/v1',

  // App Version (for force update check)
  APP_VERSION: '1.0.0',
  BUILD_NUMBER: '1',

  // Platform-specific store URLs
  IOS_STORE_URL: 'https://apps.apple.com/app/savi/id123456789',
  ANDROID_STORE_URL: 'https://play.google.com/store/apps/details?id=com.savi.app',

  // Feature flags defaults
  ENABLE_ANALYTICS: true,
  ENABLE_ADS: true,

  // Timeouts
  API_TIMEOUT: 30000, // 30 seconds

  // Debug
  DEBUG_MODE: __DEV__,
} as const;

export type EnvConfig = typeof ENV;
