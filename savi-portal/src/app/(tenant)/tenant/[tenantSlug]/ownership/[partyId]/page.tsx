'use client';

/**
 * Owner Detail Page (F-OWN-07)
 * Party-centric ownership view showing all units owned by a party
 * URL: /tenant/{slug}/ownership/{partyId}
 * Permission: TENANT_OWNERSHIP_VIEW
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Building2,
  Briefcase,
  Loader2,
  AlertCircle,
  ChevronRight,
  Home,
  Star,
  ArrowUpRight,
  Mail,
  Phone,
  UserCheck,
  KeyRound,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { getPartyById } from '@/lib/api/parties';
import { getOwnershipsByParty } from '@/lib/api/ownership';
import { Party, PartyType, getPartyTypeLabel, PartyContactType, getPrimaryContact } from '@/types/party';
import {
  UnitOwnership,
  formatDateOnly,
  formatOwnershipPeriod,
  getOwnershipStatusColor,
  getOwnershipStatusLabel,
} from '@/types/ownership';

// ============================================
// Party Type Icon
// ============================================

function PartyTypeIcon({ type, size = 'md' }: { type: PartyType; size?: 'md' | 'lg' }) {
  const className = size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
  switch (type) {
    case PartyType.Individual:
      return <User className={className} />;
    case PartyType.Company:
      return <Building2 className={className} />;
    case PartyType.Entity:
      return <Briefcase className={className} />;
    default:
      return <User className={className} />;
  }
}

// ============================================
// Breadcrumb
// ============================================

interface BreadcrumbProps {
  tenantSlug: string;
  partyName: string;
}

function Breadcrumb({ tenantSlug, partyName }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        href={`/tenant/${tenantSlug}/ownership`}
        className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors"
      >
        <KeyRound className="h-4 w-4" />
        Ownership
      </Link>
      <ChevronRight className="h-4 w-4 text-gray-400" />
      <span className="font-medium text-gray-900">{partyName}</span>
    </nav>
  );
}

// ============================================
// Owner Header Panel
// ============================================

interface OwnerHeaderPanelProps {
  party: Party;
  tenantSlug: string;
  activeUnitsCount: number;
}

function OwnerHeaderPanel({ party, tenantSlug, activeUnitsCount }: OwnerHeaderPanelProps) {
  // Get primary contact info
  const primaryEmail = getPrimaryContact(party.contacts, PartyContactType.Email);
  const primaryPhone = getPrimaryContact(party.contacts, PartyContactType.Mobile) ||
    getPrimaryContact(party.contacts, PartyContactType.Phone);

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Party Info */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <PartyTypeIcon type={party.partyType} size="lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{party.partyName}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{getPartyTypeLabel(party.partyType)}</span>
                {party.legalName && party.legalName !== party.partyName && (
                  <span className="text-gray-400">({party.legalName})</span>
                )}
              </div>
              
              {/* Contact Info */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {primaryEmail && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {primaryEmail.value}
                  </span>
                )}
                {primaryPhone && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {primaryPhone.value}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats & Actions */}
          <div className="flex flex-col items-end gap-3">
            {/* Active Units Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
              <Home className="h-4 w-4 text-primary-600" />
              <span className="font-semibold text-primary-700">{activeUnitsCount}</span>
              <span className="text-sm text-primary-600">active unit{activeUnitsCount !== 1 ? 's' : ''}</span>
            </div>

            {/* Link to Party Profile */}
            <Link
              href={`/tenant/${tenantSlug}/parties/${party.id}`}
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              View Party Profile
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Ownership Card Component
// ============================================

interface OwnershipCardProps {
  ownership: UnitOwnership;
  tenantSlug: string;
}

function OwnershipCard({ ownership, tenantSlug }: OwnershipCardProps) {
  const router = useRouter();

  return (
    <div
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-surface-50 cursor-pointer transition-colors"
      onClick={() => router.push(`/tenant/${tenantSlug}/units/${ownership.unitId}`)}
    >
      <div className="flex items-center gap-4">
        {/* Unit Icon */}
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
          ownership.isCurrentlyActive
            ? 'bg-primary-100 text-primary-600'
            : 'bg-gray-100 text-gray-500'
        }`}>
          <Home className="h-6 w-6" />
        </div>

        {/* Unit Info */}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{ownership.unitNumber}</p>
            {ownership.isPrimaryOwner && (
              <span title="Primary Owner">
                <Star className="h-4 w-4 text-amber-500" />
              </span>
            )}
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              getOwnershipStatusColor(ownership.isCurrentlyActive)
            }`}>
              {getOwnershipStatusLabel(ownership.isCurrentlyActive)}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {ownership.blockName} • {ownership.floorName}
          </p>
        </div>
      </div>

      {/* Ownership Details */}
      <div className="text-right">
        <p className="font-medium text-gray-900">{ownership.ownershipShare}%</p>
        <p className="text-sm text-gray-500 flex items-center gap-1 justify-end">
          <Calendar className="h-3.5 w-3.5" />
          {formatOwnershipPeriod(ownership.fromDate, ownership.toDate)}
        </p>
      </div>
    </div>
  );
}

// ============================================
// Current Units Section
// ============================================

interface CurrentUnitsSectionProps {
  ownerships: UnitOwnership[];
  tenantSlug: string;
}

function CurrentUnitsSection({ ownerships, tenantSlug }: CurrentUnitsSectionProps) {
  const currentOwnerships = ownerships.filter(o => o.isCurrentlyActive);

  if (currentOwnerships.length === 0) {
    return (
      <Card>
        <CardHeader title="Current Units" />
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Home className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">No active unit ownerships</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Current Units"
        description={`${currentOwnerships.length} active ownership${currentOwnerships.length !== 1 ? 's' : ''}`}
      />
      <CardContent>
        <div className="space-y-3">
          {currentOwnerships.map(ownership => (
            <OwnershipCard
              key={ownership.id}
              ownership={ownership}
              tenantSlug={tenantSlug}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Ownership History Section
// ============================================

interface OwnershipHistorySectionProps {
  ownerships: UnitOwnership[];
  tenantSlug: string;
}

function OwnershipHistorySection({ ownerships, tenantSlug }: OwnershipHistorySectionProps) {
  if (ownerships.length === 0) {
    return null;
  }

  // Sort by fromDate descending
  const sortedOwnerships = [...ownerships].sort((a, b) => {
    if (!a.fromDate || !b.fromDate) return 0;
    const aDate = new Date(a.fromDate.year, a.fromDate.month - 1, a.fromDate.day);
    const bDate = new Date(b.fromDate.year, b.fromDate.month - 1, b.fromDate.day);
    return bDate.getTime() - aDate.getTime();
  });

  return (
    <Card noPadding>
      <CardHeader
        title="Ownership History"
        description="All ownership records for this party"
        className="p-6 pb-0"
      />
      <CardContent className="mt-0 pt-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 text-left text-sm font-medium text-gray-600">
              <tr>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Share</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedOwnerships.map(ownership => (
                <tr
                  key={ownership.id}
                  className="hover:bg-surface-50 cursor-pointer transition-colors"
                  onClick={() => {
                    window.location.href = `/tenant/${tenantSlug}/units/${ownership.unitId}`;
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{ownership.unitNumber}</span>
                      {ownership.isPrimaryOwner && (
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {ownership.blockName} • {ownership.floorName}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {ownership.ownershipShare}%
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatOwnershipPeriod(ownership.fromDate, ownership.toDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      getOwnershipStatusColor(ownership.isCurrentlyActive)
                    }`}>
                      {getOwnershipStatusLabel(ownership.isCurrentlyActive)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function OwnerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const partyId = params.partyId as string;
  const { profile } = useAuthStore();

  // Guard against double fetch
  const fetchedRef = useRef(false);

  // Data state
  const [party, setParty] = useState<Party | null>(null);
  const [ownerships, setOwnerships] = useState<UnitOwnership[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);

  // Permissions
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_OWNERSHIP_VIEW'] === true;

  // Load data
  const loadData = useCallback(async (force = false) => {
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const [partyData, ownershipsData] = await Promise.all([
        getPartyById(partyId),
        getOwnershipsByParty({ partyId, pageSize: 100 }),
      ]);

      setParty(partyData);
      setOwnerships(ownershipsData.items);
    } catch (err: unknown) {
      console.error('Failed to load owner data:', err);
      if (err instanceof Error && err.message.includes('404')) {
        setShowNotFound(true);
        return;
      }
      setError('Failed to load owner details');
    } finally {
      setIsLoading(false);
    }
  }, [partyId]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Trigger notFound
  if (showNotFound) {
    notFound();
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-gray-500">Loading owner details...</p>
      </div>
    );
  }

  // Error state
  if (error || !party) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="mt-3 font-medium text-gray-900">{error || 'Owner not found'}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/tenant/${tenantSlug}/ownership`)}
          className="mt-4"
        >
          Back to Ownership
        </Button>
      </div>
    );
  }

  // Calculate active units count
  const activeUnitsCount = ownerships.filter(o => o.isCurrentlyActive).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb tenantSlug={tenantSlug} partyName={party.partyName} />

      {/* Owner Header */}
      <OwnerHeaderPanel
        party={party}
        tenantSlug={tenantSlug}
        activeUnitsCount={activeUnitsCount}
      />

      {/* Current Units */}
      <CurrentUnitsSection ownerships={ownerships} tenantSlug={tenantSlug} />

      {/* Ownership History */}
      <OwnershipHistorySection ownerships={ownerships} tenantSlug={tenantSlug} />
    </div>
  );
}


