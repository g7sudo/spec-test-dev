/**
 * Tenant Configuration
 * 
 * Manages tenant code/slug for the app. Can be set via:
 * - Deep link parameters
 * - App configuration
 * - User selection
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TenantConfigState {
  tenantCode: string | null;
  setTenantCode: (code: string | null) => void;
  clearTenantCode: () => void;
}

/**
 * Tenant code store
 * Stores the current tenant code used for API requests
 */
export const useTenantConfigStore = create<TenantConfigState>()(
  persist(
    (set) => ({
      tenantCode: null,
      setTenantCode: (code) => set({ tenantCode: code }),
      clearTenantCode: () => set({ tenantCode: null }),
    }),
    {
      name: 'tenant-config-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Gets the current tenant code
 * Falls back to default if not set
 */
export function getTenantCode(): string {
  const code = useTenantConfigStore.getState().tenantCode;
  
  // TODO: In production, this should come from:
  // 1. Deep link parameters (if app opened via invite link)
  // 2. App configuration
  // 3. User selection (if multiple tenants)
  // For now, return a default or throw if not set
  if (!code) {
    // Default fallback - should be removed in production
    console.warn('Tenant code not set, using default');
    return 'sunset-heights'; // This should be dynamic
  }
  
  return code;
}

/**
 * Sets tenant code from deep link or other source
 */
export function setTenantCodeFromSource(code: string): void {
  useTenantConfigStore.getState().setTenantCode(code);
}

