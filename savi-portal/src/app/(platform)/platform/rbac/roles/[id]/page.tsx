'use client';

/**
 * Platform Role Detail Page
 * View and edit permissions for a specific platform role
 * Permission: PLATFORM_RBAC_VIEW (read), PLATFORM_RBAC_MANAGE (edit)
 * 
 * Flow: F-RBAC-PLAT-02 – Edit Permissions for a Platform Role
 * Flow: F-RBAC-PLAT-03 – View Users Assigned to a Platform Role
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
  Mail,
  Phone,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  getPlatformRoleById,
  updatePlatformRolePermissions,
  listPlatformRoleUsers,
} from '@/lib/api/platform-rbac';
import { PlatformRoleDetail, RolePermission, RoleUser } from '@/types/rbac';
import { PermissionMatrix } from '@/components/rbac';

// ============================================
// Users Tab Component
// ============================================

interface UsersTabProps {
  roleId: string;
}

function UsersTab({ roleId }: UsersTabProps) {
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  
  const fetchUsers = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await listPlatformRoleUsers(roleId);
      setUsers(result);
    } catch (err) {
      console.error('Failed to fetch role users:', err);
      setError('Failed to load users');
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [roleId]);
  
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
        <Link href="/platform/rbac/users">
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
            <p className="font-medium text-gray-900 truncate">
              {user.fullName || 'No name'}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </span>
              {user.phoneNumber && (
                <span className="flex items-center gap-1 truncate">
                  <Phone className="h-3.5 w-3.5" />
                  {user.phoneNumber}
                </span>
              )}
            </div>
          </div>
          
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

export default function PlatformRoleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const { profile } = useAuthStore();
  
  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);
  
  // State
  const [role, setRole] = useState<PlatformRoleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('permissions');
  
  // Track permission changes (key -> isEnabled)
  const [permissionChanges, setPermissionChanges] = useState<Map<string, boolean>>(new Map());
  
  // Permissions
  const permissions = profile?.permissions || {};
  const canView = permissions['PLATFORM_RBAC_VIEW'] === true;
  const canManage = permissions['PLATFORM_RBAC_MANAGE'] === true;
  
  // Compute current permissions with changes applied
  const currentPermissions = useMemo(() => {
    if (!role) return [];
    
    return role.permissions.map((p) => ({
      ...p,
      isEnabled: permissionChanges.has(p.key)
        ? permissionChanges.get(p.key)!
        : p.isEnabled,
    }));
  }, [role, permissionChanges]);
  
  // Check if there are unsaved changes
  const hasChanges = permissionChanges.size > 0;
  
  // Fetch role
  const fetchRole = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getPlatformRoleById(roleId);
      setRole(result);
    } catch (err) {
      console.error('Failed to fetch role:', err);
      setError('Failed to load role');
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [roleId]);
  
  useEffect(() => {
    fetchRole();
  }, [fetchRole]);
  
  // Handle permission toggle
  const handleToggle = (key: string, enabled: boolean) => {
    if (!role) return;
    
    setPermissionChanges((prev) => {
      const next = new Map(prev);
      
      // Find original value
      const original = role.permissions.find((p) => p.key === key);
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
    if (!role || !hasChanges) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Get all enabled permission keys
      const enabledKeys = currentPermissions
        .filter((p) => p.isEnabled)
        .map((p) => p.key);
      
      await updatePlatformRolePermissions(roleId, enabledKeys);
      
      // Clear changes and refresh
      setPermissionChanges(new Map());
      fetchedRef.current = false;
      await fetchRole();
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
  if (error || !role) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="mt-3 font-medium text-gray-900">{error || 'Role not found'}</p>
        <div className="flex gap-2 mt-4">
          <Link href="/platform/rbac/roles">
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
              fetchRole();
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
        href="/platform/rbac/roles"
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
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{role.name}</h1>
                  {role.isSystem && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                      <Lock className="h-3 w-3" />
                      System Role
                    </span>
                  )}
                </div>
                <p className="text-gray-500 mt-1">
                  {role.description || 'No description'}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Key className="h-4 w-4" />
                    {role.permissions.filter((p) => p.isEnabled).length} permissions enabled
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
              You have unsaved changes ({permissionChanges.size} permission{permissionChanges.size !== 1 ? 's' : ''} modified)
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
              <UsersTab roleId={roleId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

