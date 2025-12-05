/**
 * Leases API functions
 * Handles tenant-level lease CRUD operations
 * 
 * Endpoints:
 * - GET /tenant/leases/{id} - Get lease by ID with parties
 * - GET /tenant/leases/by-unit/{unitId} - List leases for a unit
 * - POST /tenant/leases - Create new lease (Draft)
 * - POST /tenant/leases/{id}/activate - Activate a draft lease
 * - POST /tenant/leases/{id}/end - End an active lease
 * - POST /tenant/leases/{id}/parties - Add party to lease
 * - DELETE /tenant/leases/parties/{leasePartyId} - Remove party from lease
 */

import { httpClient } from '@/lib/http';
import {
  Lease,
  LeaseSummary,
  LeaseStatus,
  CreateLeaseRequest,
  AddLeasePartyRequest,
  EndLeaseRequest,
  ListLeasesByUnitParams,
  ListLeasesParams,
} from '@/types/lease';
import { PagedResult } from '@/types/http';

// ============================================
// API Endpoints
// ============================================

const LEASES_BASE = '/api/v1/tenant/leases';

// ============================================
// Lease Operations
// ============================================

/**
 * Gets a lease by ID with all associated parties
 * Used in lease detail views
 */
export async function getLeaseById(id: string): Promise<Lease> {
  return httpClient.get<Lease>(`${LEASES_BASE}/${id}`);
}

/**
 * Lists all leases in the community with optional filters
 * Used in Leases list page
 */
export async function listLeases(
  params: ListLeasesParams = {}
): Promise<PagedResult<LeaseSummary>> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const query = searchParams.toString();
  const url = query ? `${LEASES_BASE}?${query}` : LEASES_BASE;

  return httpClient.get<PagedResult<LeaseSummary>>(url);
}

/**
 * Lists leases for a specific unit
 * Used in Unit Detail page to show lease history
 */
export async function getLeasesByUnit(
  params: ListLeasesByUnitParams
): Promise<PagedResult<LeaseSummary>> {
  const { unitId, ...queryParams } = params;
  const searchParams = new URLSearchParams();

  if (queryParams.status !== undefined) {
    searchParams.set('status', queryParams.status.toString());
  }
  if (queryParams.page) searchParams.set('page', queryParams.page.toString());
  if (queryParams.pageSize) searchParams.set('pageSize', queryParams.pageSize.toString());

  const query = searchParams.toString();
  const url = query
    ? `${LEASES_BASE}/by-unit/${unitId}?${query}`
    : `${LEASES_BASE}/by-unit/${unitId}`;

  return httpClient.get<PagedResult<LeaseSummary>>(url);
}

/**
 * Creates a new lease for a unit (in Draft status)
 * Can optionally include initial parties
 */
export async function createLease(
  data: CreateLeaseRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(LEASES_BASE, data);
}

/**
 * Activates a draft lease
 * Validates at least one primary resident exists
 */
export async function activateLease(leaseId: string): Promise<void> {
  return httpClient.post<void>(`${LEASES_BASE}/${leaseId}/activate`);
}

/**
 * Ends an active lease
 * Marks lease as Ended (or Terminated if reason provided)
 */
export async function endLease(
  leaseId: string,
  data?: EndLeaseRequest
): Promise<void> {
  return httpClient.post<void>(`${LEASES_BASE}/${leaseId}/end`, data);
}

// ============================================
// Lease Party Operations
// ============================================

/**
 * Adds a party to an existing lease
 * Used for adding residents, co-residents, guarantors
 */
export async function addLeaseParty(
  leaseId: string,
  data: AddLeasePartyRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(`${LEASES_BASE}/${leaseId}/parties`, data);
}

/**
 * Removes a party from a lease
 * Note: Uses leasePartyId, not partyId
 */
export async function removeLeaseParty(leasePartyId: string): Promise<void> {
  return httpClient.delete<void>(`${LEASES_BASE}/parties/${leasePartyId}`);
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets active lease for a unit (if any)
 * Returns the first active lease found
 */
export async function getActiveLeaseForUnit(
  unitId: string
): Promise<LeaseSummary | null> {
  const result = await getLeasesByUnit({
    unitId,
    status: LeaseStatus.Active,
    pageSize: 1,
  });
  
  return result.items.length > 0 ? result.items[0] : null;
}

/**
 * Gets draft lease for a unit (if any)
 * Returns the first draft lease found
 */
export async function getDraftLeaseForUnit(
  unitId: string
): Promise<LeaseSummary | null> {
  const result = await getLeasesByUnit({
    unitId,
    status: LeaseStatus.Draft,
    pageSize: 1,
  });
  
  return result.items.length > 0 ? result.items[0] : null;
}


