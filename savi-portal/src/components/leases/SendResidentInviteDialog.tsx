'use client';

/**
 * Send Resident Invite Dialog
 * Used for sending invites to lease parties (Flow 4, Step 5 / Flow 5)
 * Sends email invitation to residents to join the app
 */

import { useState, useEffect } from 'react';
import {
  Mail,
  User,
  Building2,
  Briefcase,
  Loader2,
  AlertCircle,
  CheckCircle,
  Send,
  Clock,
  RefreshCw,
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
  createResidentInvite,
  resendResidentInvite,
  getInvitesByLease,
} from '@/lib/api/resident-invites';
import { LeaseParty, LeasePartyRole, getLeasePartyRoleLabel } from '@/types/lease';
import { PartyType, PartyContact, PartyContactType } from '@/types/party';
import {
  ResidentInvite,
  ResidentInviteStatus,
  getInviteStatusLabel,
  getInviteStatusColor,
  formatInviteExpiry,
} from '@/types/resident-invite';

// ============================================
// Types
// ============================================

interface SendResidentInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lease ID */
  leaseId: string;
  /** Party to send invite to */
  leaseParty: LeaseParty | null;
  /** Email contact if available */
  partyEmail?: string | null;
  /** Callback when invite is sent */
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

export function SendResidentInviteDialog({
  open,
  onOpenChange,
  leaseId,
  leaseParty,
  partyEmail,
  onSuccess,
}: SendResidentInviteDialogProps) {
  // Form state
  const [email, setEmail] = useState(partyEmail || '');
  const [expirationDays, setExpirationDays] = useState('7');

  // Existing invite state
  const [existingInvite, setExistingInvite] = useState<ResidentInvite | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing invite for this party
  useEffect(() => {
    if (open && leaseParty) {
      setEmail(partyEmail || '');
      setExpirationDays('7');
      setError(null);
      setSuccess(null);

      // Check for existing invite
      setIsLoadingInvite(true);
      getInvitesByLease({ leaseId, pageSize: 100 })
        .then((result) => {
          const invite = result.items.find(
            (i) => i.partyId === leaseParty.partyId
          );
          setExistingInvite(invite || null);
        })
        .catch((err) => {
          console.error('Failed to load invites:', err);
        })
        .finally(() => {
          setIsLoadingInvite(false);
        });
    }
  }, [open, leaseId, leaseParty, partyEmail]);

  if (!leaseParty) return null;

  // Handle send new invite
  const handleSendInvite = async () => {
    setError(null);
    setSuccess(null);

    // Validate email
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createResidentInvite({
        leaseId,
        partyId: leaseParty.partyId,
        role: leaseParty.role as LeasePartyRole,
        email,
        expirationDays: parseInt(expirationDays),
      });

      if (result.emailSent) {
        setSuccess(`Invitation sent to ${email}`);
        setExistingInvite({
          id: result.inviteId,
          leaseId: result.leaseId,
          partyId: result.partyId,
          partyName: result.partyName,
          role: result.role,
          status: ResidentInviteStatus.Pending,
          email: result.email,
          expiresAt: result.expiresAt,
          acceptedAt: null,
          cancelledAt: null,
          isValid: true,
          createdAt: new Date().toISOString(),
        });
      } else {
        setSuccess('Invitation created (email delivery pending)');
      }

      // Delay closing to show success message
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);
    } catch (err: unknown) {
      console.error('Failed to send invite:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send invitation');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend invite
  const handleResendInvite = async () => {
    if (!existingInvite) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await resendResidentInvite(existingInvite.id, {
        expirationDays: parseInt(expirationDays),
      });

      if (result.emailSent) {
        setSuccess(`Invitation resent to ${result.email}`);
      } else {
        setSuccess('Invitation resent (email delivery pending)');
      }

      // Update existing invite
      setExistingInvite({
        id: result.inviteId,
        leaseId: result.leaseId,
        partyId: result.partyId,
        partyName: result.partyName,
        role: result.role,
        status: ResidentInviteStatus.Pending,
        email: result.email,
        expiresAt: result.expiresAt,
        acceptedAt: null,
        cancelledAt: null,
        isValid: true,
        createdAt: new Date().toISOString(),
      });

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);
    } catch (err: unknown) {
      console.error('Failed to resend invite:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to resend invitation');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if invite is pending or expired
  const isPending =
    existingInvite?.status === ResidentInviteStatus.Pending;
  const isExpired =
    existingInvite?.status === ResidentInviteStatus.Expired;
  const isAccepted =
    existingInvite?.status === ResidentInviteStatus.Accepted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary-600" />
            Send Resident Invite
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join the community app
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Party Info */}
          <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
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

          {/* Loading existing invite */}
          {isLoadingInvite && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}

          {/* Existing Invite Status */}
          {existingInvite && !isLoadingInvite && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Existing Invitation
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getInviteStatusColor(
                    existingInvite.status
                  )}`}
                >
                  {getInviteStatusLabel(existingInvite.status)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Sent to: {existingInvite.email}</p>
                <p className="flex items-center gap-1 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatInviteExpiry(existingInvite.expiresAt)}
                </p>
              </div>

              {isAccepted && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {leaseParty.partyName} has already joined the app
                  </span>
                </div>
              )}

              {(isPending || isExpired) && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={handleResendInvite}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Resend Invitation
                </Button>
              )}
            </div>
          )}

          {/* New Invite Form - show if no existing invite or cancelled */}
          {(!existingInvite ||
            existingInvite.status === ResidentInviteStatus.Cancelled) &&
            !isLoadingInvite && (
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="resident@example.com"
                    leftAddon={<Mail className="h-4 w-4" />}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The invite link will be sent to this email
                  </p>
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Expires In
                  </label>
                  <Select
                    value={expirationDays}
                    onValueChange={setExpirationDays}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {success}
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
              {success ? 'Close' : 'Cancel'}
            </Button>
            {(!existingInvite ||
              existingInvite.status === ResidentInviteStatus.Cancelled) &&
              !success && (
                <Button onClick={handleSendInvite} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Invite
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


