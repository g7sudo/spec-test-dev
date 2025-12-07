'use client';

/**
 * Add Comment Dialog
 * Add a comment/note to a maintenance request
 */

import { useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { addMaintenanceComment } from '@/lib/api/maintenance';
import { MaintenanceCommentType, COMMENT_TYPE_OPTIONS } from '@/types/maintenance';

// ============================================
// Props
// ============================================

interface AddCommentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
}

// ============================================
// Component
// ============================================

export function AddCommentDialog({
  open,
  onClose,
  onSuccess,
  requestId,
}: AddCommentDialogProps) {
  // Form state
  const [commentType, setCommentType] = useState<MaintenanceCommentType>(
    MaintenanceCommentType.StaffPublicReply
  );
  const [message, setMessage] = useState('');
  const [visibleToResident, setVisibleToResident] = useState(true);
  const [visibleToOwner, setVisibleToOwner] = useState(true);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when dialog opens
  useState(() => {
    if (open) {
      setCommentType(MaintenanceCommentType.StaffPublicReply);
      setMessage('');
      setVisibleToResident(true);
      setVisibleToOwner(true);
      setError(null);
    }
  });

  // Update visibility based on comment type
  const handleTypeChange = (type: MaintenanceCommentType) => {
    setCommentType(type);
    // Internal notes are hidden from resident/owner by default
    if (type === MaintenanceCommentType.StaffInternalNote) {
      setVisibleToResident(false);
      setVisibleToOwner(false);
    } else {
      setVisibleToResident(true);
      setVisibleToOwner(true);
    }
  };

  // ============================================
  // Submit
  // ============================================

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addMaintenanceComment(requestId, {
        commentType,
        message: message.trim(),
        isVisibleToResident: visibleToResident,
        isVisibleToOwner: visibleToOwner,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment');
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
            <MessageSquare className="h-5 w-5 inline mr-2" />
            Add Comment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment Type
            </label>
            <Select
              value={commentType}
              onValueChange={(v) => handleTypeChange(v as MaintenanceCommentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your comment or note..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Visibility
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={visibleToResident}
                  onChange={(e) => setVisibleToResident(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Visible to resident
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={visibleToOwner}
                  onChange={(e) => setVisibleToOwner(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Visible to owner
              </label>
            </div>
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
          <Button onClick={handleSubmit} disabled={isSubmitting || !message.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

