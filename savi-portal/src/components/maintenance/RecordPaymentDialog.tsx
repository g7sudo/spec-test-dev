'use client';

/**
 * Record Payment Dialog
 * Record owner payment after approval
 */

import { useState, useEffect } from 'react';
import { Loader2, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { recordPayment } from '@/lib/api/maintenance';

// ============================================
// Props
// ============================================

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
  approvedAmount?: number | null;
}

// ============================================
// Component
// ============================================

export function RecordPaymentDialog({
  open,
  onClose,
  onSuccess,
  requestId,
  approvedAmount,
}: RecordPaymentDialogProps) {
  // Form state
  const [paidAmount, setPaidAmount] = useState(approvedAmount?.toString() || '');
  const [paymentReference, setPaymentReference] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setPaidAmount(approvedAmount?.toString() || '');
      setPaymentReference('');
      setError(null);
    }
  }, [open, approvedAmount]);

  // ============================================
  // Submit
  // ============================================

  const handleSubmit = async () => {
    if (!paidAmount || parseFloat(paidAmount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await recordPayment(requestId, {
        paidAmount: parseFloat(paidAmount),
        paymentReference: paymentReference.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to record payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to record payment');
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
          <DialogTitle>
            <CreditCard className="h-5 w-5 inline mr-2" />
            Record Owner Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Record the payment received from the owner for this maintenance work.
          </p>

          {/* Approved Amount Reference */}
          {approvedAmount && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <span className="text-gray-500">Approved amount: </span>
              <span className="font-medium">${approvedAmount.toFixed(2)}</span>
            </div>
          )}

          {/* Paid Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Paid *
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Payment Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Reference
            </label>
            <Input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Receipt no. / Transaction ID"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Receipt number, transaction ID, or internal reference
            </p>
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
          <Button onClick={handleSubmit} disabled={isSubmitting || !paidAmount}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

