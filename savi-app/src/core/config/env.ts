/**
 * Environment configuration
 * 
 * Reads configuration from environment variables (prefixed with EXPO_PUBLIC_)
 * Falls back to default values for development.
 * 
 * To configure:
 * 1. Create/update .env file in the root directory (savi-app/.env)
 * 2. Add: EXPO_PUBLIC_API_BASE_URL=https://your-api-domain.com/api/v1
 * 3. Restart the Expo development server
 * 
 * For production builds, set these in your CI/CD environment variables.
 */

export const ENV = {
  // API Configuration
  // Read from EXPO_PUBLIC_API_BASE_URL environment variable
  // Note: Base URL should NOT include /v1 (e.g., http://localhost:5024/api)
  // The /v1 is added in individual endpoint paths
  // Default: localhost for development
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (__DEV__
      ? 'http://localhost:5024/api'
      : 'https://api.savi.app/api'),

  // App Version (for force update check)
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  BUILD_NUMBER: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',

  // Platform-specific store URLs
  IOS_STORE_URL:
    process.env.EXPO_PUBLIC_IOS_STORE_URL ||
    'https://apps.apple.com/app/savi/id123456789',
  ANDROID_STORE_URL:
    process.env.EXPO_PUBLIC_ANDROID_STORE_URL ||
    'https://play.google.com/store/apps/details?id=com.savi.app',

  // Feature flags defaults
  ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS !== 'false',
  ENABLE_ADS: process.env.EXPO_PUBLIC_ENABLE_ADS !== 'false',

  // Timeouts
  API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10), // 30 seconds

  // Debug
  DEBUG_MODE: __DEV__,

  // Firebase Configuration (read from environment variables)
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENTID || '',
} as const;

export type EnvConfig = typeof ENV;
