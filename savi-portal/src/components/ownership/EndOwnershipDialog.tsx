'use client';

/**
 * End Ownership Dialog (F-OWN-05)
 * Ends ownership for a specific owner without full transfer
 * Used when one co-owner exits but others remain
 */

import { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Briefcase,
  Loader2,
  AlertCircle,
  Star,
  Calendar,
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
import { endOwnership } from '@/lib/api/ownership';
import { PartyType } from '@/types/party';
import {
  UnitOwnership,
  formatDateOnly,
} from '@/types/ownership';

// ============================================
// Types
// ============================================

interface EndOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The ownership record to end */
  ownership: UnitOwnership | null;
  /** Unit number for context */
  unitNumber: string;
  /** Callback when ownership is ended successfully */
  onSuccess: () => void;
}

// ============================================
// Party Type Icon
// ============================================

function PartyTypeIcon({ type }: { type: PartyType }) {
  switch (type) {
    case PartyType.Individual:
      return <User className="h-5 w-5" />;
    case PartyType.Company:
      return <Building2 className="h-5 w-5" />;
    case PartyType.Entity:
      return <Briefcase className="h-5 w-5" />;
    default:
      return <User className="h-5 w-5" />;
  }
}

// ============================================
// Main Component
// ============================================

export function EndOwnershipDialog({
  open,
  onOpenChange,
  ownership,
  unitNumber,
  onSuccess,
}: EndOwnershipDialogProps) {
  // End date state
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setEndDate(new Date().toISOString().split('T')[0]);
      setError(null);
    }
  }, [open]);

  // Handle submit
  const handleSubmit = async () => {
    if (!ownership) return;
    
    setError(null);
    
    // Validate end date
    const [year, month, day] = endDate.split('-').map(Number);
    if (!year || !month || !day) {
      setError('Please select a valid end date');
      return;
    }
    
    // Validate end date is not before from date
    if (ownership.fromDate) {
      let fromDateObj: Date;
      
      if (typeof ownership.fromDate === 'string') {
        // Handle ISO string format "YYYY-MM-DD"
        fromDateObj = new Date(ownership.fromDate + 'T00:00:00');
      } else {
        // Handle DateOnly object
        fromDateObj = new Date(
          ownership.fromDate.year,
          ownership.fromDate.month - 1,
          ownership.fromDate.day
        );
      }
      
      const endDateObj = new Date(year, month - 1, day);
      
      if (endDateObj < fromDateObj) {
        setError('End date cannot be before the start date');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // API expects ISO date string "YYYY-MM-DD"
      await endOwnership(ownership.id, {
        endDate: endDate, // Already in ISO format from input[type=date]
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Failed to end ownership:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to end ownership. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ownership) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>End Ownership</DialogTitle>
          <DialogDescription>
            End ownership for this owner on Unit {unitNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Owner Info */}
          <div className="flex items-center gap-4 p-4 bg-surface-50 rounded-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <PartyTypeIcon type={ownership.partyType} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{ownership.partyName}</p>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{ownership.ownershipShare}% share</span>
                {ownership.isPrimaryOwner && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Star className="h-3.5 w-3.5" />
                    Primary
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ownership Period Info */}
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Started: {formatDateOnly(ownership.fromDate)}</span>
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              The ownership will be recorded as ending on this date.
            </p>
          </div>

          {/* Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <p>
              This will end the ownership for <strong>{ownership.partyName}</strong> on 
              Unit {unitNumber}. The ownership record will be preserved in the history.
            </p>
          </div>

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
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ending...
                </>
              ) : (
                'End Ownership'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


