'use client';

/**
 * Parking Slots List Page
 * Manage parking slots in the community
 * Supports allocation and deallocation workflows
 * Permission: TENANT_COMMUNITY_VIEW (view) / TENANT_COMMUNITY_MANAGE (manage)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  ParkingCircle,
  MoreVertical,
  Loader2,
  AlertCircle,
  Home,
  Zap,
  Warehouse,
  Link2,
  Link2Off,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  listParkingSlots,
  listUnits,
  allocateParkingSlot,
  deallocateParkingSlot,
} from '@/lib/api/community';
import {
  ParkingSlot,
  ParkingStatus,
  Unit,
  getParkingStatusLabel,
  getParkingStatusColor,
  getParkingLocationTypeLabel,
} from '@/types/community';
import { ParkingSlotFormDialog } from '@/components/community';

// ============================================
// Constants
// ============================================

const PAGE_SIZE = 20;

// ============================================
// Parking Row Component
// ============================================

interface ParkingRowProps {
  slot: ParkingSlot;
  tenantSlug: string;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onAllocate: () => void;
  onDeallocate: () => void;
}

function ParkingRow({
  slot,
  tenantSlug,
  canManage,
  onView,
  onEdit,
  onAllocate,
  onDeallocate,
}: ParkingRowProps) {
  const isAllocated = !!slot.allocatedUnitId;

  return (
    <tr
      className="hover:bg-surface-50 cursor-pointer transition-colors"
      onClick={onView}
    >
      {/* Code */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isAllocated ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
          }`}>
            <ParkingCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{slot.code}</p>
            <p className="text-sm text-gray-500">{slot.levelLabel || '—'}</p>
          </div>
        </div>
      </td>

      {/* Location Type & Features */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm text-gray-900">
            {getParkingLocationTypeLabel(slot.locationType)}
          </p>
          <div className="flex items-center gap-2">
            {slot.isCovered && (
              <span className="flex items-center gap-0.5 text-xs text-gray-500">
                <Warehouse className="h-3 w-3" />
                Covered
              </span>
            )}
            {slot.isEVCompatible && (
              <span className="flex items-center gap-0.5 text-xs text-green-600">
                <Zap className="h-3 w-3" />
                EV
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Allocated To */}
      <td className="px-4 py-3">
        {slot.allocatedUnitId ? (
          <Link
            href={`/tenant/${tenantSlug}/units/${slot.allocatedUnitId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <Home className="h-3.5 w-3.5" />
            Unit {slot.allocatedUnitNumber}
          </Link>
        ) : (
          <span className="text-sm text-gray-400">Not allocated</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getParkingStatusColor(slot.status)}`}
        >
          {getParkingStatusLabel(slot.status)}
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
                {isAllocated ? (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDeallocate(); }}
                    className="text-error"
                  >
                    <Link2Off className="h-4 w-4 mr-2" />
                    Deallocate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAllocate(); }}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Allocate to Unit
                  </DropdownMenuItem>
                )}
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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <ParkingCircle className="h-8 w-8 text-blue-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No parking slots yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Create parking slots and allocate them to units.
      </p>
      {canManage && (
        <Button className="mt-4" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          Create Parking Slot
        </Button>
      )}
    </div>
  );
}

// ============================================
// Allocate Dialog (from Parking perspective)
// ============================================

interface AllocateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkingSlot: ParkingSlot | null;
  units: Unit[];
  isLoadingUnits: boolean;
  onAllocate: (slotId: string, unitId: string) => Promise<void>;
}

function AllocateDialog({
  open,
  onOpenChange,
  parkingSlot,
  units,
  isLoadingUnits,
  onAllocate,
}: AllocateDialogProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [isAllocating, setIsAllocating] = useState(false);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedUnitId('');
    }
  }, [open]);

  const handleAllocate = async () => {
    if (!parkingSlot || !selectedUnitId) return;
    setIsAllocating(true);
    try {
      await onAllocate(parkingSlot.id, selectedUnitId);
      onOpenChange(false);
    } finally {
      setIsAllocating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary-600" />
            Allocate Parking Slot
          </DialogTitle>
          <DialogDescription>
            Allocate <strong>{parkingSlot?.code}</strong> to a unit
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Select Unit
          </label>
          <Select
            value={selectedUnitId}
            onValueChange={setSelectedUnitId}
            disabled={isLoadingUnits}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingUnits ? 'Loading units...' : 'Choose a unit'} />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  Unit {unit.unitNumber} ({unit.blockName} - {unit.floorName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isAllocating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAllocate}
            isLoading={isAllocating}
            disabled={!selectedUnitId}
          >
            <Link2 className="h-4 w-4" />
            Allocate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function ParkingPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { profile } = useAuthStore();

  // Guard against double fetch in Strict Mode
  const fetchedRef = useRef(false);

  // Data state
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ParkingSlot | null>(null);
  const [allocatingSlot, setAllocatingSlot] = useState<ParkingSlot | null>(null);

  // Permissions
  const permissions = profile?.permissions || {};
  const canManage = permissions['TENANT_COMMUNITY_MANAGE'] === true;

  // Load parking slots
  const fetchParkingSlots = useCallback(async (force = false) => {
    // Guard against double fetch in Strict Mode
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listParkingSlots({
        page,
        pageSize: PAGE_SIZE,
        status: filterStatus !== 'all' ? (parseInt(filterStatus) as ParkingStatus) : undefined,
      });

      setParkingSlots(result.items);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch parking slots:', err);
      setError('Failed to load parking slots');
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStatus]);

  // Load units (for allocation dialog)
  const loadUnits = useCallback(async () => {
    setIsLoadingUnits(true);
    try {
      const result = await listUnits({ pageSize: 200 });
      setUnits(result.items);
    } catch (err) {
      console.error('Failed to load units:', err);
    } finally {
      setIsLoadingUnits(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchedRef.current = false;
    fetchParkingSlots();
  }, [fetchParkingSlots]);

  // Load units when allocation dialog opens
  useEffect(() => {
    if (allocatingSlot) {
      loadUnits();
    }
  }, [allocatingSlot, loadUnits]);

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
    setPage(1);
  };

  // Navigate to detail
  const navigateToDetail = (slotId: string) => {
    router.push(`/tenant/${tenantSlug}/parking/${slotId}`);
  };

  // Handle allocate
  const handleAllocate = async (slotId: string, unitId: string) => {
    try {
      await allocateParkingSlot(slotId, { unitId });
      fetchParkingSlots(true);
    } catch (err) {
      console.error('Failed to allocate parking:', err);
      alert('Failed to allocate parking slot');
    }
  };

  // Handle deallocate
  const handleDeallocate = async (slotId: string) => {
    if (!confirm('Remove this parking slot allocation?')) return;

    try {
      await deallocateParkingSlot(slotId);
      fetchParkingSlots(true);
    } catch (err) {
      console.error('Failed to deallocate parking:', err);
      alert('Failed to remove parking allocation');
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsCreateOpen(false);
    setEditingSlot(null);
    fetchParkingSlots(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parking Slots</h1>
          <p className="text-sm text-gray-500">
            Manage parking slots and unit allocations
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Parking Slot
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 sm:max-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                Status
              </label>
              <Select value={filterStatus} onValueChange={handleFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="0">Available</SelectItem>
                  <SelectItem value="1">Allocated</SelectItem>
                  <SelectItem value="2">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card noPadding>
        {isLoading ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading parking slots...</p>
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
                onClick={() => fetchParkingSlots(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        ) : parkingSlots.length === 0 ? (
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
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Type & Features</th>
                    <th className="px-4 py-3">Allocated To</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parkingSlots.map((slot) => (
                    <ParkingRow
                      key={slot.id}
                      slot={slot}
                      tenantSlug={tenantSlug}
                      canManage={canManage}
                      onView={() => navigateToDetail(slot.id)}
                      onEdit={() => setEditingSlot(slot)}
                      onAllocate={() => setAllocatingSlot(slot)}
                      onDeallocate={() => handleDeallocate(slot.id)}
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
      <ParkingSlotFormDialog
        open={isCreateOpen || !!editingSlot}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingSlot(null);
          }
        }}
        parkingSlot={editingSlot}
        onSuccess={handleFormSuccess}
      />

      {/* Allocate Dialog */}
      <AllocateDialog
        open={!!allocatingSlot}
        onOpenChange={(open) => {
          if (!open) setAllocatingSlot(null);
        }}
        parkingSlot={allocatingSlot}
        units={units}
        isLoadingUnits={isLoadingUnits}
        onAllocate={handleAllocate}
      />
    </div>
  );
}

