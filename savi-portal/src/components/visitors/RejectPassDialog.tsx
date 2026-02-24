'use client';

/**
 * Reject Visitor Pass Dialog
 * Allows admin/resident to reject a visitor pass with optional reason
 */

import { useState, useEffect } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { rejectVisitorPass } from '@/lib/api/visitors';

// ============================================
// Props
// ============================================

interface RejectPassDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  passId: string;
}

// ============================================
// Component
// ============================================

export function RejectPassDialog({
  open,
  onClose,
  onSuccess,
  passId,
}: RejectPassDialogProps) {
  // Form state
  const [reason, setReason] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  // ============================================
  // Submit
  // ============================================

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await rejectVisitorPass(passId, {
        reason: reason.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to reject visitor pass:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject visitor pass');
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
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Reject Visitor Pass
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will reject the visitor pass. The visitor will not be allowed entry.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Rejection
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optionally explain why this visitor is being rejected..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
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
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
