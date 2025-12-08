// Non-secret constants used throughout the app

export const APP_NAME = 'SAVI';

export const APP_CONFIG = {
  TERMS_URL: 'https://savi.app/terms',
  PRIVACY_URL: 'https://savi.app/privacy',
  SUPPORT_EMAIL: 'support@savi.app',
  APP_STORE_URL: 'https://apps.apple.com/app/savi',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.savi.app',
} as const;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Storage keys
export const STORAGE_KEYS = {
  // App state
  ONBOARDING_COMPLETED: 'onboarding_completed',
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',

  // Consent
  ANALYTICS_ENABLED: 'analytics_enabled',
  ADS_PERSONALIZATION_ENABLED: 'ads_personalization_enabled',
  NOTIFICATION_PERMISSION_STATUS: 'notification_permission_status',

  // Auth
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',

  // Tenant
  CURRENT_TENANT_ID: 'current_tenant_id',
  TENANT_LIST: 'tenant_list',

  // Device
  DEVICE_ID: 'device_id',
  FCM_TOKEN: 'fcm_token',
} as const;

// API endpoints (relative paths)
// Note: All endpoints include /v1 prefix since base URL is /api (without /v1)
// Base URL format: http://localhost:5024/api
// Full URL example: http://localhost:5024/api/v1/platform/auth/me
export const API_ENDPOINTS = {
  // Platform
  AUTH_ME: '/v1/platform/auth/me',
  MOBILE_CONFIG: '/v1/platform/mobile-config',
  INVITATIONS_VALIDATE: '/v1/platform/invitations/validate',
  INVITATIONS_ACCEPT: '/v1/platform/invitations/accept',
  DEVICES_REGISTER: '/v1/platform/devices/register',

  // Tenant - Profile
  MY_PROFILE: '/v1/tenant/me/profile',

  // Tenant - Maintenance
  MAINTENANCE_REQUESTS: '/v1/tenant/maintenance/requests',
  MAINTENANCE_MY_REQUESTS: '/v1/tenant/maintenance/requests/my-requests',
  MAINTENANCE_CATEGORIES: '/v1/tenant/maintenance/categories',

  // Tenant - Visitors
  VISITOR_PASSES: '/v1/tenant/visitors/passes',

  // Tenant - Amenities
  AMENITIES: '/v1/tenant/amenities',
  AMENITY_BOOKINGS: '/v1/tenant/amenity-bookings',

  // Tenant - Announcements
  ANNOUNCEMENTS_FEED: '/v1/tenant/announcements/feed',

  // Tenant - Notifications
  NOTIFICATIONS: '/v1/tenant/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/v1/tenant/notifications/unread/count',

  // Tenant - Community
  UNITS: '/v1/tenant/community/units',

  // Ads
  ADS_BANNERS: '/v1/ads/banners',
  ADS_STORIES: '/v1/ads/stories',
} as const;

// Quick action types
export const QUICK_ACTIONS = {
  PRE_REGISTER_VISITOR: 'pre_register_visitor',
  MAINTENANCE_REQUEST: 'maintenance_request',
  GIVE_FEEDBACK: 'give_feedback',
  BOOK_FACILITY: 'book_facility',
  EMERGENCY: 'emergency',
  ANNOUNCEMENTS: 'announcements',
} as const;

// Maintenance status colors
export const MAINTENANCE_STATUS_COLORS = {
  New: '#FFC107',
  Assigned: '#FFC107',
  InProgress: '#2196F3',
  Completed: '#4CAF50',
  Cancelled: '#9E9E9E',
  Rejected: '#F44336',
} as const;
