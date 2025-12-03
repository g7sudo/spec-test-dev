/**
 * Invitations API functions
 * Handles invitation validation and acceptance
 */

import { httpClient } from '@/lib/http';
import { API_BASE_URL } from '@/config/env';
import { getIdToken } from '@/lib/auth/firebase';
import {
  ValidateInvitationResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
} from '@/types/invitation';

// ============================================
// API Endpoints
// ============================================

const INVITATIONS_BASE = '/api/v1/platform/invitations';

// ============================================
// Validate Invitation (Anonymous)
// ============================================

/**
 * Validates an invitation token (no auth required)
 * Called before user signs in to show invitation details
 */
export async function validateInvitation(
  token: string
): Promise<ValidateInvitationResponse> {
  // Use fetch directly since this is an anonymous endpoint
  const url = `${API_BASE_URL}${INVITATIONS_BASE}/validate?token=${encodeURIComponent(token)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Invalid or expired invitation');
  }

  return response.json();
}

// ============================================
// Accept Invitation (Authenticated)
// ============================================

/**
 * Accepts an invitation (requires Firebase auth)
 * Called after user signs in with matching email
 */
export async function acceptInvitation(
  token: string
): Promise<AcceptInvitationResponse> {
  // Get the auth token
  const idToken = await getIdToken();
  if (!idToken) {
    throw new Error('Not authenticated');
  }

  const url = `${API_BASE_URL}${INVITATIONS_BASE}/accept`;
  const body: AcceptInvitationRequest = {
    invitationToken: token,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to accept invitation');
  }

  return response.json();
}

