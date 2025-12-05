'use client';

/**
 * Move Out Resident Dialog
 * Handles moving out a resident from their unit/lease
 * 
 * Scenarios:
 * 1. Co-resident: Simply sets MoveOutDate
 * 2. Primary resident: Offers choices:
 *    - End entire lease (all residents become past)
 *    - Transfer primary to another resident and move out
 */

import { useState, useEffect, useMemo } from 'react';
import {
  LogOut,
  Calendar,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle,
  User,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { moveOutResident } from '@/lib/api/residents';
import { Resident } from '@/types/resident';

// ============================================
// Types
// ============================================

interface MoveOutResidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The resident to move out */
  resident: Resident | null;
  /** Other residents on the same lease (for primary transfer) */
  coResidents?: Resident[];
  /** Callback when move-out is successful */
  onSuccess: () => void;
}

type MoveOutOption = 'end_lease' | 'transfer_primary';

// ============================================
// Main Component
// ============================================

export function MoveOutResidentDialog({
  open,
  onOpenChange,
  resident,
  coResidents = [],
  onSuccess,
}: MoveOutResidentDialogProps) {
  // Form state
  const [moveOutDate, setMoveOutDate] = useState('');
  const [moveOutOption, setMoveOutOption] = useState<MoveOutOption>('end_lease');
  const [newPrimaryId, setNewPrimaryId] = useState('');
  const [terminationReason, setTerminationReason] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if this is a primary resident
  const isPrimary = resident?.isPrimary === true;

  // Filter co-residents to show as transfer options (exclude the current resident)
  const transferOptions = useMemo(() => {
    if (!resident) return [];
    return coResidents.filter(
      (r) =>
        r.leasePartyId !== resident.leasePartyId &&
        r.statusText !== 'Past'
    );
  }, [resident, coResidents]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && resident) {
      // Default to today's date
      const today = new Date().toISOString().split('T')[0];
      setMoveOutDate(today);
      setMoveOutOption('end_lease');
      setNewPrimaryId('');
      setTerminationReason('');
      setError(null);
      setSuccess(false);
    }
  }, [open, resident]);

  if (!resident) return null;

  // Handle form submission
  const handleSubmit = async () => {
    setError(null);

    // Validate date
    if (!moveOutDate) {
      setError('Please select a move-out date');
      return;
    }

    // Validate transfer selection if primary and not ending lease
    if (isPrimary && moveOutOption === 'transfer_primary' && !newPrimaryId) {
      setError('Please select who will become the new primary resident');
      return;
    }

    setIsSubmitting(true);

    try {
      await moveOutResident(resident.leasePartyId, {
        moveOutDate,
        // For primary residents, determine if we're ending the lease or transferring
        endLease: isPrimary ? moveOutOption === 'end_lease' : undefined,
        terminationReason:
          isPrimary && moveOutOption === 'end_lease' && terminationReason
            ? terminationReason
            : undefined,
        newPrimaryLeasePartyId:
          isPrimary && moveOutOption === 'transfer_primary'
            ? newPrimaryId
            : undefined,
      });

      setSuccess(true);

      // Close dialog after brief delay to show success
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1200);
    } catch (err: unknown) {
      console.error('Failed to move out resident:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to process move-out. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-amber-600" />
            Move Out Resident
          </DialogTitle>
          <DialogDescription>
            Record the move-out for this resident
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Resident Info */}
          <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{resident.residentName}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Unit {resident.unitNumber}</span>
                {resident.blockName && (
                  <>
                    <span>•</span>
                    <span>{resident.blockName}</span>
                  </>
                )}
                <span>•</span>
                <span
                  className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    isPrimary
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {resident.roleText}
                </span>
              </div>
            </div>
          </div>

          {/* Move Out Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Move Out Date *
            </label>
            <Input
              type="date"
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
              leftAddon={<Calendar className="h-4 w-4" />}
            />
          </div>

          {/* Primary Resident Options */}
          {isPrimary && (
            <div className="space-y-4">
              {/* Warning Banner */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">
                    This is the primary resident
                  </p>
                  <p className="text-amber-700 mt-1">
                    Choose whether to end the lease or transfer primary
                    responsibility to another resident.
                  </p>
                </div>
              </div>

              {/* Option Selection */}
              <div className="space-y-3">
                {/* End Lease Option */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    moveOutOption === 'end_lease'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-surface-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="moveOutOption"
                    value="end_lease"
                    checked={moveOutOption === 'end_lease'}
                    onChange={() => setMoveOutOption('end_lease')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">End Entire Lease</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      All residents will be moved out and the lease will be
                      terminated
                    </p>
                  </div>
                </label>

                {/* Transfer Primary Option - only if there are co-residents */}
                {transferOptions.length > 0 && (
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      moveOutOption === 'transfer_primary'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:bg-surface-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="moveOutOption"
                      value="transfer_primary"
                      checked={moveOutOption === 'transfer_primary'}
                      onChange={() => setMoveOutOption('transfer_primary')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Transfer Primary & Move Out
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Make another resident the primary and keep the lease
                        active
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* Transfer Selection */}
              {moveOutOption === 'transfer_primary' &&
                transferOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      New Primary Resident *
                    </label>
                    <Select value={newPrimaryId} onValueChange={setNewPrimaryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new primary..." />
                      </SelectTrigger>
                      <SelectContent>
                        {transferOptions.map((r) => (
                          <SelectItem key={r.leasePartyId} value={r.leasePartyId}>
                            <div className="flex items-center gap-2">
                              <span>{r.residentName}</span>
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-500">Primary</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

              {/* Termination Reason (optional) */}
              {moveOutOption === 'end_lease' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Termination Reason (optional)
                  </label>
                  <Input
                    type="text"
                    value={terminationReason}
                    onChange={(e) => setTerminationReason(e.target.value)}
                    placeholder="e.g., Lease completed, Early termination..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                {resident.residentName} has been moved out
                {isPrimary && moveOutOption === 'end_lease' && ' and the lease has been ended'}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {!success && (
              <Button
                variant="danger"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Confirm Move Out
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


