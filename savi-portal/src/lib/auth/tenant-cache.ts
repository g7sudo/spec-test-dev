/**
 * Tenant ID Cache
 * Stores slug → tenantId mapping in localStorage
 * Enables single API call on tenant page loads (after first visit)
 */

const STORAGE_KEY = 'savi_tenant_cache';

interface TenantCacheEntry {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

type TenantCache = Record<string, TenantCacheEntry>; // slug → entry

/**
 * Gets cached tenant data by slug
 */
export function getCachedTenant(slug: string): TenantCacheEntry | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    
    const cache: TenantCache = JSON.parse(raw);
    return cache[slug] || null;
  } catch {
    return null;
  }
}

/**
 * Caches tenant data for future lookups
 */
export function cacheTenant(entry: TenantCacheEntry): void {
  if (typeof window === 'undefined') return;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const cache: TenantCache = raw ? JSON.parse(raw) : {};
    
    cache[entry.tenantSlug] = entry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Caches all tenant memberships from profile
 */
export function cacheAllTenants(
  memberships: Array<{ tenantId: string; tenantSlug: string; tenantName: string }>
): void {
  if (typeof window === 'undefined') return;
  if (!memberships?.length) return;
  
  try {
    const cache: TenantCache = {};
    
    for (const m of memberships) {
      cache[m.tenantSlug] = {
        tenantId: m.tenantId,
        tenantSlug: m.tenantSlug,
        tenantName: m.tenantName,
      };
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clears the tenant cache (on logout)
 */
export function clearTenantCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

