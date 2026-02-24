'use client';

/**
 * Manage User Role Groups Dialog
 * Dialog for assigning/removing role groups from a community user
 * Used in Tenant RBAC Users page
 */

import { useState, useEffect } from 'react';
import { Shield, Save, Check, User, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  RoleGroup,
  CommunityUserRbac,
  RoleGroupAssignment,
  getRoleGroupTypeLabel,
  getRoleGroupTypeColor,
} from '@/types/rbac';
import { assignCommunityUserRoles } from '@/lib/api/tenant-rbac';

// ============================================
// Props
// ============================================

interface ManageUserRoleGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The user whose role groups are being managed */
  user: CommunityUserRbac;
  /** All available role groups */
  availableRoleGroups: RoleGroup[];
  /** Callback when role groups are successfully updated */
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function ManageUserRoleGroupsDialog({
  open,
  onOpenChange,
  user,
  availableRoleGroups,
  onSuccess,
}: ManageUserRoleGroupsDialogProps) {
  // Track selected role groups with isPrimary flag
  const [selectedRoleGroups, setSelectedRoleGroups] = useState<Map<string, boolean>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize selected role groups when dialog opens or user changes
  useEffect(() => {
    if (open && user) {
      // Pre-select user's current role groups with their primary status
      const currentRoleGroups = new Map<string, boolean>();
      user.roleGroups.forEach((rg) => {
        currentRoleGroups.set(rg.roleGroupId, rg.isPrimary);
      });
      setSelectedRoleGroups(currentRoleGroups);
      setError(null);
    }
  }, [open, user]);
  
  // Toggle a role group selection
  const toggleRoleGroup = (roleGroupId: string) => {
    setSelectedRoleGroups((prev) => {
      const next = new Map(prev);
      if (next.has(roleGroupId)) {
        next.delete(roleGroupId);
      } else {
        // Add with isPrimary = false by default
        // If this is the first role group, make it primary
        next.set(roleGroupId, next.size === 0);
      }
      return next;
    });
  };
  
  // Set a role group as primary
  const setPrimary = (roleGroupId: string) => {
    setSelectedRoleGroups((prev) => {
      const next = new Map(prev);
      // Set all to non-primary, then set the selected one as primary
      next.forEach((_, key) => {
        next.set(key, key === roleGroupId);
      });
      return next;
    });
  };
  
  // Check if changes were made
  const hasChanges = () => {
    const currentMap = new Map<string, boolean>();
    user.roleGroups.forEach((rg) => {
      currentMap.set(rg.roleGroupId, rg.isPrimary);
    });
    
    if (currentMap.size !== selectedRoleGroups.size) return true;
    
    for (const [id, isPrimary] of Array.from(selectedRoleGroups)) {
      if (!currentMap.has(id) || currentMap.get(id) !== isPrimary) {
        return true;
      }
    }
    return false;
  };
  
  // Handle save
  const handleSave = async () => {
    if (!hasChanges()) {
      onOpenChange(false);
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const roleGroups: RoleGroupAssignment[] = Array.from(selectedRoleGroups).map(
        ([roleGroupId, isPrimary]) => ({ roleGroupId, isPrimary })
      );
      
      await assignCommunityUserRoles(user.id, roleGroups);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to update user role groups:', err);
      setError(err.message || 'Failed to update user role groups');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary-600" />
          Manage Roles
        </DialogTitle>
        
        <DialogDescription className="text-gray-600">
          Select roles for{' '}
          <span className="font-medium text-gray-900">
            {user.preferredName || user.partyName || 'Community User'}
          </span>
        </DialogDescription>
        
        {/* User Info Card */}
        <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg mt-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">
              {user.preferredName || user.partyName || 'No name'}
            </p>
            {user.partyName && user.preferredName !== user.partyName && (
              <p className="text-sm text-gray-500 truncate">{user.partyName}</p>
            )}
          </div>
        </div>
        
        {/* Role Groups List */}
        <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
          {availableRoleGroups.map((roleGroup) => {
            const isSelected = selectedRoleGroups.has(roleGroup.id);
            const isPrimary = selectedRoleGroups.get(roleGroup.id) === true;
            
            return (
              <div
                key={roleGroup.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-surface-50'
                )}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleRoleGroup(roleGroup.id)}
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                    isSelected
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </button>
                
                {/* Role group info */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => toggleRoleGroup(roleGroup.id)}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{roleGroup.name}</p>
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        getRoleGroupTypeColor(roleGroup.groupType)
                      )}
                    >
                      {getRoleGroupTypeLabel(roleGroup.groupType)}
                    </span>
                  </div>
                  {roleGroup.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {roleGroup.description}
                    </p>
                  )}
                </div>
                
                {/* Primary star button */}
                {isSelected && (
                  <button
                    type="button"
                    onClick={() => setPrimary(roleGroup.id)}
                    className={cn(
                      'p-1 rounded transition-colors',
                      isPrimary
                        ? 'text-yellow-500'
                        : 'text-gray-300 hover:text-gray-400'
                    )}
                    title={isPrimary ? 'Primary role' : 'Set as primary role'}
                  >
                    <Star
                      className={cn('h-4 w-4', isPrimary && 'fill-current')}
                    />
                  </button>
                )}
              </div>
            );
          })}
          
          {availableRoleGroups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No role groups available
            </div>
          )}
        </div>
        
        {/* Hint */}
        <p className="text-xs text-gray-400 mt-2">
          <Star className="h-3 w-3 inline fill-yellow-500 text-yellow-500" /> marks
          the primary role. Click the star to change it.
        </p>
        
        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!hasChanges()}
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

