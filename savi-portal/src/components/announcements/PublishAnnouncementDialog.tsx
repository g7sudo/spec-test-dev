'use client';

/**
 * Publish Announcement Dialog
 * Allows publishing immediately or scheduling for later
 * Also supports setting expiration date
 */

import { useState } from 'react';
import { Loader2, Send, Clock, CalendarClock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { publishAnnouncement } from '@/lib/api/announcements';

// ============================================
// Props
// ============================================

interface PublishAnnouncementDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  announcementId: string;
  announcementTitle: string;
}

// ============================================
// Component
// ============================================

export function PublishAnnouncementDialog({
  open,
  onClose,
  onSuccess,
  announcementId,
  announcementTitle,
}: PublishAnnouncementDialogProps) {
  // Form state
  const [publishType, setPublishType] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setPublishType('now');
      setScheduledAt('');
      setExpiresAt('');
      setError(null);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    // Validation for scheduling
    if (publishType === 'schedule' && !scheduledAt) {
      setError('Please select a date and time to schedule');
      return;
    }

    // Validate scheduled date is in the future
    if (publishType === 'schedule' && scheduledAt) {
      const scheduled = new Date(scheduledAt);
      if (scheduled <= new Date()) {
        setError('Scheduled date must be in the future');
        return;
      }
    }

    // Validate expiry is after scheduled/current time
    if (expiresAt) {
      const expires = new Date(expiresAt);
      const compareDate = publishType === 'schedule' ? new Date(scheduledAt) : new Date();
      if (expires <= compareDate) {
        setError('Expiry date must be after the publish date');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await publishAnnouncement(announcementId, {
        publishImmediately: publishType === 'now',
        scheduledAt: publishType === 'schedule' ? new Date(scheduledAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });

      onSuccess();
    } catch (err) {
      console.error('Failed to publish announcement:', err);
      setError(err instanceof Error ? err.message : 'Failed to publish announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary-500" />
            Publish Announcement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Announcement Title Preview */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Publishing:</p>
            <p className="font-medium text-gray-900 truncate">{announcementTitle}</p>
          </div>

          {/* Publish Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              When to publish?
            </label>

            {/* Publish Now */}
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                publishType === 'now'
                  ? 'bg-primary-50 border-primary-300'
                  : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="publishType"
                checked={publishType === 'now'}
                onChange={() => setPublishType('now')}
                className="h-4 w-4 text-primary-600"
              />
              <Send className="h-5 w-5 text-primary-500" />
              <div>
                <p className="font-medium text-gray-900">Publish Now</p>
                <p className="text-sm text-gray-500">Make visible immediately</p>
              </div>
            </label>

            {/* Schedule */}
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                publishType === 'schedule'
                  ? 'bg-primary-50 border-primary-300'
                  : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="publishType"
                checked={publishType === 'schedule'}
                onChange={() => setPublishType('schedule')}
                className="h-4 w-4 text-primary-600"
              />
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">Schedule for Later</p>
                <p className="text-sm text-gray-500">Publish at a specific date/time</p>
              </div>
            </label>
          </div>

          {/* Schedule Date Input */}
          {publishType === 'schedule' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CalendarClock className="h-4 w-4 inline mr-1" />
                Scheduled Date/Time *
              </label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          {/* Expiry Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date (Optional)
            </label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={
                publishType === 'schedule' && scheduledAt
                  ? scheduledAt
                  : new Date().toISOString().slice(0, 16)
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Announcement will be auto-archived after this date
            </p>
          </div>

          {/* Error Message */}
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
            {publishType === 'now' ? 'Publish Now' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

