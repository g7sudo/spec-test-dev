'use client';

/**
 * Tenants List Page
 * Platform-level management of communities/tenants
 * Permission: PLATFORM_TENANT_VIEW
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Building2,
  MoreVertical,
  MapPin,
  Loader2,
  AlertCircle,
  UserPlus,
  Archive,
  Edit,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import { listTenants, archiveTenant } from '@/lib/api/tenants';
import {
  TenantSummary,
  TenantStatus,
  getTenantStatusLabel,
  getTenantStatusColor,
  getTenantLocation,
} from '@/types/tenant';
import { TenantFormDialog, InviteAdminDialog } from '@/components/tenants';

// ============================================
// Constants
// ============================================

const PAGE_SIZE = 20;

// ============================================
// Tenant Row Component
// ============================================

interface TenantRowProps {
  tenant: TenantSummary;
  canManage: boolean;
  canUpdate: boolean;
  onView: () => void;
  onEdit: () => void;
  onInviteAdmin: () => void;
  onArchive: () => void;
}

function TenantRow({
  tenant,
  canManage,
  canUpdate,
  onView,
  onEdit,
  onInviteAdmin,
  onArchive,
}: TenantRowProps) {
  return (
    <tr
      className="hover:bg-surface-50 cursor-pointer transition-colors"
      onClick={onView}
    >
      {/* Name & Code */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{tenant.name}</p>
            <p className="text-sm text-gray-500">{tenant.code}</p>
          </div>
        </div>
      </td>

      {/* Location */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-3.5 w-3.5" />
          {getTenantLocation(tenant)}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getTenantStatusColor(
            tenant.status
          )}`}
        >
          {getTenantStatusLabel(tenant.status)}
        </span>
      </td>

      {/* Created */}
      <td className="px-4 py-3 text-sm text-gray-500">
        {new Date(tenant.createdAt).toLocaleDateString()}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            
            {canUpdate && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            
            {canManage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onInviteAdmin(); }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-error"
                  onClick={(e) => { e.stopPropagation(); onArchive(); }}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ============================================
// Empty State
// ============================================

interface EmptyStateProps {
  canManage: boolean;
  onCreateClick: () => void;
}

function EmptyState({ canManage, onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
        <Building2 className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No communities yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating your first community.
      </p>
      {canManage && (
        <Button className="mt-4" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          Create Community
        </Button>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function TenantsPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);

  // State
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantSummary | null>(null);
  const [invitingTenant, setInvitingTenant] = useState<TenantSummary | null>(null);

  // Permissions
  const permissions = profile?.permissions || {};
  const canView = permissions['PLATFORM_TENANT_VIEW'] === true;
  const canManage = permissions['PLATFORM_TENANT_MANAGE'] === true;
  const canUpdate = permissions['PLATFORM_TENANT_UPDATE'] === true;

  // Fetch tenants
  const fetchTenants = useCallback(async (force = false) => {
    // Skip if already fetched (Strict Mode guard), unless forced
    if (fetchedRef.current && !force) {
      return;
    }
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listTenants({
        page,
        pageSize: PAGE_SIZE,
        status: filterStatus !== 'all' ? filterStatus as TenantStatus : undefined,
        search: searchTerm || undefined,
      });

      setTenants(result.items);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setError('Failed to load communities');
      fetchedRef.current = false; // Allow retry on error
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStatus, searchTerm]);

  useEffect(() => {
    fetchedRef.current = false; // Reset when deps change
    fetchTenants();
  }, [fetchTenants]);

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
    setPage(1);
  };

  // Handle archive
  const handleArchive = async (tenant: TenantSummary) => {
    if (!confirm(`Are you sure you want to archive "${tenant.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await archiveTenant(tenant.id);
      fetchTenants(true);
    } catch (err) {
      console.error('Failed to archive tenant:', err);
      alert('Failed to archive community. Please try again.');
    }
  };

  // Navigate to detail
  const navigateToDetail = (tenantId: string) => {
    router.push(`/platform/tenants/${tenantId}`);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsCreateOpen(false);
    setEditingTenant(null);
    fetchTenants(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
          <p className="text-sm text-gray-500">
            Manage tenant communities on the platform
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Community
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search by name, code, or city..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                leftAddon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="0">Pending</SelectItem>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="2">Suspended</SelectItem>
                <SelectItem value="3">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        {isLoading ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading communities...</p>
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
                onClick={() => fetchTenants(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        ) : tenants.length === 0 ? (
          <CardContent>
            <EmptyState canManage={canManage} onCreateClick={() => setIsCreateOpen(true)} />
          </CardContent>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 text-left text-sm font-medium text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Community</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tenants.map((tenant) => (
                    <TenantRow
                      key={tenant.id}
                      tenant={tenant}
                      canManage={canManage}
                      canUpdate={canUpdate}
                      onView={() => navigateToDetail(tenant.id)}
                      onEdit={() => setEditingTenant(tenant)}
                      onInviteAdmin={() => setInvitingTenant(tenant)}
                      onArchive={() => handleArchive(tenant)}
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

      {/* Create/Edit Dialog */}
      <TenantFormDialog
        open={isCreateOpen || !!editingTenant}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingTenant(null);
          }
        }}
        tenant={editingTenant}
        onSuccess={handleFormSuccess}
      />

      {/* Invite Admin Dialog */}
      {invitingTenant && (
        <InviteAdminDialog
          open={!!invitingTenant}
          onOpenChange={(open) => {
            if (!open) setInvitingTenant(null);
          }}
          tenant={invitingTenant}
          onSuccess={() => {
            // Optionally refresh or show toast
          }}
        />
      )}
    </div>
  );
}

