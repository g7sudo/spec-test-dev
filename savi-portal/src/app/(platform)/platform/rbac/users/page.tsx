'use client';

/**
 * Platform RBAC Users Page
 * Lists all platform users with their assigned roles
 * Permission: PLATFORM_RBAC_VIEW
 * 
 * Flow: F-RBAC-PLAT-04 – View Platform Users & Their Roles
 * Flow: F-RBAC-PLAT-05 – Assign / Remove Roles for a Platform User
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Shield,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Settings2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth-store';
import { listPlatformRbacUsers, listPlatformRoles } from '@/lib/api/platform-rbac';
import { PlatformUserRbac, PlatformRole } from '@/types/rbac';
import { ManageUserRolesDialog } from '@/components/rbac';

// ============================================
// Constants
// ============================================

const PAGE_SIZE = 20;

// ============================================
// User Row Component
// ============================================

interface UserRowProps {
  user: PlatformUserRbac;
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
              {user.fullName || 'No name'}
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>
      </td>
      
      {/* Phone */}
      <td className="px-4 py-4">
        {user.phoneNumber ? (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Phone className="h-3.5 w-3.5" />
            <span>{user.phoneNumber}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      
      {/* Roles */}
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1.5">
          {user.roles.length > 0 ? (
            user.roles.map((role) => (
              <span
                key={role.roleId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700"
              >
                <Shield className="h-3 w-3" />
                {role.roleName}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No roles assigned</span>
          )}
        </div>
      </td>
      
      {/* Created */}
      <td className="px-4 py-4 text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString()}
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
        Platform users will appear here once created.
      </p>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function PlatformRbacUsersPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);
  const rolesFetchedRef = useRef(false);
  
  // State
  const [users, setUsers] = useState<PlatformUserRbac[]>([]);
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [managingUser, setManagingUser] = useState<PlatformUserRbac | null>(null);
  
  // Permissions
  const permissions = profile?.permissions || {};
  const canView = permissions['PLATFORM_RBAC_VIEW'] === true;
  const canManage = permissions['PLATFORM_RBAC_MANAGE'] === true;
  
  // Fetch roles (for dialog)
  const fetchRoles = useCallback(async () => {
    if (rolesFetchedRef.current) return;
    rolesFetchedRef.current = true;
    
    try {
      const result = await listPlatformRoles();
      setRoles(result);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      rolesFetchedRef.current = false;
    }
  }, []);
  
  // Fetch users
  const fetchUsers = useCallback(async (force = false) => {
    if (fetchedRef.current && !force) {
      return;
    }
    fetchedRef.current = true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await listPlatformRbacUsers({
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
  }, [page, searchTerm]);
  
  useEffect(() => {
    fetchedRef.current = false;
    fetchUsers();
  }, [fetchUsers]);
  
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);
  
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
          <h1 className="text-2xl font-bold text-gray-900">Platform Users</h1>
          <p className="text-sm text-gray-500">
            View and manage role assignments for platform administrators
          </p>
        </div>
      </div>
      
      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <Input
            placeholder="Search by name or email..."
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
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3">Created</th>
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
      
      {/* Manage Roles Dialog */}
      {managingUser && (
        <ManageUserRolesDialog
          open={!!managingUser}
          onOpenChange={(open) => {
            if (!open) setManagingUser(null);
          }}
          user={managingUser}
          availableRoles={roles}
          onSuccess={handleManageSuccess}
        />
      )}
    </div>
  );
}

