'use client';

/**
 * Add Comment Dialog
 * Add a comment/note to a maintenance request with optional attachments
 */

import { useState, useEffect, useRef } from 'react';
import { Loader2, MessageSquare, Paperclip, X, Image as ImageIcon } from 'lucide-react';
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
// Constants
// ============================================

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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
  
  // Attachments state
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setCommentType(MaintenanceCommentType.StaffPublicReply);
      setMessage('');
      setVisibleToResident(true);
      setVisibleToOwner(true);
      setAttachments([]);
      setError(null);
    }
  }, [open]);

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
  // Attachment Handlers
  // ============================================

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    let errorMsg = '';

    Array.from(files).forEach((file) => {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errorMsg = 'Only image files (JPEG, PNG, GIF, WebP) are allowed';
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errorMsg = `Files must be under ${MAX_FILE_SIZE_MB}MB`;
        return;
      }

      // Check total count
      if (attachments.length + newFiles.length >= MAX_ATTACHMENTS) {
        errorMsg = `Maximum ${MAX_ATTACHMENTS} attachments allowed`;
        return;
      }

      newFiles.push(file);
    });

    if (errorMsg) {
      setError(errorMsg);
    }

    if (newFiles.length > 0) {
      setAttachments((prev) => [...prev, ...newFiles]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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
      await addMaintenanceComment(
        requestId,
        {
          commentType,
          message: message.trim(),
          isVisibleToResident: visibleToResident,
          isVisibleToOwner: visibleToOwner,
        },
        attachments.length > 0 ? attachments : undefined
      );
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

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments ({attachments.length}/{MAX_ATTACHMENTS})
            </label>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="relative group flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 pr-8"
                  >
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700 truncate max-w-[120px]">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                    >
                      <X className="h-3 w-3 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add attachment button */}
            {attachments.length < MAX_ATTACHMENTS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Add Attachment
              </Button>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Images only (JPEG, PNG, GIF, WebP). Max {MAX_FILE_SIZE_MB}MB each.
            </p>
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
            {attachments.length > 0 
              ? `Add Comment (${attachments.length} file${attachments.length > 1 ? 's' : ''})` 
              : 'Add Comment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
