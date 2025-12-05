'use client';

/**
 * Leases List Page
 * Shows all leases across all units in the community
 * Entry point: /tenant/[tenantSlug]/leases
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Loader2,
  ChevronRight,
  Building2,
  User,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
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
import { useAuthStore } from '@/lib/store/auth-store';
import { listLeases } from '@/lib/api/leases';
import {
  LeaseSummary,
  LeaseStatus,
  getLeaseStatusLabel,
  getLeaseStatusColor,
  formatLeasePeriod,
} from '@/types/lease';

// ============================================
// Status Filter Options
// ============================================

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Active', label: 'Active' },
  { value: 'Ended', label: 'Ended' },
  { value: 'Terminated', label: 'Terminated' },
];

// ============================================
// Main Component
// ============================================

export default function LeasesPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const fetchedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Auth & permissions
  const { profile } = useAuthStore();
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_LEASE_VIEW'] === true;

  // Data state
  const [leases, setLeases] = useState<LeaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Load leases
  const loadLeases = useCallback(async (force = false) => {
    if (!canView) return;
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listLeases({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        searchTerm: debouncedSearch || undefined,
        page,
        pageSize,
      });
      setLeases(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / pageSize));
    } catch (err) {
      console.error('Failed to load leases:', err);
      setError('Failed to load leases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [canView, statusFilter, debouncedSearch, page, pageSize]);

  // Initial load
  useEffect(() => {
    loadLeases();
  }, [loadLeases]);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
      fetchedRef.current = false;
    }, 300);
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    fetchedRef.current = false;
  };

  // Reload when filters change
  useEffect(() => {
    loadLeases(true);
  }, [debouncedSearch, statusFilter, page]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Navigate to unit detail (where lease management happens)
  const handleViewLease = (lease: LeaseSummary) => {
    router.push(`/tenant/${tenantSlug}/units/${lease.unitId}`);
  };

  // Get status icon
  const getStatusIcon = (status: LeaseStatus | string) => {
    switch (status) {
      case LeaseStatus.Active:
      case 'Active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case LeaseStatus.Draft:
      case 'Draft':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case LeaseStatus.Ended:
      case 'Ended':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case LeaseStatus.Terminated:
      case 'Terminated':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  // No permission
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FileText className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h2>
        <p className="text-gray-500">
          You don&apos;t have permission to view leases.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
        <p className="text-gray-500 mt-1">
          View and manage leases across all units
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search by unit number or resident name..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                leftAddon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
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

      {/* Leases List */}
      <Card>
        <CardHeader
          title="All Leases"
          description={
            isLoading
              ? 'Loading...'
              : `${totalCount} lease${totalCount !== 1 ? 's' : ''} found`
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
                  loadLeases(true);
                }}
              >
                Retry
              </Button>
            </div>
          ) : leases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'No leases match your filters'
                  : 'No leases found'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Create leases from the Unit detail page
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {leases.map((lease) => (
                <button
                  key={lease.id}
                  type="button"
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors text-left"
                  onClick={() => handleViewLease(lease)}
                >
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      {getStatusIcon(lease.status)}
                    </div>

                    {/* Lease Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {formatLeasePeriod(lease.startDate, lease.endDate)}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLeaseStatusColor(
                            lease.status
                          )}`}
                        >
                          {getLeaseStatusLabel(lease.status)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {/* Unit */}
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          Unit {lease.unitNumber}
                          {lease.blockName && ` • ${lease.blockName}`}
                        </span>

                        {/* Primary Resident */}
                        {lease.primaryResidentName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {lease.primaryResidentName}
                          </span>
                        )}

                        {/* Party Count */}
                        {lease.partyCount > 0 && (
                          <span className="text-gray-400">
                            {lease.partyCount} {lease.partyCount === 1 ? 'party' : 'parties'}
                          </span>
                        )}

                        {/* Monthly Rent */}
                        {lease.monthlyRent && (
                          <span className="text-gray-400">
                            ${lease.monthlyRent.toLocaleString()}/mo
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

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <p>
          <strong>Tip:</strong> To create or manage a lease, click on a lease to go to its unit page, 
          or navigate to <strong>Units</strong> and select a unit to create a new lease.
        </p>
      </div>
    </div>
  );
}

