'use client';

/**
 * Owners List Page (F-OWN-06)
 * Global Ownership View showing all parties that own units
 * URL: /tenant/{slug}/ownership
 * Permission: TENANT_OWNERSHIP_VIEW
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Search,
  User,
  Building2,
  Briefcase,
  MoreVertical,
  Loader2,
  AlertCircle,
  KeyRound,
  Home,
  Clock,
  UserCheck,
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
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import { listOwners } from '@/lib/api/ownership';
import { OwnerSummary } from '@/types/ownership';
import { PartyType, getPartyTypeLabel } from '@/types/party';

// ============================================
// Constants
// ============================================

const PAGE_SIZE = 20;

// ============================================
// Party Type Icon
// ============================================

function PartyTypeIcon({ type }: { type: PartyType }) {
  switch (type) {
    case PartyType.Individual:
      return <User className="h-5 w-5" />;
    case PartyType.Company:
      return <Building2 className="h-5 w-5" />;
    case PartyType.Entity:
      return <Briefcase className="h-5 w-5" />;
    default:
      return <User className="h-5 w-5" />;
  }
}

// ============================================
// Owner Row Component
// ============================================

interface OwnerRowProps {
  owner: OwnerSummary;
  onView: () => void;
  onViewParty: () => void;
}

function OwnerRow({ owner, onView, onViewParty }: OwnerRowProps) {
  // Format the last activity date
  const formatLastActivity = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <tr
      className="hover:bg-surface-50 cursor-pointer transition-colors"
      onClick={onView}
    >
      {/* Owner Name & Type */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <PartyTypeIcon type={owner.partyType} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{owner.partyName}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{getPartyTypeLabel(owner.partyType)}</span>
              {owner.hasCommunityUserAccount && (
                <span className="flex items-center gap-1 text-green-600">
                  <UserCheck className="h-3.5 w-3.5" />
                  Has Account
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {owner.primaryContact || <span className="text-gray-400">—</span>}
      </td>

      {/* Active Units */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{owner.activeOwnedUnitCount}</span>
          <span className="text-sm text-gray-500">active</span>
        </div>
      </td>

      {/* Total Historical */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {owner.totalHistoricalUnitsCount} total
      </td>

      {/* Last Activity */}
      <td className="px-4 py-3 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          {formatLastActivity(owner.lastOwnershipActivityDate)}
        </div>
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
              View Ownership Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewParty(); }}>
              View Party Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        <KeyRound className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No owners yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Ownership records will appear here once units have owners assigned.
      </p>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function OwnersPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { profile } = useAuthStore();

  // Guard against double fetch in Strict Mode
  const fetchedRef = useRef(false);

  // Data state
  const [owners, setOwners] = useState<OwnerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentOwnersOnly, setCurrentOwnersOnly] = useState(true);

  // Permissions
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_OWNERSHIP_VIEW'] === true;

  // Fetch owners
  const fetchOwners = useCallback(async (force = false) => {
    // Guard against double fetch in Strict Mode
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listOwners({
        page,
        pageSize: PAGE_SIZE,
        searchTerm: searchTerm || undefined,
        partyType: filterType !== 'all' ? parseInt(filterType) : undefined,
        currentOwnersOnly,
      });

      setOwners(result.items);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch owners:', err);
      setError('Failed to load owners');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, filterType, currentOwnersOnly]);

  // Fetch on filter changes
  useEffect(() => {
    fetchedRef.current = false;
    fetchOwners();
  }, [fetchOwners]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setPage(1);
  };

  // Toggle current owners only
  const handleCurrentToggle = (checked: boolean) => {
    setCurrentOwnersOnly(checked);
    setPage(1);
  };

  // Navigate to owner detail
  const navigateToOwnerDetail = (partyId: string) => {
    router.push(`/tenant/${tenantSlug}/ownership/${partyId}`);
  };

  // Navigate to party detail
  const navigateToPartyDetail = (partyId: string) => {
    router.push(`/tenant/${tenantSlug}/parties/${partyId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ownership</h1>
          <p className="text-sm text-gray-500">
            View all unit owners and their ownership history
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                leftAddon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="0">Individual</SelectItem>
                <SelectItem value="1">Company</SelectItem>
                <SelectItem value="2">Entity</SelectItem>
              </SelectContent>
            </Select>

            {/* Current Owners Toggle */}
            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={currentOwnersOnly}
                onChange={(e) => handleCurrentToggle(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Current owners only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card noPadding>
        {isLoading ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading owners...</p>
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
                onClick={() => fetchOwners(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        ) : owners.length === 0 ? (
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
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Active Units</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Last Activity</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {owners.map((owner) => (
                    <OwnerRow
                      key={owner.partyId}
                      owner={owner}
                      onView={() => navigateToOwnerDetail(owner.partyId)}
                      onViewParty={() => navigateToPartyDetail(owner.partyId)}
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
    </div>
  );
}


