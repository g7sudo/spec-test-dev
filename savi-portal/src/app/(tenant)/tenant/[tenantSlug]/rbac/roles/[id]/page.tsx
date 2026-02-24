'use client';

/**
 * Tenant Role Group Detail Page
 * View and edit permissions for a specific tenant role group
 * Permission: TENANT_RBAC_VIEW (read), TENANT_RBAC_MANAGE (edit)
 * 
 * Flow: F-RBAC-TENANT-02 – Edit Permissions for a Tenant Role Group
 * Flow: F-RBAC-TENANT-03 – View Community Users in a Role Group
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  ArrowLeft,
  Users,
  Key,
  Save,
  Loader2,
  AlertCircle,
  Lock,
  Star,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  getRoleGroupById,
  updateRoleGroupPermissions,
  listRoleGroupUsers,
} from '@/lib/api/tenant-rbac';
import {
  RoleGroupDetail,
  RoleGroupPermission,
  RoleGroupUser,
  getRoleGroupTypeLabel,
  getRoleGroupTypeColor,
} from '@/types/rbac';
import { PermissionMatrix } from '@/components/rbac';

// ============================================
// Users Tab Component
// ============================================

interface UsersTabProps {
  roleGroupId: string;
  tenantSlug: string;
}

function UsersTab({ roleGroupId, tenantSlug }: UsersTabProps) {
  const [users, setUsers] = useState<RoleGroupUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  
  const fetchUsers = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await listRoleGroupUsers(roleGroupId);
      setUsers(result);
    } catch (err) {
      console.error('Failed to fetch role group users:', err);
      setError('Failed to load users');
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [roleGroupId]);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-500">Loading users...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="mt-2 text-gray-900">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            fetchedRef.current = false;
            fetchUsers();
          }}
          className="mt-3"
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-8 w-8 text-gray-400" />
        <p className="mt-2 font-medium text-gray-900">No users assigned</p>
        <p className="text-sm text-gray-500">
          Users can be assigned to this role from the Users page.
        </p>
        <Link href={`/tenant/${tenantSlug}/rbac/users`}>
          <Button variant="secondary" size="sm" className="mt-3">
            Go to Users
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-100">
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-4 py-4">
          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <Users className="h-5 w-5" />
          </div>
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 truncate">
                {user.preferredName || user.partyName || 'No name'}
              </p>
              {user.isPrimary && (
                <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                  <Star className="h-3 w-3 fill-current" />
                  Primary
                </span>
              )}
            </div>
            {user.partyName && user.preferredName !== user.partyName && (
              <p className="text-sm text-gray-500 truncate">{user.partyName}</p>
            )}
          </div>
          
          {/* Validity */}
          {(user.validFrom || user.validTo) && (
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {user.validFrom
                ? new Date(user.validFrom).toLocaleDateString()
                : '—'}{' '}
              to{' '}
              {user.validTo ? new Date(user.validTo).toLocaleDateString() : '—'}
            </div>
          )}
          
          {/* Created */}
          <span className="text-xs text-gray-400 flex-shrink-0">
            Added {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function TenantRoleGroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const roleGroupId = params.id as string;
  const tenantSlug = params.tenantSlug as string;
  const { profile } = useAuthStore();
  
  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);
  
  // State
  const [roleGroup, setRoleGroup] = useState<RoleGroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('permissions');
  
  // Track permission changes (key -> isEnabled)
  const [permissionChanges, setPermissionChanges] = useState<Map<string, boolean>>(
    new Map()
  );
  
  // Permissions
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_RBAC_VIEW'] === true;
  const canManage = permissions['TENANT_RBAC_MANAGE'] === true;
  
  // Compute current permissions with changes applied
  const currentPermissions = useMemo(() => {
    if (!roleGroup) return [];
    
    return roleGroup.permissions.map((p) => ({
      ...p,
      isEnabled: permissionChanges.has(p.key)
        ? permissionChanges.get(p.key)!
        : p.isEnabled,
    }));
  }, [roleGroup, permissionChanges]);
  
  // Check if there are unsaved changes
  const hasChanges = permissionChanges.size > 0;
  
  // Fetch role group
  const fetchRoleGroup = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getRoleGroupById(roleGroupId);
      setRoleGroup(result);
    } catch (err) {
      console.error('Failed to fetch role group:', err);
      setError('Failed to load role');
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [roleGroupId]);
  
  useEffect(() => {
    fetchRoleGroup();
  }, [fetchRoleGroup]);
  
  // Handle permission toggle
  const handleToggle = (key: string, enabled: boolean) => {
    if (!roleGroup) return;
    
    setPermissionChanges((prev) => {
      const next = new Map(prev);
      
      // Find original value
      const original = roleGroup.permissions.find((p) => p.key === key);
      if (!original) return prev;
      
      // If toggling back to original, remove from changes
      if (original.isEnabled === enabled) {
        next.delete(key);
      } else {
        next.set(key, enabled);
      }
      
      return next;
    });
  };
  
  // Handle save
  const handleSave = async () => {
    if (!roleGroup || !hasChanges) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Get all enabled permission keys
      const enabledKeys = currentPermissions
        .filter((p) => p.isEnabled)
        .map((p) => p.key);
      
      await updateRoleGroupPermissions(roleGroupId, enabledKeys);
      
      // Clear changes and refresh
      setPermissionChanges(new Map());
      fetchedRef.current = false;
      await fetchRoleGroup();
    } catch (err: any) {
      console.error('Failed to save permissions:', err);
      setSaveError(err.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle discard changes
  const handleDiscard = () => {
    setPermissionChanges(new Map());
    setSaveError(null);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-gray-500">Loading role...</p>
      </div>
    );
  }
  
  // Error state
  if (error || !roleGroup) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="mt-3 font-medium text-gray-900">{error || 'Role not found'}</p>
        <div className="flex gap-2 mt-4">
          <Link href={`/tenant/${tenantSlug}/rbac/roles`}>
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Roles
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              fetchedRef.current = false;
              fetchRoleGroup();
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href={`/tenant/${tenantSlug}/rbac/roles`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Roles
      </Link>
      
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <Shield className="h-7 w-7" />
              </div>
              
              {/* Info */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {roleGroup.name}
                  </h1>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${getRoleGroupTypeColor(
                      roleGroup.groupType
                    )}`}
                  >
                    {getRoleGroupTypeLabel(roleGroup.groupType)}
                  </span>
                  {roleGroup.isSystem && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      <Lock className="h-3 w-3" />
                      System Role
                    </span>
                  )}
                </div>
                <p className="text-gray-500 mt-1">
                  {roleGroup.description || 'No description'}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Key className="h-4 w-4" />
                    {roleGroup.permissions.filter((p) => p.isEnabled).length}{' '}
                    permissions enabled
                  </span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            {canManage && hasChanges && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={handleDiscard} disabled={isSaving}>
                  Discard
                </Button>
                <Button onClick={handleSave} isLoading={isSaving}>
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
          
          {/* Save Error */}
          {saveError && (
            <div className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
              {saveError}
            </div>
          )}
          
          {/* Unsaved changes indicator */}
          {hasChanges && (
            <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700">
              You have unsaved changes ({permissionChanges.size} permission
              {permissionChanges.size !== 1 ? 's' : ''} modified)
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="permissions" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="permissions">
                <Key className="h-4 w-4" />
                Permissions
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="permissions" className="mt-6">
              <PermissionMatrix
                permissions={currentPermissions}
                canEdit={canManage}
                onToggle={handleToggle}
              />
            </TabsContent>
            
            <TabsContent value="users" className="mt-6">
              <UsersTab roleGroupId={roleGroupId} tenantSlug={tenantSlug} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

