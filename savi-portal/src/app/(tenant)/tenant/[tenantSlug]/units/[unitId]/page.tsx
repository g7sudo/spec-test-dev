'use client';

/**
 * Unit Detail Hub Page (F-UNIT-DETAIL-01)
 * The core control center for unit management
 * Shows unit info, parking allocations, and navigation
 * Permission: TENANT_COMMUNITY_VIEW (view) / TENANT_COMMUNITY_MANAGE (edit)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Building,
  Layers,
  Edit,
  Plus,
  ParkingCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
  Zap,
  Warehouse,
  Link2Off,
  KeyRound,
  User,
  Building2,
  Briefcase,
  Star,
  ArrowRightLeft,
  X,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  getUnitById,
  listParkingSlots,
  listBlocks,
  deallocateParkingSlot,
} from '@/lib/api/community';
import {
  Unit,
  Block,
  ParkingSlot,
  getUnitStatusLabel,
  getUnitStatusColor,
  getParkingLocationTypeLabel,
} from '@/types/community';
import { UnitFormDialog, AllocateParkingDialog } from '@/components/community';
import {
  AddOwnershipDialog,
  TransferOwnershipDialog,
  EndOwnershipDialog,
} from '@/components/ownership';
import { getOwnershipsByUnit } from '@/lib/api/ownership';
import {
  UnitOwnership,
  formatDateOnly,
  formatOwnershipPeriod,
  getOwnershipStatusColor,
  getOwnershipStatusLabel,
} from '@/types/ownership';
import { PartyType, getPartyTypeLabel } from '@/types/party';

// ============================================
// Breadcrumb Component
// ============================================

interface BreadcrumbProps {
  tenantSlug: string;
  unit: Unit;
}

function Breadcrumb({ tenantSlug, unit }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      {/* Block link */}
      <Link
        href={`/tenant/${tenantSlug}/blocks`}
        className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors"
      >
        <Building className="h-4 w-4" />
        {unit.blockName}
      </Link>
      
      <ChevronRight className="h-4 w-4 text-gray-400" />
      
      {/* Floor link */}
      <Link
        href={`/tenant/${tenantSlug}/units?blockId=${unit.blockId}&floorId=${unit.floorId}`}
        className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors"
      >
        <Layers className="h-4 w-4" />
        {unit.floorName}
      </Link>
      
      <ChevronRight className="h-4 w-4 text-gray-400" />
      
      {/* Current unit */}
      <span className="flex items-center gap-1 font-medium text-gray-900">
        <Home className="h-4 w-4" />
        {unit.unitNumber}
      </span>
    </nav>
  );
}

// ============================================
// Unit Info Panel
// ============================================

interface UnitInfoPanelProps {
  unit: Unit;
  canManage: boolean;
  onEdit: () => void;
}

function UnitInfoPanel({ unit, canManage, onEdit }: UnitInfoPanelProps) {
  return (
    <Card>
      <CardHeader
        title="Unit Information"
        action={
          canManage && (
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )
        }
      />
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {/* Unit Number */}
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit Number
            </dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">
              {unit.unitNumber}
            </dd>
          </div>

          {/* Unit Type */}
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </dt>
            <dd className="mt-1 text-gray-900">
              {unit.unitTypeName || 'Standard'}
            </dd>
          </div>

          {/* Status */}
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </dt>
            <dd className="mt-1">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getUnitStatusColor(unit.status)}`}>
                {getUnitStatusLabel(unit.status)}
              </span>
            </dd>
          </div>

          {/* Block */}
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Block
            </dt>
            <dd className="mt-1 text-gray-900">{unit.blockName}</dd>
          </div>

          {/* Floor */}
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Floor
            </dt>
            <dd className="mt-1 text-gray-900">{unit.floorName}</dd>
          </div>

          {/* Area */}
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Area
            </dt>
            <dd className="mt-1 text-gray-900">
              {unit.areaSqft ? `${unit.areaSqft.toLocaleString()} sqft` : '—'}
            </dd>
          </div>

          {/* Notes (full width) */}
          {unit.notes && (
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </dt>
              <dd className="mt-1 text-gray-700 whitespace-pre-wrap">
                {unit.notes}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

// ============================================
// Parking Allocation Section
// ============================================

interface ParkingAllocationSectionProps {
  tenantSlug: string;
  unitId: string;
  parkingSlots: ParkingSlot[];
  canManage: boolean;
  isLoading: boolean;
  onAddParking: () => void;
  onDeallocate: (slotId: string) => void;
}

function ParkingAllocationSection({
  tenantSlug,
  unitId,
  parkingSlots,
  canManage,
  isLoading,
  onAddParking,
  onDeallocate,
}: ParkingAllocationSectionProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader
        title="Parking Allocation"
        description={`${parkingSlots.length} parking slot${parkingSlots.length !== 1 ? 's' : ''} allocated`}
        action={
          canManage && (
            <Button variant="secondary" size="sm" onClick={onAddParking}>
              <Plus className="h-4 w-4" />
              Add Parking
            </Button>
          )
        }
      />
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : parkingSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ParkingCircle className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">No parking slots allocated</p>
            {canManage && (
              <Button variant="secondary" size="sm" className="mt-4" onClick={onAddParking}>
                <Plus className="h-4 w-4" />
                Allocate Parking
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {parkingSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-surface-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/tenant/${tenantSlug}/parking/${slot.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <ParkingCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{slot.code}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {slot.levelLabel && <span>{slot.levelLabel}</span>}
                      <span>{getParkingLocationTypeLabel(slot.locationType)}</span>
                      {slot.isCovered && (
                        <span className="flex items-center gap-0.5">
                          <Warehouse className="h-3 w-3" />
                          Covered
                        </span>
                      )}
                      {slot.isEVCompatible && (
                        <span className="flex items-center gap-0.5 text-green-600">
                          <Zap className="h-3 w-3" />
                          EV
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeallocate(slot.id);
                    }}
                    className="text-gray-400 hover:text-error"
                    title="Remove allocation"
                  >
                    <Link2Off className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
// Ownership Section (F-OWN-01)
// ============================================

interface OwnershipSectionProps {
  tenantSlug: string;
  unitId: string;
  unitNumber: string;
  ownerships: UnitOwnership[];
  canView: boolean;
  canManage: boolean;
  isLoading: boolean;
  onAddOwner: () => void;
  onTransfer: () => void;
  onEndOwnership: (ownership: UnitOwnership) => void;
  onViewOwner: (partyId: string) => void;
}

function OwnershipSection({
  tenantSlug,
  unitId,
  unitNumber,
  ownerships,
  canView,
  canManage,
  isLoading,
  onAddOwner,
  onTransfer,
  onEndOwnership,
  onViewOwner,
}: OwnershipSectionProps) {
  const router = useRouter();

  // Separate current and historical ownerships
  const currentOwnerships = ownerships.filter(o => o.isCurrentlyActive);
  const historicalOwnerships = ownerships.filter(o => !o.isCurrentlyActive);

  // Calculate total current share
  const totalCurrentShare = currentOwnerships.reduce((sum, o) => sum + o.ownershipShare, 0);

  if (!canView) {
    return null;
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Ownership"
        description={
          currentOwnerships.length > 0
            ? `${currentOwnerships.length} current owner${currentOwnerships.length !== 1 ? 's' : ''}`
            : 'No current owners'
        }
        action={
          canManage && (
            <div className="flex gap-2">
              {currentOwnerships.length > 0 && (
                <Button variant="secondary" size="sm" onClick={onTransfer}>
                  <ArrowRightLeft className="h-4 w-4" />
                  Transfer
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={onAddOwner}>
                <Plus className="h-4 w-4" />
                {currentOwnerships.length > 0 ? 'Add Joint Owner' : 'Add Owner'}
              </Button>
            </div>
          )
        }
      />
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : currentOwnerships.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <KeyRound className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">
              This unit doesn&apos;t have any recorded owners yet.
            </p>
            {canManage && (
              <Button variant="secondary" size="sm" className="mt-4" onClick={onAddOwner}>
                <Plus className="h-4 w-4" />
                Add First Owner
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Owners */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Current Owners</h4>
              <div className="space-y-3">
                {currentOwnerships.map(ownership => (
                  <div
                    key={ownership.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-surface-50 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => onViewOwner(ownership.partyId)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                        <PartyTypeIcon type={ownership.partyType} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">
                            {ownership.partyName}
                          </p>
                          {ownership.isPrimaryOwner && (
                            <span className="flex items-center gap-1 text-amber-600 text-xs">
                              <Star className="h-3.5 w-3.5" />
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{getPartyTypeLabel(ownership.partyType)}</span>
                          <span>•</span>
                          <span>{ownership.ownershipShare}% share</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Since {formatDateOnly(ownership.fromDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {canManage && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEndOwnership(ownership)}
                          className="text-gray-400 hover:text-error"
                          title="End ownership"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Share summary */}
              {currentOwnerships.length > 1 && (
                <div className="mt-3 text-sm text-gray-500 text-right">
                  Total share: {totalCurrentShare}%
                  {totalCurrentShare < 100 && (
                    <span className="text-amber-600 ml-2">
                      ({100 - totalCurrentShare}% unallocated)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Ownership History */}
            {historicalOwnerships.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ownership History</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-50 text-left text-gray-600">
                      <tr>
                        <th className="px-4 py-2">Owner</th>
                        <th className="px-4 py-2">Share</th>
                        <th className="px-4 py-2">Period</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historicalOwnerships.map(ownership => (
                        <tr
                          key={ownership.id}
                          className="hover:bg-surface-50 cursor-pointer"
                          onClick={() => onViewOwner(ownership.partyId)}
                        >
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ownership.partyName}</span>
                              {ownership.isPrimaryOwner && (
                                <Star className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {ownership.ownershipShare}%
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {formatOwnershipPeriod(ownership.fromDate, ownership.toDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function UnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const unitId = params.unitId as string;
  const { profile } = useAuthStore();

  // Guard against double fetch in Strict Mode
  const fetchedRef = useRef(false);

  // Data state
  const [unit, setUnit] = useState<Unit | null>(null);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [ownerships, setOwnerships] = useState<UnitOwnership[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isParkingLoading, setIsParkingLoading] = useState(true);
  const [isOwnershipLoading, setIsOwnershipLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);

  // Dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isAddOwnerOpen, setIsAddOwnerOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [endingOwnership, setEndingOwnership] = useState<UnitOwnership | null>(null);

  // Permissions
  const permissions = profile?.permissions || {};
  const canManage = permissions['TENANT_COMMUNITY_MANAGE'] === true;
  const canViewOwnership = permissions['TENANT_OWNERSHIP_VIEW'] === true;
  const canManageOwnership = permissions['TENANT_OWNERSHIP_MANAGE'] === true;

  // Load unit data
  const loadUnit = useCallback(async (force = false) => {
    // Guard against double fetch in Strict Mode
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const [unitData, blocksData] = await Promise.all([
        getUnitById(unitId),
        listBlocks({ pageSize: 100 }),
      ]);
      setUnit(unitData);
      setBlocks(blocksData.items);
    } catch (err: unknown) {
      console.error('Failed to load unit:', err);
      // Check if 404
      if (err instanceof Error && err.message.includes('404')) {
        setShowNotFound(true);
        return;
      }
      setError('Failed to load unit details');
    } finally {
      setIsLoading(false);
    }
  }, [unitId]);

  // Load parking slots allocated to this unit
  const loadParkingSlots = useCallback(async () => {
    setIsParkingLoading(true);
    try {
      const result = await listParkingSlots({ allocatedUnitId: unitId, pageSize: 100 });
      setParkingSlots(result.items);
    } catch (err) {
      console.error('Failed to load parking slots:', err);
    } finally {
      setIsParkingLoading(false);
    }
  }, [unitId]);

  // Load ownership data for this unit
  const loadOwnerships = useCallback(async () => {
    setIsOwnershipLoading(true);
    try {
      const result = await getOwnershipsByUnit({ unitId, pageSize: 100 });
      setOwnerships(result.items);
    } catch (err) {
      console.error('Failed to load ownerships:', err);
    } finally {
      setIsOwnershipLoading(false);
    }
  }, [unitId]);

  // Initial load
  useEffect(() => {
    loadUnit();
    loadParkingSlots();
    loadOwnerships();
  }, [loadUnit, loadParkingSlots, loadOwnerships]);

  // Handle deallocate parking
  const handleDeallocate = async (slotId: string) => {
    if (!confirm('Remove this parking slot allocation?')) return;

    try {
      await deallocateParkingSlot(slotId);
      loadParkingSlots(); // Refresh parking list
    } catch (err) {
      console.error('Failed to deallocate parking:', err);
      alert('Failed to remove parking allocation');
    }
  };

  // Handle edit success
  const handleEditSuccess = () => {
    setIsEditOpen(false);
    loadUnit(true);
  };

  // Handle allocate success
  const handleAllocateSuccess = () => {
    setIsAllocateOpen(false);
    loadParkingSlots();
  };

  // Handle ownership success (add/transfer/end)
  const handleOwnershipSuccess = () => {
    setIsAddOwnerOpen(false);
    setIsTransferOpen(false);
    setEndingOwnership(null);
    loadOwnerships();
  };

  // Navigate to owner detail
  const navigateToOwner = (partyId: string) => {
    router.push(`/tenant/${tenantSlug}/ownership/${partyId}`);
  };

  // Trigger Next.js notFound() for invalid unit
  if (showNotFound) {
    notFound();
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-gray-500">Loading unit details...</p>
      </div>
    );
  }

  // Error state
  if (error || !unit) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="mt-3 font-medium text-gray-900">{error || 'Unit not found'}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/tenant/${tenantSlug}/units`)}
          className="mt-4"
        >
          Back to Units
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb tenantSlug={tenantSlug} unit={unit} />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Unit {unit.unitNumber}</h1>
            <p className="text-sm text-gray-500">
              {unit.blockName} • {unit.floorName}
            </p>
          </div>
        </div>

        {canManage && (
          <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4" />
            Edit Unit
          </Button>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Unit Info Panel */}
        <UnitInfoPanel
          unit={unit}
          canManage={canManage}
          onEdit={() => setIsEditOpen(true)}
        />

        {/* Parking Allocation Section */}
        <ParkingAllocationSection
          tenantSlug={tenantSlug}
          unitId={unitId}
          parkingSlots={parkingSlots}
          canManage={canManage}
          isLoading={isParkingLoading}
          onAddParking={() => setIsAllocateOpen(true)}
          onDeallocate={handleDeallocate}
        />

        {/* Ownership Section (spans 2 columns) */}
        <OwnershipSection
          tenantSlug={tenantSlug}
          unitId={unitId}
          unitNumber={unit.unitNumber}
          ownerships={ownerships}
          canView={canViewOwnership}
          canManage={canManageOwnership}
          isLoading={isOwnershipLoading}
          onAddOwner={() => setIsAddOwnerOpen(true)}
          onTransfer={() => setIsTransferOpen(true)}
          onEndOwnership={(ownership) => setEndingOwnership(ownership)}
          onViewOwner={navigateToOwner}
        />
      </div>

      {/* Future: Residents Section, Maintenance History, Documents */}

      {/* Edit Unit Dialog */}
      <UnitFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        unit={unit}
        blocks={blocks}
        onSuccess={handleEditSuccess}
      />

      {/* Allocate Parking Dialog */}
      <AllocateParkingDialog
        open={isAllocateOpen}
        onOpenChange={setIsAllocateOpen}
        unitId={unitId}
        unitNumber={unit.unitNumber}
        onSuccess={handleAllocateSuccess}
      />

      {/* Add Ownership Dialog */}
      <AddOwnershipDialog
        open={isAddOwnerOpen}
        onOpenChange={setIsAddOwnerOpen}
        unitId={unitId}
        unitNumber={unit.unitNumber}
        currentOwners={ownerships.filter(o => o.isCurrentlyActive)}
        onSuccess={handleOwnershipSuccess}
      />

      {/* Transfer Ownership Dialog */}
      <TransferOwnershipDialog
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        unitId={unitId}
        unitNumber={unit.unitNumber}
        currentOwners={ownerships}
        onSuccess={handleOwnershipSuccess}
      />

      {/* End Ownership Dialog */}
      <EndOwnershipDialog
        open={!!endingOwnership}
        onOpenChange={(open) => !open && setEndingOwnership(null)}
        ownership={endingOwnership}
        unitNumber={unit.unitNumber}
        onSuccess={handleOwnershipSuccess}
      />
    </div>
  );
}

