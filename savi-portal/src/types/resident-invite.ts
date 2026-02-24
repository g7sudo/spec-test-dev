/**
 * Resident Invite Types for Resident Onboarding
 * Maps to backend DTOs from Savi.Application.Tenant.ResidentInvites
 * 
 * Key concepts:
 * - Invites are created for lease parties to onboard as app users
 * - Flow: Create invite → Email sent → Resident accepts via mobile app
 * - Invite validation is public (for mobile app pre-signup)
 */

import { LeasePartyRole } from './lease';
export type { PagedResult } from './http';

// ============================================
// Enums (values match C# enum integers)
// ============================================

/**
 * Status of a resident invitation
 * Maps to: Savi.Domain.Tenant.Enums.ResidentInviteStatus
 */
export enum ResidentInviteStatus {
  /** Invite has been sent and is awaiting acceptance */
  Pending = 0,
  /** Invite has been accepted by the resident */
  Accepted = 1,
  /** Invite has expired without being accepted */
  Expired = 2,
  /** Invite was cancelled by admin */
  Cancelled = 3,
}

// ============================================
// Resident Invite DTOs
// ============================================

/**
 * Resident invite record
 */
export interface ResidentInvite {
  id: string;
  leaseId: string;
  partyId: string;
  partyName: string;
  role: LeasePartyRole;
  status: ResidentInviteStatus;
  /** Email the invite was sent to */
  email: string;
  /** When the invite expires */
  expiresAt: string;
  /** When the invite was accepted */
  acceptedAt: string | null;
  /** When the invite was cancelled */
  cancelledAt: string | null;
  /** Computed: whether the invite is still valid */
  isValid: boolean;
  createdAt: string;
}

/**
 * Result from creating a resident invite
 */
export interface CreateResidentInviteResult {
  inviteId: string;
  leaseId: string;
  partyId: string;
  partyName: string;
  email: string;
  role: LeasePartyRole;
  expiresAt: string;
  /** Whether the email was sent successfully */
  emailSent: boolean;
  /** Invitation token (only exposed in dev environments) */
  invitationToken: string | null;
  /** Invitation URL (only exposed in dev environments) */
  invitationUrl: string | null;
}

/**
 * Validation result for resident invite (public endpoint)
 */
export interface ResidentInviteValidation {
  isValid: boolean;
  errorMessage: string | null;
  inviteId: string | null;
  communityName: string | null;
  unitLabel: string | null;
  email: string | null;
  partyName: string | null;
  role: LeasePartyRole | null;
  expiresAt: string | null;
}

// ============================================
// Request Types
// ============================================

/**
 * Create a resident invite
 */
export interface CreateResidentInviteRequest {
  leaseId: string;
  partyId: string;
  role: LeasePartyRole;
  email: string;
  /** Default: 7 days */
  expirationDays?: number;
}

/**
 * Resend a resident invite
 */
export interface ResendResidentInviteRequest {
  /** Default: 7 days */
  expirationDays?: number;
}

// ============================================
// Query Params
// ============================================

/**
 * Parameters for listing invites by lease
 */
export interface ListInvitesByLeaseParams {
  leaseId: string;
  status?: ResidentInviteStatus;
  page?: number;
  pageSize?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets display label for invite status
 */
export function getInviteStatusLabel(status: ResidentInviteStatus | string): string {
  const statusValue = typeof status === 'string'
    ? ResidentInviteStatus[status as keyof typeof ResidentInviteStatus] ?? status
    : status;

  switch (statusValue as ResidentInviteStatus) {
    case ResidentInviteStatus.Pending:
      return 'Pending';
    case ResidentInviteStatus.Accepted:
      return 'Accepted';
    case ResidentInviteStatus.Expired:
      return 'Expired';
    case ResidentInviteStatus.Cancelled:
      return 'Cancelled';
    default:
      return String(status);
  }
}

/**
 * Gets status color classes for invite status badge
 */
export function getInviteStatusColor(status: ResidentInviteStatus | string): string {
  const statusValue = typeof status === 'string'
    ? ResidentInviteStatus[status as keyof typeof ResidentInviteStatus] ?? status
    : status;

  switch (statusValue as ResidentInviteStatus) {
    case ResidentInviteStatus.Pending:
      return 'bg-yellow-100 text-yellow-700';
    case ResidentInviteStatus.Accepted:
      return 'bg-green-100 text-green-700';
    case ResidentInviteStatus.Expired:
      return 'bg-gray-100 text-gray-600';
    case ResidentInviteStatus.Cancelled:
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Formats expiry date with relative time
 */
export function formatInviteExpiry(expiresAt: string | null): string {
  if (!expiresAt) return '—';

  try {
    const expires = new Date(expiresAt);
    const now = new Date();
    
    if (isNaN(expires.getTime())) return '—';

    // If expired
    if (expires < now) {
      return 'Expired';
    }

    // Calculate days remaining
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else if (diffDays <= 7) {
      return `Expires in ${diffDays} days`;
    }

    // Format date
    return `Expires ${expires.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  } catch {
    return '—';
  }
}

/**
 * Checks if an invite can be resent (is pending or expired)
 */
export function canResendInvite(status: ResidentInviteStatus | string): boolean {
  return (
    status === ResidentInviteStatus.Pending ||
    status === 'Pending' ||
    status === ResidentInviteStatus.Expired ||
    status === 'Expired'
  );
}

/**
 * Checks if an invite can be cancelled (is pending)
 */
export function canCancelInvite(status: ResidentInviteStatus | string): boolean {
  return status === ResidentInviteStatus.Pending || status === 'Pending';
}

/**
 * Checks if an invite is still actionable (pending and not expired)
 */
export function isInviteActionable(invite: ResidentInvite): boolean {
  if (invite.status !== ResidentInviteStatus.Pending) {
    return false;
  }
  
  const now = new Date();
  const expires = new Date(invite.expiresAt);
  return expires > now;
}


