/**
 * Party types for tenant-level party management
 * Maps to backend DTOs from Savi.Application.Tenant.Community.Parties
 */

// Re-export PagedResult from http.ts to avoid duplication
export { PagedResult } from './http';

// ============================================
// Enums (values match C# enum integers)
// ============================================

/**
 * Type of party in the community
 */
export enum PartyType {
  Individual = 0,
  Company = 1,
  Entity = 2,
}

/**
 * Type of address for a party
 */
export enum PartyAddressType {
  Permanent = 0,
  Communication = 1,
  Registered = 2,
  Billing = 3,
  Other = 4,
}

/**
 * Type of contact information for a party
 */
export enum PartyContactType {
  Email = 0,
  Mobile = 1,
  Phone = 2,
  Whatsapp = 3,
  Other = 4,
}

// ============================================
// Party DTOs
// ============================================

/**
 * Party entity response
 */
export interface Party {
  id: string;
  partyType: PartyType;
  partyName: string;
  legalName: string | null;
  
  // Individual-specific
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null; // ISO date string
  
  // Company/Entity-specific
  registrationNumber: string | null;
  taxNumber: string | null;
  
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  
  // Related entities (only in detail view)
  addresses?: PartyAddress[];
  contacts?: PartyContact[];
}

/**
 * Party address entity
 */
export interface PartyAddress {
  id: string;
  partyId: string;
  addressType: PartyAddressType;
  line1: string;
  line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Party contact entity
 */
export interface PartyContact {
  id: string;
  partyId: string;
  contactType: PartyContactType;
  value: string;
  isPrimary: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// ============================================
// Request Types
// ============================================

/**
 * Create party request
 */
export interface CreatePartyRequest {
  partyType: PartyType;
  partyName: string;
  legalName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  notes?: string | null;
}

/**
 * Update party request
 */
export interface UpdatePartyRequest {
  partyName: string;
  legalName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  notes?: string | null;
}

/**
 * Add/Update party address request
 */
export interface PartyAddressRequest {
  addressType: PartyAddressType;
  line1: string;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  isPrimary: boolean;
}

/**
 * Add/Update party contact request
 */
export interface PartyContactRequest {
  contactType: PartyContactType;
  value: string;
  isPrimary: boolean;
}

// ============================================
// List Query Params
// ============================================

export interface ListPartiesParams {
  page?: number;
  pageSize?: number;
  partyType?: PartyType;
  searchTerm?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets display label for party type
 */
export function getPartyTypeLabel(type: PartyType): string {
  switch (type) {
    case PartyType.Individual:
      return 'Individual';
    case PartyType.Company:
      return 'Company';
    case PartyType.Entity:
      return 'Entity';
    default:
      return 'Unknown';
  }
}

/**
 * Gets display label for address type
 */
export function getAddressTypeLabel(type: PartyAddressType): string {
  switch (type) {
    case PartyAddressType.Permanent:
      return 'Permanent';
    case PartyAddressType.Communication:
      return 'Communication';
    case PartyAddressType.Registered:
      return 'Registered';
    case PartyAddressType.Billing:
      return 'Billing';
    case PartyAddressType.Other:
      return 'Other';
    default:
      return 'Unknown';
  }
}

/**
 * Gets display label for contact type
 */
export function getContactTypeLabel(type: PartyContactType): string {
  switch (type) {
    case PartyContactType.Email:
      return 'Email';
    case PartyContactType.Mobile:
      return 'Mobile';
    case PartyContactType.Phone:
      return 'Phone';
    case PartyContactType.Whatsapp:
      return 'WhatsApp';
    case PartyContactType.Other:
      return 'Other';
    default:
      return 'Unknown';
  }
}

/**
 * Formats address to single line
 */
export function formatAddress(address: PartyAddress): string {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Gets primary contact of a specific type
 */
export function getPrimaryContact(
  contacts: PartyContact[] | undefined,
  type: PartyContactType
): PartyContact | undefined {
  return contacts?.find(c => c.contactType === type && c.isPrimary);
}

