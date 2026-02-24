'use client';

/**
 * Manage User Roles Dialog
 * Dialog for assigning/removing roles from a platform user
 * Used in Platform RBAC Users page
 */

import { useState, useEffect } from 'react';
import { Shield, Save, Check, User } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlatformRole, PlatformUserRbac, UserRoleAssignment } from '@/types/rbac';
import { assignPlatformUserRoles } from '@/lib/api/platform-rbac';

// ============================================
// Props
// ============================================

interface ManageUserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The user whose roles are being managed */
  user: PlatformUserRbac;
  /** All available roles */
  availableRoles: PlatformRole[];
  /** Callback when roles are successfully updated */
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function ManageUserRolesDialog({
  open,
  onOpenChange,
  user,
  availableRoles,
  onSuccess,
}: ManageUserRolesDialogProps) {
  // Track selected role IDs
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize selected roles when dialog opens or user changes
  useEffect(() => {
    if (open && user) {
      // Pre-select user's current roles
      const currentRoleIds = new Set(user.roles.map((r) => r.roleId));
      setSelectedRoleIds(currentRoleIds);
      setError(null);
    }
  }, [open, user]);
  
  // Toggle a role selection
  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };
  
  // Check if changes were made
  const hasChanges = () => {
    const currentIds = new Set(user.roles.map((r) => r.roleId));
    if (currentIds.size !== selectedRoleIds.size) return true;
    for (const id of Array.from(currentIds)) {
      if (!selectedRoleIds.has(id)) return true;
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
      await assignPlatformUserRoles(user.id, Array.from(selectedRoleIds));
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to update user roles:', err);
      setError(err.message || 'Failed to update user roles');
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
            {user.fullName || user.email}
          </span>
        </DialogDescription>
        
        {/* User Info Card */}
        <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg mt-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">
              {user.fullName || 'No name'}
            </p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        
        {/* Roles List */}
        <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
          {availableRoles.map((role) => {
            const isSelected = selectedRoleIds.has(role.id);
            
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-surface-50'
                )}
              >
                {/* Checkbox indicator */}
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                    isSelected
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                
                {/* Role info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{role.name}</p>
                    {role.isSystem && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                        System
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {role.description}
                    </p>
                  )}
                </div>
                
                {/* Permission count */}
                <span className="text-xs text-gray-400">
                  {role.permissionCount} permissions
                </span>
              </button>
            );
          })}
          
          {availableRoles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No roles available
            </div>
          )}
        </div>
        
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

