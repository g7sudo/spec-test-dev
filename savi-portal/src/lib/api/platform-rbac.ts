/**
 * Platform RBAC API functions
 * Handles platform-level role and permission management
 * 
 * Endpoints covered:
 * - GET  /api/v1/platform/rbac/permissions   - List all permissions
 * - GET  /api/v1/platform/rbac/roles         - List all roles
 * - GET  /api/v1/platform/rbac/roles/{id}    - Get role detail with permissions
 * - PUT  /api/v1/platform/rbac/roles/{id}/permissions - Update role permissions
 * - GET  /api/v1/platform/rbac/roles/{id}/users - List users in role
 * - GET  /api/v1/platform/rbac/users         - List platform users with roles
 * - PUT  /api/v1/platform/rbac/users/{id}/roles - Assign roles to user
 */

import { httpClient } from '@/lib/http';
import {
  PlatformPermission,
  PlatformRole,
  PlatformRoleDetail,
  RoleUser,
  PlatformUserRbac,
  UpdateRolePermissionsRequest,
  AssignPlatformUserRolesRequest,
  ListRbacUsersParams,
  ListPermissionsParams,
  PagedResult,
} from '@/types/rbac';

// ============================================
// API Base Path
// ============================================

const RBAC_BASE = '/api/v1/platform/rbac';

// ============================================
// Permissions
// ============================================

/**
 * Lists all platform permissions
 * Optionally filtered by scope
 */
export async function listPlatformPermissions(
  params: ListPermissionsParams = {}
): Promise<PlatformPermission[]> {
  const searchParams = new URLSearchParams();
  
  if (params.scope) {
    searchParams.set('scope', params.scope);
  }
  
  const query = searchParams.toString();
  const url = query ? `${RBAC_BASE}/permissions?${query}` : `${RBAC_BASE}/permissions`;
  
  return httpClient.get<PlatformPermission[]>(url);
}

// ============================================
// Roles
// ============================================

/**
 * Lists all platform roles with summary info
 */
export async function listPlatformRoles(): Promise<PlatformRole[]> {
  return httpClient.get<PlatformRole[]>(`${RBAC_BASE}/roles`);
}

/**
 * Gets a platform role by ID with all permissions
 */
export async function getPlatformRoleById(id: string): Promise<PlatformRoleDetail> {
  return httpClient.get<PlatformRoleDetail>(`${RBAC_BASE}/roles/${id}`);
}

/**
 * Updates permissions for a platform role
 * @param id - Role ID
 * @param permissionIds - List of permission IDs (GUIDs) to enable
 */
export async function updatePlatformRolePermissions(
  id: string,
  permissionIds: string[]
): Promise<void> {
  // Backend expects raw array of permission IDs (GUIDs)
  return httpClient.put<void>(`${RBAC_BASE}/roles/${id}/permissions`, permissionIds);
}

/**
 * Lists users assigned to a specific role
 */
export async function listPlatformRoleUsers(roleId: string): Promise<RoleUser[]> {
  return httpClient.get<RoleUser[]>(`${RBAC_BASE}/roles/${roleId}/users`);
}

// ============================================
// Users
// ============================================

/**
 * Lists platform users with their assigned roles
 */
export async function listPlatformRbacUsers(
  params: ListRbacUsersParams = {}
): Promise<PagedResult<PlatformUserRbac>> {
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
  
  return httpClient.get<PagedResult<PlatformUserRbac>>(url);
}

/**
 * Assigns roles to a platform user
 * @param userId - User ID
 * @param roleIds - List of role IDs to assign
 */
export async function assignPlatformUserRoles(
  userId: string,
  roleIds: string[]
): Promise<void> {
  const request: AssignPlatformUserRolesRequest = { roleIds };
  return httpClient.put<void>(`${RBAC_BASE}/users/${userId}/roles`, request);
}

