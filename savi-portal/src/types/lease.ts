/**
 * Lease Types for Unit Lease Management
 * Maps to backend DTOs from Savi.Application.Tenant.Leases
 * 
 * Key concepts:
 * - Leases are tied to Units and have parties (residents, guarantors)
 * - Lease flows: Draft → Active → Ended/Terminated
 * - LeaseParty links a Party to a Lease with role and dates
 */

import { PartyType } from './party';
export type { PagedResult } from './http';

// ============================================
// Enums (values match C# enum integers)
// ============================================

/**
 * Status of a lease agreement
 * Maps to: Savi.Domain.Tenant.Enums.LeaseStatus
 */
export enum LeaseStatus {
  /** Lease is being drafted, not yet active */
  Draft = 0,
  /** Lease is active and in effect */
  Active = 1,
  /** Lease has ended normally */
  Ended = 2,
  /** Lease was terminated early */
  Terminated = 3,
}

/**
 * Role of a party in a lease agreement
 * Maps to: Savi.Domain.Tenant.Enums.LeasePartyRole
 */
export enum LeasePartyRole {
  /** Primary resident responsible for the lease */
  PrimaryResident = 0,
  /** Co-resident sharing the unit */
  CoResident = 1,
  /** Guarantor for the lease */
  Guarantor = 2,
  /** Other role */
  Other = 3,
}

// ============================================
// Lease DTOs
// ============================================

/**
 * Full lease record with parties
 * Used in lease detail views
 */
export interface Lease {
  id: string;
  unitId: string;
  unitNumber: string;
  blockName: string | null;
  floorName: string | null;
  status: LeaseStatus;
  /** Start date - ISO string "YYYY-MM-DD" */
  startDate: string;
  /** End date - ISO string "YYYY-MM-DD" or null for open-ended */
  endDate: string | null;
  monthlyRent: number | null;
  depositAmount: number | null;
  notes: string | null;
  activatedAt: string | null;
  endedAt: string | null;
  terminationReason: string | null;
  /** Parties associated with this lease */
  parties: LeaseParty[];
  isActive: boolean;
  createdAt: string;
}

/**
 * Lease party record linking a Party to a Lease
 */
export interface LeaseParty {
  id: string;
  leaseId: string;
  partyId: string;
  partyName: string;
  partyType: PartyType;
  /** Optional CommunityUser ID if party has app account */
  communityUserId: string | null;
  role: LeasePartyRole;
  /** Whether this is the primary party for the lease */
  isPrimary: boolean;
  /** Move-in date - ISO string "YYYY-MM-DD" */
  moveInDate: string | null;
  /** Move-out date - ISO string "YYYY-MM-DD" */
  moveOutDate: string | null;
  /** Computed: party has an app account */
  hasAppAccount: boolean;
  /** Computed: party is currently residing */
  isCurrentlyResiding: boolean;
  isActive: boolean;
}

/**
 * Lease summary for list views
 */
export interface LeaseSummary {
  id: string;
  unitId: string;
  unitNumber: string;
  blockName: string | null;
  status: LeaseStatus;
  /** Start date - ISO string "YYYY-MM-DD" */
  startDate: string;
  /** End date - ISO string "YYYY-MM-DD" */
  endDate: string | null;
  /** Primary resident name for display */
  primaryResidentName: string | null;
  /** Number of parties on this lease */
  partyCount: number;
  /** Monthly rent amount */
  monthlyRent: number | null;
  createdAt: string;
}

// ============================================
// Request Types
// ============================================

/**
 * Party entry for creating a lease with initial parties
 */
export interface CreateLeasePartyInput {
  partyId: string;
  role: LeasePartyRole;
  isPrimary: boolean;
  /** ISO date string "YYYY-MM-DD" */
  moveInDate?: string | null;
}

/**
 * Create a new lease (in Draft status)
 */
export interface CreateLeaseRequest {
  unitId: string;
  /** ISO date string "YYYY-MM-DD" */
  startDate: string;
  /** ISO date string "YYYY-MM-DD" or null for open-ended */
  endDate?: string | null;
  monthlyRent?: number | null;
  depositAmount?: number | null;
  notes?: string | null;
  /** Optional initial parties */
  parties?: CreateLeasePartyInput[] | null;
}

/**
 * Add a party to an existing lease
 */
export interface AddLeasePartyRequest {
  partyId: string;
  role: LeasePartyRole;
  isPrimary: boolean;
  /** ISO date string "YYYY-MM-DD" */
  moveInDate?: string | null;
}

/**
 * End a lease
 */
export interface EndLeaseRequest {
  terminationReason?: string | null;
}

// ============================================
// Query Params
// ============================================

/**
 * Parameters for listing leases by unit
 */
export interface ListLeasesByUnitParams {
  unitId: string;
  status?: LeaseStatus;
  page?: number;
  pageSize?: number;
}

/**
 * Parameters for listing all leases
 */
export interface ListLeasesParams {
  /** Filter by status (Draft, Active, Ended, Terminated) */
  status?: string;
  /** Search by unit number or primary resident name */
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets display label for lease status
 */
export function getLeaseStatusLabel(status: LeaseStatus | string): string {
  // Handle string values from API
  const statusValue = typeof status === 'string' 
    ? LeaseStatus[status as keyof typeof LeaseStatus] ?? status
    : status;
    
  switch (statusValue) {
    case LeaseStatus.Draft:
    case 'Draft':
      return 'Draft';
    case LeaseStatus.Active:
    case 'Active':
      return 'Active';
    case LeaseStatus.Ended:
    case 'Ended':
      return 'Ended';
    case LeaseStatus.Terminated:
    case 'Terminated':
      return 'Terminated';
    default:
      return String(status);
  }
}

/**
 * Gets status color classes for lease status badge
 */
export function getLeaseStatusColor(status: LeaseStatus | string): string {
  const statusValue = typeof status === 'string' 
    ? LeaseStatus[status as keyof typeof LeaseStatus] ?? status
    : status;
    
  switch (statusValue) {
    case LeaseStatus.Draft:
    case 'Draft':
      return 'bg-yellow-100 text-yellow-700';
    case LeaseStatus.Active:
    case 'Active':
      return 'bg-green-100 text-green-700';
    case LeaseStatus.Ended:
    case 'Ended':
      return 'bg-gray-100 text-gray-600';
    case LeaseStatus.Terminated:
    case 'Terminated':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for lease party role
 */
export function getLeasePartyRoleLabel(role: LeasePartyRole | string): string {
  const roleValue = typeof role === 'string' 
    ? LeasePartyRole[role as keyof typeof LeasePartyRole] ?? role
    : role;
    
  switch (roleValue) {
    case LeasePartyRole.PrimaryResident:
    case 'PrimaryResident':
      return 'Primary Resident';
    case LeasePartyRole.CoResident:
    case 'CoResident':
      return 'Co-Resident';
    case LeasePartyRole.Guarantor:
    case 'Guarantor':
      return 'Guarantor';
    case LeasePartyRole.Other:
    case 'Other':
      return 'Other';
    default:
      return String(role);
  }
}

/**
 * Gets role color classes for lease party role badge
 */
export function getLeasePartyRoleColor(role: LeasePartyRole | string): string {
  const roleValue = typeof role === 'string' 
    ? LeasePartyRole[role as keyof typeof LeasePartyRole] ?? role
    : role;
    
  switch (roleValue) {
    case LeasePartyRole.PrimaryResident:
    case 'PrimaryResident':
      return 'bg-primary-100 text-primary-700';
    case LeasePartyRole.CoResident:
    case 'CoResident':
      return 'bg-blue-100 text-blue-700';
    case LeasePartyRole.Guarantor:
    case 'Guarantor':
      return 'bg-purple-100 text-purple-700';
    case LeasePartyRole.Other:
    case 'Other':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Formats a date string to display format (e.g., "Jan 15, 2024")
 */
export function formatLeaseDate(date: string | null | undefined): string {
  if (!date) return '—';
  
  try {
    // Handle ISO string format "YYYY-MM-DD"
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
 * Formats lease period as "From → To" or "From → Open-ended"
 */
export function formatLeasePeriod(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  const start = formatLeaseDate(startDate);
  const end = endDate ? formatLeaseDate(endDate) : 'Open-ended';
  return `${start} → ${end}`;
}

/**
 * Checks if a lease can be activated (is in Draft status)
 */
export function canActivateLease(status: LeaseStatus | string): boolean {
  return status === LeaseStatus.Draft || status === 'Draft';
}

/**
 * Checks if a lease can be ended (is Active)
 */
export function canEndLease(status: LeaseStatus | string): boolean {
  return status === LeaseStatus.Active || status === 'Active';
}

/**
 * Checks if a lease is editable (is Draft)
 */
export function isLeaseEditable(status: LeaseStatus | string): boolean {
  return status === LeaseStatus.Draft || status === 'Draft';
}

/**
 * Gets the primary resident from lease parties
 */
export function getPrimaryResident(parties: LeaseParty[]): LeaseParty | undefined {
  return parties.find(p => p.isPrimary && p.role === LeasePartyRole.PrimaryResident);
}

/**
 * Gets residents (primary + co-residents) from lease parties
 */
export function getResidents(parties: LeaseParty[]): LeaseParty[] {
  return parties.filter(
    p => p.role === LeasePartyRole.PrimaryResident || p.role === LeasePartyRole.CoResident
  );
}


