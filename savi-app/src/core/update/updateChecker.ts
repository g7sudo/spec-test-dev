import { ENV } from '@/core/config/env';
import apiClient from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/core/config/constants';

export interface UpdateResult {
  type: 'none' | 'soft_update' | 'force_update';
  message: string;
  storeUrl: string;
}

interface MobileConfigResponse {
  currentVersion: string;
  newVersion: string;
  isForceUpdate: boolean;
}

/**
 * Check for app updates by comparing current version with server config
 */
export const checkForUpdate = async (): Promise<UpdateResult> => {
  // Skip update check in development mode
  if (__DEV__) {
    return {
      type: 'none',
      message: '',
      storeUrl: '',
    };
  }

  try {
    const response = await apiClient.get<MobileConfigResponse>(
      API_ENDPOINTS.MOBILE_CONFIG
    );

    const { currentVersion, newVersion, isForceUpdate } = response.data;

    // Compare versions
    const currentParts = ENV.APP_VERSION.split('.').map(Number);
    const serverMinParts = currentVersion.split('.').map(Number);
    const serverLatestParts = newVersion.split('.').map(Number);

    const isCurrentBelowMin = compareVersions(currentParts, serverMinParts) < 0;
    const isCurrentBelowLatest = compareVersions(currentParts, serverLatestParts) < 0;

    if (isForceUpdate && isCurrentBelowMin) {
      return {
        type: 'force_update',
        message: 'A new version of the app is required. Please update to continue.',
        storeUrl: getStoreUrl(),
      };
    }

    if (isCurrentBelowLatest) {
      return {
        type: 'soft_update',
        message: 'A new version of the app is available.',
        storeUrl: getStoreUrl(),
      };
    }

    return {
      type: 'none',
      message: '',
      storeUrl: '',
    };
  } catch (error) {
    // If we can't check for updates, don't block the user
    console.warn('Failed to check for updates:', error);
    return {
      type: 'none',
      message: '',
      storeUrl: '',
    };
  }
};

/**
 * Compare two version arrays
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
const compareVersions = (a: number[], b: number[]): number => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const aPart = a[i] || 0;
    const bPart = b[i] || 0;
    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }
  return 0;
};

/**
 * Get the appropriate store URL based on platform
 */
const getStoreUrl = (): string => {
  // In a real app, you'd use Platform.OS to determine this
  // For now, return iOS URL (can be enhanced with Platform.select)
  return ENV.IOS_STORE_URL;
};

export default checkForUpdate;
