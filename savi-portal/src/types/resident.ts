/**
 * Resident Types for Residents Module
 * Maps to backend DTOs from Savi.Application.Tenant.Residents
 * 
 * Key concepts:
 * - Residents are derived from LeaseParty with Role = PrimaryResident/CoResident
 * - Status is computed: Upcoming (future move-in), Current, Past (moved out or lease ended)
 * - Resident Profile aggregates party, lease, community user, and invite data
 */

export type { PagedResult } from './http';

// ============================================
// Enums
// ============================================

/**
 * Residency status - computed from lease dates and status
 */
export enum ResidentStatus {
  /** Upcoming move-in (lease active but move-in date is future) */
  Upcoming = 'Upcoming',
  /** Currently residing */
  Current = 'Current',
  /** Past resident (moved out or lease ended) */
  Past = 'Past',
}

// ============================================
// List DTOs
// ============================================

/**
 * Resident list item
 * Combined from LeaseParty + Party + Lease + CommunityUser
 */
export interface Resident {
  /** LeaseParty ID - unique identifier for this residency */
  leasePartyId: string;
  /** Party ID */
  partyId: string;
  /** Resident name (from Party) */
  residentName: string;
  
  /** Party type (enum value) */
  partyType: number;
  /** Party type text: Individual, Company, Entity */
  partyTypeText: string;
  
  /** Primary email (if available) */
  email: string | null;
  /** Primary phone (if available) */
  phone: string | null;
  
  /** Lease information */
  leaseId: string;
  leaseStatus: number;
  leaseStatusText: string;
  /** Lease start date - ISO string "YYYY-MM-DD" */
  startDate: string;
  /** Lease end date - ISO string "YYYY-MM-DD" */
  endDate: string | null;
  
  /** Unit information */
  unitId: string;
  unitNumber: string;
  blockName: string | null;
  blockId: string;
  floorName: string | null;
  floorId: string;
  
  /** Residency status (enum value: 0=Current, 1=Upcoming, 2=Past) */
  status: number;
  /** Status text: Current, Upcoming, Past */
  statusText: string;
  
  /** Role (enum value: 0=PrimaryResident, 1=CoResident, etc.) */
  role: number;
  /** Role text: PrimaryResident, CoResident, Guarantor, Other */
  roleText: string;
  isPrimary: boolean;
  
  /** App access - whether they have a CommunityUser account */
  hasAppAccess: boolean;
  communityUserId: string | null;
  
  /** Move dates - ISO string "YYYY-MM-DD" */
  moveInDate: string | null;
  moveOutDate: string | null;
}

/**
 * Resident profile - comprehensive view
 * Used in resident detail page
 * Matches GET /api/v1/tenant/residents/{partyId}
 */
export interface ResidentProfile {
  /** Party information */
  partyId: string;
  residentName: string;
  partyType: number;
  partyTypeText: string;
  
  /** Contact information (flat, not array) */
  email: string | null;
  phone: string | null;
  
  /** Current unit (if currently residing) */
  currentUnit: ProfileUnit | null;
  
  /** Overall status: 0=Current, 1=Upcoming, 2=Past */
  status: number;
  statusText: string;
  
  /** App access */
  hasAppAccess: boolean;
  communityUserId: string | null;
  loginEmail: string | null;
  lastLoginAt: string | null;
  
  /** All residencies (current + past) */
  residencies: ProfileResidency[];
  
  /** Invites sent to this resident */
  invites: ProfileInvite[];
  
  createdAt: string;
}

/**
 * Unit info in profile
 */
export interface ProfileUnit {
  unitId: string;
  unitNumber: string;
  blockName: string | null;
  floorName: string | null;
}

/**
 * Residency record in profile
 */
export interface ProfileResidency {
  leasePartyId: string;
  leaseId: string;
  unit: ProfileUnit;
  leaseStatus: number;
  leaseStatusText: string;
  role: number;
  roleText: string;
  isPrimary: boolean;
  startDate: string;
  endDate: string | null;
  moveInDate: string | null;
  moveOutDate: string | null;
  /** Whether this is the current residency */
  isCurrent: boolean;
  /** Co-residents in the same unit/lease */
  coResidents: ProfileCoResident[];
}

/**
 * Co-resident summary in profile
 */
export interface ProfileCoResident {
  leasePartyId: string;
  partyId: string;
  partyName: string;
  role: number;
  roleText: string;
  isPrimary: boolean;
  hasAppAccess: boolean;
}

/**
 * Invite record in profile
 */
export interface ProfileInvite {
  id: string;
  leaseId: string;
  partyId: string;
  partyName: string;
  role: number;
  roleText: string;
  status: number;
  statusText: string;
  email: string;
  expiresAt: string;
  acceptedAt: string | null;
  cancelledAt: string | null;
  isValid: boolean;
  createdAt: string;
}

// ============================================
// Request Types
// ============================================

/**
 * Move out resident request
 */
export interface MoveOutResidentRequest {
  /** Move out date - ISO string "YYYY-MM-DD" */
  moveOutDate: string;
  /** Whether to end the lease (only for primary residents) */
  endLease?: boolean;
  /** Termination reason (if ending lease) */
  terminationReason?: string | null;
  /** New primary lease party ID (if primary moving out but not ending lease) */
  newPrimaryLeasePartyId?: string | null;
}

// ============================================
// Query Params
// ============================================

/**
 * Parameters for listing residents
 */
export interface ListResidentsParams {
  /** Filter by status: Current, Upcoming, Past */
  status?: string;
  /** Filter by unit ID */
  unitId?: string;
  /** Filter by block ID */
  blockId?: string;
  /** Filter by floor ID */
  floorId?: string;
  /** Filter by app access */
  hasAppAccess?: boolean;
  /** Search by name, phone, or email */
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets display label for resident status
 * Accepts number (enum value), string text, or ResidentStatus enum
 */
export function getResidentStatusLabel(status: number | string): string {
  // Handle text values directly
  if (typeof status === 'string') {
    return status;
  }

  // Handle numeric enum values
  switch (status) {
    case 0:
      return 'Current';
    case 1:
      return 'Upcoming';
    case 2:
      return 'Past';
    default:
      return String(status);
  }
}

/**
 * Gets status color classes for resident status badge
 * Accepts number (enum value) or string text
 */
export function getResidentStatusColor(status: number | string): string {
  // Normalize to string for comparison
  const statusStr = typeof status === 'number' ? getResidentStatusLabel(status) : status;
  
  switch (statusStr) {
    case 'Upcoming':
      return 'bg-blue-100 text-blue-700';
    case 'Current':
      return 'bg-green-100 text-green-700';
    case 'Past':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets role badge color
 * Accepts number (enum value) or string text
 */
export function getResidentRoleColor(role: number | string): string {
  // Normalize to string for comparison
  const roleStr = typeof role === 'number' 
    ? (role === 0 ? 'PrimaryResident' : role === 1 ? 'CoResident' : 'Other')
    : role;
    
  switch (roleStr) {
    case 'PrimaryResident':
      return 'bg-primary-100 text-primary-700';
    case 'CoResident':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Formats a date string to display format
 */
export function formatResidentDate(date: string | null | undefined): string {
  if (!date) return '—';
  
  try {
    const d = new Date(date + 'T00:00:00');
    if (isNaN(d.getTime())) return '—';
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Checks if a resident can be moved out
 * Only current and upcoming residents can be moved out
 */
export function canMoveOutResident(status: number | string): boolean {
  // Normalize to string
  const statusStr = typeof status === 'number' ? getResidentStatusLabel(status) : status;
  return statusStr === 'Current' || statusStr === 'Upcoming';
}

/**
 * Checks if a resident can be invited to the app
 * Only residents without app access can be invited (not past residents)
 */
export function canInviteResident(resident: Resident): boolean {
  const statusStr = typeof resident.status === 'number' 
    ? getResidentStatusLabel(resident.status) 
    : resident.statusText;
  return !resident.hasAppAccess && statusStr !== 'Past';
}
