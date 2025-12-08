export interface UpdateResult {
  type: 'none' | 'soft_update' | 'force_update';
  message: string;
  storeUrl: string;
}

export interface MobileConfig {
  currentVersion: string;
  newVersion: string;
  isForceUpdate: boolean;
  featureFlags?: Record<string, boolean>;
}
