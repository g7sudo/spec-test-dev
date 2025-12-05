'use client';

/**
 * Permission Matrix Component
 * Displays permissions grouped by module with toggles for enable/disable
 * Used in both Platform and Tenant RBAC role detail pages
 */

import { useMemo } from 'react';
import { Check, X, Lock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupPermissionsByModule } from '@/types/rbac';

// ============================================
// Types
// ============================================

interface Permission {
  key: string;
  module: string;
  description: string | null;
  isEnabled: boolean;
}

interface PermissionMatrixProps {
  /** List of permissions with their enabled state */
  permissions: Permission[];
  /** Whether the user can edit permissions */
  canEdit: boolean;
  /** Callback when a permission is toggled */
  onToggle: (key: string, enabled: boolean) => void;
  /** Optional: Additional CSS classes */
  className?: string;
}

// ============================================
// Module Card Component
// ============================================

interface ModuleCardProps {
  module: string;
  permissions: Permission[];
  canEdit: boolean;
  onToggle: (key: string, enabled: boolean) => void;
}

function ModuleCard({ module, permissions, canEdit, onToggle }: ModuleCardProps) {
  // Count enabled permissions in this module
  const enabledCount = permissions.filter(p => p.isEnabled).length;
  const totalCount = permissions.length;
  
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Module Header */}
      <div className="flex items-center justify-between bg-surface-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900">{module}</h4>
          <span className="text-xs text-gray-500">
            ({enabledCount}/{totalCount} enabled)
          </span>
        </div>
        {!canEdit && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Lock className="h-3 w-3" />
            <span>View only</span>
          </div>
        )}
      </div>
      
      {/* Permissions List */}
      <div className="divide-y divide-gray-100">
        {permissions.map((permission) => (
          <PermissionRow
            key={permission.key}
            permission={permission}
            canEdit={canEdit}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Permission Row Component
// ============================================

interface PermissionRowProps {
  permission: Permission;
  canEdit: boolean;
  onToggle: (key: string, enabled: boolean) => void;
}

function PermissionRow({ permission, canEdit, onToggle }: PermissionRowProps) {
  const handleClick = () => {
    if (canEdit) {
      onToggle(permission.key, !permission.isEnabled);
    }
  };
  
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3',
        canEdit && 'cursor-pointer hover:bg-surface-50 transition-colors'
      )}
      onClick={handleClick}
    >
      {/* Permission Info */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-medium text-sm text-gray-900 truncate">
          {permission.key}
        </p>
        {permission.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {permission.description}
          </p>
        )}
      </div>
      
      {/* Toggle */}
      <button
        type="button"
        disabled={!canEdit}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className={cn(
          'flex-shrink-0 h-6 w-11 rounded-full transition-colors relative',
          permission.isEnabled
            ? 'bg-primary-500'
            : 'bg-gray-200',
          canEdit
            ? 'cursor-pointer'
            : 'cursor-not-allowed opacity-60'
        )}
        aria-pressed={permission.isEnabled}
        aria-label={`Toggle ${permission.key}`}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            'flex items-center justify-center',
            permission.isEnabled ? 'translate-x-5' : 'translate-x-0.5'
          )}
        >
          {permission.isEnabled ? (
            <Check className="h-3 w-3 text-primary-600" />
          ) : (
            <X className="h-3 w-3 text-gray-400" />
          )}
        </span>
      </button>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function PermissionMatrix({
  permissions,
  canEdit,
  onToggle,
  className,
}: PermissionMatrixProps) {
  // Group permissions by module
  const groupedPermissions = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions]
  );
  
  // Get sorted module names
  const moduleNames = useMemo(
    () => Object.keys(groupedPermissions).sort(),
    [groupedPermissions]
  );
  
  if (permissions.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Info className="h-8 w-8 text-gray-400 mx-auto" />
        <p className="mt-2 text-sm text-gray-500">No permissions available</p>
      </div>
    );
  }
  
  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      {moduleNames.map((module) => (
        <ModuleCard
          key={module}
          module={module}
          permissions={groupedPermissions[module]}
          canEdit={canEdit}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

