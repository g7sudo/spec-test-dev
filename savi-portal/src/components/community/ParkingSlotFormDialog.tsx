'use client';

/**
 * Parking Slot Form Dialog
 * Create or edit a parking slot in the community
 */

import { useState, useEffect } from 'react';
import { Save, ParkingCircle, Zap, Warehouse } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { createParkingSlot, updateParkingSlot } from '@/lib/api/community';
import {
  ParkingSlot,
  ParkingLocationType,
  CreateParkingSlotRequest,
  UpdateParkingSlotRequest,
  getParkingLocationTypeValue,
} from '@/types/community';

// ============================================
// Props
// ============================================

interface ParkingSlotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkingSlot?: ParkingSlot | null; // null = create mode
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function ParkingSlotFormDialog({
  open,
  onOpenChange,
  parkingSlot,
  onSuccess,
}: ParkingSlotFormDialogProps) {
  const isEditing = !!parkingSlot;

  // Form state
  const [code, setCode] = useState('');
  const [locationType, setLocationType] = useState<ParkingLocationType>(ParkingLocationType.Surface);
  const [levelLabel, setLevelLabel] = useState('');
  const [isCovered, setIsCovered] = useState(false);
  const [isEVCompatible, setIsEVCompatible] = useState(false);
  const [notes, setNotes] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or parking slot changes
  useEffect(() => {
    if (open) {
      if (parkingSlot) {
        // Edit mode: populate form with existing data
        setCode(parkingSlot.code);
        setLocationType(getParkingLocationTypeValue(parkingSlot.locationType));
        setLevelLabel(parkingSlot.levelLabel || '');
        setIsCovered(parkingSlot.isCovered);
        setIsEVCompatible(parkingSlot.isEVCompatible);
        setNotes(parkingSlot.notes || '');
      } else {
        // Create mode: reset to defaults
        setCode('');
        setLocationType(ParkingLocationType.Surface);
        setLevelLabel('');
        setIsCovered(false);
        setIsEVCompatible(false);
        setNotes('');
      }
      setError(null);
    }
  }, [open, parkingSlot]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && parkingSlot) {
        // Update existing parking slot
        const request: UpdateParkingSlotRequest = {
          code,
          locationType,
          levelLabel: levelLabel || null,
          isCovered,
          isEVCompatible,
          notes: notes || null,
        };
        await updateParkingSlot(parkingSlot.id, request);
      } else {
        // Create new parking slot
        const request: CreateParkingSlotRequest = {
          code,
          locationType,
          levelLabel: levelLabel || null,
          isCovered,
          isEVCompatible,
          notes: notes || null,
        };
        await createParkingSlot(request);
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to save parking slot:', err);
      const message = err instanceof Error ? err.message : 'Failed to save parking slot';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ParkingCircle className="h-5 w-5 text-primary-600" />
            {isEditing ? 'Edit Parking Slot' : 'Create New Parking Slot'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parking Code */}
          <Input
            label="Parking Code *"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. P-001, B1-12, S-A01"
            required
          />

          {/* Location Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Location Type *
            </label>
            <Select
              value={locationType.toString()}
              onValueChange={(v) => setLocationType(parseInt(v) as ParkingLocationType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Underground</SelectItem>
                <SelectItem value="1">Surface</SelectItem>
                <SelectItem value="2">Covered</SelectItem>
                <SelectItem value="3">Street</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Level Label */}
          <Input
            label="Level Label"
            value={levelLabel}
            onChange={(e) => setLevelLabel(e.target.value)}
            placeholder="e.g. B1, Ground, Level 2"
          />

          {/* Features - Checkboxes */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Features
            </label>
            
            {/* Covered checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCovered}
                onChange={(e) => setIsCovered(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Covered Parking</span>
              </div>
            </label>

            {/* EV Compatible checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isEVCompatible}
                onChange={(e) => setIsEVCompatible(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">EV Charging Compatible</span>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this parking slot..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              <Save className="h-4 w-4" />
              {isEditing ? 'Save Changes' : 'Create Parking Slot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

