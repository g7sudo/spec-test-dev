'use client';

/**
 * Tenant RBAC Roles Page
 * Lists all tenant role groups with permission counts
 * Permission: TENANT_RBAC_VIEW
 * 
 * Flow: F-RBAC-TENANT-01 – View Tenant Role Groups (Tenant RBAC Roles)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Users,
  ChevronRight,
  Loader2,
  AlertCircle,
  Key,
  Lock,
  Plus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { listTenantRoleGroups } from '@/lib/api/tenant-rbac';
import {
  RoleGroup,
  getRoleGroupTypeLabel,
  getRoleGroupTypeColor,
} from '@/types/rbac';
import { RoleGroupFormDialog } from '@/components/rbac';

// ============================================
// Role Group Card Component
// ============================================

interface RoleGroupCardProps {
  roleGroup: RoleGroup;
  tenantSlug: string;
}

function RoleGroupCard({ roleGroup, tenantSlug }: RoleGroupCardProps) {
  return (
    <Link href={`/tenant/${tenantSlug}/rbac/roles/${roleGroup.id}`}>
      <Card className="hover:border-primary-200 hover:shadow-md transition-all cursor-pointer h-full">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Shield className="h-6 w-6" />
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 truncate">
                  {roleGroup.name}
                </h3>
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
                    System
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {roleGroup.description || 'No description'}
              </p>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Key className="h-3.5 w-3.5" />
                  <span>{roleGroup.permissionCount} permissions</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5" />
                  <span>{roleGroup.userCount} users</span>
                </div>
              </div>
            </div>
            
            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================
// Empty State
// ============================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
        <Shield className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No roles found</h3>
      <p className="mt-1 text-sm text-gray-500">
        Community role groups will appear here once created.
      </p>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function TenantRolesPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { profile } = useAuthStore();
  
  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);
  
  // State
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Permissions
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_RBAC_VIEW'] === true;
  const canManage = permissions['TENANT_RBAC_MANAGE'] === true;
  
  // Fetch role groups
  const fetchRoleGroups = useCallback(async (force = false) => {
    if (fetchedRef.current && !force) {
      return;
    }
    fetchedRef.current = true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await listTenantRoleGroups();
      // Sort by display order
      setRoleGroups(result.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err) {
      console.error('Failed to fetch role groups:', err);
      setError('Failed to load roles');
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchRoleGroups();
  }, [fetchRoleGroups]);
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Roles</h1>
          <p className="text-sm text-gray-500">
            Manage role groups and their permissions for community members
          </p>
        </div>
        
        {/* Actions */}
        {canManage && (
          <div className="flex items-center gap-2">
            <Link href={`/tenant/${tenantSlug}/rbac/permissions`}>
              <Button variant="secondary">
                <Key className="h-4 w-4" />
                View Permissions
              </Button>
            </Link>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Role
            </Button>
          </div>
        )}
      </div>
      
      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading roles...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-8 w-8 text-error" />
              <p className="mt-3 font-medium text-gray-900">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchRoleGroups(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : roleGroups.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roleGroups.map((roleGroup) => (
            <RoleGroupCard
              key={roleGroup.id}
              roleGroup={roleGroup}
              tenantSlug={tenantSlug}
            />
          ))}
        </div>
      )}
      
      {/* Create Role Dialog */}
      <RoleGroupFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchRoleGroups(true);
        }}
      />
    </div>
  );
}

