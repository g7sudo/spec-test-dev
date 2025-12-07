'use client';

/**
 * Detail Line Item Dialog
 * Add or edit service/spare part line items for a maintenance request
 */

import { useState, useEffect } from 'react';
import { Loader2, Package, Wrench, DollarSign } from 'lucide-react';
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
import {
  addMaintenanceRequestDetail,
  updateMaintenanceRequestDetail,
} from '@/lib/api/maintenance';
import {
  MaintenanceRequestDetail,
  MaintenanceDetailType,
  DETAIL_TYPE_OPTIONS,
} from '@/types/maintenance';

// ============================================
// Props
// ============================================

interface DetailLineDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
  // If editing, pass existing detail
  detail?: MaintenanceRequestDetail | null;
}

// ============================================
// Component
// ============================================

export function DetailLineDialog({
  open,
  onClose,
  onSuccess,
  requestId,
  detail,
}: DetailLineDialogProps) {
  const isEditing = !!detail;

  // Form state
  const [lineType, setLineType] = useState<MaintenanceDetailType>(MaintenanceDetailType.Service);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitOfMeasure, setUnitOfMeasure] = useState('');
  const [estimatedUnitPrice, setEstimatedUnitPrice] = useState('');
  const [isBillable, setIsBillable] = useState(true);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens or detail changes
  useEffect(() => {
    if (open) {
      if (detail) {
        setLineType((detail.lineType as MaintenanceDetailType) || MaintenanceDetailType.Service);
        setDescription(detail.description || '');
        setQuantity(detail.quantity?.toString() || '1');
        setUnitOfMeasure(detail.unitOfMeasure || '');
        setEstimatedUnitPrice(detail.estimatedUnitPrice?.toString() || '');
        setIsBillable(detail.isBillable ?? true);
      } else {
        setLineType(MaintenanceDetailType.Service);
        setDescription('');
        setQuantity('1');
        setUnitOfMeasure('');
        setEstimatedUnitPrice('');
        setIsBillable(true);
      }
      setError(null);
    }
  }, [open, detail]);

  // Calculate total
  const estimatedTotal =
    parseFloat(quantity || '0') * parseFloat(estimatedUnitPrice || '0') || null;

  // ============================================
  // Submit
  // ============================================

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const data = {
      lineType,
      description: description.trim(),
      quantity: parseFloat(quantity),
      unitOfMeasure: unitOfMeasure.trim() || undefined,
      estimatedUnitPrice: estimatedUnitPrice ? parseFloat(estimatedUnitPrice) : undefined,
      isBillable,
    };

    try {
      if (isEditing && detail) {
        await updateMaintenanceRequestDetail(requestId, detail.id, data);
      } else {
        await addMaintenanceRequestDetail(requestId, data);
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to save detail');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Line Item' : 'Add Line Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Line Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <Select value={lineType} onValueChange={(v) => setLineType(v as MaintenanceDetailType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DETAIL_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.value === MaintenanceDetailType.Service && <Wrench className="h-4 w-4 inline mr-2" />}
                    {opt.value === MaintenanceDetailType.SparePart && <Package className="h-4 w-4 inline mr-2" />}
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                lineType === MaintenanceDetailType.Service
                  ? 'e.g., Labour - tap replacement'
                  : 'e.g., Cartridge 35mm'
              }
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit of Measure
              </label>
              <Input
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                placeholder="e.g., pcs, hours"
              />
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Est. Unit Price
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={estimatedUnitPrice}
                onChange={(e) => setEstimatedUnitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Est. Total
              </label>
              <div className="h-10 flex items-center px-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium">
                {estimatedTotal !== null ? `$${estimatedTotal.toFixed(2)}` : '-'}
              </div>
            </div>
          </div>

          {/* Billable */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isBillable"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isBillable" className="text-sm text-gray-700">
              Billable to owner
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !description.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update' : 'Add'} Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

