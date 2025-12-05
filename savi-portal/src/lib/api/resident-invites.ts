/**
 * Resident Invites API functions
 * Handles resident invitation operations for onboarding
 * 
 * Endpoints:
 * - POST /tenant/resident-invites - Create and send invite
 * - GET /tenant/resident-invites/by-lease/{leaseId} - List invites for a lease
 * - POST /tenant/resident-invites/{id}/cancel - Cancel invite
 * - POST /tenant/resident-invites/{id}/resend - Resend invite with fresh token
 * - GET /tenant/resident-invites/validate - Validate invite (public)
 * - POST /tenant/resident-invites/accept - Accept invite (authenticated)
 */

import { httpClient } from '@/lib/http';
import {
  ResidentInvite,
  ResidentInviteStatus,
  CreateResidentInviteRequest,
  CreateResidentInviteResult,
  ResendResidentInviteRequest,
  ResidentInviteValidation,
  ListInvitesByLeaseParams,
} from '@/types/resident-invite';
import { PagedResult } from '@/types/http';

// ============================================
// API Endpoints
// ============================================

const INVITES_BASE = '/api/v1/tenant/resident-invites';

// ============================================
// Invite Operations
// ============================================

/**
 * Creates and sends a resident invite
 * Sends email notification to the invitee
 */
export async function createResidentInvite(
  data: CreateResidentInviteRequest
): Promise<CreateResidentInviteResult> {
  return httpClient.post<CreateResidentInviteResult>(INVITES_BASE, data);
}

/**
 * Lists resident invites for a specific lease
 * Used in lease detail view to show invite status
 */
export async function getInvitesByLease(
  params: ListInvitesByLeaseParams
): Promise<PagedResult<ResidentInvite>> {
  const { leaseId, ...queryParams } = params;
  const searchParams = new URLSearchParams();

  if (queryParams.status !== undefined) {
    searchParams.set('status', queryParams.status.toString());
  }
  if (queryParams.page) searchParams.set('page', queryParams.page.toString());
  if (queryParams.pageSize) searchParams.set('pageSize', queryParams.pageSize.toString());

  const query = searchParams.toString();
  const url = query
    ? `${INVITES_BASE}/by-lease/${leaseId}?${query}`
    : `${INVITES_BASE}/by-lease/${leaseId}`;

  return httpClient.get<PagedResult<ResidentInvite>>(url);
}

/**
 * Cancels a pending resident invite
 * Only works on Pending invites
 */
export async function cancelResidentInvite(inviteId: string): Promise<void> {
  return httpClient.post<void>(`${INVITES_BASE}/${inviteId}/cancel`);
}

/**
 * Resends a resident invite with a fresh token
 * Cancels the old invite and creates a new one
 */
export async function resendResidentInvite(
  inviteId: string,
  data?: ResendResidentInviteRequest
): Promise<CreateResidentInviteResult> {
  return httpClient.post<CreateResidentInviteResult>(
    `${INVITES_BASE}/${inviteId}/resend`,
    data
  );
}

// ============================================
// Public Validation (No Auth Required)
// ============================================

/**
 * Validates a resident invite (public endpoint)
 * Used by mobile app before showing signup screen
 * Note: This requires skipAuth since it's a public endpoint
 */
export async function validateResidentInvite(
  inviteId: string,
  token: string
): Promise<ResidentInviteValidation> {
  const searchParams = new URLSearchParams();
  searchParams.set('inviteId', inviteId);
  searchParams.set('token', token);

  return httpClient.get<ResidentInviteValidation>(
    `${INVITES_BASE}/validate?${searchParams.toString()}`,
    { skipAuth: true }
  );
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets pending invites for a lease
 */
export async function getPendingInvitesForLease(
  leaseId: string
): Promise<ResidentInvite[]> {
  const result = await getInvitesByLease({
    leaseId,
    status: ResidentInviteStatus.Pending,
    pageSize: 100,
  });
  
  return result.items;
}

/**
 * Checks if a party has a pending invite for a lease
 */
export async function hasPendingInvite(
  leaseId: string,
  partyId: string
): Promise<boolean> {
  const invites = await getPendingInvitesForLease(leaseId);
  return invites.some(invite => invite.partyId === partyId);
}


