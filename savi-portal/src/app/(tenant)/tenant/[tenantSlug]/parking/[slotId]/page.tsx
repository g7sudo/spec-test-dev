'use client';

/**
 * Parking Slot Detail Page (F-PARKING-TO-UNIT-01)
 * Shows parking slot details with link to allocated unit
 * Supports bottom-up navigation: Parking → Unit
 * Permission: TENANT_COMMUNITY_VIEW (view) / TENANT_COMMUNITY_MANAGE (edit)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ParkingCircle,
  Edit,
  Home,
  Loader2,
  AlertCircle,
  Zap,
  Warehouse,
  Link2,
  Link2Off,
  MapPin,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { getParkingSlotById, deallocateParkingSlot, listUnits, allocateParkingSlot } from '@/lib/api/community';
import {
  ParkingSlot,
  Unit,
  getParkingStatusLabel,
  getParkingStatusColor,
  getParkingLocationTypeLabel,
} from '@/types/community';
import { ParkingSlotFormDialog } from '@/components/community';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

// ============================================
// Allocate Dialog Component
// ============================================

interface AllocateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkingSlot: ParkingSlot;
  onSuccess: () => void;
}

function AllocateDialog({ open, onOpenChange, parkingSlot, onSuccess }: AllocateDialogProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [isAllocating, setIsAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load units when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedUnitId('');
      setError(null);
      loadUnits();
    }
  }, [open]);

  const loadUnits = async () => {
    setIsLoadingUnits(true);
    try {
      const result = await listUnits({ pageSize: 200 });
      setUnits(result.items);
    } catch (err) {
      console.error('Failed to load units:', err);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedUnitId) return;
    setIsAllocating(true);
    setError(null);
    try {
      await allocateParkingSlot(parkingSlot.id, { unitId: selectedUnitId });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to allocate';
      setError(message);
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
            Allocate to Unit
          </DialogTitle>
          <DialogDescription>
            Select a unit to allocate parking slot <strong>{parkingSlot.code}</strong>
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
              <SelectValue placeholder={isLoadingUnits ? 'Loading...' : 'Choose a unit'} />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  Unit {unit.unitNumber} ({unit.blockName} - {unit.floorName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isAllocating}>
            Cancel
          </Button>
          <Button onClick={handleAllocate} isLoading={isAllocating} disabled={!selectedUnitId}>
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

export default function ParkingSlotDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const slotId = params.slotId as string;
  const { profile } = useAuthStore();

  // Guard against double fetch in Strict Mode
  const fetchedRef = useRef(false);

  // Data state
  const [slot, setSlot] = useState<ParkingSlot | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);

  // Dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);

  // Permissions
  const permissions = profile?.permissions || {};
  const canManage = permissions['TENANT_COMMUNITY_MANAGE'] === true;

  // Load parking slot data
  const loadSlot = useCallback(async (force = false) => {
    // Guard against double fetch in Strict Mode
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const slotData = await getParkingSlotById(slotId);
      setSlot(slotData);
    } catch (err: unknown) {
      console.error('Failed to load parking slot:', err);
      // Check if 404
      if (err instanceof Error && err.message.includes('404')) {
        setShowNotFound(true);
        return;
      }
      setError('Failed to load parking slot details');
    } finally {
      setIsLoading(false);
    }
  }, [slotId]);

  // Initial load
  useEffect(() => {
    loadSlot();
  }, [loadSlot]);

  // Handle deallocate
  const handleDeallocate = async () => {
    if (!slot || !confirm('Remove this parking slot allocation?')) return;

    try {
      await deallocateParkingSlot(slot.id);
      loadSlot(true);
    } catch (err) {
      console.error('Failed to deallocate parking:', err);
      alert('Failed to remove parking allocation');
    }
  };

  // Handle edit success
  const handleEditSuccess = () => {
    setIsEditOpen(false);
    loadSlot(true);
  };

  // Handle allocate success
  const handleAllocateSuccess = () => {
    setIsAllocateOpen(false);
    loadSlot(true);
  };

  // Trigger Next.js notFound() for invalid slot
  if (showNotFound) {
    notFound();
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-gray-500">Loading parking slot...</p>
      </div>
    );
  }

  // Error state
  if (error || !slot) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="mt-3 font-medium text-gray-900">{error || 'Parking slot not found'}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/tenant/${tenantSlug}/parking`)}
          className="mt-4"
        >
          Back to Parking
        </Button>
      </div>
    );
  }

  const isAllocated = !!slot.allocatedUnitId;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isAllocated ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
          }`}>
            <ParkingCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{slot.code}</h1>
            <p className="text-sm text-gray-500">
              {getParkingLocationTypeLabel(slot.locationType)}
              {slot.levelLabel && ` • ${slot.levelLabel}`}
            </p>
          </div>
        </div>

        {canManage && (
          <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Slot Info */}
        <Card>
          <CardHeader title="Slot Information" />
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slot Code
                </dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {slot.code}
                </dd>
              </div>

              {/* Status */}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </dt>
                <dd className="mt-1">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getParkingStatusColor(slot.status)}`}>
                    {getParkingStatusLabel(slot.status)}
                  </span>
                </dd>
              </div>

              {/* Location Type */}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location Type
                </dt>
                <dd className="mt-1 flex items-center gap-1 text-gray-900">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {getParkingLocationTypeLabel(slot.locationType)}
                </dd>
              </div>

              {/* Level */}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </dt>
                <dd className="mt-1 text-gray-900">
                  {slot.levelLabel || '—'}
                </dd>
              </div>

              {/* Features */}
              <div className="col-span-2">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Features
                </dt>
                <dd className="mt-2 flex items-center gap-4">
                  <div className={`flex items-center gap-2 ${slot.isCovered ? 'text-gray-700' : 'text-gray-400'}`}>
                    <Warehouse className="h-4 w-4" />
                    <span className="text-sm">Covered</span>
                    {slot.isCovered && <span className="text-green-600">✓</span>}
                  </div>
                  <div className={`flex items-center gap-2 ${slot.isEVCompatible ? 'text-green-600' : 'text-gray-400'}`}>
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">EV Compatible</span>
                    {slot.isEVCompatible && <span>✓</span>}
                  </div>
                </dd>
              </div>

              {/* Notes */}
              {slot.notes && (
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </dt>
                  <dd className="mt-1 text-gray-700 whitespace-pre-wrap">
                    {slot.notes}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Allocation Info */}
        <Card>
          <CardHeader
            title="Unit Allocation"
            description={isAllocated ? 'Currently allocated to:' : 'Not allocated'}
            action={
              canManage && (
                isAllocated ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDeallocate}
                    className="text-error hover:text-error"
                  >
                    <Link2Off className="h-4 w-4" />
                    Deallocate
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsAllocateOpen(true)}
                  >
                    <Link2 className="h-4 w-4" />
                    Allocate
                  </Button>
                )
              )
            }
          />
          <CardContent>
            {isAllocated ? (
              <Link
                href={`/tenant/${tenantSlug}/units/${slot.allocatedUnitId}`}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-surface-50 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <Home className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Unit {slot.allocatedUnitNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    Click to view unit details
                  </p>
                </div>
                <span className="text-primary-600">→</span>
              </Link>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Home className="h-12 w-12 text-gray-300" />
                <p className="mt-3 text-gray-500">This slot is not allocated to any unit</p>
                {canManage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsAllocateOpen(true)}
                  >
                    <Link2 className="h-4 w-4" />
                    Allocate to Unit
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <ParkingSlotFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        parkingSlot={slot}
        onSuccess={handleEditSuccess}
      />

      {/* Allocate Dialog */}
      {slot && (
        <AllocateDialog
          open={isAllocateOpen}
          onOpenChange={setIsAllocateOpen}
          parkingSlot={slot}
          onSuccess={handleAllocateSuccess}
        />
      )}
    </div>
  );
}

