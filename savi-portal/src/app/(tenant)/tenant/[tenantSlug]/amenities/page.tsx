'use client';

/**
 * Amenities List Page
 * Shows all amenities in the community with filtering
 * Entry point: /tenant/[tenantSlug]/amenities
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building,
  Search,
  Loader2,
  ChevronRight,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Wrench,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { AmenityFormDialog } from '@/components/amenities';
import { useAuthStore } from '@/lib/store/auth-store';
import { listAmenities } from '@/lib/api/amenities';
import {
  AmenitySummary,
  AmenityStatus,
  AmenityType,
  getAmenityTypeLabel,
  getAmenityStatusLabel,
  getAmenityStatusColor,
  AMENITY_TYPE_OPTIONS,
  AMENITY_STATUS_OPTIONS,
} from '@/types/amenity';

// ============================================
// Filter Options
// ============================================

const typeOptions = [
  { value: 'all', label: 'All Types' },
  ...AMENITY_TYPE_OPTIONS,
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  ...AMENITY_STATUS_OPTIONS,
];

// ============================================
// Amenity Type Icon
// ============================================

function AmenityTypeIcon({ type }: { type: AmenityType | string }) {
  // Return a generic building icon - can be expanded with specific icons
  return <Building className="h-5 w-5" />;
}

// ============================================
// Status Icon
// ============================================

function StatusIcon({ status }: { status: AmenityStatus | string }) {
  switch (status) {
    case AmenityStatus.Active:
    case 'Active':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case AmenityStatus.Inactive:
    case 'Inactive':
      return <XCircle className="h-4 w-4 text-gray-400" />;
    case AmenityStatus.UnderMaintenance:
    case 'UnderMaintenance':
      return <Wrench className="h-4 w-4 text-yellow-500" />;
    case AmenityStatus.Closed:
    case 'Closed':
      return <Clock className="h-4 w-4 text-red-500" />;
    default:
      return <Building className="h-4 w-4 text-gray-400" />;
  }
}

// ============================================
// Main Component
// ============================================

export default function AmenitiesPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const fetchedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  // Track previous deps to detect ACTUAL changes (not Strict Mode re-runs or initial mount)
  const prevDepsRef = useRef<{ search: string; type: string; status: string; page: number } | null>(null);

  // Auth & permissions
  const { profile } = useAuthStore();
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_AMENITY_VIEW'] === true;
  const canManage = permissions['TENANT_AMENITY_MANAGE'] === true;

  // Data state
  const [amenities, setAmenities] = useState<AmenitySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Load amenities
  const loadAmenities = useCallback(
    async (force = false) => {
      if (!canView) return;
      if (!force && fetchedRef.current) return;
      fetchedRef.current = true;

      setIsLoading(true);
      setError(null);

      try {
        const result = await listAmenities({
          type: typeFilter !== 'all' ? (typeFilter as AmenityType) : undefined,
          status: statusFilter !== 'all' ? (statusFilter as AmenityStatus) : undefined,
          searchTerm: debouncedSearch || undefined,
          page,
          pageSize,
        });
        setAmenities(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(Math.ceil(result.totalCount / pageSize));
      } catch (err) {
        console.error('Failed to load amenities:', err);
        setError('Failed to load amenities. Please try again.');
        fetchedRef.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [canView, typeFilter, statusFilter, debouncedSearch, page, pageSize]
  );

  // Initial load
  useEffect(() => {
    loadAmenities();
  }, [loadAmenities]);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  // Handle type filter change
  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  // Reload when filters ACTUALLY change (not on initial mount)
  useEffect(() => {
    const currentDeps = { search: debouncedSearch, type: typeFilter, status: statusFilter, page };
    
    // Skip initial mount - let the other useEffect handle it
    if (prevDepsRef.current === null) {
      prevDepsRef.current = currentDeps;
      return;
    }
    
    // Check if deps actually changed
    const prev = prevDepsRef.current;
    const changed = 
      prev.search !== currentDeps.search ||
      prev.type !== currentDeps.type ||
      prev.status !== currentDeps.status ||
      prev.page !== currentDeps.page;
    
    if (changed) {
      prevDepsRef.current = currentDeps;
      fetchedRef.current = false; // Reset guard for actual changes
      loadAmenities();
    }
  }, [debouncedSearch, typeFilter, statusFilter, page, loadAmenities]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Navigate to amenity detail
  const handleViewAmenity = (amenity: AmenitySummary) => {
    router.push(`/tenant/${tenantSlug}/amenities/${amenity.id}`);
  };

  // Handle create success
  const handleCreateSuccess = () => {
    fetchedRef.current = false;
    loadAmenities(true);
  };

  // No permission
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Building className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">
          You don&apos;t have permission to view amenities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amenities</h1>
          <p className="text-gray-500 mt-1">
            Manage community amenities and booking settings
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Amenity
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search by name, code, or description..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                leftAddon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Type Filter */}
            <div className="w-full sm:w-40">
              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-40">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amenities List */}
      <Card>
        <CardHeader
          title="All Amenities"
          description={
            isLoading
              ? 'Loading...'
              : `${totalCount} amenity${totalCount !== 1 ? 's' : ''} found`
          }
        />
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-300 mb-3" />
              <p className="text-red-600">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  fetchedRef.current = false;
                  loadAmenities(true);
                }}
              >
                Retry
              </Button>
            </div>
          ) : amenities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'No amenities match your filters'
                  : 'No amenities configured yet'}
              </p>
              {canManage && !searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add First Amenity
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {amenities.map((amenity) => (
                <button
                  key={amenity.id}
                  type="button"
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors text-left"
                  onClick={() => handleViewAmenity(amenity)}
                >
                  <div className="flex items-center gap-4">
                    {/* Type Icon */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                      <AmenityTypeIcon type={amenity.type} />
                    </div>

                    {/* Amenity Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {amenity.name}
                        </span>
                        {amenity.code && (
                          <span className="text-xs text-gray-400">
                            ({amenity.code})
                          </span>
                        )}
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getAmenityStatusColor(
                            amenity.status
                          )}`}
                        >
                          {getAmenityStatusLabel(amenity.status)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {/* Type */}
                        <span>{getAmenityTypeLabel(amenity.type)}</span>

                        {/* Location */}
                        {amenity.locationText && (
                          <span className="text-gray-400">
                            {amenity.locationText}
                          </span>
                        )}

                        {/* Bookable */}
                        {amenity.isBookable ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Bookable
                          </span>
                        ) : (
                          <span className="text-gray-400">Not bookable</span>
                        )}

                        {/* Requires Approval */}
                        {amenity.isBookable && amenity.requiresApproval && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Clock className="h-3.5 w-3.5" />
                            Requires Approval
                          </span>
                        )}

                        {/* Deposit */}
                        {amenity.depositRequired && amenity.depositAmount && (
                          <span className="text-gray-400">
                            Deposit: ${amenity.depositAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => p - 1);
                    fetchedRef.current = false;
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((p) => p + 1);
                    fetchedRef.current = false;
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Amenity Dialog */}
      <AmenityFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

