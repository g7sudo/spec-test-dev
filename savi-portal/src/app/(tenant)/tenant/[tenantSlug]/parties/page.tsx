'use client';

/**
 * Parties List Page
 * Shows all parties with search, filter, and pagination
 * Permission: TENANT_PARTY_VIEW
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Plus,
  Search,
  User,
  Building2,
  Briefcase,
  MoreVertical,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  Users,
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
import { listParties, deleteParty } from '@/lib/api/parties';
import {
  Party,
  PartyType,
  PartyContactType,
  getPartyTypeLabel,
  getPrimaryContact,
} from '@/types/party';
import { PartyFormDialog } from '@/components/parties/PartyFormDialog';

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
// Party Row Component
// ============================================

interface PartyRowProps {
  party: Party;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PartyRow({ party, canManage, onView, onEdit, onDelete }: PartyRowProps) {
  const primaryEmail = getPrimaryContact(party.contacts, PartyContactType.Email);
  const primaryPhone = getPrimaryContact(party.contacts, PartyContactType.Mobile) ||
    getPrimaryContact(party.contacts, PartyContactType.Phone);

  return (
    <tr
      className="hover:bg-surface-50 cursor-pointer transition-colors"
      onClick={onView}
    >
      {/* Name & Type */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <PartyTypeIcon type={party.partyType} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{party.partyName}</p>
            <p className="text-sm text-gray-500">
              {getPartyTypeLabel(party.partyType)}
            </p>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          {primaryEmail && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-3.5 w-3.5" />
              {primaryEmail.value}
            </div>
          )}
          {primaryPhone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-3.5 w-3.5" />
              {primaryPhone.value}
            </div>
          )}
          {!primaryEmail && !primaryPhone && (
            <span className="text-sm text-gray-400">No contact info</span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            party.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {party.isActive ? 'Active' : 'Inactive'}
        </span>
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
              View Details
            </DropdownMenuItem>
            {canManage && (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-error"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
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
        <Users className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No parties yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating your first party.
      </p>
      {canManage && (
        <Button className="mt-4" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          Create Party
        </Button>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function PartiesPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { profile } = useAuthStore();

  // State
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Permissions
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_PARTY_VIEW'] === true;
  const canManage = permissions['TENANT_PARTY_MANAGE'] === true;

  // Fetch parties
  const fetchParties = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listParties({
        page,
        pageSize: PAGE_SIZE,
        partyType: filterType !== 'all' ? filterType as PartyType : undefined,
        searchTerm: searchTerm || undefined,
      });

      setParties(result.items);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch parties:', err);
      setError('Failed to load parties');
    } finally {
      setIsLoading(false);
    }
  }, [page, filterType, searchTerm]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

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

  // Handle delete
  const handleDelete = async (party: Party) => {
    if (!confirm(`Are you sure you want to delete "${party.partyName}"?`)) {
      return;
    }

    try {
      await deleteParty(party.id);
      fetchParties();
    } catch (err) {
      console.error('Failed to delete party:', err);
      alert('Failed to delete party. It may be in use by other records.');
    }
  };

  // Navigate to detail
  const navigateToDetail = (partyId: string) => {
    router.push(`/tenant/${tenantSlug}/parties/${partyId}`);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsCreateOpen(false);
    setEditingParty(null);
    fetchParties();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parties</h1>
          <p className="text-sm text-gray-500">
            Manage individuals, companies, and entities
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Party
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
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        {isLoading ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading parties...</p>
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
                onClick={fetchParties}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        ) : parties.length === 0 ? (
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
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parties.map((party) => (
                    <PartyRow
                      key={party.id}
                      party={party}
                      canManage={canManage}
                      onView={() => navigateToDetail(party.id)}
                      onEdit={() => setEditingParty(party)}
                      onDelete={() => handleDelete(party)}
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
      <PartyFormDialog
        open={isCreateOpen || !!editingParty}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingParty(null);
          }
        }}
        party={editingParty}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

