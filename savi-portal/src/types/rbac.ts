/**
 * RBAC (Role-Based Access Control) types
 * Covers both Platform and Tenant RBAC structures
 * Maps to backend DTOs from Savi.Application.Platform.Rbac and Savi.Application.Tenant.Rbac
 */

import { PagedResult } from './http';

// Re-export PagedResult for convenience
export type { PagedResult };

// ============================================
// Enums
// ============================================

/**
 * Role group type for tenant roles
 * Matches C# RoleGroupType enum
 */
export enum RoleGroupType {
  System = 0,
  Admin = 1,
  Staff = 2,
  Custom = 3,
}

// ============================================
// Platform RBAC Types
// ============================================

/**
 * Permission definition (Platform scope)
 * Returned from GET /api/v1/platform/rbac/permissions
 */
export interface PlatformPermission {
  id: string;
  key: string;
  module: string;
  description: string | null;
  scope: string | null;
}

/**
 * Platform role summary for list views
 * Returned from GET /api/v1/platform/rbac/roles
 */
export interface PlatformRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
}

/**
 * Permission with enabled state for role detail
 */
export interface RolePermission {
  id: string;
  key: string;
  module: string;
  description: string | null;
  isEnabled: boolean;
}

/**
 * Platform role detail with all permissions
 * Returned from GET /api/v1/platform/rbac/roles/{id}
 */
export interface PlatformRoleDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: RolePermission[];
}

/**
 * User assigned to a role
 * Returned from GET /api/v1/platform/rbac/roles/{id}/users
 */
export interface RoleUser {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  createdAt: string;
}

/**
 * User role assignment info
 */
export interface UserRoleAssignment {
  roleId: string;
  roleCode: string;
  roleName: string;
}

/**
 * Platform user with roles for RBAC users list
 * Returned from GET /api/v1/platform/rbac/users
 */
export interface PlatformUserRbac {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  createdAt: string;
  roles: UserRoleAssignment[];
}

// ============================================
// Tenant RBAC Types
// ============================================

/**
 * Permission definition (Tenant scope)
 * Returned from GET /api/v1/tenant/rbac/permissions
 */
export interface TenantPermission {
  key: string;
  module: string;
  description: string | null;
}

/**
 * Tenant role group summary for list views
 * Returned from GET /api/v1/tenant/rbac/roles
 */
export interface RoleGroup {
  id: string;
  code: string;
  name: string;
  description: string | null;
  groupType: RoleGroupType;
  isSystem: boolean;
  displayOrder: number;
  permissionCount: number;
  userCount: number;
}

/**
 * Permission with enabled state for role group detail
 */
export interface RoleGroupPermission {
  key: string;
  module: string;
  description: string | null;
  isEnabled: boolean;
}

/**
 * Role group detail with all permissions
 * Returned from GET /api/v1/tenant/rbac/roles/{id}
 */
export interface RoleGroupDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  groupType: RoleGroupType;
  isSystem: boolean;
  displayOrder: number;
  permissions: RoleGroupPermission[];
}

/**
 * User assigned to a role group
 * Returned from GET /api/v1/tenant/rbac/roles/{id}/users
 */
export interface RoleGroupUser {
  id: string;
  preferredName: string | null;
  partyId: string | null;
  partyName: string | null;
  isPrimary: boolean;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
}

/**
 * User role group assignment info
 */
export interface UserRoleGroupAssignment {
  roleGroupId: string;
  roleGroupCode: string;
  roleGroupName: string;
  isPrimary: boolean;
}

/**
 * Community user with role groups for RBAC users list
 * Returned from GET /api/v1/tenant/rbac/users
 */
export interface CommunityUserRbac {
  id: string;
  preferredName: string | null;
  partyId: string | null;
  partyName: string | null;
  roleGroups: UserRoleGroupAssignment[];
}

// ============================================
// Request Types
// ============================================

/**
 * Request to update role permissions
 * PUT /api/v1/platform/rbac/roles/{id}/permissions
 */
export interface UpdateRolePermissionsRequest {
  // List of permission keys that should be enabled for this role
  permissions: string[];
}

/**
 * Request to assign roles to a platform user
 * PUT /api/v1/platform/rbac/users/{id}/roles
 */
export interface AssignPlatformUserRolesRequest {
  roleIds: string[];
}

/**
 * Request to create a new role group
 * POST /api/v1/tenant/rbac/roles
 */
export interface CreateRoleGroupRequest {
  name: string;
  code?: string | null;
  description?: string | null;
  groupType?: RoleGroupType;
}

/**
 * Response from creating a role group
 */
export interface CreateRoleGroupResponse {
  id: string;
  code: string;
  name: string;
  groupType: RoleGroupType;
}

/**
 * Request to update role group permissions
 * PUT /api/v1/tenant/rbac/roles/{id}/permissions
 */
export interface UpdateRoleGroupPermissionsRequest {
  // List of permission keys that should be enabled for this role group
  permissions: string[];
}

/**
 * Role group assignment for a user
 */
export interface RoleGroupAssignment {
  roleGroupId: string;
  isPrimary: boolean;
}

/**
 * Request to assign role groups to a community user
 * PUT /api/v1/tenant/rbac/users/{id}/roles
 */
export interface AssignCommunityUserRolesRequest {
  roleGroups: RoleGroupAssignment[];
}

// ============================================
// Query Params
// ============================================

export interface ListRbacUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ListPermissionsParams {
  scope?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets display label for role group type
 */
export function getRoleGroupTypeLabel(type: RoleGroupType): string {
  switch (type) {
    case RoleGroupType.System:
      return 'System';
    case RoleGroupType.Admin:
      return 'Admin';
    case RoleGroupType.Staff:
      return 'Staff';
    case RoleGroupType.Custom:
      return 'Custom';
    default:
      return 'Unknown';
  }
}

/**
 * Gets badge color classes for role group type
 */
export function getRoleGroupTypeColor(type: RoleGroupType): string {
  switch (type) {
    case RoleGroupType.System:
      return 'bg-purple-100 text-purple-700';
    case RoleGroupType.Admin:
      return 'bg-blue-100 text-blue-700';
    case RoleGroupType.Staff:
      return 'bg-green-100 text-green-700';
    case RoleGroupType.Custom:
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Groups permissions by their module for display in a matrix
 */
export function groupPermissionsByModule<T extends { module: string }>(
  permissions: T[]
): Record<string, T[]> {
  return permissions.reduce((acc, permission) => {
    const moduleName = permission.module || 'Other';
    if (!acc[moduleName]) {
      acc[moduleName] = [];
    }
    acc[moduleName].push(permission);
    return acc;
  }, {} as Record<string, T[]>);
}

