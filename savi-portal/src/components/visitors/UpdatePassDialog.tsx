'use client';

/**
 * Update Visitor Pass Dialog
 * Allows editing visitor pass details before check-in
 */

import { useState, useEffect } from 'react';
import { Loader2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateVisitorPass } from '@/lib/api/visitors';
import { VisitorPass } from '@/types/visitor';

// ============================================
// Props
// ============================================

interface UpdatePassDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  passId: string;
  currentData: VisitorPass | null;
}

// ============================================
// Component
// ============================================

export function UpdatePassDialog({
  open,
  onClose,
  onSuccess,
  passId,
  currentData,
}: UpdatePassDialogProps) {
  // Form state
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [notes, setNotes] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form when dialog opens with current data
  useEffect(() => {
    if (open && currentData) {
      setVisitorName(currentData.visitorName || '');
      setVisitorPhone(currentData.visitorPhone || '');
      setVehicleNumber(currentData.vehicleNumber || '');
      setVehicleType(currentData.vehicleType || '');
      setNotes(currentData.notes || '');
      setError(null);
    }
  }, [open, currentData]);

  // ============================================
  // Submit
  // ============================================

  const handleSubmit = async () => {
    // Validation
    if (!visitorName.trim()) {
      setError('Visitor name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateVisitorPass(passId, {
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        vehicleType: vehicleType.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to update visitor pass:', err);
      setError(err instanceof Error ? err.message : 'Failed to update visitor pass');
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
            <Edit className="h-5 w-5" />
            Update Visitor Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Visitor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visitor Name *
            </label>
            <Input
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Full name of the visitor"
              maxLength={200}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <Input
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
              placeholder="Visitor's phone number"
              maxLength={50}
            />
          </div>

          {/* Vehicle Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Number
              </label>
              <Input
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="Plate number"
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type
              </label>
              <Input
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="e.g., Car, Motorcycle"
                maxLength={50}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              rows={2}
              maxLength={1000}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Error */}
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
          <Button onClick={handleSubmit} disabled={isSubmitting || !visitorName.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
