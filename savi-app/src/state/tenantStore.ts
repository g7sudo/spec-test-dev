import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  address?: string;
  city?: string;
}

export interface CurrentUnit {
  id: string;
  unitNumber: string;
  blockName?: string;
  floorNumber?: number;
}

export interface SelectedTenant {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  unitId: string;
  unitName: string;
}

export interface TenantState {
  // Current tenant
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;

  // Current unit (within the tenant)
  currentUnit: CurrentUnit | null;
  setCurrentUnit: (unit: CurrentUnit | null) => void;

  // Selected tenant (combined for easy access)
  selectedTenant: SelectedTenant | null;

  // Tenant loading state
  isTenantLoading: boolean;
  setIsTenantLoading: (loading: boolean) => void;

  // Actions
  selectTenant: (tenant: Tenant, unit?: { id: string; name: string }) => void;
  clearTenant: () => void;
  clearSelectedTenant: () => void; // Alias for clearTenant

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      // Current tenant
      currentTenant: null,
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),

      // Current unit
      currentUnit: null,
      setCurrentUnit: (unit) => set({ currentUnit: unit }),

      // Selected tenant (combined)
      selectedTenant: null,

      // Loading state
      isTenantLoading: false,
      setIsTenantLoading: (loading) => set({ isTenantLoading: loading }),

      // Actions
      selectTenant: (tenant, unit) =>
        set({
          currentTenant: tenant,
          currentUnit: unit ? { id: unit.id, unitNumber: unit.name } : null,
          selectedTenant: {
            tenantId: tenant.id,
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
            unitId: unit?.id || '',
            unitName: unit?.name || '',
          },
          isTenantLoading: false,
        }),

      clearTenant: () =>
        set({
          currentTenant: null,
          currentUnit: null,
          selectedTenant: null,
        }),

      clearSelectedTenant: () =>
        set({
          currentTenant: null,
          currentUnit: null,
          selectedTenant: null,
        }),

      // Hydration
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
    }),
    {
      name: 'tenant-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        currentUnit: state.currentUnit,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selector hooks
export const useCurrentTenant = () => useTenantStore((state) => state.currentTenant);
export const useCurrentUnit = () => useTenantStore((state) => state.currentUnit);
export const useCurrentTenantId = () => useTenantStore((state) => state.currentTenant?.id);
export const useIsTenantLoading = () => useTenantStore((state) => state.isTenantLoading);
export const useSelectedTenant = () => useTenantStore((state) => state.selectedTenant);
export const useTenantHasHydrated = () => useTenantStore((state) => state._hasHydrated);
