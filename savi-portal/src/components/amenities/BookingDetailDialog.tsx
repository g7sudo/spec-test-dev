'use client';

/**
 * Booking Detail Dialog
 * Shows booking details and allows approve/reject/cancel/complete actions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  Users,
  Building2,
  User,
  CheckCircle,
  XCircle,
  Ban,
  Check,
  DollarSign,
  Smartphone,
  Monitor,
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
import {
  getBookingById,
  approveBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  updateDepositStatus,
} from '@/lib/api/amenities';
import {
  AmenityBooking,
  AmenityBookingStatus,
  AmenityDepositStatus,
  getBookingStatusLabel,
  getBookingStatusColor,
  getDepositStatusLabel,
  getDepositStatusColor,
  getBookingSourceLabel,
  formatDateTime,
  DEPOSIT_STATUS_OPTIONS,
} from '@/types/amenity';

// ============================================
// Types
// ============================================

interface BookingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Booking ID to load */
  bookingId: string | null;
  /** Whether user has permission to approve/reject */
  canApprove?: boolean;
  /** Whether user has permission to manage (complete, deposit) */
  canManage?: boolean;
  /** Callback when booking is updated */
  onUpdate: () => void;
}

type ActionMode = 'none' | 'reject' | 'cancel' | 'deposit';

// ============================================
// Source Icon
// ============================================

function SourceIcon({ source }: { source: string }) {
  switch (source) {
    case 'MobileApp':
      return <Smartphone className="h-4 w-4" />;
    case 'AdminPortal':
    case 'FrontDesk':
      return <Monitor className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

// ============================================
// Main Component
// ============================================

export function BookingDetailDialog({
  open,
  onOpenChange,
  bookingId,
  canApprove = false,
  canManage = false,
  onUpdate,
}: BookingDetailDialogProps) {
  const fetchedRef = useRef(false);

  // Data state
  const [booking, setBooking] = useState<AmenityBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [actionMode, setActionMode] = useState<ActionMode>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [depositStatus, setDepositStatus] = useState<AmenityDepositStatus>(
    AmenityDepositStatus.Pending
  );
  const [depositReference, setDepositReference] = useState('');

  // Load booking details
  const loadBooking = useCallback(
    async (force = false) => {
      if (!bookingId) return;
      if (!force && fetchedRef.current) return;
      fetchedRef.current = true;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getBookingById(bookingId);
        setBooking(data);
        setDepositStatus(data.depositStatus as AmenityDepositStatus);
        setDepositReference(data.depositReference || '');
      } catch (err) {
        console.error('Failed to load booking:', err);
        setError('Failed to load booking details.');
        fetchedRef.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [bookingId]
  );

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open && bookingId) {
      fetchedRef.current = false;
      setActionMode('none');
      setRejectReason('');
      setCancelReason('');
      setAdminNotes('');
      loadBooking();
    }
  }, [open, bookingId, loadBooking]);

  // Handle approve
  const handleApprove = async () => {
    if (!booking) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await approveBooking(booking.id, { adminNotes: adminNotes.trim() || null });
      onUpdate();
      loadBooking(true);
      setAdminNotes('');
    } catch (err: unknown) {
      console.error('Failed to approve booking:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to approve booking.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!booking) return;
    if (!rejectReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await rejectBooking(booking.id, { reason: rejectReason.trim() });
      onUpdate();
      loadBooking(true);
      setActionMode('none');
      setRejectReason('');
    } catch (err: unknown) {
      console.error('Failed to reject booking:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reject booking.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!booking) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await cancelBooking(booking.id, {
        reason: cancelReason.trim() || null,
        isAdminCancellation: true,
      });
      onUpdate();
      loadBooking(true);
      setActionMode('none');
      setCancelReason('');
    } catch (err: unknown) {
      console.error('Failed to cancel booking:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to cancel booking.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle complete
  const handleComplete = async () => {
    if (!booking) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await completeBooking(booking.id);
      onUpdate();
      loadBooking(true);
    } catch (err: unknown) {
      console.error('Failed to complete booking:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to complete booking.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deposit status update
  const handleUpdateDeposit = async () => {
    if (!booking) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateDepositStatus(booking.id, {
        newStatus: depositStatus,
        reference: depositReference.trim() || null,
      });
      onUpdate();
      loadBooking(true);
      setActionMode('none');
    } catch (err: unknown) {
      console.error('Failed to update deposit status:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update deposit status.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if booking is pending approval
  const isPending =
    booking?.status === AmenityBookingStatus.PendingApproval ||
    booking?.status === 'PendingApproval';

  // Check if booking is approved
  const isApproved =
    booking?.status === AmenityBookingStatus.Approved ||
    booking?.status === 'Approved';

  // Check if booking can be cancelled
  const canCancel = isPending || isApproved;

  // Check if booking can be completed
  const canComplete = isApproved;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>
            View booking information and take actions
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : !booking ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">Booking not found</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getBookingStatusColor(
                  booking.status
                )}`}
              >
                {getBookingStatusLabel(booking.status)}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <SourceIcon source={booking.source} />
                {getBookingSourceLabel(booking.source)}
              </span>
            </div>

            {/* Booking Info */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              {/* Amenity & Title */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {booking.amenityName}
                </h4>
                {booking.title && (
                  <p className="text-sm text-gray-600">{booking.title}</p>
                )}
              </div>

              {/* Date/Time */}
              <div className="flex items-start gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">{formatDateTime(booking.startAt)}</p>
                  <p className="text-gray-500">to {formatDateTime(booking.endAt)}</p>
                </div>
              </div>

              {/* Unit */}
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">
                  Unit {booking.unitNumber}
                  {booking.blockName && ` • ${booking.blockName}`}
                </span>
              </div>

              {/* Booked For */}
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{booking.bookedForUserName}</span>
              </div>

              {/* Guests */}
              {booking.numberOfGuests && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{booking.numberOfGuests} guests</span>
                </div>
              )}

              {/* Notes */}
              {booking.notes && (
                <div className="pt-2 border-t text-sm">
                  <p className="text-gray-500">Notes:</p>
                  <p className="text-gray-700">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Deposit Info */}
            {booking.depositRequired && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">
                      Deposit: ${booking.depositAmount?.toFixed(2)}
                    </span>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getDepositStatusColor(
                      booking.depositStatus
                    )}`}
                  >
                    {getDepositStatusLabel(booking.depositStatus)}
                  </span>
                </div>
                {booking.depositReference && (
                  <p className="text-xs text-amber-700">
                    Reference: {booking.depositReference}
                  </p>
                )}
              </div>
            )}

            {/* Approval/Rejection Info */}
            {booking.approvedAt && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                <span>
                  Approved by {booking.approvedByUserName} on{' '}
                  {formatDateTime(booking.approvedAt)}
                </span>
              </div>
            )}
            {booking.rejectedAt && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <XCircle className="h-4 w-4" />
                  <span>
                    Rejected by {booking.rejectedByUserName} on{' '}
                    {formatDateTime(booking.rejectedAt)}
                  </span>
                </div>
                {booking.rejectionReason && (
                  <p className="text-sm text-red-600 mt-1 ml-6">
                    Reason: {booking.rejectionReason}
                  </p>
                )}
              </div>
            )}
            {booking.cancelledAt && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Ban className="h-4 w-4" />
                  <span>
                    Cancelled by {booking.cancelledByUserName} on{' '}
                    {formatDateTime(booking.cancelledAt)}
                  </span>
                </div>
                {booking.cancellationReason && (
                  <p className="text-sm text-gray-600 mt-1 ml-6">
                    Reason: {booking.cancellationReason}
                  </p>
                )}
              </div>
            )}
            {booking.completedAt && (
              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                <Check className="h-4 w-4" />
                <span>Completed on {formatDateTime(booking.completedAt)}</span>
              </div>
            )}

            {/* Admin Notes */}
            {booking.adminNotes && (
              <div className="text-sm">
                <p className="text-gray-500">Admin Notes:</p>
                <p className="text-gray-700">{booking.adminNotes}</p>
              </div>
            )}

            {/* Action Forms */}
            {actionMode === 'reject' && (
              <div className="space-y-3 p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                <h4 className="text-sm font-medium text-red-900">Reject Booking</h4>
                <div>
                  <label className="block text-sm text-red-700 mb-1">
                    Reason *
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    rows={3}
                    placeholder="Enter rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActionMode('none')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleReject}
                    disabled={isSubmitting || !rejectReason.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Confirm Reject'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {actionMode === 'cancel' && (
              <div className="space-y-3 p-4 border-2 border-gray-200 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900">Cancel Booking</h4>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Reason (optional)
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    rows={2}
                    placeholder="Enter cancellation reason..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActionMode('none')}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Confirm Cancel'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {actionMode === 'deposit' && (
              <div className="space-y-3 p-4 border-2 border-amber-200 bg-amber-50 rounded-lg">
                <h4 className="text-sm font-medium text-amber-900">
                  Update Deposit Status
                </h4>
                <div>
                  <label className="block text-sm text-amber-700 mb-1">Status</label>
                  <Select
                    value={depositStatus}
                    onValueChange={(v) => setDepositStatus(v as AmenityDepositStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPOSIT_STATUS_OPTIONS.filter(
                        (opt) => opt.value !== AmenityDepositStatus.NotRequired
                      ).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-amber-700 mb-1">
                    Reference
                  </label>
                  <Input
                    placeholder="e.g., Transaction ID"
                    value={depositReference}
                    onChange={(e) => setDepositReference(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActionMode('none')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpdateDeposit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Update Deposit'
                    )}
                  </Button>
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
            {actionMode === 'none' && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {/* Approve/Reject for pending bookings */}
                {isPending && canApprove && (
                  <>
                    <Button onClick={handleApprove} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setActionMode('reject')}
                      disabled={isSubmitting}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}

                {/* Complete for approved bookings */}
                {canComplete && canManage && (
                  <Button
                    variant="secondary"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                )}

                {/* Update deposit for bookings that require deposit */}
                {booking.depositRequired &&
                  canManage &&
                  !['Cancelled', 'Rejected', 'NoShow'].includes(booking.status) && (
                    <Button
                      variant="secondary"
                      onClick={() => setActionMode('deposit')}
                      disabled={isSubmitting}
                    >
                      <DollarSign className="h-4 w-4" />
                      Update Deposit
                    </Button>
                  )}

                {/* Cancel */}
                {canCancel && (
                  <Button
                    variant="secondary"
                    onClick={() => setActionMode('cancel')}
                    disabled={isSubmitting}
                  >
                    <Ban className="h-4 w-4" />
                    Cancel Booking
                  </Button>
                )}

                {/* Close */}
                <Button
                  variant="secondary"
                  className="ml-auto"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

