/**
 * Tenant RBAC API functions
 * Handles tenant-level (community) role group and permission management
 * 
 * Endpoints covered:
 * - GET  /api/v1/tenant/rbac/permissions    - List all tenant permissions
 * - GET  /api/v1/tenant/rbac/roles          - List all role groups
 * - GET  /api/v1/tenant/rbac/roles/{id}     - Get role group detail with permissions
 * - PUT  /api/v1/tenant/rbac/roles/{id}/permissions - Update role group permissions
 * - GET  /api/v1/tenant/rbac/roles/{id}/users - List users in role group
 * - GET  /api/v1/tenant/rbac/users          - List community users with role groups
 * - PUT  /api/v1/tenant/rbac/users/{id}/roles - Assign role groups to user
 * 
 * Note: All tenant endpoints require X-Tenant-Id header (handled by httpClient)
 */

import { httpClient } from '@/lib/http';
import {
  TenantPermission,
  RoleGroup,
  RoleGroupDetail,
  RoleGroupUser,
  CommunityUserRbac,
  UpdateRoleGroupPermissionsRequest,
  RoleGroupAssignment,
  ListRbacUsersParams,
  PagedResult,
} from '@/types/rbac';

// ============================================
// API Base Path
// ============================================

const RBAC_BASE = '/api/v1/tenant/rbac';

// ============================================
// Permissions
// ============================================

/**
 * Lists all tenant permissions
 */
export async function listTenantPermissions(): Promise<TenantPermission[]> {
  return httpClient.get<TenantPermission[]>(`${RBAC_BASE}/permissions`);
}

// ============================================
// Role Groups
// ============================================

/**
 * Lists all tenant role groups with summary info
 */
export async function listTenantRoleGroups(): Promise<RoleGroup[]> {
  return httpClient.get<RoleGroup[]>(`${RBAC_BASE}/roles`);
}

/**
 * Gets a role group by ID with all permissions
 */
export async function getRoleGroupById(id: string): Promise<RoleGroupDetail> {
  return httpClient.get<RoleGroupDetail>(`${RBAC_BASE}/roles/${id}`);
}

/**
 * Updates permissions for a role group
 * @param id - Role group ID
 * @param permissions - List of permission keys to enable
 */
export async function updateRoleGroupPermissions(
  id: string,
  permissions: string[]
): Promise<void> {
  const request: UpdateRoleGroupPermissionsRequest = { permissions };
  return httpClient.put<void>(`${RBAC_BASE}/roles/${id}/permissions`, request);
}

/**
 * Lists users assigned to a specific role group
 */
export async function listRoleGroupUsers(roleGroupId: string): Promise<RoleGroupUser[]> {
  return httpClient.get<RoleGroupUser[]>(`${RBAC_BASE}/roles/${roleGroupId}/users`);
}

// ============================================
// Users
// ============================================

/**
 * Lists community users with their assigned role groups
 */
export async function listTenantRbacUsers(
  params: ListRbacUsersParams = {}
): Promise<PagedResult<CommunityUserRbac>> {
  const searchParams = new URLSearchParams();
  
  if (params.page) {
    searchParams.set('page', params.page.toString());
  }
  if (params.pageSize) {
    searchParams.set('pageSize', params.pageSize.toString());
  }
  if (params.search) {
    searchParams.set('search', params.search);
  }
  
  const query = searchParams.toString();
  const url = query ? `${RBAC_BASE}/users?${query}` : `${RBAC_BASE}/users`;
  
  return httpClient.get<PagedResult<CommunityUserRbac>>(url);
}

/**
 * Assigns role groups to a community user
 * @param userId - Community user ID
 * @param roleGroups - List of role group assignments
 */
export async function assignCommunityUserRoles(
  userId: string,
  roleGroups: RoleGroupAssignment[]
): Promise<number> {
  return httpClient.put<number>(`${RBAC_BASE}/users/${userId}/roles`, roleGroups);
}

