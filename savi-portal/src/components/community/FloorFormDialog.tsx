'use client';

/**
 * Floor Form Dialog
 * Create or edit a floor in the community structure
 */

import { useState, useEffect } from 'react';
import { Save, Layers } from 'lucide-react';
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
import { createFloor, updateFloor } from '@/lib/api/community';
import { Block, Floor, CreateFloorRequest, UpdateFloorRequest } from '@/types/community';

// ============================================
// Props
// ============================================

interface FloorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floor?: Floor | null; // null = create mode
  blocks: Block[]; // Available blocks for selection
  defaultBlockId?: string; // Pre-select block when creating from block context
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function FloorFormDialog({
  open,
  onOpenChange,
  floor,
  blocks,
  defaultBlockId,
  onSuccess,
}: FloorFormDialogProps) {
  const isEditing = !!floor;

  // Form state
  const [blockId, setBlockId] = useState('');
  const [name, setName] = useState('');
  const [levelNumber, setLevelNumber] = useState(1);
  const [displayOrder, setDisplayOrder] = useState(0);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or floor changes
  useEffect(() => {
    if (open) {
      if (floor) {
        // Edit mode: populate form with existing data
        setBlockId(floor.blockId);
        setName(floor.name);
        setLevelNumber(floor.levelNumber);
        setDisplayOrder(floor.displayOrder);
      } else {
        // Create mode: reset to defaults
        setBlockId(defaultBlockId || (blocks.length > 0 ? blocks[0].id : ''));
        setName('');
        setLevelNumber(1);
        setDisplayOrder(0);
      }
      setError(null);
    }
  }, [open, floor, defaultBlockId, blocks]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && floor) {
        // Update existing floor (blockId cannot be changed)
        const request: UpdateFloorRequest = {
          name,
          levelNumber,
          displayOrder,
        };
        await updateFloor(floor.id, request);
      } else {
        // Create new floor
        const request: CreateFloorRequest = {
          blockId,
          name,
          levelNumber,
          displayOrder,
        };
        await createFloor(request);
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to save floor:', err);
      const message = err instanceof Error ? err.message : 'Failed to save floor';
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
            <Layers className="h-5 w-5 text-primary-600" />
            {isEditing ? 'Edit Floor' : 'Create New Floor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Block Selection (only for create, not editable after) */}
          {!isEditing && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Block *
              </label>
              <Select value={blockId} onValueChange={setBlockId}>
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
              {blocks.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No blocks available. Create a block first.
                </p>
              )}
            </div>
          )}

          {/* Show block name in edit mode */}
          {isEditing && floor && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Block
              </label>
              <p className="rounded-lg bg-surface-50 px-3 py-2.5 text-sm text-gray-700">
                {floor.blockName}
              </p>
            </div>
          )}

          {/* Floor Name */}
          <Input
            label="Floor Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ground Floor, Floor 1, Basement"
            required
          />

          {/* Level Number */}
          <Input
            label="Level Number *"
            type="number"
            value={levelNumber}
            onChange={(e) => setLevelNumber(parseInt(e.target.value) || 0)}
            placeholder="1"
            required
          />

          {/* Display Order */}
          <Input
            label="Display Order"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            placeholder="0"
            min={0}
          />

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
              disabled={!isEditing && (!blockId || blocks.length === 0)}
            >
              <Save className="h-4 w-4" />
              {isEditing ? 'Save Changes' : 'Create Floor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

