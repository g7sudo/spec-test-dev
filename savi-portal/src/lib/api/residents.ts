/**
 * Residents API functions
 * Handles tenant-level resident operations
 * 
 * Endpoints:
 * - GET /tenant/residents - List all residents with filters
 * - GET /tenant/residents/{partyId} - Get comprehensive resident profile
 * - POST /tenant/residents/{leasePartyId}/move-out - Move out a resident
 * 
 * Note: Adding residents is done via Lease API (POST /leases/{id}/parties)
 * Inviting residents is done via ResidentInvites API
 */

import { httpClient } from '@/lib/http';
import {
  Resident,
  ResidentProfile,
  ResidentStatus,
  MoveOutResidentRequest,
  ListResidentsParams,
} from '@/types/resident';
import { PagedResult } from '@/types/http';

// ============================================
// API Endpoints
// ============================================

const RESIDENTS_BASE = '/api/v1/tenant/residents';

// ============================================
// Resident Operations
// ============================================

/**
 * Lists all residents with optional filters
 * Permission: TENANT_LEASE_VIEW
 * 
 * Filters:
 * - status: Upcoming / Current / Past
 * - unitId, blockId, floorId: Location filters
 * - hasAppAccess: true/false
 * - searchTerm: Search by name, phone, or email
 */
export async function listResidents(
  params: ListResidentsParams = {}
): Promise<PagedResult<Resident>> {
  const searchParams = new URLSearchParams();

  // Add filters to query params
  if (params.status) searchParams.set('status', params.status);
  if (params.unitId) searchParams.set('unitId', params.unitId);
  if (params.blockId) searchParams.set('blockId', params.blockId);
  if (params.floorId) searchParams.set('floorId', params.floorId);
  if (params.hasAppAccess !== undefined) {
    searchParams.set('hasAppAccess', params.hasAppAccess.toString());
  }
  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query ? `${RESIDENTS_BASE}?${query}` : RESIDENTS_BASE;

  return httpClient.get<PagedResult<Resident>>(url);
}

/**
 * Gets comprehensive resident profile by party ID
 * Permission: TENANT_LEASE_VIEW
 * 
 * Includes:
 * - Party info (identity & PII)
 * - CommunityUser (if any) → login status
 * - LeaseParty records → all residencies (current & past)
 * - Invite status
 */
export async function getResidentProfile(
  partyId: string
): Promise<ResidentProfile> {
  return httpClient.get<ResidentProfile>(`${RESIDENTS_BASE}/${partyId}`);
}

/**
 * Moves out a resident
 * Permission: TENANT_LEASE_MANAGE
 * 
 * Handles different scenarios:
 * 1. Co-resident: Just sets MoveOutDate
 * 2. Primary resident + endLease=true: Ends the entire lease
 * 3. Primary resident + endLease=false: Requires newPrimaryLeasePartyId
 */
export async function moveOutResident(
  leasePartyId: string,
  data: MoveOutResidentRequest
): Promise<void> {
  return httpClient.post<void>(
    `${RESIDENTS_BASE}/${leasePartyId}/move-out`,
    data
  );
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets current residents for a unit
 * Convenience wrapper for listResidents with unit filter and Current status
 */
export async function getCurrentResidentsByUnit(
  unitId: string
): Promise<Resident[]> {
  const result = await listResidents({
    unitId,
    status: ResidentStatus.Current,
    pageSize: 100,
  });
  return result.items;
}

/**
 * Gets all residents (current and upcoming) for a unit
 * Useful for showing who is/will be living in a unit
 */
export async function getActiveResidentsByUnit(
  unitId: string
): Promise<Resident[]> {
  // Fetch current and upcoming in parallel
  const [currentResult, upcomingResult] = await Promise.all([
    listResidents({
      unitId,
      status: ResidentStatus.Current,
      pageSize: 100,
    }),
    listResidents({
      unitId,
      status: ResidentStatus.Upcoming,
      pageSize: 100,
    }),
  ]);

  return [...currentResult.items, ...upcomingResult.items];
}

/**
 * Gets residents without app access
 * Useful for bulk invite operations
 */
export async function getResidentsWithoutAppAccess(): Promise<Resident[]> {
  const result = await listResidents({
    hasAppAccess: false,
    status: ResidentStatus.Current,
    pageSize: 100,
  });
  return result.items;
}


