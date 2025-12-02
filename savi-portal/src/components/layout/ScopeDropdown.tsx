'use client';

/**
 * Scope Dropdown
 * Gmail-style scope selector for switching between Platform and Tenants
 * 
 * On scope change:
 * 1. Hard navigates to new scope's dashboard URL
 * 2. Page reload triggers ScopeProvider to detect new scope from URL
 * 3. ScopeProvider refetches /auth/me with X-Tenant-Id header
 * 4. Sidebar re-renders with new permissions
 */

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Building2, Globe, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  buildScopeOptions,
  getCurrentScopeFromPath,
  getScopeDashboardUrl,
  saveLastScope,
  ScopeOption,
} from '@/lib/auth';
import { isPlatformAdmin } from '@/types/auth';

export function ScopeDropdown() {
  const pathname = usePathname();
  const { profile } = useAuthStore();

  // Build scope options from profile
  const scopeOptions = useMemo(() => {
    if (!profile) return [];
    return buildScopeOptions(profile);
  }, [profile]);

  // Get current scope from URL
  const currentScope = useMemo(() => {
    const pathScope = getCurrentScopeFromPath(pathname);
    if (!pathScope) return null;
    
    // Find the full scope info from options
    return scopeOptions.find(opt => opt.value === pathScope.value) || pathScope;
  }, [pathname, scopeOptions]);

  /**
   * Handle scope change
   * Uses hard navigation to ensure:
   * 1. URL changes completely
   * 2. Page reloads with new scope context
   * 3. ScopeProvider detects scope from URL
   * 4. /auth/me is called with correct X-Tenant-Id
   */
  const handleScopeChange = (value: string) => {
    const selectedScope = scopeOptions.find(opt => opt.value === value);
    if (!selectedScope || selectedScope.value === currentScope?.value) return;

    // Save as last used scope for next login
    saveLastScope(selectedScope);

    // Hard navigate to new scope's dashboard
    // This triggers a full page reload which:
    // - ScopeProvider reads scope from URL
    // - Sets tenant ID in scope store
    // - Refetches /auth/me with X-Tenant-Id header
    // - Profile updates with scope-specific permissions
    // - SideNav re-renders with filtered items
    const url = getScopeDashboardUrl(selectedScope);
    window.location.href = url;
  };

  // Don't render if no options
  if (scopeOptions.length === 0) return null;

  // Separate platform and tenant options
  const platformOption = scopeOptions.find(opt => opt.type === 'platform');
  const tenantOptions = scopeOptions.filter(opt => opt.type === 'tenant');
  const hasPlatformAccess = isPlatformAdmin(profile);

  return (
    <Select value={currentScope?.value || ''} onValueChange={handleScopeChange}>
      <SelectTrigger className="w-[200px] sm:w-[260px]">
        <div className="flex items-center gap-2">
          {/* Scope icon */}
          {currentScope?.type === 'platform' ? (
            <Globe className="h-4 w-4 text-primary-500" />
          ) : (
            <Building2 className="h-4 w-4 text-primary-500" />
          )}
          
          {/* Scope name */}
          <SelectValue placeholder="Select scope">
            <span className="truncate font-medium">
              {currentScope?.label || 'Select scope'}
            </span>
          </SelectValue>
        </div>
      </SelectTrigger>

      <SelectContent>
        {/* Platform option (if admin) */}
        {hasPlatformAccess && platformOption && (
          <>
            <SelectGroup>
              <SelectLabel>Platform Admin</SelectLabel>
              <SelectItem value={platformOption.value}>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary-600" />
                  <span className="font-medium">{platformOption.label}</span>
                </div>
              </SelectItem>
            </SelectGroup>
            
            {tenantOptions.length > 0 && <SelectSeparator />}
          </>
        )}

        {/* Tenant options */}
        {tenantOptions.length > 0 && (
          <SelectGroup>
            <SelectLabel>Communities</SelectLabel>
            {tenantOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="truncate">{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
