'use client';

/**
 * Blackout Form Dialog
 * Used for creating and editing amenity blackout periods
 */

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createBlackout, updateBlackout } from '@/lib/api/amenities';
import { AmenityBlackout } from '@/types/amenity';

// ============================================
// Types
// ============================================

interface BlackoutFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Amenity ID for creating a new blackout */
  amenityId: string;
  /** Amenity name for display */
  amenityName: string;
  /** Existing blackout for editing; null for create mode */
  blackout?: AmenityBlackout | null;
  /** Callback when blackout is created/updated successfully */
  onSuccess: () => void;
}

interface FormData {
  startDate: string;
  endDate: string;
  reason: string;
  autoCancelBookings: boolean;
}

// ============================================
// Main Component
// ============================================

export function BlackoutFormDialog({
  open,
  onOpenChange,
  amenityId,
  amenityName,
  blackout,
  onSuccess,
}: BlackoutFormDialogProps) {
  const isEdit = !!blackout;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    startDate: '',
    endDate: '',
    reason: '',
    autoCancelBookings: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing or reset when creating
  useEffect(() => {
    if (open) {
      setError(null);

      if (blackout) {
        setFormData({
          startDate: blackout.startDate,
          endDate: blackout.endDate,
          reason: blackout.reason || '',
          autoCancelBookings: blackout.autoCancelBookings,
        });
      } else {
        // Default to tomorrow and day after
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);

        setFormData({
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: dayAfter.toISOString().split('T')[0],
          reason: '',
          autoCancelBookings: false,
        });
      }
    }
  }, [open, blackout]);

  // Update a single form field
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Validate form
  const validate = (): boolean => {
    setError(null);

    if (!formData.startDate) {
      setError('Start date is required');
      return false;
    }

    if (!formData.endDate) {
      setError('End date is required');
      return false;
    }

    if (formData.startDate > formData.endDate) {
      setError('End date must be after start date');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim() || null,
        autoCancelBookings: formData.autoCancelBookings,
      };

      if (isEdit && blackout) {
        await updateBlackout(blackout.id, payload);
      } else {
        await createBlackout({
          amenityId,
          ...payload,
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Failed to save blackout:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save blackout. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Blackout Period' : 'Add Blackout Period'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update blackout period for ${amenityName}`
              : `Create a new blackout period for ${amenityName}. Bookings will not be allowed during this time.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Date *
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                End Date *
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                min={formData.startDate}
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              rows={3}
              placeholder="e.g., Christmas Holiday, Maintenance, etc."
              value={formData.reason}
              onChange={(e) => updateField('reason', e.target.value)}
            />
          </div>

          {/* Auto Cancel Bookings */}
          <label className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={formData.autoCancelBookings}
              onChange={(e) => updateField('autoCancelBookings', e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span className="text-sm font-medium text-amber-900">
                Auto-cancel existing bookings
              </span>
              <p className="text-xs text-amber-700 mt-0.5">
                Automatically cancel any existing approved bookings that overlap with
                this blackout period
              </p>
            </div>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                'Update Blackout'
              ) : (
                'Create Blackout'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

