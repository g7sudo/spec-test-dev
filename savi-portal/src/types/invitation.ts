/**
 * Invitation types for tenant admin onboarding
 * Maps to backend DTOs from Savi.Application.Platform.Tenants.Dtos
 */

// ============================================
// Validate Invitation Response
// ============================================

/**
 * Response from validating an invitation token
 * GET /api/v1/platform/invitations/validate?token=...
 */
export interface ValidateInvitationResponse {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  tenantCity: string | null;
  inviteeEmail: string;
  tenantRoleCode: string;
  invitationExpiresAt: string;
}

// ============================================
// Accept Invitation
// ============================================

/**
 * Request to accept an invitation
 * POST /api/v1/platform/invitations/accept
 */
export interface AcceptInvitationRequest {
  invitationToken: string;
}

/**
 * Response after accepting an invitation
 */
export interface AcceptInvitationResponse {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  tenantRoleCode: string;
  requiresFirstTimeSetup: boolean;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets a human-friendly role label
 */
export function getRoleLabel(roleCode: string): string {
  switch (roleCode.toLowerCase()) {
    case 'communityadmin':
    case 'community_admin':
      return 'Community Admin';
    case 'resident':
      return 'Resident';
    case 'owner':
      return 'Owner';
    case 'tenant':
      return 'Tenant';
    default:
      return roleCode;
  }
}

/**
 * Formats expiration date for display
 */
export function formatExpirationDate(expiresAt: string): string {
  const date = new Date(expiresAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return 'Expired';
  } else if (diffDays === 1) {
    return 'Expires tomorrow';
  } else if (diffDays <= 7) {
    return `Expires in ${diffDays} days`;
  } else {
    return `Expires on ${date.toLocaleDateString()}`;
  }
}

