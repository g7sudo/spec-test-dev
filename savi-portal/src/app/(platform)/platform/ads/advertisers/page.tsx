'use client';

/**
 * Advertisers List Page
 * Platform-level advertiser management
 * Permission: PLATFORM_ADVERTISERS_VIEW
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Building,
  MoreVertical,
  Loader2,
  AlertCircle,
  Edit,
  Eye,
  Trash2,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import { listAdvertisers, deleteAdvertiser } from '@/lib/api/ads';
import { Advertiser } from '@/types/ads';
import { AdvertiserFormDialog } from '@/components/ads';

// ============================================
// Constants
// ============================================

const PAGE_SIZE = 20;

// ============================================
// Advertiser Row Component
// ============================================

interface AdvertiserRowProps {
  advertiser: Advertiser;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onViewAnalytics: () => void;
  onDelete: () => void;
}

function AdvertiserRow({
  advertiser,
  canManage,
  onView,
  onEdit,
  onViewAnalytics,
  onDelete,
}: AdvertiserRowProps) {
  return (
    <tr className="hover:bg-surface-50 cursor-pointer transition-colors" onClick={onView}>
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{advertiser.name}</p>
            {advertiser.contactName && (
              <p className="text-sm text-gray-500">{advertiser.contactName}</p>
            )}
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-4 py-3">
        <div className="text-sm">
          {advertiser.contactEmail && (
            <p className="text-gray-600">{advertiser.contactEmail}</p>
          )}
          {advertiser.contactPhone && (
            <p className="text-gray-500">{advertiser.contactPhone}</p>
          )}
          {!advertiser.contactEmail && !advertiser.contactPhone && (
            <p className="text-gray-400">No contact info</p>
          )}
        </div>
      </td>

      {/* Campaigns */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700">
          {advertiser.campaignCount} campaigns
        </span>
      </td>

      {/* Created */}
      <td className="px-4 py-3 text-sm text-gray-500">
        {new Date(advertiser.createdAt).toLocaleDateString()}
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
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onViewAnalytics();
              }}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </DropdownMenuItem>

            {canManage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
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
        <Building className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No advertisers yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by adding your first advertiser.
      </p>
      {canManage && (
        <Button className="mt-4" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          Add Advertiser
        </Button>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function AdvertisersPage() {
  const router = useRouter();
  const { profile } = useAuthStore();

  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);

  // State
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<Advertiser | null>(null);

  // Permissions (singular form: PLATFORM_ADVERTISER_*)
  const permissions = profile?.permissions || {};
  const canView = permissions['PLATFORM_ADVERTISER_VIEW'] === true;
  const canCreate = permissions['PLATFORM_ADVERTISER_CREATE'] === true;
  const canUpdate = permissions['PLATFORM_ADVERTISER_UPDATE'] === true;
  const canDelete = permissions['PLATFORM_ADVERTISER_DELETE'] === true;
  const canManage = canCreate || canUpdate || canDelete;

  // Fetch advertisers
  const fetchAdvertisers = useCallback(
    async (force = false) => {
      if (fetchedRef.current && !force) return;
      fetchedRef.current = true;

      setIsLoading(true);
      setError(null);

      try {
        const result = await listAdvertisers({
          page,
          pageSize: PAGE_SIZE,
          searchTerm: searchTerm || undefined,
        });

        setAdvertisers(result.items);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error('Failed to fetch advertisers:', err);
        setError('Failed to load advertisers');
        fetchedRef.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [page, searchTerm]
  );

  useEffect(() => {
    fetchedRef.current = false;
    fetchAdvertisers();
  }, [fetchAdvertisers]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  // Handle delete
  const handleDelete = async (advertiser: Advertiser) => {
    if (advertiser.campaignCount > 0) {
      alert(
        `Cannot delete "${advertiser.name}" because it has ${advertiser.campaignCount} campaign(s). Delete the campaigns first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete "${advertiser.name}"?`)) {
      return;
    }

    try {
      await deleteAdvertiser(advertiser.id);
      fetchAdvertisers(true);
    } catch (err) {
      console.error('Failed to delete advertiser:', err);
      alert('Failed to delete advertiser. Please try again.');
    }
  };

  // Navigate to detail
  const navigateToDetail = (advertiserId: string) => {
    router.push(`/platform/ads/advertisers/${advertiserId}`);
  };

  // Navigate to analytics
  const navigateToAnalytics = (advertiserId: string) => {
    router.push(`/platform/ads/advertisers/${advertiserId}?tab=analytics`);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingAdvertiser(null);
    fetchAdvertisers(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/platform/ads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advertisers</h1>
            <p className="text-sm text-gray-500">Manage advertising partners</p>
          </div>
        </div>

        {canCreate && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Advertiser
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            leftAddon={<Search className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        {isLoading ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading advertisers...</p>
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
                onClick={() => fetchAdvertisers(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        ) : advertisers.length === 0 ? (
          <CardContent>
            <EmptyState canManage={canCreate} onCreateClick={() => setIsFormOpen(true)} />
          </CardContent>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 text-left text-sm font-medium text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Advertiser</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Campaigns</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {advertisers.map((advertiser) => (
                    <AdvertiserRow
                      key={advertiser.id}
                      advertiser={advertiser}
                      canManage={canManage}
                      onView={() => navigateToDetail(advertiser.id)}
                      onEdit={() => setEditingAdvertiser(advertiser)}
                      onViewAnalytics={() => navigateToAnalytics(advertiser.id)}
                      onDelete={() => handleDelete(advertiser)}
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
      <AdvertiserFormDialog
        open={isFormOpen || !!editingAdvertiser}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingAdvertiser(null);
          }
        }}
        advertiser={editingAdvertiser}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

