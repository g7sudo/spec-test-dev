/**
 * Tenants API functions
 * Handles platform-level tenant CRUD operations
 */

import { httpClient } from '@/lib/http';
import {
  Tenant,
  TenantSummary,
  PagedResult,
  ListTenantsParams,
  CreateTenantRequest,
  CreateTenantResponse,
  UpdateTenantRequest,
  UpdateTenantResponse,
  InviteAdminRequest,
  InviteAdminResponse,
} from '@/types/tenant';

// ============================================
// API Endpoints
// ============================================

const TENANTS_BASE = '/api/v1/platform/tenants';

// ============================================
// Tenant CRUD
// ============================================

/**
 * Lists tenants with pagination and filtering
 */
export async function listTenants(
  params: ListTenantsParams = {}
): Promise<PagedResult<TenantSummary>> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.status !== undefined) searchParams.set('status', params.status.toString());
  if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
  
  const query = searchParams.toString();
  const url = query ? `${TENANTS_BASE}?${query}` : TENANTS_BASE;
  
  return httpClient.get<PagedResult<TenantSummary>>(url);
}

/**
 * Gets a tenant by ID with full details
 */
export async function getTenantById(id: string): Promise<Tenant> {
  return httpClient.get<Tenant>(`${TENANTS_BASE}/${id}`);
}

/**
 * Creates a new tenant
 */
export async function createTenant(
  data: CreateTenantRequest
): Promise<CreateTenantResponse> {
  return httpClient.post<CreateTenantResponse>(TENANTS_BASE, data);
}

/**
 * Updates an existing tenant
 */
export async function updateTenant(
  id: string,
  data: UpdateTenantRequest
): Promise<UpdateTenantResponse> {
  return httpClient.put<UpdateTenantResponse>(`${TENANTS_BASE}/${id}`, data);
}

/**
 * Archives (soft-deletes) a tenant
 */
export async function archiveTenant(id: string): Promise<void> {
  return httpClient.delete<void>(`${TENANTS_BASE}/${id}`);
}

// ============================================
// Tenant Admin Invitation
// ============================================

/**
 * Invites a community admin for a tenant
 */
export async function inviteTenantAdmin(
  tenantId: string,
  data: InviteAdminRequest
): Promise<InviteAdminResponse> {
  return httpClient.post<InviteAdminResponse>(
    `${TENANTS_BASE}/${tenantId}/invite-admin`,
    data
  );
}

