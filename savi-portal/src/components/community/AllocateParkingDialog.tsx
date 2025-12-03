'use client';

/**
 * Allocate Parking Dialog
 * Dialog to allocate available parking slots to a unit
 * Used from Unit Detail page
 */

import { useState, useEffect, useCallback } from 'react';
import { Link2, Loader2, ParkingCircle, Zap, Warehouse, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { listParkingSlots, allocateParkingSlot } from '@/lib/api/community';
import {
  ParkingSlot,
  ParkingStatus,
  getParkingLocationTypeLabel,
} from '@/types/community';

// ============================================
// Props
// ============================================

interface AllocateParkingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  unitNumber: string;
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function AllocateParkingDialog({
  open,
  onOpenChange,
  unitId,
  unitNumber,
  onSuccess,
}: AllocateParkingDialogProps) {
  // State
  const [availableSlots, setAvailableSlots] = useState<ParkingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isAllocating, setIsAllocating] = useState(false);

  // Load available parking slots when dialog opens
  const loadAvailableSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch available (unallocated) parking slots
      const result = await listParkingSlots({
        status: ParkingStatus.Available,
        pageSize: 100,
      });
      setAvailableSlots(result.items.filter(s => !s.allocatedUnitId));
    } catch (err) {
      console.error('Failed to load parking slots:', err);
      setError('Failed to load available parking slots');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedSlotId(null);
      loadAvailableSlots();
    }
  }, [open, loadAvailableSlots]);

  // Handle allocation
  const handleAllocate = async () => {
    if (!selectedSlotId) return;

    setIsAllocating(true);
    setError(null);

    try {
      await allocateParkingSlot(selectedSlotId, { unitId });
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to allocate parking:', err);
      const message = err instanceof Error ? err.message : 'Failed to allocate parking slot';
      setError(message);
    } finally {
      setIsAllocating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary-600" />
            Allocate Parking to Unit
          </DialogTitle>
          <DialogDescription>
            Select an available parking slot to allocate to unit <strong>{unitNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading available slots...</p>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-8 w-8 text-error" />
              <p className="mt-3 font-medium text-gray-900">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={loadAvailableSlots}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && availableSlots.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ParkingCircle className="h-12 w-12 text-gray-300" />
              <p className="mt-3 font-medium text-gray-900">No available parking slots</p>
              <p className="text-sm text-gray-500">
                All parking slots are currently allocated or under maintenance.
              </p>
            </div>
          )}

          {/* Slot list */}
          {!isLoading && !error && availableSlots.length > 0 && (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {availableSlots.map((slot) => (
                <label
                  key={slot.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedSlotId === slot.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="parkingSlot"
                    value={slot.id}
                    checked={selectedSlotId === slot.id}
                    onChange={() => setSelectedSlotId(slot.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{slot.code}</span>
                      {slot.levelLabel && (
                        <span className="text-sm text-gray-500">• {slot.levelLabel}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{getParkingLocationTypeLabel(slot.locationType)}</span>
                      {slot.isCovered && (
                        <span className="flex items-center gap-1">
                          <Warehouse className="h-3 w-3" />
                          Covered
                        </span>
                      )}
                      {slot.isEVCompatible && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Zap className="h-3 w-3" />
                          EV Ready
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isAllocating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAllocate}
            isLoading={isAllocating}
            disabled={!selectedSlotId || isLoading}
          >
            <Link2 className="h-4 w-4" />
            Allocate Parking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

