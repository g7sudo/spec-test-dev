'use client';

/**
 * Request Owner Approval Dialog
 * Send estimate for owner approval
 */

import { useState } from 'react';
import { Loader2, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requestApproval } from '@/lib/api/maintenance';

// ============================================
// Props
// ============================================

interface RequestApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
  suggestedAmount?: number | null;
}

// ============================================
// Component
// ============================================

export function RequestApprovalDialog({
  open,
  onClose,
  onSuccess,
  requestId,
  suggestedAmount,
}: RequestApprovalDialogProps) {
  // Form state
  const [requestedAmount, setRequestedAmount] = useState(suggestedAmount?.toString() || '');
  const [currency, setCurrency] = useState('USD');
  const [requiresPayment, setRequiresPayment] = useState(true);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when dialog opens
  useState(() => {
    if (open) {
      setRequestedAmount(suggestedAmount?.toString() || '');
      setRequiresPayment(true);
      setError(null);
    }
  });

  // ============================================
  // Submit
  // ============================================

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await requestApproval(requestId, {
        requestedAmount: requestedAmount ? parseFloat(requestedAmount) : null,
        currency: currency || null,
        requiresOwnerPayment: requiresPayment,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to request approval:', err);
      setError(err instanceof Error ? err.message : 'Failed to request approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Owner Approval</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Send the estimate to the owner for approval before proceeding with work.
          </p>

          {/* Requested Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Estimated Amount
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total estimated cost from detail lines (optional)
            </p>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="USD"
              maxLength={3}
            />
          </div>

          {/* Requires Payment */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiresPayment"
              checked={requiresPayment}
              onChange={(e) => setRequiresPayment(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="requiresPayment" className="text-sm text-gray-700">
              Owner payment required after approval
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send for Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

