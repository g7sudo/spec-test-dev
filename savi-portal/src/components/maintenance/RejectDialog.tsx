'use client';

/**
 * Reject Maintenance Request Dialog
 * Allows supervisor to reject a maintenance request with reason
 */

import { useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { rejectMaintenanceRequest, rejectApproval } from '@/lib/api/maintenance';

// ============================================
// Props
// ============================================

interface RejectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
  // Type of rejection: 'request' for the request itself, 'approval' for owner approval
  type: 'request' | 'approval';
}

// ============================================
// Component
// ============================================

export function RejectDialog({
  open,
  onClose,
  onSuccess,
  requestId,
  type,
}: RejectDialogProps) {
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
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (type === 'request') {
        await rejectMaintenanceRequest(requestId, { reason: reason.trim() });
      } else {
        await rejectApproval(requestId, { reason: reason.trim() });
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to reject:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  const title = type === 'request' ? 'Reject Request' : 'Reject Approval';
  const description =
    type === 'request'
      ? 'This will reject the maintenance request. Please provide a reason.'
      : 'This will reject the owner approval request. Please provide a reason.';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">{description}</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Rejection *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this is being rejected..."
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
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

