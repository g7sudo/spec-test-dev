'use client';

/**
 * Unit Form Dialog
 * Create or edit a unit in the community structure
 */

import { useState, useEffect, useCallback } from 'react';
import { Save, Home } from 'lucide-react';
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
import { createUnit, updateUnit, listFloors, listUnitTypes } from '@/lib/api/community';
import {
  Block,
  Floor,
  Unit,
  UnitType,
  CreateUnitRequest,
  UpdateUnitRequest,
  UnitStatus,
  getUnitStatusValue,
} from '@/types/community';

// ============================================
// Props
// ============================================

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: Unit | null; // null = create mode
  blocks: Block[]; // Available blocks for selection
  defaultBlockId?: string; // Pre-select block
  defaultFloorId?: string; // Pre-select floor
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function UnitFormDialog({
  open,
  onOpenChange,
  unit,
  blocks,
  defaultBlockId,
  defaultFloorId,
  onSuccess,
}: UnitFormDialogProps) {
  const isEditing = !!unit;

  // Form state
  const [blockId, setBlockId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [unitTypeId, setUnitTypeId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [areaSqft, setAreaSqft] = useState<string>('');
  const [status, setStatus] = useState<UnitStatus>(UnitStatus.Vacant);
  const [notes, setNotes] = useState('');

  // Dependent dropdown state
  const [floors, setFloors] = useState<Floor[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [isLoadingFloors, setIsLoadingFloors] = useState(false);
  const [isLoadingUnitTypes, setIsLoadingUnitTypes] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load floors when block changes
  const loadFloors = useCallback(async (selectedBlockId: string) => {
    if (!selectedBlockId) {
      setFloors([]);
      return;
    }

    setIsLoadingFloors(true);
    try {
      const result = await listFloors({ blockId: selectedBlockId, pageSize: 100 });
      setFloors(result.items);
    } catch (err) {
      console.error('Failed to load floors:', err);
      setFloors([]);
    } finally {
      setIsLoadingFloors(false);
    }
  }, []);

  // Load unit types
  const loadUnitTypes = useCallback(async () => {
    setIsLoadingUnitTypes(true);
    try {
      const result = await listUnitTypes({ pageSize: 100 });
      setUnitTypes(result.items);
      // Auto-select first unit type if none selected
      if (result.items.length > 0 && !unitTypeId) {
        setUnitTypeId(result.items[0].id);
      }
    } catch (err) {
      console.error('Failed to load unit types:', err);
      setUnitTypes([]);
    } finally {
      setIsLoadingUnitTypes(false);
    }
  }, [unitTypeId]);

  // Reset form when dialog opens/closes or unit changes
  useEffect(() => {
    if (open) {
      // Load unit types on open
      loadUnitTypes();
      
      if (unit) {
        // Edit mode: populate with existing data
        setBlockId(unit.blockId);
        setFloorId(unit.floorId);
        setUnitTypeId(unit.unitTypeId);
        setUnitNumber(unit.unitNumber);
        setAreaSqft(unit.areaSqft?.toString() || '');
        setStatus(getUnitStatusValue(unit.status));
        setNotes(unit.notes || '');
        // Load floors for the unit's block
        loadFloors(unit.blockId);
      } else {
        // Create mode: reset to defaults
        const initialBlockId = defaultBlockId || (blocks.length > 0 ? blocks[0].id : '');
        setBlockId(initialBlockId);
        setFloorId(defaultFloorId || '');
        setUnitNumber('');
        setAreaSqft('');
        setStatus(UnitStatus.Vacant);
        setNotes('');
        // Load floors for the default block
        if (initialBlockId) {
          loadFloors(initialBlockId);
        }
      }
      setError(null);
    }
  }, [open, unit, defaultBlockId, defaultFloorId, blocks, loadFloors, loadUnitTypes]);

  // Handle block change - reload floors
  const handleBlockChange = (newBlockId: string) => {
    setBlockId(newBlockId);
    setFloorId(''); // Reset floor selection
    loadFloors(newBlockId);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && unit) {
        // Update existing unit (block/floor cannot be changed via update)
        const request: UpdateUnitRequest = {
          unitTypeId,
          unitNumber,
          areaSqft: areaSqft ? parseFloat(areaSqft) : null,
          status,
          notes: notes || null,
        };
        await updateUnit(unit.id, request);
      } else {
        // Create new unit
        const request: CreateUnitRequest = {
          blockId,
          floorId,
          unitTypeId,
          unitNumber,
          areaSqft: areaSqft ? parseFloat(areaSqft) : null,
          status,
          notes: notes || null,
        };
        await createUnit(request);
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to save unit:', err);
      const message = err instanceof Error ? err.message : 'Failed to save unit';
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
            <Home className="h-5 w-5 text-primary-600" />
            {isEditing ? 'Edit Unit' : 'Create New Unit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Block Selection (only for create) */}
          {!isEditing && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Block *
              </label>
              <Select value={blockId} onValueChange={handleBlockChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a block" />
                </SelectTrigger>
                <SelectContent>
                  {blocks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Floor Selection (only for create) */}
          {!isEditing && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Floor *
              </label>
              <Select
                value={floorId}
                onValueChange={setFloorId}
                disabled={!blockId || isLoadingFloors}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={isLoadingFloors ? 'Loading floors...' : 'Select a floor'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {blockId && floors.length === 0 && !isLoadingFloors && (
                <p className="mt-1 text-xs text-amber-600">
                  No floors in this block. Create floors first.
                </p>
              )}
            </div>
          )}

          {/* Show block/floor in edit mode */}
          {isEditing && unit && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Block
                </label>
                <p className="rounded-lg bg-surface-50 px-3 py-2.5 text-sm text-gray-700">
                  {unit.blockName}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Floor
                </label>
                <p className="rounded-lg bg-surface-50 px-3 py-2.5 text-sm text-gray-700">
                  {unit.floorName}
                </p>
              </div>
            </div>
          )}

          {/* Unit Type Selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Unit Type *
            </label>
            <Select
              value={unitTypeId}
              onValueChange={setUnitTypeId}
              disabled={isLoadingUnitTypes}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoadingUnitTypes ? 'Loading types...' : 'Select unit type'}
                />
              </SelectTrigger>
              <SelectContent>
                {unitTypes.map((ut) => (
                  <SelectItem key={ut.id} value={ut.id}>
                    {ut.name} {ut.code && `(${ut.code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {unitTypes.length === 0 && !isLoadingUnitTypes && (
              <p className="mt-1 text-xs text-amber-600">
                No unit types available. Create unit types first.
              </p>
            )}
          </div>

          {/* Unit Number */}
          <Input
            label="Unit Number *"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            placeholder="e.g. 101, A-101, 1A"
            required
          />

          {/* Area */}
          <Input
            label="Area (sqft)"
            type="number"
            value={areaSqft}
            onChange={(e) => setAreaSqft(e.target.value)}
            placeholder="e.g. 1200"
            min={0}
            step="0.01"
          />

          {/* Status */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Status
            </label>
            <Select
              value={status.toString()}
              onValueChange={(v) => setStatus(parseInt(v) as UnitStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Vacant</SelectItem>
                <SelectItem value="1">Occupied</SelectItem>
                <SelectItem value="2">Under Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this unit..."
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
            <Button
              type="submit"
              isLoading={isSaving}
              disabled={!unitTypeId || (!isEditing && (!blockId || !floorId))}
            >
              <Save className="h-4 w-4" />
              {isEditing ? 'Save Changes' : 'Create Unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

