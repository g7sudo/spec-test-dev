/**
 * Ownership API functions
 * Handles tenant-level unit ownership CRUD operations
 * 
 * Endpoints:
 * - GET /tenant/ownership/owners - List owners with aggregated stats
 * - GET /tenant/ownership/owners/{partyId}/ownerships - Get ownerships for a party
 * - GET /tenant/ownership/unit-ownerships/by-unit/{unitId} - Get ownerships for a unit
 * - GET /tenant/ownership/unit-ownerships/by-party/{partyId} - Get ownerships by party
 * - POST /tenant/ownership/unit-ownerships - Create new ownership
 * - POST /tenant/ownership/unit-ownerships/transfer - Transfer ownership
 * - POST /tenant/ownership/unit-ownerships/{id}/end - End an ownership
 */

import { httpClient } from '@/lib/http';
import {
  OwnerSummary,
  UnitOwnership,
  CreateOwnershipRequest,
  TransferOwnershipRequest,
  EndOwnershipRequest,
  ListOwnersParams,
  ListOwnershipsByUnitParams,
  ListOwnershipsByPartyParams,
} from '@/types/ownership';
import { PagedResult } from '@/types/http';

// ============================================
// API Endpoints
// ============================================

const OWNERS_BASE = '/api/v1/tenant/ownership/owners';
const OWNERSHIPS_BASE = '/api/v1/tenant/ownership/unit-ownerships';

// ============================================
// Owners (Aggregated View)
// ============================================

/**
 * Lists owners with aggregated ownership statistics
 * Returns parties that have current or historical unit ownerships
 */
export async function listOwners(
  params: ListOwnersParams = {}
): Promise<PagedResult<OwnerSummary>> {
  const searchParams = new URLSearchParams();
  
  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);
  if (params.partyType !== undefined) searchParams.set('partyType', params.partyType.toString());
  if (params.currentOwnersOnly !== undefined) {
    searchParams.set('currentOwnersOnly', params.currentOwnersOnly.toString());
  }
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  
  const query = searchParams.toString();
  const url = query ? `${OWNERS_BASE}?${query}` : OWNERS_BASE;
  
  return httpClient.get<PagedResult<OwnerSummary>>(url);
}

/**
 * Gets all ownerships for a specific owner (party)
 * Alternative endpoint through owners controller
 */
export async function getOwnershipsByOwner(
  partyId: string,
  params: { currentOnly?: boolean; page?: number; pageSize?: number } = {}
): Promise<PagedResult<UnitOwnership>> {
  const searchParams = new URLSearchParams();
  
  if (params.currentOnly !== undefined) {
    searchParams.set('currentOnly', params.currentOnly.toString());
  }
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  
  const query = searchParams.toString();
  const url = query
    ? `${OWNERS_BASE}/${partyId}/ownerships?${query}`
    : `${OWNERS_BASE}/${partyId}/ownerships`;
  
  return httpClient.get<PagedResult<UnitOwnership>>(url);
}

// ============================================
// Unit Ownerships
// ============================================

/**
 * Gets all ownerships for a specific unit
 * Used in Unit Detail page to show current and historical owners
 */
export async function getOwnershipsByUnit(
  params: ListOwnershipsByUnitParams
): Promise<PagedResult<UnitOwnership>> {
  const { unitId, ...queryParams } = params;
  const searchParams = new URLSearchParams();
  
  if (queryParams.currentOnly !== undefined) {
    searchParams.set('currentOnly', queryParams.currentOnly.toString());
  }
  if (queryParams.page) searchParams.set('page', queryParams.page.toString());
  if (queryParams.pageSize) searchParams.set('pageSize', queryParams.pageSize.toString());
  
  const query = searchParams.toString();
  const url = query
    ? `${OWNERSHIPS_BASE}/by-unit/${unitId}?${query}`
    : `${OWNERSHIPS_BASE}/by-unit/${unitId}`;
  
  return httpClient.get<PagedResult<UnitOwnership>>(url);
}

/**
 * Gets all ownerships for a specific party
 * Used in Owner Detail page to show all units they own/owned
 */
export async function getOwnershipsByParty(
  params: ListOwnershipsByPartyParams
): Promise<PagedResult<UnitOwnership>> {
  const { partyId, ...queryParams } = params;
  const searchParams = new URLSearchParams();
  
  if (queryParams.currentOnly !== undefined) {
    searchParams.set('currentOnly', queryParams.currentOnly.toString());
  }
  if (queryParams.page) searchParams.set('page', queryParams.page.toString());
  if (queryParams.pageSize) searchParams.set('pageSize', queryParams.pageSize.toString());
  
  const query = searchParams.toString();
  const url = query
    ? `${OWNERSHIPS_BASE}/by-party/${partyId}?${query}`
    : `${OWNERSHIPS_BASE}/by-party/${partyId}`;
  
  return httpClient.get<PagedResult<UnitOwnership>>(url);
}

/**
 * Creates a new unit ownership record
 * Used for "Add first owner" or "Add joint owner" flows
 */
export async function createOwnership(
  data: CreateOwnershipRequest
): Promise<string> {
  return httpClient.post<string>(OWNERSHIPS_BASE, data);
}

/**
 * Transfers ownership from current owners to new owners
 * Closes all current ownerships and creates new ones atomically
 */
export async function transferOwnership(
  data: TransferOwnershipRequest
): Promise<string[]> {
  return httpClient.post<string[]>(`${OWNERSHIPS_BASE}/transfer`, data);
}

/**
 * Ends a specific ownership (sets ToDate)
 * Used for "End ownership" action on individual owners
 */
export async function endOwnership(
  ownershipId: string,
  data: EndOwnershipRequest
): Promise<void> {
  return httpClient.post<void>(`${OWNERSHIPS_BASE}/${ownershipId}/end`, data);
}


