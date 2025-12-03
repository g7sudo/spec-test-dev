/**
 * Ownership Types for Unit Ownership Management
 * Maps to backend DTOs from Savi.Application.Tenant.Ownership
 * 
 * Key concepts:
 * - Owners are Parties (Individual / Company / Entity)
 * - Ownership is historical + can be joint (multiple parties per unit, with shares)
 * - UnitOwnership links a Party to a Unit with share percentage and date range
 */

import { PartyType } from './party';
export type { PagedResult } from './http';

// ============================================
// Owner Summary DTO (for Owners list view)
// ============================================

/**
 * Aggregated owner view showing ownership stats per party
 * Used in the global Owners list page
 */
export interface OwnerSummary {
  partyId: string;
  partyName: string | null;
  partyType: PartyType;
  primaryContact: string | null;
  /** Number of units currently owned */
  activeOwnedUnitCount: number;
  /** Total units ever owned (including historical) */
  totalHistoricalUnitsCount: number;
  /** Most recent ownership activity date */
  lastOwnershipActivityDate: string | null;
  /** Whether this party has a linked CommunityUser account */
  hasCommunityUserAccount: boolean;
}

// ============================================
// Unit Ownership DTO
// ============================================

/**
 * DateOnly object from backend (C# DateOnly)
 */
export interface DateOnly {
  year: number;
  month: number;
  day: number;
}

/**
 * Unit ownership record linking a Party to a Unit
 * Contains share percentage, date range, and primary owner indicator
 */
export interface UnitOwnership {
  id: string;
  unitId: string;
  unitNumber: string | null;
  blockName: string | null;
  floorName: string | null;
  partyId: string;
  partyName: string | null;
  partyType: PartyType;
  /** Ownership share percentage (0-100) */
  ownershipShare: number;
  /** Start date of ownership */
  fromDate: DateOnly | null;
  /** End date of ownership (null = still active) */
  toDate: DateOnly | null;
  /** Whether this is the primary owner for the period */
  isPrimaryOwner: boolean;
  /** Computed: whether ownership is currently active (toDate is null or in future) */
  isCurrentlyActive: boolean;
  isActive: boolean;
  createdAt: string;
}

// ============================================
// Request Types
// ============================================

/**
 * Create a new unit ownership record
 */
export interface CreateOwnershipRequest {
  unitId: string;
  partyId: string;
  ownershipShare: number;
  fromDate: DateOnly;
  isPrimaryOwner: boolean;
}

/**
 * New owner entry for transfer ownership
 */
export interface NewOwnerEntry {
  partyId: string;
  ownershipShare: number;
  isPrimaryOwner: boolean;
}

/**
 * Transfer ownership to new owner(s)
 * Closes all current ownerships and creates new ones
 */
export interface TransferOwnershipRequest {
  unitId: string;
  transferDate: DateOnly;
  newOwners: NewOwnerEntry[];
}

/**
 * End ownership for a specific ownership record
 */
export interface EndOwnershipRequest {
  endDate: DateOnly;
}

// ============================================
// Query Params
// ============================================

/**
 * Parameters for listing owners (summary view)
 */
export interface ListOwnersParams {
  searchTerm?: string;
  partyType?: PartyType;
  currentOwnersOnly?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Parameters for listing unit ownerships by unit
 */
export interface ListOwnershipsByUnitParams {
  unitId: string;
  currentOnly?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Parameters for listing unit ownerships by party
 */
export interface ListOwnershipsByPartyParams {
  partyId: string;
  currentOnly?: boolean;
  page?: number;
  pageSize?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Formats a DateOnly object to a display string (e.g., "Jan 15, 2024")
 */
export function formatDateOnly(date: DateOnly | null | undefined): string {
  if (!date) return '—';
  
  try {
    const d = new Date(date.year, date.month - 1, date.day);
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
 * Formats ownership period as "From → To" or "From → Present"
 */
export function formatOwnershipPeriod(
  fromDate: DateOnly | null | undefined,
  toDate: DateOnly | null | undefined
): string {
  const from = formatDateOnly(fromDate);
  const to = toDate ? formatDateOnly(toDate) : 'Present';
  return `${from} → ${to}`;
}

/**
 * Converts a Date to DateOnly for API requests
 */
export function dateToDateOnly(date: Date): DateOnly {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/**
 * Gets today as a DateOnly
 */
export function getTodayAsDateOnly(): DateOnly {
  return dateToDateOnly(new Date());
}

/**
 * Converts DateOnly to Date object
 */
export function dateOnlyToDate(date: DateOnly | null | undefined): Date | null {
  if (!date) return null;
  return new Date(date.year, date.month - 1, date.day);
}

/**
 * Formats DateOnly as ISO date string (YYYY-MM-DD) for input fields
 */
export function formatDateOnlyAsISO(date: DateOnly | null | undefined): string {
  if (!date) return '';
  const month = date.month.toString().padStart(2, '0');
  const day = date.day.toString().padStart(2, '0');
  return `${date.year}-${month}-${day}`;
}

/**
 * Parses ISO date string (YYYY-MM-DD) to DateOnly
 */
export function parseISOToDateOnly(isoString: string): DateOnly | null {
  if (!isoString) return null;
  const [year, month, day] = isoString.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

/**
 * Gets color classes for ownership status badge
 */
export function getOwnershipStatusColor(isCurrentlyActive: boolean): string {
  return isCurrentlyActive
    ? 'bg-green-100 text-green-700'
    : 'bg-gray-100 text-gray-600';
}

/**
 * Gets label for ownership status
 */
export function getOwnershipStatusLabel(isCurrentlyActive: boolean): string {
  return isCurrentlyActive ? 'Current' : 'Past';
}


