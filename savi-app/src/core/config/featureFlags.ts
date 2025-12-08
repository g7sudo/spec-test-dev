// Feature flags - can be overridden by remote config

export interface FeatureFlags {
  // Core features
  maintenanceEnabled: boolean;
  visitorsEnabled: boolean;
  amenitiesEnabled: boolean;
  announcementsEnabled: boolean;

  // Home screen sections
  communityFeedsEnabled: boolean;
  promoBannersEnabled: boolean;
  featuredOffersEnabled: boolean;
  billDrawerEnabled: boolean;

  // Quick actions
  feedbackEnabled: boolean;
  emergencyEnabled: boolean;

  // Other
  darkModeEnabled: boolean;
  multiLanguageEnabled: boolean;
}

// Default feature flags
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Core features - all enabled by default
  maintenanceEnabled: true,
  visitorsEnabled: true,
  amenitiesEnabled: true,
  announcementsEnabled: true,

  // Home screen sections
  communityFeedsEnabled: true,
  promoBannersEnabled: true,
  featuredOffersEnabled: true,
  billDrawerEnabled: false, // Disabled per user requirement

  // Quick actions
  feedbackEnabled: false, // Disabled per user requirement - no API
  emergencyEnabled: true, // Always visible per PRD

  // Other
  darkModeEnabled: true,
  multiLanguageEnabled: true,
};

// Feature flags store (can be updated from remote config)
let featureFlags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };

export const getFeatureFlags = (): FeatureFlags => featureFlags;

export const updateFeatureFlags = (updates: Partial<FeatureFlags>): void => {
  featureFlags = { ...featureFlags, ...updates };
};

export const resetFeatureFlags = (): void => {
  featureFlags = { ...DEFAULT_FEATURE_FLAGS };
};

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags[feature];
};
