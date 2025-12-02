/**
 * Tenant types for platform-level tenant (community) management
 * Maps to backend DTOs from Savi.Application.Platform.Tenants
 */

// Re-export PagedResult from http.ts to avoid duplication
export { PagedResult } from './http';

// ============================================
// Enums (values match C# enum integers)
// ============================================

/**
 * Status of a tenant/community
 */
export enum TenantStatus {
  Pending = 0,
  Active = 1,
  Suspended = 2,
  Archived = 3,
}

// ============================================
// Tenant DTOs
// ============================================

/**
 * Full tenant detail response
 */
export interface Tenant {
  id: string;
  name: string;
  code: string | null;
  status: TenantStatus;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  timezone: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
}

/**
 * Summary tenant for list views (lighter payload)
 */
export interface TenantSummary {
  id: string;
  name: string;
  code: string | null;
  status: TenantStatus;
  city: string | null;
  country: string | null;
  createdAt: string;
  isActive: boolean;
}

// ============================================
// Request Types
// ============================================

/**
 * Create tenant request
 */
export interface CreateTenantRequest {
  name: string;
  code?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  timezone?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  planId?: string | null;
  planCode?: string | null;
  databaseProvider?: string | null;
  connectionString?: string | null;
  provisionTenantDatabase?: boolean;
  seedTenantRbac?: boolean;
}

/**
 * Update tenant request
 */
export interface UpdateTenantRequest {
  name: string;
  code?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  timezone?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
}

/**
 * Create tenant response
 */
export interface CreateTenantResponse {
  tenantId: string;
  code: string;
  name: string;
  planCode: string;
  provider: string;
}

/**
 * Update tenant response
 */
export interface UpdateTenantResponse {
  id: string;
  name: string;
  code: string | null;
  updatedAt: string;
}

/**
 * Invite admin request
 */
export interface InviteAdminRequest {
  email: string;
  fullName?: string | null;
}

/**
 * Invite admin response
 */
export interface InviteAdminResponse {
  membershipId: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  inviteeEmail: string;
  tenantRoleCode: string;
  invitationExpiresAt: string;
  invitationToken?: string | null;
  invitationUrl?: string | null;
}

// ============================================
// List Query Params
// ============================================

export interface ListTenantsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TenantStatus;
  isActive?: boolean;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets display label for tenant status
 */
export function getTenantStatusLabel(status: TenantStatus): string {
  switch (status) {
    case TenantStatus.Pending:
      return 'Pending';
    case TenantStatus.Active:
      return 'Active';
    case TenantStatus.Suspended:
      return 'Suspended';
    case TenantStatus.Archived:
      return 'Archived';
    default:
      return 'Unknown';
  }
}

/**
 * Gets status badge color classes
 */
export function getTenantStatusColor(status: TenantStatus): string {
  switch (status) {
    case TenantStatus.Pending:
      return 'bg-yellow-100 text-yellow-700';
    case TenantStatus.Active:
      return 'bg-green-100 text-green-700';
    case TenantStatus.Suspended:
      return 'bg-red-100 text-red-700';
    case TenantStatus.Archived:
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Formats tenant address to single line
 */
export function formatTenantAddress(tenant: Tenant | TenantSummary): string {
  if ('addressLine1' in tenant) {
    const parts = [
      tenant.addressLine1,
      tenant.addressLine2,
      tenant.city,
      tenant.state,
      tenant.postalCode,
      tenant.country,
    ].filter(Boolean);
    return parts.join(', ');
  }
  // TenantSummary only has city and country
  const parts = [tenant.city, tenant.country].filter(Boolean);
  return parts.join(', ') || 'No address';
}

/**
 * Gets tenant location (city, country) for display
 */
export function getTenantLocation(tenant: TenantSummary | Tenant): string {
  const parts = [tenant.city, tenant.country].filter(Boolean);
  return parts.join(', ') || 'No location';
}

