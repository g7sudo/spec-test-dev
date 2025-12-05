'use client';

/**
 * Tenant RBAC Users Page
 * Lists all community users with their assigned role groups
 * Permission: TENANT_RBAC_VIEW
 * 
 * Flow: F-RBAC-TENANT-04 – View Community Users & Their Roles
 * Flow: F-RBAC-TENANT-05 – Assign / Remove Role Groups for a Community User
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  Search,
  Shield,
  Loader2,
  AlertCircle,
  Settings2,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth-store';
import { listTenantRbacUsers, listTenantRoleGroups } from '@/lib/api/tenant-rbac';
import { CommunityUserRbac, RoleGroup } from '@/types/rbac';
import { ManageUserRoleGroupsDialog } from '@/components/rbac';

// ============================================
// Constants
// ============================================

const PAGE_SIZE = 20;

// ============================================
// User Row Component
// ============================================

interface UserRowProps {
  user: CommunityUserRbac;
  canManage: boolean;
  onManageRoles: () => void;
}

function UserRow({ user, canManage, onManageRoles }: UserRowProps) {
  return (
    <tr className="hover:bg-surface-50 transition-colors">
      {/* User Info */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {user.preferredName || user.partyName || 'No name'}
            </p>
            {user.partyName && user.preferredName !== user.partyName && (
              <p className="text-sm text-gray-500 truncate">{user.partyName}</p>
            )}
          </div>
        </div>
      </td>
      
      {/* Role Groups */}
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1.5">
          {user.roleGroups.length > 0 ? (
            user.roleGroups.map((rg) => (
              <span
                key={rg.roleGroupId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700"
              >
                <Shield className="h-3 w-3" />
                {rg.roleGroupName}
                {rg.isPrimary && (
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                )}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No roles assigned</span>
          )}
        </div>
      </td>
      
      {/* Actions */}
      <td className="px-4 py-4 text-right">
        {canManage && (
          <Button variant="secondary" size="sm" onClick={onManageRoles}>
            <Settings2 className="h-4 w-4" />
            Manage Roles
          </Button>
        )}
      </td>
    </tr>
  );
}

// ============================================
// Empty State
// ============================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
        <Users className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No users found</h3>
      <p className="mt-1 text-sm text-gray-500">
        Community users will appear here once they join.
      </p>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function TenantRbacUsersPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { profile } = useAuthStore();
  
  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);
  const roleGroupsFetchedRef = useRef(false);
  
  // State
  const [users, setUsers] = useState<CommunityUserRbac[]>([]);
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [managingUser, setManagingUser] = useState<CommunityUserRbac | null>(null);
  
  // Permissions
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_RBAC_VIEW'] === true;
  const canManage = permissions['TENANT_RBAC_MANAGE'] === true;
  
  // Fetch role groups (for dialog)
  const fetchRoleGroups = useCallback(async () => {
    if (roleGroupsFetchedRef.current) return;
    roleGroupsFetchedRef.current = true;
    
    try {
      const result = await listTenantRoleGroups();
      setRoleGroups(result);
    } catch (err) {
      console.error('Failed to fetch role groups:', err);
      roleGroupsFetchedRef.current = false;
    }
  }, []);
  
  // Fetch users
  const fetchUsers = useCallback(
    async (force = false) => {
      if (fetchedRef.current && !force) {
        return;
      }
      fetchedRef.current = true;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await listTenantRbacUsers({
          page,
          pageSize: PAGE_SIZE,
          search: searchTerm || undefined,
        });
        
        setUsers(result.items);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users');
        fetchedRef.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [page, searchTerm]
  );
  
  useEffect(() => {
    fetchedRef.current = false;
    fetchUsers();
  }, [fetchUsers]);
  
  useEffect(() => {
    fetchRoleGroups();
  }, [fetchRoleGroups]);
  
  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };
  
  // Handle role management success
  const handleManageSuccess = () => {
    setManagingUser(null);
    fetchUsers(true);
  };
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Users</h1>
          <p className="text-sm text-gray-500">
            View and manage role assignments for community members
          </p>
        </div>
      </div>
      
      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            leftAddon={<Search className="h-4 w-4" />}
            className="max-w-md"
          />
        </CardContent>
      </Card>
      
      {/* Content */}
      <Card>
        {isLoading ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading users...</p>
            </div>
          </CardContent>
        ) : error ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-8 w-8 text-error" />
              <p className="mt-3 font-medium text-gray-900">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchUsers(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        ) : users.length === 0 ? (
          <CardContent>
            <EmptyState />
          </CardContent>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 text-left text-sm font-medium text-gray-600">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      canManage={canManage}
                      onManageRoles={() => setManagingUser(user)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
      
      {/* Manage Role Groups Dialog */}
      {managingUser && (
        <ManageUserRoleGroupsDialog
          open={!!managingUser}
          onOpenChange={(open) => {
            if (!open) setManagingUser(null);
          }}
          user={managingUser}
          availableRoleGroups={roleGroups}
          onSuccess={handleManageSuccess}
        />
      )}
    </div>
  );
}

