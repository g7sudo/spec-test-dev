'use client';

/**
 * Platform RBAC Roles Page
 * Lists all platform roles with permission counts
 * Permission: PLATFORM_RBAC_VIEW
 * 
 * Flow: F-RBAC-PLAT-01 – View Platform Roles Overview
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Users,
  ChevronRight,
  Loader2,
  AlertCircle,
  Key,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { listPlatformRoles } from '@/lib/api/platform-rbac';
import { PlatformRole } from '@/types/rbac';

// ============================================
// Role Card Component
// ============================================

interface RoleCardProps {
  role: PlatformRole;
}

function RoleCard({ role }: RoleCardProps) {
  return (
    <Link href={`/platform/rbac/roles/${role.id}`}>
      <Card className="hover:border-primary-200 hover:shadow-md transition-all cursor-pointer h-full">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Shield className="h-6 w-6" />
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {role.name}
                </h3>
                {role.isSystem && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                    <Lock className="h-3 w-3" />
                    System
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {role.description || 'No description'}
              </p>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Key className="h-3.5 w-3.5" />
                  <span>{role.permissionCount} permissions</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5" />
                  <span>{role.userCount} users</span>
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
        Platform roles will appear here once created.
      </p>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function PlatformRolesPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);
  
  // State
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Permissions
  const permissions = profile?.permissions || {};
  const canView = permissions['PLATFORM_RBAC_VIEW'] === true;
  const canManage = permissions['PLATFORM_RBAC_MANAGE'] === true;
  
  // Fetch roles
  const fetchRoles = useCallback(async (force = false) => {
    // Skip if already fetched (Strict Mode guard), unless forced
    if (fetchedRef.current && !force) {
      return;
    }
    fetchedRef.current = true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await listPlatformRoles();
      setRoles(result);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setError('Failed to load roles');
      fetchedRef.current = false; // Allow retry on error
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Roles</h1>
          <p className="text-sm text-gray-500">
            Manage roles and their permissions for platform administrators
          </p>
        </div>
        
        {/* Optional: Link to view all permissions */}
        {canManage && (
          <Link href="/platform/rbac/permissions">
            <Button variant="secondary">
              <Key className="h-4 w-4" />
              View All Permissions
            </Button>
          </Link>
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
                onClick={() => fetchRoles(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}

