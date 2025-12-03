'use client';

/**
 * Block Form Dialog
 * Create or edit a block in the community structure
 */

import { useState, useEffect } from 'react';
import { Save, Loader2, Building } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createBlock, updateBlock } from '@/lib/api/community';
import { Block, CreateBlockRequest, UpdateBlockRequest } from '@/types/community';

// ============================================
// Props
// ============================================

interface BlockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block?: Block | null; // null = create mode
  onSuccess: () => void;
}

// ============================================
// Component
// ============================================

export function BlockFormDialog({
  open,
  onOpenChange,
  block,
  onSuccess,
}: BlockFormDialogProps) {
  const isEditing = !!block;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or block changes
  useEffect(() => {
    if (open) {
      if (block) {
        setName(block.name);
        setDescription(block.description || '');
        setDisplayOrder(block.displayOrder);
      } else {
        // Reset to defaults for new block
        setName('');
        setDescription('');
        setDisplayOrder(0);
      }
      setError(null);
    }
  }, [open, block]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && block) {
        // Update existing block
        const request: UpdateBlockRequest = {
          name,
          description: description || null,
          displayOrder,
        };
        await updateBlock(block.id, request);
      } else {
        // Create new block
        const request: CreateBlockRequest = {
          name,
          description: description || null,
          displayOrder,
        };
        await createBlock(request);
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to save block:', err);
      const message = err instanceof Error ? err.message : 'Failed to save block';
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
            <Building className="h-5 w-5 text-primary-600" />
            {isEditing ? 'Edit Block' : 'Create New Block'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Block Name */}
          <Input
            label="Block Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Block A, Tower 1, Building North"
            required
          />

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of the block..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>

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
            <Button type="submit" isLoading={isSaving}>
              <Save className="h-4 w-4" />
              {isEditing ? 'Save Changes' : 'Create Block'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

