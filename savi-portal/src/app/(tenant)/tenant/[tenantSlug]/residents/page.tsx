'use client';

/**
 * Residents List Page (Flow 1)
 * Entry point for Community Admin to manage residents
 * Shows all current, upcoming, and past residents with filters
 * 
 * Route: /tenant/[tenantSlug]/residents
 * Permission: TENANT_LEASE_VIEW (view) / TENANT_LEASE_MANAGE (actions)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Loader2,
  ChevronRight,
  Building2,
  Home,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  LogOut,
  Send,
  MoreVertical,
  UserPlus,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import { listResidents } from '@/lib/api/residents';
import {
  Resident,
  getResidentStatusColor,
  getResidentRoleColor,
  canMoveOutResident,
  canInviteResident,
} from '@/types/resident';
import { LeasePartyRole } from '@/types/lease';
import { MoveOutResidentDialog } from '@/components/residents';
import { SendResidentInviteDialog } from '@/components/leases';

// ============================================
// Status Filter Options
// ============================================

const statusOptions = [
  { value: 'all', label: 'All Residents' },
  { value: 'Current', label: 'Current Residents' },
  { value: 'Upcoming', label: 'Upcoming Move-ins' },
  { value: 'Past', label: 'Past Residents' },
];

const appAccessOptions = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Has App Access' },
  { value: 'no', label: 'No App Access' },
];

// ============================================
// Status Icon Component
// ============================================

function StatusIcon({ statusText }: { statusText: string }) {
  switch (statusText) {
    case 'Current':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'Upcoming':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'Past':
      return <XCircle className="h-4 w-4 text-gray-400" />;
    default:
      return <User className="h-4 w-4 text-gray-400" />;
  }
}

// ============================================
// Resident Row Component
// ============================================

interface ResidentRowProps {
  resident: Resident;
  canManage: boolean;
  onView: () => void;
  onMoveOut: () => void;
  onInvite: () => void;
  onViewUnit: () => void;
}

function ResidentRow({
  resident,
  canManage,
  onView,
  onMoveOut,
  onInvite,
  onViewUnit,
}: ResidentRowProps) {
  const canDoMoveOut = canManage && canMoveOutResident(resident.status);
  const canDoInvite = canManage && canInviteResident(resident);

  return (
    <tr className="hover:bg-surface-50 transition-colors">
      {/* Name & Contact */}
      <td className="px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-3 text-left w-full"
          onClick={onView}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{resident.residentName}</p>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {resident.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {resident.email}
                </span>
              )}
              {resident.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {resident.phone}
                </span>
              )}
            </div>
          </div>
        </button>
      </td>

      {/* Unit */}
      <td className="px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600 transition-colors"
          onClick={onViewUnit}
        >
          <Home className="h-4 w-4" />
          <span>Unit {resident.unitNumber}</span>
          {resident.blockName && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{resident.blockName}</span>
            </>
          )}
        </button>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getResidentStatusColor(
            resident.statusText
          )}`}
        >
          <StatusIcon statusText={resident.statusText} />
          {resident.statusText}
        </span>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getResidentRoleColor(
            resident.roleText
          )}`}
        >
          {resident.roleText}
        </span>
      </td>

      {/* App Access */}
      <td className="px-4 py-3">
        {resident.hasAppAccess ? (
          <span className="inline-flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-gray-400">
            <XCircle className="h-4 w-4" />
            No
          </span>
        )}
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
            <DropdownMenuItem onClick={onView}>
              <User className="h-4 w-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onViewUnit}>
              <Home className="h-4 w-4 mr-2" />
              View Unit
            </DropdownMenuItem>
            
            {(canDoInvite || canDoMoveOut) && <DropdownMenuSeparator />}
            
            {canDoInvite && (
              <DropdownMenuItem onClick={onInvite}>
                <Send className="h-4 w-4 mr-2" />
                Invite to App
              </DropdownMenuItem>
            )}
            {canDoMoveOut && (
              <DropdownMenuItem
                onClick={onMoveOut}
                className="text-amber-600 focus:text-amber-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Move Out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  hasFilters: boolean;
}

function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
        <Users className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        {hasFilters ? 'No residents match your filters' : 'No residents yet'}
      </h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        {hasFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Residents are added when you create leases from the Units page.'}
      </p>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function ResidentsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const fetchedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Auth & permissions
  const { profile } = useAuthStore();
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_LEASE_VIEW'] === true;
  const canManage = permissions['TENANT_LEASE_MANAGE'] === true;

  // Data state
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [appAccessFilter, setAppAccessFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Dialog state
  const [moveOutResident, setMoveOutResident] = useState<Resident | null>(null);
  const [inviteResident, setInviteResident] = useState<Resident | null>(null);

  // Get co-residents for move-out dialog (same lease)
  const coResidents = moveOutResident
    ? residents.filter(
        (r) =>
          r.leaseId === moveOutResident.leaseId &&
          r.leasePartyId !== moveOutResident.leasePartyId
      )
    : [];

  // Track previous deps to detect ACTUAL changes (not Strict Mode re-runs)
  const prevDepsRef = useRef({ statusFilter, appAccessFilter, debouncedSearch, page });

  // Load residents
  const loadResidents = useCallback(
    async (force = false) => {
      if (!canView) return;
      if (!force && fetchedRef.current) return;
      fetchedRef.current = true;

      setIsLoading(true);
      setError(null);

      try {
        const result = await listResidents({
          status:
            statusFilter !== 'all'
              ? statusFilter
              : undefined,
          hasAppAccess:
            appAccessFilter === 'yes'
              ? true
              : appAccessFilter === 'no'
              ? false
              : undefined,
          searchTerm: debouncedSearch || undefined,
          page,
          pageSize,
        });
        setResidents(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(Math.ceil(result.totalCount / pageSize));
      } catch (err) {
        console.error('Failed to load residents:', err);
        setError('Failed to load residents. Please try again.');
        fetchedRef.current = false; // Allow retry on error
      } finally {
        setIsLoading(false);
      }
    },
    [canView, statusFilter, appAccessFilter, debouncedSearch, page, pageSize]
  );

  // Reset guard ONLY when deps actually change (separate effect per guidelines)
  useEffect(() => {
    const prev = prevDepsRef.current;
    const changed =
      prev.statusFilter !== statusFilter ||
      prev.appAccessFilter !== appAccessFilter ||
      prev.debouncedSearch !== debouncedSearch ||
      prev.page !== page;

    if (changed) {
      fetchedRef.current = false; // Reset ONLY on actual change
      prevDepsRef.current = { statusFilter, appAccessFilter, debouncedSearch, page };
    }
  }, [statusFilter, appAccessFilter, debouncedSearch, page]);

  // Fetch effect - guard prevents Strict Mode double call
  useEffect(() => {
    loadResidents();
  }, [loadResidents]);

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

  // Handle filter changes
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleAppAccessChange = (value: string) => {
    setAppAccessFilter(value);
    setPage(1);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Navigation handlers
  const navigateToResident = (partyId: string) => {
    router.push(`/tenant/${tenantSlug}/residents/${partyId}`);
  };

  const navigateToUnit = (unitId: string) => {
    router.push(`/tenant/${tenantSlug}/units/${unitId}`);
  };

  // Dialog success handlers - use force refresh
  const handleMoveOutSuccess = () => {
    setMoveOutResident(null);
    loadResidents(true); // Force bypasses guard
  };

  const handleInviteSuccess = () => {
    setInviteResident(null);
    loadResidents(true); // Force bypasses guard
  };

  // Check if any filters are active
  const hasFilters =
    searchTerm !== '' || statusFilter !== 'all' || appAccessFilter !== 'all';

  // No permission
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h2>
        <p className="text-gray-500">
          You don&apos;t have permission to view residents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
          <p className="text-gray-500 mt-1">
            Manage all residents across your community
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or phone..."
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

            {/* App Access Filter */}
            <div className="w-full sm:w-40">
              <Select
                value={appAccessFilter}
                onValueChange={handleAppAccessChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="App Access" />
                </SelectTrigger>
                <SelectContent>
                  {appAccessOptions.map((opt) => (
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

      {/* Residents List Card */}
      <Card>
        <CardHeader
          title="All Residents"
          description={
            isLoading
              ? 'Loading...'
              : `${totalCount} resident${totalCount !== 1 ? 's' : ''} found`
          }
        />

        {isLoading ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading residents...</p>
            </div>
          </CardContent>
        ) : error ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-red-300 mb-3" />
              <p className="text-red-600">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => loadResidents(true)}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        ) : residents.length === 0 ? (
          <CardContent>
            <EmptyState hasFilters={hasFilters} />
          </CardContent>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 text-left text-sm font-medium text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Resident</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">App Access</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {residents.map((resident) => (
                    <ResidentRow
                      key={resident.leasePartyId}
                      resident={resident}
                      canManage={canManage}
                      onView={() => navigateToResident(resident.partyId)}
                      onMoveOut={() => setMoveOutResident(resident)}
                      onInvite={() => setInviteResident(resident)}
                      onViewUnit={() => navigateToUnit(resident.unitId)}
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
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <p>
          <strong>Tip:</strong> To add new residents, go to{' '}
          <strong>Units</strong> → select a unit → manage the lease and add
          residents there. Residents can only be added to units with an active
          lease.
        </p>
      </div>

      {/* Move Out Dialog */}
      <MoveOutResidentDialog
        open={!!moveOutResident}
        onOpenChange={(open) => !open && setMoveOutResident(null)}
        resident={moveOutResident}
        coResidents={coResidents}
        onSuccess={handleMoveOutSuccess}
      />

      {/* Invite Dialog */}
      {inviteResident && (
        <SendResidentInviteDialog
          open={!!inviteResident}
          onOpenChange={(open) => !open && setInviteResident(null)}
          leaseId={inviteResident.leaseId}
          leaseParty={{
            id: inviteResident.leasePartyId,
            leaseId: inviteResident.leaseId,
            partyId: inviteResident.partyId,
            partyName: inviteResident.residentName, // Map residentName to partyName for dialog
            partyType: inviteResident.partyType,
            communityUserId: inviteResident.communityUserId,
            role: inviteResident.role as LeasePartyRole,
            isPrimary: inviteResident.isPrimary,
            moveInDate: inviteResident.moveInDate,
            moveOutDate: inviteResident.moveOutDate,
            hasAppAccount: inviteResident.hasAppAccess,
            isCurrentlyResiding: inviteResident.statusText === 'Current',
            isActive: true,
          }}
          partyEmail={inviteResident.email}
          onSuccess={handleInviteSuccess}
        />
      )}
    </div>
  );
}


