'use client';

/**
 * Cancel Maintenance Request Dialog
 * Allows user to cancel a maintenance request with optional reason
 */

import { useState } from 'react';
import { Loader2, Ban } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cancelMaintenanceRequest } from '@/lib/api/maintenance';

// ============================================
// Props
// ============================================

interface CancelDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
}

// ============================================
// Component
// ============================================

export function CancelDialog({
  open,
  onClose,
  onSuccess,
  requestId,
}: CancelDialogProps) {
  // Form state
  const [reason, setReason] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when dialog opens
  useState(() => {
    if (open) {
      setReason('');
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
      await cancelMaintenanceRequest(requestId, {
        reason: reason.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to cancel request:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
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
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-gray-500" />
            Cancel Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to cancel this maintenance request? This action cannot be undone.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this request being cancelled?"
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
            Keep Request
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cancel Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

