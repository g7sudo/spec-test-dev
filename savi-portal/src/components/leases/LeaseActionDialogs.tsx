'use client';

/**
 * Lease Action Dialogs
 * - ActivateLeaseDialog: Activates a draft lease (Flow 4, Step 4)
 * - EndLeaseDialog: Ends an active lease (Flow 4, Step 5)
 * - RemoveLeasePartyDialog: Removes a party from a lease
 */

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  AlertTriangle,
  User,
  Building2,
  Briefcase,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { activateLease, endLease, removeLeaseParty } from '@/lib/api/leases';
import {
  Lease,
  LeaseParty,
  formatLeaseDate,
  getLeasePartyRoleLabel,
} from '@/types/lease';
import { PartyType, getPartyTypeLabel } from '@/types/party';

// ============================================
// Activate Lease Dialog
// ============================================

interface ActivateLeaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lease: Lease | null;
  onSuccess: () => void;
}

export function ActivateLeaseDialog({
  open,
  onOpenChange,
  lease,
  onSuccess,
}: ActivateLeaseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!lease) return null;

  // Check if lease has a primary resident
  const hasPrimaryResident = lease.parties.some(p => p.isPrimary);
  const residents = lease.parties.filter(p =>
    p.role === 0 || p.role === 1 || p.role === 'PrimaryResident' || p.role === 'CoResident'
  );

  const handleActivate = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await activateLease(lease.id);
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Failed to activate lease:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to activate lease');
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
            <CheckCircle className="h-5 w-5 text-green-600" />
            Activate Lease
          </DialogTitle>
          <DialogDescription>
            Activate this lease to make it effective
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lease Summary */}
          <div className="p-4 bg-surface-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Unit</span>
              <span className="font-medium">{lease.unitNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Start Date</span>
              <span className="font-medium">{formatLeaseDate(lease.startDate)}</span>
            </div>
            {lease.endDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">End Date</span>
                <span className="font-medium">{formatLeaseDate(lease.endDate)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Parties</span>
              <span className="font-medium">{lease.parties.length}</span>
            </div>
          </div>

          {/* Validation Warning */}
          {!hasPrimaryResident && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">No Primary Resident</p>
                <p className="text-amber-700 mt-1">
                  This lease doesn&apos;t have a primary resident assigned. You may
                  want to add one before activating.
                </p>
              </div>
            </div>
          )}

          {residents.length === 0 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">No Residents</p>
                <p className="text-red-700 mt-1">
                  This lease has no residents. Please add at least one resident before activating.
                </p>
              </div>
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
            <Button
              onClick={handleActivate}
              disabled={isSubmitting || residents.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Activate Lease
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// End Lease Dialog
// ============================================

interface EndLeaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lease: Lease | null;
  onSuccess: () => void;
}

export function EndLeaseDialog({
  open,
  onOpenChange,
  lease,
  onSuccess,
}: EndLeaseDialogProps) {
  const [terminationReason, setTerminationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!lease) return null;

  const handleEnd = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await endLease(lease.id, {
        terminationReason: terminationReason || null,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Failed to end lease:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to end lease');
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
            <XCircle className="h-5 w-5 text-red-600" />
            End Lease
          </DialogTitle>
          <DialogDescription>
            End this lease for Unit {lease.unitNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">This action cannot be undone</p>
              <p className="text-amber-700 mt-1">
                Ending this lease will mark all residents as moved out. You can create
                a new lease afterward if needed.
              </p>
            </div>
          </div>

          {/* Lease Summary */}
          <div className="p-4 bg-surface-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Unit</span>
              <span className="font-medium">{lease.unitNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Lease Period</span>
              <span className="font-medium">
                {formatLeaseDate(lease.startDate)} → {lease.endDate ? formatLeaseDate(lease.endDate) : 'Open-ended'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Active Residents</span>
              <span className="font-medium">
                {lease.parties.filter(p => p.isCurrentlyResiding).length}
              </span>
            </div>
          </div>

          {/* Termination Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason (optional)
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              rows={3}
              placeholder="e.g., Tenant moved out, Lease ended early..."
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
            />
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
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEnd}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ending...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  End Lease
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Party Type Icon
// ============================================

function PartyTypeIcon({ type }: { type: PartyType }) {
  switch (type) {
    case PartyType.Individual:
      return <User className="h-4 w-4" />;
    case PartyType.Company:
      return <Building2 className="h-4 w-4" />;
    case PartyType.Entity:
      return <Briefcase className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
}

// ============================================
// Remove Lease Party Dialog
// ============================================

interface RemoveLeasePartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaseParty: LeaseParty | null;
  onSuccess: () => void;
}

export function RemoveLeasePartyDialog({
  open,
  onOpenChange,
  leaseParty,
  onSuccess,
}: RemoveLeasePartyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!leaseParty) return null;

  const handleRemove = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await removeLeaseParty(leaseParty.id);
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Failed to remove party:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to remove party from lease');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove Party from Lease</DialogTitle>
          <DialogDescription>
            Remove {leaseParty.partyName} from this lease?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Party Info */}
          <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <PartyTypeIcon type={leaseParty.partyType} />
            </div>
            <div>
              <p className="font-medium text-gray-900">{leaseParty.partyName}</p>
              <p className="text-sm text-gray-500">
                {getLeasePartyRoleLabel(leaseParty.role)}
                {leaseParty.isPrimary && ' • Primary'}
              </p>
            </div>
          </div>

          {leaseParty.isPrimary && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                This is the primary party. Make sure to assign a new primary if needed.
              </p>
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
            <Button
              variant="primary"
              onClick={handleRemove}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


