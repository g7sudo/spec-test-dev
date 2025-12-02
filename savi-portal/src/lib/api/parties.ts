/**
 * Parties API functions
 * Handles tenant-level party CRUD operations
 */

import { httpClient } from '@/lib/http';
import {
  Party,
  PagedResult,
  ListPartiesParams,
  CreatePartyRequest,
  UpdatePartyRequest,
  PartyAddressRequest,
  PartyContactRequest,
} from '@/types/party';

// ============================================
// API Endpoints
// ============================================

const PARTIES_BASE = '/api/v1/tenant/parties';

// ============================================
// Party CRUD
// ============================================

/**
 * Lists parties with pagination and filtering
 */
export async function listParties(
  params: ListPartiesParams = {}
): Promise<PagedResult<Party>> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.partyType !== undefined) searchParams.set('partyType', params.partyType.toString());
  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);
  
  const query = searchParams.toString();
  const url = query ? `${PARTIES_BASE}?${query}` : PARTIES_BASE;
  
  return httpClient.get<PagedResult<Party>>(url);
}

/**
 * Gets a party by ID with addresses and contacts
 */
export async function getPartyById(id: string): Promise<Party> {
  return httpClient.get<Party>(`${PARTIES_BASE}/${id}`);
}

/**
 * Creates a new party
 */
export async function createParty(data: CreatePartyRequest): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(PARTIES_BASE, data);
}

/**
 * Updates an existing party
 */
export async function updateParty(id: string, data: UpdatePartyRequest): Promise<void> {
  return httpClient.put<void>(`${PARTIES_BASE}/${id}`, data);
}

/**
 * Deletes (soft-deletes) a party
 */
export async function deleteParty(id: string): Promise<void> {
  return httpClient.delete<void>(`${PARTIES_BASE}/${id}`);
}

// ============================================
// Party Addresses
// ============================================

/**
 * Adds an address to a party
 */
export async function addPartyAddress(
  partyId: string,
  data: PartyAddressRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(`${PARTIES_BASE}/${partyId}/addresses`, data);
}

/**
 * Updates a party address
 */
export async function updatePartyAddress(
  partyId: string,
  addressId: string,
  data: PartyAddressRequest
): Promise<void> {
  return httpClient.put<void>(`${PARTIES_BASE}/${partyId}/addresses/${addressId}`, data);
}

/**
 * Deletes a party address
 */
export async function deletePartyAddress(
  partyId: string,
  addressId: string
): Promise<void> {
  return httpClient.delete<void>(`${PARTIES_BASE}/${partyId}/addresses/${addressId}`);
}

// ============================================
// Party Contacts
// ============================================

/**
 * Adds a contact to a party
 */
export async function addPartyContact(
  partyId: string,
  data: PartyContactRequest
): Promise<{ id: string }> {
  return httpClient.post<{ id: string }>(`${PARTIES_BASE}/${partyId}/contacts`, data);
}

/**
 * Updates a party contact
 */
export async function updatePartyContact(
  partyId: string,
  contactId: string,
  data: PartyContactRequest
): Promise<void> {
  return httpClient.put<void>(`${PARTIES_BASE}/${partyId}/contacts/${contactId}`, data);
}

/**
 * Deletes a party contact
 */
export async function deletePartyContact(
  partyId: string,
  contactId: string
): Promise<void> {
  return httpClient.delete<void>(`${PARTIES_BASE}/${partyId}/contacts/${contactId}`);
}

